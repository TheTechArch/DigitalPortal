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
    {
        var altinnToken = Request.Cookies["dp_altinn_token"];
        if (string.IsNullOrEmpty(altinnToken))
            return Unauthorized(new { error = "No Altinn token. Please log in with the required scopes." });

        var baseUrl = config["Altinn:AccessManagementBaseUrl"]
            ?? "https://platform.tt02.altinn.no";

        // Forward all query parameters as-is to Altinn
        var queryString = Request.QueryString.Value ?? string.Empty;
        var endpoint = $"{baseUrl}/accessmanagement/api/v1/enduser/authorizedparties{queryString}";

        try
        {
            var httpClient = httpClientFactory.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", altinnToken);

            var response = await httpClient.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Altinn authorizedparties returned {Status}: {Body}", response.StatusCode, content);
                return StatusCode((int)response.StatusCode, content);
            }

            return Content(content, "application/json");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch authorizedparties from Altinn");
            return StatusCode(500, new { error = "Failed to contact Altinn API." });
        }
    }
}
