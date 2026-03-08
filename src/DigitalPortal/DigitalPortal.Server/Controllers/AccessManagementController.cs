using System.Net.Http.Headers;
using Microsoft.AspNetCore.Mvc;

namespace DigitalPortal.Server.Controllers;

[ApiController]
[Route("api/accessmanagement")]
public class AccessManagementController(
    IConfiguration config,
    IHttpClientFactory httpClientFactory,
    ILogger<AccessManagementController> logger) : ControllerBase
{
    // GET /api/accessmanagement/authorizedparties
    // Forwards all filter query parameters to Altinn and streams the JSON response.
    [HttpGet("authorizedparties")]
    public async Task<IActionResult> GetAuthorizedParties()
        => await ForwardToAltinn(
            "accessmanagement/api/v1/enduser/authorizedparties",
            "authorizedparties");

    // GET /api/accessmanagement/rightholders
    // Returns parties that have rights for/from the given party.
    // Query params: party (required), from, to, includeClientDelegations, includeAgentConnections
    // Scope: altinn:accessmanagement/enduser.read
    [HttpGet("rightholders")]
    public async Task<IActionResult> GetRightHolders()
        => await ForwardToAltinn(
            "accessmanagement/api/v1/connection/rightholders",
            "rightholders");

    // GET /api/accessmanagement/clients
    // Returns client delegations for the given party.
    // Query params: party (required)
    [HttpGet("clients")]
    public async Task<IActionResult> GetClients()
        => await ForwardToAltinn(
            "accessmanagement/api/v1/clientdelegations/clients",
            "clients");

    // GET /api/accessmanagement/agents
    // Returns agent connections for the given party.
    // Query params: party (required)
    [HttpGet("agents")]
    public async Task<IActionResult> GetAgents()
        => await ForwardToAltinn(
            "accessmanagement/api/v1/clientdelegations/agents",
            "agents");

    private async Task<IActionResult> ForwardToAltinn(string path, string label)
    {
        var altinnToken = Request.Cookies["dp_altinn_token"];
        if (string.IsNullOrEmpty(altinnToken))
            return Unauthorized(new { error = "No Altinn token. Please log in with the required scopes." });

        var baseUrl = config["Altinn:AccessManagementBaseUrl"]
            ?? "https://platform.tt02.altinn.no";

        var queryString = Request.QueryString.Value ?? string.Empty;
        var endpoint = $"{baseUrl}/{path}{queryString}";

        try
        {
            var httpClient = httpClientFactory.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", altinnToken);

            var response = await httpClient.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Altinn {Label} returned {Status}: {Body}", label, response.StatusCode, content);
                return StatusCode((int)response.StatusCode, content);
            }

            return Content(content, "application/json");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch {Label} from Altinn", label);
            return StatusCode(500, new { error = "Failed to contact Altinn API." });
        }
    }
}
