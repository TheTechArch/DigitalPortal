namespace Altinn.Authorization.Api.Contracts.AccessManagement;

/// <summary>
/// Generic paginated result returned by Altinn APIs.
/// </summary>
public class PaginatedResultDto<T>
{
    /// <summary>
    /// The result data.
    /// </summary>
    public T Data { get; set; } = default!;

    /// <summary>
    /// Pagination links.
    /// </summary>
    public PaginationLinks? Links { get; set; }
}

/// <summary>
/// Pagination links for navigating result sets.
/// </summary>
public class PaginationLinks
{
    /// <summary>
    /// Link to the next page of results.
    /// </summary>
    public string? Next { get; set; }
}
