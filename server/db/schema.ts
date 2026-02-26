import { usersTable } from "./schemas/users.schema";
import { organizationsTable } from "./schemas/organizations.schema";
import { organizationUsersTable } from "./schemas/organization-users.schema";
import { ognanizationContextsTable } from "./schemas/ognanization-contexts.schema";

export { usersTable, organizationsTable, organizationUsersTable, ognanizationContextsTable };

export const schema = {
  usersTable,
  organizationsTable,
  organizationUsersTable,
  ognanizationContextsTable,
};
