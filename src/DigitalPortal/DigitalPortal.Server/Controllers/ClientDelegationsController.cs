using System.Net.Http.Headers;
using Microsoft.AspNetCore.Mvc;

namespace DigitalPortal.Server.Controllers;

[ApiController]
[Route("api/clientdelegations")]
public class ClientDelegationsController(
    IConfiguration config,
    IHttpClientFactory httpClientFactory,
    ILogger<ClientDelegationsController> logger)
{
    // GET /api/clientdelegations/myclients
    // Requires dp_altinn_token cookie and altinn:clientdelegations/myclients.read scope.
    [HttpGet("myclients")]
    public async Task<IActionResult> GetMyClients()
    {
        var altinnToken = Request.Cookies["dp_altinn_token"];
        if (string.IsNullOrEmpty(altinnToken))
            return Unauthorized(new { error = "No Altinn token. Please log in with the required scopes." });

        var baseUrl = config["Altinn:AccessManagementBaseUrl"]
            ?? "https://platform.tt02.altinn.no";

        var endpoint = $"{baseUrl}/accessmanagement/api/v1/enduser/clientdelegations/my/clients";

        try
        {
            var httpClient = httpClientFactory.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", altinnToken);

            var response = await httpClient.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Altinn myclients returned {Status}: {Body}", response.StatusCode, content);
                return StatusCode((int)response.StatusCode, content);
            }

            return Content(content, "application/json");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch myclients from Altinn");
            return StatusCode(500, new { error = "Failed to contact Altinn API." });
        }
    }
}
