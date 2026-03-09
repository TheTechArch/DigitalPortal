using DigitalPortal.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace DigitalPortal.Server.Controllers;

[ApiController]
[Route("api/clientdelegations")]
public class ClientDelegationsController(ClientDelegationsService clientDelegationsService) : ControllerBase
{
    // GET /api/clientdelegations/myclients
    // Requires dp_altinn_token cookie and altinn:clientdelegations/myclients.read scope.
    [HttpGet("myclients")]
    public async Task<IActionResult> GetMyClients()
    {
        var altinnToken = Request.Cookies["dp_altinn_token"];
        if (string.IsNullOrEmpty(altinnToken))
            return Unauthorized(new { error = "No Altinn token. Please log in with the required scopes." });

        try
        {
            var (content, statusCode) = await clientDelegationsService.GetMyClientsAsync(altinnToken);

            if (statusCode < 200 || statusCode >= 300)
                return StatusCode(statusCode, content);

            return Content(content, "application/json");
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "Failed to contact Altinn API." });
        }
    }
}
