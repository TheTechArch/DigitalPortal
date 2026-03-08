using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using DigitalPortal.Server.Models;

namespace DigitalPortal.Server.Services;

public class TokenService(IConfiguration config, HttpClient httpClient, ILogger<TokenService> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    // ── Code → ID-porten tokens ────────────────────────────────────────────────

    public async Task<IdPortenTokenResponse?> ExchangeCodeAsync(string code, string codeVerifier)
    {
        var clientId = config["IdPorten:ClientId"]!;
        var clientSecret = config["IdPorten:ClientSecret"]!;
        var redirectUri = config["IdPorten:RedirectUri"]!;
        var tokenEndpoint = config["IdPorten:TokenEndpoint"]!;

        var body = new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["code"] = code,
            ["redirect_uri"] = redirectUri,
            ["code_verifier"] = codeVerifier,
        };

        return await PostTokenRequest(tokenEndpoint, clientId, clientSecret, body);
    }

    // ── Refresh token → new ID-porten tokens ──────────────────────────────────

    public async Task<IdPortenTokenResponse?> RefreshTokensAsync(string refreshToken)
    {
        var clientId = config["IdPorten:ClientId"]!;
        var clientSecret = config["IdPorten:ClientSecret"]!;
        var tokenEndpoint = config["IdPorten:TokenEndpoint"]!;

        var body = new Dictionary<string, string>
        {
            ["grant_type"] = "refresh_token",
            ["refresh_token"] = refreshToken,
        };

        return await PostTokenRequest(tokenEndpoint, clientId, clientSecret, body);
    }

    // ── ID-porten access token → Altinn token ─────────────────────────────────

    public async Task<string?> ExchangeForAltinnTokenAsync(string accessToken)
    {
        var endpoint = config["Altinn:TokenExchangeEndpoint"];
        if (string.IsNullOrEmpty(endpoint))
        {
            logger.LogWarning("Altinn:TokenExchangeEndpoint not configured – skipping Altinn token exchange");
            return null;
        }

        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Altinn token exchange returned {Status}", response.StatusCode);
                return null;
            }

            // Altinn returns the token as a plain JWT string
            return (await response.Content.ReadAsStringAsync()).Trim('"');
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to exchange for Altinn token");
            return null;
        }
    }

    // ── JWT parsing (no signature verification – display only) ────────────────

    public Dictionary<string, object?>? ParseJwt(string token)
    {
        try
        {
            var parts = token.Split('.');
            if (parts.Length != 3) return null;

            var payload = parts[1];
            var padding = (4 - payload.Length % 4) % 4;
            payload = payload + new string('=', padding);
            payload = payload.Replace('-', '+').Replace('_', '/');

            var jsonBytes = Convert.FromBase64String(payload);
            using var document = JsonDocument.Parse(jsonBytes);

            var result = new Dictionary<string, object?>();
            foreach (var property in document.RootElement.EnumerateObject())
                result[property.Name] = ConvertJsonElement(property.Value);

            return result;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to parse JWT");
            return null;
        }
    }

    // ── Internal helpers ───────────────────────────────────────────────────────

    private async Task<IdPortenTokenResponse?> PostTokenRequest(
        string endpoint,
        string clientId,
        string clientSecret,
        Dictionary<string, string> extraParams)
    {
        try
        {
            // Client authentication via Basic auth header (client_secret_basic)
            var credentials = Convert.ToBase64String(
                Encoding.UTF8.GetBytes($"{Uri.EscapeDataString(clientId)}:{Uri.EscapeDataString(clientSecret)}"));

            var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
            {
                Content = new FormUrlEncodedContent(extraParams)
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);

            var response = await httpClient.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Token request failed {Status}: {Body}", response.StatusCode, content);
                return null;
            }

            return JsonSerializer.Deserialize<IdPortenTokenResponse>(content, JsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Token request threw an exception");
            return null;
        }
    }

    private static object? ConvertJsonElement(JsonElement element) => element.ValueKind switch
    {
        JsonValueKind.String => element.GetString(),
        JsonValueKind.Number => element.TryGetInt64(out var l) ? l : element.GetDouble(),
        JsonValueKind.True => true,
        JsonValueKind.False => false,
        JsonValueKind.Null => null,
        JsonValueKind.Array => element.EnumerateArray().Select(ConvertJsonElement).ToArray(),
        _ => element.GetRawText()
    };
}
