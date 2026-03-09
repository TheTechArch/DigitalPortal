namespace Altinn.Authorization.Api.Contracts.AccessManagement;

/// <summary>
/// Input model for identifying a person when creating a connection.
/// </summary>
public class PersonInputDto
{
    /// <summary>
    /// Either an 11-digit national identity number (fødselsnummer) or a username.
    /// </summary>
    public string? PersonIdentifier { get; set; }

    /// <summary>
    /// Last name of the person.
    /// </summary>
    public string? LastName { get; set; }
}
