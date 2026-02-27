import { type NewOrganizationMcpPluginRecord, type OrganizationMcpPluginRecord } from "../../db/schemas/organization-mcp-plugins.schema";

export type OrganizationMcpPlugin = OrganizationMcpPluginRecord;

export type CreatableOrganizationMcpPlugin = NewOrganizationMcpPluginRecord;

export type UpdatableOrganizationMcpPlugin = Partial<NewOrganizationMcpPluginRecord>;
