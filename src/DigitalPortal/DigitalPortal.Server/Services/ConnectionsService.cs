using System.Net.Http.Headers;

namespace DigitalPortal.Server.Services;

public class ConnectionsService(
    IConfiguration config,
    IHttpClientFactory httpClientFactory,
    ILogger<ConnectionsService> logger)
{
    public async Task<(string Content, int StatusCode)> GetConnectionsAsync(string altinnToken, string queryString)
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
            logger.LogWarning("Altinn connections returned {Status}: {Body}", response.StatusCode, content);

        return (content, (int)response.StatusCode);
    }

    public async Task<(string Content, int StatusCode)> CreateConnectionAsync(
        string altinnToken, string queryString, string jsonBody)
    {
        var baseUrl = config["Altinn:AccessManagementBaseUrl"]
            ?? "https://platform.tt02.altinn.no";

        var endpoint = $"{baseUrl}/accessmanagement/api/v1/enduser/connections{queryString}";

        var httpClient = httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", altinnToken);
        request.Content = new StringContent(jsonBody, System.Text.Encoding.UTF8, "application/json");

        var response = await httpClient.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            logger.LogWarning("Altinn create connection returned {Status}: {Body}", response.StatusCode, content);

        return (content, (int)response.StatusCode);
    }
}
