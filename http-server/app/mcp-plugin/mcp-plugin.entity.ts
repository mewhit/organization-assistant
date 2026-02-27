import { type McpPluginRecord, type NewMcpPluginRecord } from "../../db/schemas/mcp-plugins.schema";

export type McpPlugin = McpPluginRecord;

export type McpPluginTools = McpPluginRecord["tools"];

export type CreatableMcpPlugin = NewMcpPluginRecord;

export type UpdatableMcpPlugin = Partial<NewMcpPluginRecord>;
