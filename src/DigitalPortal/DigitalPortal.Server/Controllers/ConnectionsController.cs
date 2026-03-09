using DigitalPortal.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace DigitalPortal.Server.Controllers;

[ApiController]
[Route("api/connections")]
public class ConnectionsController(ConnectionsService connectionsService) : ControllerBase
{
    // GET /api/connections?party=uuid&from=uuid&to=uuid
    [HttpGet]
    public async Task<IActionResult> GetConnections()
    {
        var altinnToken = Request.Cookies["dp_altinn_token"];
        if (string.IsNullOrEmpty(altinnToken))
            return Unauthorized(new { error = "No Altinn token. Please log in with the required scopes." });

        try
        {
            var queryString = Request.QueryString.Value ?? string.Empty;
            var (content, statusCode) = await connectionsService.GetConnectionsAsync(altinnToken, queryString);

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
