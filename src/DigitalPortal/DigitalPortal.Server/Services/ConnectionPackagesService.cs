using System.Net.Http.Headers;
using System.Text.Json;
using Altinn.Authorization.Api.Contracts.AccessManagement;

namespace DigitalPortal.Server.Services;

public class ConnectionPackagesService(
    IConfiguration config,
    IHttpClientFactory httpClientFactory,
    ILogger<ConnectionPackagesService> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<(PaginatedResultDto<List<ConnectionPackageDto>>? Result, string? Error, int StatusCode)>
        GetConnectionPackagesAsync(string altinnToken, string queryString)
    {
        var baseUrl = config["Altinn:AccessManagementBaseUrl"]
            ?? "https://platform.tt02.altinn.no";

        var endpoint = $"{baseUrl}/accessmanagement/api/v1/enduser/connections/accesspackages{queryString}";

        var httpClient = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", altinnToken);

        var response = await httpClient.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("Altinn connection packages returned {Status}: {Body}", response.StatusCode, content);
            return (null, content, (int)response.StatusCode);
        }

        var result = JsonSerializer.Deserialize<PaginatedResultDto<List<ConnectionPackageDto>>>(content, JsonOptions);
        return (result, null, (int)response.StatusCode);
    }
}
