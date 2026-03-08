export interface CompactEntity {
  id: string;
  name: string;
  type: string;
  variant?: string;
  organizationIdentifier?: string;
  partyid?: number;
  userId?: number;
  username?: string;
}

export interface CompactRole {
  id: string;
  code: string;
  urn: string;
}

export interface CompactPackage {
  id: string;
  urn: string;
  areaId: string;
}

export interface ClientAccess {
  role: CompactRole;
  packages: CompactPackage[];
}

export interface ClientItem {
  client: CompactEntity;
  access: ClientAccess[];
}

export interface MyClient {
  provider: CompactEntity;
  clients: ClientItem[];
}

export interface PaginatedResult<T> {
  data: T[];
  links?: { next?: string };
}
