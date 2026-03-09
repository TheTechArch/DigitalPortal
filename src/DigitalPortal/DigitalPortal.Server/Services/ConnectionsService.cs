using System.Net.Http.Headers;
using System.Text.Json;
using Altinn.Authorization.Api.Contracts.AccessManagement;

namespace DigitalPortal.Server.Services;

public class ConnectionsService(
    IConfiguration config,
    IHttpClientFactory httpClientFactory,
    ILogger<ConnectionsService> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private static readonly JsonSerializerOptions CamelCaseOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public async Task<(PaginatedResultDto<List<ConnectionDto>>? Result, string? Error, int StatusCode)>
        GetConnectionsAsync(string altinnToken, string queryString)
    {
        var baseUrl = config["Altinn:AccessManagementBaseUrl"]
            ?? "https://platform.tt02.altinn.no";

        var endpoint = $"{baseUrl}/accessmanagement/api/v1/enduser/connections{queryString}";

        var httpClient = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", altinnToken);

        var response = await httpClient.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("Altinn connections returned {Status}: {Body}", response.StatusCode, content);
            return (null, content, (int)response.StatusCode);
        }

        var result = JsonSerializer.Deserialize<PaginatedResultDto<List<ConnectionDto>>>(content, JsonOptions);
        return (result, null, (int)response.StatusCode);
    }

    public async Task<(AssignmentDto? Result, string? Error, int StatusCode)>
        CreateConnectionAsync(string altinnToken, string queryString, PersonInputDto input)
    {
        var baseUrl = config["Altinn:AccessManagementBaseUrl"]
            ?? "https://platform.tt02.altinn.no";

        var endpoint = $"{baseUrl}/accessmanagement/api/v1/enduser/connections{queryString}";

        var httpClient = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", altinnToken);
        request.Content = new StringContent(
            JsonSerializer.Serialize(input, CamelCaseOptions),
            System.Text.Encoding.UTF8,
            "application/json");

        var response = await httpClient.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("Altinn create connection returned {Status}: {Body}", response.StatusCode, content);
            return (null, content, (int)response.StatusCode);
        }

        var result = JsonSerializer.Deserialize<AssignmentDto>(content, JsonOptions);
        return (result, null, (int)response.StatusCode);
    }
}
