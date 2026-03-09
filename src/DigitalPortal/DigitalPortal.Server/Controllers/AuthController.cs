using System.Security.Cryptography;
using System.Text;
using System.Web;
using DigitalPortal.Server.Models;
using DigitalPortal.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace DigitalPortal.Server.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IConfiguration config, TokenService tokenService, ILogger<AuthController> logger)
    : ControllerBase
{
    // ── Scope catalogue ────────────────────────────────────────────────────────

    private static readonly ScopeDefinition[] AvailableScopes =
    [
        new("openid",
            "OpenID Connect", "OpenID Connect",
            "Grunnleggende autentisering – alltid påkrevd",
            "Basic authentication – always required",
            Required: true, "Grunnleggende"),

        new("profile",
            "Profil", "Profile",
            "Navn, fødselsnummer og grunnleggende profilinformasjon fra Folkeregisteret",
            "Name, national identity number and basic profile information",
            Required: false, "Grunnleggende"),

        new("altinn:accessmanagement/authorizedparties",
            "Autoriserte parter", "Authorised parties",
            "Les hvilke aktører (personer og virksomheter) den innloggede brukeren kan representere i Altinn",
            "Read which parties (persons and organisations) the logged-in user can represent in Altinn",
            Required: false, "Altinn tilgangsstyring"),

        new("altinn:accessmanagement/enduser:connections:fromothers.read",
            "Les mottatte tilganger", "Read received access",
            "Se mottatte tilganger for deg og andre du evt. er tilgangsstyrer for",
            "View received access for you and others you manage access for",
            Required: false, "Altinn tilgangsstyring"),

        new("altinn:accessmanagement/enduser:connections:fromothers.write",
            "Slett mottatte tilganger", "Delete received access",
            "Slett mottatte tilganger gitt til deg eller andre aktører du er tilgangsstyrer for",
            "Delete received access granted to you or other parties you manage access for",
            Required: false, "Altinn tilgangsstyring"),

        new("altinn:accessmanagement/enduser:connections:toothers.read",
            "Les tilganger gitt til andre", "Read access given to others",
            "Se tilganger gitt til andre, fra deg eller andre aktører du er tilgangsstyrer for",
            "View access given to others, from you or other parties you manage access for",
            Required: false, "Altinn tilgangsstyring"),

        new("altinn:accessmanagement/enduser:connections:toothers.write",
            "Administrer tilganger til andre", "Manage access to others",
            "Opprett, oppdater og slett tilganger gitt til andre fra deg eller andre aktører du er tilgangsstyrer for",
            "Create, update and delete access given to others from you or other parties you manage access for",
            Required: false, "Altinn tilgangsstyring"),

        new("altinn:clientdelegations/myclients.read",
            "Les klientdelegeringer", "Read client delegations",
            "Se hvilke organisasjoner som har gitt deg tilgang til sine klienter, hvilke klienter du har mottatt klient-delegerte tilganger til, og hvilke tilganger du har mottatt for hver klient",
            "View which organisations have granted you access to their clients, which clients you have received client-delegated access to, and what access you have received for each client",
            Required: false, "Altinn klientdelegering"),

        new("altinn:clientdelegations/myclients.write",
            "Administrer klientdelegeringer", "Manage client delegations",
            "Slett mottatte klient-delegerte tilganger for en gitt klient, og slett ditt forhold til organisasjoner som har gitt deg tilgang til sine klienter (inkl. alle klient-tilganger)",
            "Delete received client-delegated access for a given client, and remove your relationship with organisations that have granted you access to their clients (incl. all client access)",
            Required: false, "Altinn klientdelegering"),
    ];

    // ── GET /api/auth/scopes ───────────────────────────────────────────────────

    [HttpGet("scopes")]
    public IActionResult GetScopes() => Ok(AvailableScopes);

    // ── GET /api/auth/login?scopes=openid+profile+... ─────────────────────────

    [HttpGet("login")]
    public IActionResult Login([FromQuery] string scopes = "openid")
    {
        var authEndpoint = config["IdPorten:AuthorizationEndpoint"]!;
        var clientId = config["IdPorten:ClientId"]!;
        var redirectUri = config["IdPorten:RedirectUri"]!;

        // PKCE – code_verifier is random, code_challenge = base64url(SHA256(verifier))
        var codeVerifier = GenerateCodeVerifier();
        var codeChallenge = GenerateCodeChallenge(codeVerifier);
        var state = GenerateRandomBase64Url(32);

        // Store PKCE verifier and state in short-lived HttpOnly cookies
        var tempCookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,   // Lax required for cross-origin OAuth redirect
            Expires = DateTimeOffset.UtcNow.AddMinutes(10),
            Path = "/"
        };
        Response.Cookies.Append("dp_pkce_verifier", codeVerifier, tempCookieOptions);
        Response.Cookies.Append("dp_oauth_state", state, tempCookieOptions);

        var query = HttpUtility.ParseQueryString(string.Empty);
        query["client_id"] = clientId;
        query["redirect_uri"] = redirectUri;
        query["response_type"] = "code";
        query["scope"] = scopes;
        query["state"] = state;
        query["code_challenge"] = codeChallenge;
        query["code_challenge_method"] = "S256";
        query["response_mode"] = "query";
        query["ui_locales"] = "nb";

        return Redirect($"{authEndpoint}?{query}");
    }

    // ── GET /api/auth/callback?code=...&state=... ──────────────────────────────

    [HttpGet("callback")]
    public async Task<IActionResult> Callback(
        [FromQuery] string? code,
        [FromQuery] string? state,
        [FromQuery] string? error,
        [FromQuery] string? error_description)
    {
        var frontendUri = config["IdPorten:PostLoginRedirectUri"]!;

        if (error is not null)
        {
            logger.LogWarning("ID-porten returned error: {Error} – {Desc}", error, error_description);
            return Redirect($"{frontendUri}?error={Uri.EscapeDataString(error)}");
        }

        // Validate state (CSRF protection)
        var storedState = Request.Cookies["dp_oauth_state"];
        if (storedState is null || storedState != state)
            return Redirect($"{frontendUri}?error=invalid_state");

        var codeVerifier = Request.Cookies["dp_pkce_verifier"];
        if (codeVerifier is null)
            return Redirect($"{frontendUri}?error=missing_verifier");

        // Exchange authorization code for tokens
        var tokens = await tokenService.ExchangeCodeAsync(code!, codeVerifier);
        if (tokens is null)
            return Redirect($"{frontendUri}?error=token_exchange_failed");

        // Exchange ID-porten access token for an Altinn token
        var altinnToken = await tokenService.ExchangeForAltinnTokenAsync(tokens.AccessToken);

        // Persist all tokens in HttpOnly cookies
        SetTokenCookies(tokens, altinnToken);

        // Clean up temporary PKCE/state cookies
        Response.Cookies.Delete("dp_pkce_verifier");
        Response.Cookies.Delete("dp_oauth_state");

        return Redirect(frontendUri);
    }

    // ── GET /api/auth/me ───────────────────────────────────────────────────────

    [HttpGet("me")]
    public IActionResult GetMe()
    {
        var accessToken = Request.Cookies["dp_access_token"];
        if (accessToken is null)
            return Ok(new TokenInfo(false, null, null, null, [], null, null));

        var idToken = Request.Cookies["dp_id_token"];
        var altinnToken = Request.Cookies["dp_altinn_token"];

        var idClaims = idToken is not null ? tokenService.ParseJwt(idToken) : null;
        var accessClaims = tokenService.ParseJwt(accessToken);
        var altinnClaims = altinnToken is not null ? tokenService.ParseJwt(altinnToken) : null;

        var scopes = accessClaims?.GetValueOrDefault("scope")?.ToString()?.Split(' ') ?? [];

        var accessExpiresAt = GetExpiry(accessClaims);
        var altinnExpiresAt = GetExpiry(altinnClaims);

        return Ok(new TokenInfo(true, idClaims, accessClaims, altinnClaims, scopes, accessExpiresAt, altinnExpiresAt));
    }

    // ── POST /api/auth/refresh ─────────────────────────────────────────────────

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        var refreshToken = Request.Cookies["dp_refresh_token"];
        if (refreshToken is null)
            return Unauthorized(new { error = "no_refresh_token" });

        var tokens = await tokenService.RefreshTokensAsync(refreshToken);
        if (tokens is null)
            return Unauthorized(new { error = "refresh_failed" });

        var altinnToken = await tokenService.ExchangeForAltinnTokenAsync(tokens.AccessToken);
        SetTokenCookies(tokens, altinnToken);

        var accessClaims = tokenService.ParseJwt(tokens.AccessToken);
        return Ok(new
        {
            accessTokenExpiresAt = GetExpiry(accessClaims),
            altinnTokenExpiresAt = altinnToken is not null
                ? GetExpiry(tokenService.ParseJwt(altinnToken))
                : (DateTime?)null
        });
    }

    // ── POST /api/auth/logout ──────────────────────────────────────────────────

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        foreach (var name in new[] { "dp_id_token", "dp_access_token", "dp_refresh_token", "dp_altinn_token" })
            Response.Cookies.Delete(name, new CookieOptions { Path = "/" });

        return Ok();
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private void SetTokenCookies(IdPortenTokenResponse tokens, string? altinnToken)
    {
        var tokenExpiry = DateTimeOffset.UtcNow.AddSeconds(tokens.ExpiresIn);

        var secureCookie = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/",
            Expires = tokenExpiry
        };

        Response.Cookies.Append("dp_access_token", tokens.AccessToken, secureCookie);

        if (!string.IsNullOrEmpty(tokens.IdToken))
            Response.Cookies.Append("dp_id_token", tokens.IdToken, secureCookie);

        if (!string.IsNullOrEmpty(tokens.RefreshToken))
        {
            // Refresh tokens typically live much longer than access tokens
            var refreshCookie = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Path = "/",
                Expires = DateTimeOffset.UtcNow.AddDays(30)
            };
            Response.Cookies.Append("dp_refresh_token", tokens.RefreshToken, refreshCookie);
        }

        if (!string.IsNullOrEmpty(altinnToken))
            Response.Cookies.Append("dp_altinn_token", altinnToken, secureCookie);
    }

    private static DateTime? GetExpiry(Dictionary<string, object?>? claims)
    {
        if (claims?.TryGetValue("exp", out var exp) == true && exp is long expLong)
            return DateTimeOffset.FromUnixTimeSeconds(expLong).UtcDateTime;
        return null;
    }

    private static string GenerateCodeVerifier() =>
        GenerateRandomBase64Url(64);

    private static string GenerateCodeChallenge(string verifier)
    {
        var hash = SHA256.HashData(Encoding.ASCII.GetBytes(verifier));
        return Convert.ToBase64String(hash).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    private static string GenerateRandomBase64Url(int byteLength) =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(byteLength))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
