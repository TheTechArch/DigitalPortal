using DigitalPortal.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace DigitalPortal.Server.Controllers;

[ApiController]
[Route("api/connectionpackages")]
public class ConnectionPackagesController(ConnectionPackagesService connectionPackagesService) : ControllerBase
{
    // GET /api/connectionpackages?party=uuid&from=uuid or &to=uuid
    [HttpGet]
    public async Task<IActionResult> GetConnectionPackages()
    {
        var altinnToken = Request.Cookies["dp_altinn_token"];
        if (string.IsNullOrEmpty(altinnToken))
            return Unauthorized(new { error = "No Altinn token. Please log in with the required scopes." });

        try
        {
            var queryString = Request.QueryString.Value ?? string.Empty;
            var (result, error, statusCode) = await connectionPackagesService.GetConnectionPackagesAsync(altinnToken, queryString);

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
