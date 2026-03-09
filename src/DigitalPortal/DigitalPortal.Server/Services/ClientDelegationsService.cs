using System.Net.Http.Headers;
using System.Text.Json;
using Altinn.Authorization.Api.Contracts.AccessManagement;

namespace DigitalPortal.Server.Services;

public class ClientDelegationsService(
    IConfiguration config,
    IHttpClientFactory httpClientFactory,
    ILogger<ClientDelegationsService> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<(List<MyClientDto>? Result, string? Error, int StatusCode)>
        GetMyClientsAsync(string altinnToken)
    {
        var baseUrl = config["Altinn:AccessManagementBaseUrl"]
            ?? "https://platform.tt02.altinn.no";

        var endpoint = $"{baseUrl}/accessmanagement/api/v1/enduser/clientdelegations/my/clients";

        var httpClient = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", altinnToken);

        var response = await httpClient.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("Altinn myclients returned {Status}: {Body}", response.StatusCode, content);
            return (null, content, (int)response.StatusCode);
        }

        var result = JsonSerializer.Deserialize<List<MyClientDto>>(content, JsonOptions);
        return (result, null, (int)response.StatusCode);
    }
}
