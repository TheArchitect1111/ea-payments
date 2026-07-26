/**
 * OpenFGA extension point — NON-AUTHORITATIVE (INV-16).
 * Never call from assertPeopleAccess. Export/sync tooling only.
 */
export type AuthzTuple = {
  user: string;
  relation: string;
  object: string;
};

export interface AuthzProjector {
  projectOrg(organizationId: string): Promise<AuthzTuple[]>;
}

/** Projects internal ACL state to tuples for future OpenFGA sync — not used for allow/deny. */
export class InternalAclAuthzProjector implements AuthzProjector {
  async projectOrg(organizationId: string): Promise<AuthzTuple[]> {
    void organizationId;
    return [];
  }
}
