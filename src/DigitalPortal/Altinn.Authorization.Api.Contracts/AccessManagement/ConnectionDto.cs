namespace Altinn.Authorization.Api.Contracts.AccessManagement;

/// <summary>
/// Connection from one party to another
/// </summary>
public class ConnectionDto
{
    /// <summary>
    /// The party for which the connection and access applies
    /// </summary>
    public CompactEntityDto Party { get; set; } = new();

    /// <summary>
    /// Role accesses for the given party
    /// </summary>
    public List<CompactRoleDto> Roles { get; set; } = new();

    /// <summary>
    /// Access packages for the given party
    /// </summary>
    public List<AccessPackageDto> Packages { get; set; } = new();

    /// <summary>
    /// Direct resource accesses for the given party
    /// </summary>
    public List<ResourceDto> Resources { get; set; } = new();

    /// <summary>
    /// Sub-connections of the party where the same access applies
    /// </summary>
    public List<ConnectionDto> Connections { get; set; } = new();
}

/// <summary>
/// A single access package with its permissions (from the connections/accesspackages endpoint)
/// </summary>
public class ConnectionPackageDto
{
    /// <summary>
    /// The access package
    /// </summary>
    public CompactPackageDto Package { get; set; } = new();

    /// <summary>
    /// Permissions for this package
    /// </summary>
    public List<ConnectionPackagePermissionDto> Permissions { get; set; } = new();
}

/// <summary>
/// A permission entry showing from/to/via/role for a connection package
/// </summary>
public class ConnectionPackagePermissionDto
{
    /// <summary>
    /// The party granting access
    /// </summary>
    public CompactEntityDto From { get; set; } = new();

    /// <summary>
    /// The party receiving access
    /// </summary>
    public CompactEntityDto To { get; set; } = new();

    /// <summary>
    /// Optional intermediary party
    /// </summary>
    public CompactEntityDto? Via { get; set; }

    /// <summary>
    /// The role that grants the permission
    /// </summary>
    public CompactRoleDto? Role { get; set; }

    /// <summary>
    /// Optional role via which the permission is granted
    /// </summary>
    public CompactRoleDto? ViaRole { get; set; }

    /// <summary>
    /// Optional reason
    /// </summary>
    public string? Reason { get; set; }
}
