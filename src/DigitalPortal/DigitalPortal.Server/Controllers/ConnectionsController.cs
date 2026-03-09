using Altinn.Authorization.Api.Contracts.AccessManagement;
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
            var (result, error, statusCode) = await connectionsService.GetConnectionsAsync(altinnToken, queryString);

            if (result is null)
                return StatusCode(statusCode, error);

            return Ok(result);
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "Failed to contact Altinn API." });
        }
    }

    // POST /api/connections?party=uuid  body: { personIdentifier, lastName }
    [HttpPost]
    public async Task<IActionResult> CreateConnection([FromBody] PersonInputDto input)
    {
        var altinnToken = Request.Cookies["dp_altinn_token"];
        if (string.IsNullOrEmpty(altinnToken))
            return Unauthorized(new { error = "No Altinn token. Please log in with the required scopes." });

        try
        {
            var queryString = Request.QueryString.Value ?? string.Empty;
            var (result, error, statusCode) = await connectionsService.CreateConnectionAsync(altinnToken, queryString, input);

            if (result is null)
                return StatusCode(statusCode, error);

            return Ok(result);
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "Failed to contact Altinn API." });
        }
    }
}
