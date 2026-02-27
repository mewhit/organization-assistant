import { Effect, Option } from "effect";
import { type DbError, UnknownDbError } from "@libs/dbHandler";

import { McpPluginStorage } from "./mcp-plugin.storage";
import { type McpPlugin, type CreatableMcpPlugin, type UpdatableMcpPlugin } from "./mcp-plugin.entity";

export class McpPluginNotFound {
  readonly _tag = "McpPluginNotFound";
}

export class McpPluginAlreadyExists {
  readonly _tag = "McpPluginAlreadyExists";
}

export type McpPluginServiceError = McpPluginNotFound | McpPluginAlreadyExists | DbError;

export class McpPluginService {
  static create(payload: CreatableMcpPlugin): Effect.Effect<McpPlugin, McpPluginServiceError> {
    return McpPluginStorage.insert(payload).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new UnknownDbError("McpPlugin not found")),
          onSome: (mcpPlugin) => Effect.succeed(mcpPlugin),
        }),
      ),
    );
  }

  static findOne(id: string): Effect.Effect<McpPlugin, McpPluginServiceError> {
    return McpPluginStorage.findOne(id).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new McpPluginNotFound()),
          onSome: (mcpPlugin) => Effect.succeed(mcpPlugin),
        }),
      ),
    );
  }

  static find(id: string) {
    return this.findOne(id);
  }

  static update(id: string, payload: UpdatableMcpPlugin): Effect.Effect<McpPlugin, McpPluginServiceError> {
    return McpPluginStorage.update(id, payload).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new McpPluginNotFound()),
          onSome: (mcpPlugin) => Effect.succeed(mcpPlugin),
        }),
      ),
    );
  }

  static remove(id: string): Effect.Effect<McpPlugin, McpPluginServiceError> {
    return McpPluginStorage.del(id).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new McpPluginNotFound()),
          onSome: (mcpPlugin) => Effect.succeed(mcpPlugin),
        }),
      ),
    );
  }
}