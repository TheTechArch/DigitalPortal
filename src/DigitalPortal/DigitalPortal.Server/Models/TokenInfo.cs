namespace DigitalPortal.Server.Models;

public record TokenInfo(
    bool IsAuthenticated,
    Dictionary<string, object?>? IdTokenClaims,
    Dictionary<string, object?>? AccessTokenClaims,
    Dictionary<string, object?>? AltinnTokenClaims,
    string[] Scopes,
    DateTime? AccessTokenExpiresAt,
    DateTime? AltinnTokenExpiresAt
);
