import { usersTable } from "./schemas/users.schema";
import { organizationsTable } from "./schemas/organizations.schema";
import { organizationUsersTable } from "./schemas/organization-users.schema";
import { organizationContextsTable } from "./schemas/organization-contexts.schema";
import { organizationLlmsTable } from "./schemas/organization-llms.schema";

export { usersTable, organizationsTable, organizationUsersTable, organizationContextsTable, organizationLlmsTable };

export const schema = {
  usersTable,
  organizationsTable,
  organizationUsersTable,
  organizationContextsTable,
  organizationLlmsTable,
};
