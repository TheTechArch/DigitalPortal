export interface CompactRole {
  id: string;
  code: string;
  urn: string;
}

export interface AccessPackage {
  id: string;
  urn: string;
  areaId: string;
}

export interface Resource {
  id: string;
  providerId?: string;
  typeId?: string;
  name?: string;
  description?: string;
  refId?: string;
}

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

export interface ConnectionDto {
  party: CompactEntity;
  roles: CompactRole[];
  packages: AccessPackage[];
  resources: Resource[];
  connections: ConnectionDto[];
}

export interface PaginatedResult<T> {
  data: T[];
  links?: { next?: string };
}

export interface ConnectionsFilter {
  party: string;                    // UUID – required by Altinn (selected from authorized parties)
  includeClientDelegations: boolean;
  includeAgentConnections: boolean;
}

export const defaultConnectionsFilter: ConnectionsFilter = {
  party: '',
  includeClientDelegations: true,
  includeAgentConnections: true,
};

export function buildConnectionsQueryString(f: ConnectionsFilter): string {
  const params = new URLSearchParams();
  if (f.party) params.set('party', f.party.trim());
  if (!f.includeClientDelegations) params.set('includeClientDelegations', 'false');
  if (!f.includeAgentConnections) params.set('includeAgentConnections', 'false');
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
