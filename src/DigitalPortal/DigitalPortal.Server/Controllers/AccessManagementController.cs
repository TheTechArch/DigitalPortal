using DigitalPortal.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace DigitalPortal.Server.Controllers;

[ApiController]
[Route("api/accessmanagement")]
public class AccessManagementController(AccessManagementService accessManagementService) : ControllerBase
{
    // GET /api/accessmanagement/authorizedparties
    // Forwards all filter query parameters to Altinn and streams the JSON response.
    [HttpGet("authorizedparties")]
    public async Task<IActionResult> GetAuthorizedParties()
    {
        var altinnToken = Request.Cookies["dp_altinn_token"];
        if (string.IsNullOrEmpty(altinnToken))
            return Unauthorized(new { error = "No Altinn token. Please log in with the required scopes." });

        try
        {
            var queryString = Request.QueryString.Value ?? string.Empty;
            var (content, statusCode) = await accessManagementService.GetAuthorizedPartiesAsync(altinnToken, queryString);

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
