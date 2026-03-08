export interface ScopeDefinition {
  scope: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  required: boolean;
  category: string;
}

export interface TokenInfo {
  isAuthenticated: boolean;
  idTokenClaims: Record<string, unknown> | null;
  accessTokenClaims: Record<string, unknown> | null;
  altinnTokenClaims: Record<string, unknown> | null;
  scopes: string[];
  accessTokenExpiresAt: string | null; // ISO-8601
  altinnTokenExpiresAt: string | null;
}

export interface RefreshResult {
  accessTokenExpiresAt: string | null;
  altinnTokenExpiresAt: string | null;
}
