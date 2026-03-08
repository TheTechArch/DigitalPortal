namespace DigitalPortal.Server.Models;

public record ScopeDefinition(
    string Scope,
    string Title,
    string TitleEn,
    string Description,
    string DescriptionEn,
    bool Required,
    string Category
);
