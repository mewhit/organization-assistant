import { usersTable } from "./schemas/users.schema";
import { organizationsTable } from "./schemas/organizations.schema";
import { organizationUsersTable } from "./schemas/organization-users.schema";
import { organizationContextsTable } from "./schemas/organization-contexts.schema";

export { usersTable, organizationsTable, organizationUsersTable, organizationContextsTable };

export const schema = {
  usersTable,
  organizationsTable,
  organizationUsersTable,
  organizationContextsTable,
};
