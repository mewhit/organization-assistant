import { Schema } from "effect";
import { McpPluginDtoSchema } from "./mcp-plugin.dto";
import { OrganizationLlmDtoSchema } from "./organization-llm.dto";
import { OrganizationMcpPluginDtoSchema } from "./organization-mcp-plugin.dto";

export const CommandOrchestratorDtoSchema = Schema.Struct({
  organizationLlmId: Schema.String,
  command: Schema.String,
});

export type CommandOrchestratorDto = Schema.Schema.Type<typeof CommandOrchestratorDtoSchema>;

export const CommandOrchestratorResultDtoSchema = Schema.Struct({
  organizationLlm: OrganizationLlmDtoSchema,
  organizationMcpPlugin: OrganizationMcpPluginDtoSchema,
  mcpPlugin: McpPluginDtoSchema,
  response: Schema.Unknown,
});

export type CommandOrchestratorResultDto = Schema.Schema.Type<typeof CommandOrchestratorResultDtoSchema>;
