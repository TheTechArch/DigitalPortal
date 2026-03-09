export interface CompactEntity {
  id: string;
  name: string | null;
  type: string | null;
  variant: string | null;
  parent?: CompactEntity | null;
  children?: CompactEntity[] | null;
  partyid?: number | null;
  userId?: number | null;
  username?: string | null;
  organizationIdentifier?: string | null;
  personIdentifier?: string | null;
  isDeleted?: boolean;
}

export interface CompactRole {
  id: string;
  code: string | null;
  urn: string | null;
  children?: CompactRole[] | null;
}

export interface AccessPackage {
  id: string;
  urn: string | null;
  areaId: string;
}

export interface Resource {
  id: string;
  providerId?: string;
  typeId?: string;
  name: string | null;
  description?: string | null;
  refId?: string | null;
}

export interface ConnectionDto {
  party: CompactEntity;
  roles: CompactRole[] | null;
  packages: AccessPackage[] | null;
  resources: Resource[] | null;
  connections: unknown[] | null;
}

export interface PaginatedResult<T> {
  data: T[];
  links?: { next?: string | null };
}

export interface PersonInput {
  personIdentifier: string;
  lastName: string;
}

export interface AssignmentDto {
  id: string;
  roleId: string;
  fromId: string;
  toId: string;
}

export interface DelegationCheckReason {
  description: string | null;
  roleId?: string | null;
  roleUrn?: string | null;
  fromId?: string | null;
  fromName?: string | null;
  toId?: string | null;
  toName?: string | null;
  viaId?: string | null;
  viaName?: string | null;
  viaRoleId?: string | null;
}

export interface AccessPackageDtoCheck {
  package: AccessPackage;
  result: boolean;
  reasons: DelegationCheckReason[] | null;
}

export interface AssignmentPackageDto {
  id: string;
  assignmentId: string;
  packageId: string;
}
