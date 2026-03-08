export type AuthorizedPartyType = 'None' | 'Person' | 'Organization' | 'SelfIdentified';

// "false" | "true" | "auto" — Altinn's tristate filter
export type IncludeFilter = 'false' | 'true' | 'auto';

export interface AuthorizedResourceInstance {
  resourceId: string;
  instanceId: string;
}

export interface AuthorizedPartyDto {
  partyUuid: string;
  name: string;
  organizationNumber?: string;
  parentId?: string;
  personId?: string;
  dateOfBirth?: string;
  partyId: number;
  emailId?: string;
  type: AuthorizedPartyType;
  unitType?: string;
  isDeleted: boolean;
  onlyHierarchyElementWithNoAccess: boolean;
  authorizedAccessPackages: string[];
  authorizedResources: string[];
  authorizedRoles: string[];
  authorizedInstances: AuthorizedResourceInstance[];
  subunits: AuthorizedPartyDto[];
}

export interface PaginatedResult<T> {
  data: T[];
  links?: { next?: string };
}

// Filter state used by the UI
export interface AuthorizedPartiesFilter {
  includeRoles: boolean;
  includeAccessPackages: boolean;
  includeResources: boolean;
  includeInstances: boolean;
  includePartiesViaKeyRoles: IncludeFilter;
  includeSubParties: IncludeFilter;
  includeInactiveParties: IncludeFilter;
  partyFilter: string;       // comma-separated UUIDs
  anyOfResourceIds: string;  // comma-separated resource IDs
}

export const defaultFilter: AuthorizedPartiesFilter = {
  includeRoles: false,
  includeAccessPackages: false,
  includeResources: false,
  includeInstances: false,
  includePartiesViaKeyRoles: 'auto',
  includeSubParties: 'auto',
  includeInactiveParties: 'auto',
  partyFilter: '',
  anyOfResourceIds: '',
};

export function buildQueryString(f: AuthorizedPartiesFilter): string {
  const params = new URLSearchParams();
  if (f.includeRoles) params.set('includeRoles', 'true');
  if (f.includeAccessPackages) params.set('includeAccessPackages', 'true');
  if (f.includeResources) params.set('includeResources', 'true');
  if (f.includeInstances) params.set('includeInstances', 'true');
  if (f.includePartiesViaKeyRoles !== 'auto') params.set('includePartiesViaKeyRoles', f.includePartiesViaKeyRoles);
  if (f.includeSubParties !== 'auto') params.set('includeSubParties', f.includeSubParties);
  if (f.includeInactiveParties !== 'auto') params.set('includeInactiveParties', f.includeInactiveParties);
  f.partyFilter.split(',').map(s => s.trim()).filter(Boolean).forEach(v => params.append('partyFilter', v));
  f.anyOfResourceIds.split(',').map(s => s.trim()).filter(Boolean).forEach(v => params.append('anyOfResourceIds', v));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
