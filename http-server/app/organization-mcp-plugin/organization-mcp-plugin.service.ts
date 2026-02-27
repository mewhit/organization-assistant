import { Effect, Option } from "effect";
import { type DbError, UnknownDbError } from "@libs/dbHandler";

import { OrganizationMcpPluginStorage } from "./organization-mcp-plugin.storage";
import {
  type OrganizationMcpPlugin,
  type CreatableOrganizationMcpPlugin,
  type UpdatableOrganizationMcpPlugin,
} from "./organization-mcp-plugin.entity";

export class OrganizationMcpPluginNotFound {
  readonly _tag = "OrganizationMcpPluginNotFound";
}

export class OrganizationMcpPluginAlreadyExists {
  readonly _tag = "OrganizationMcpPluginAlreadyExists";
}

export type OrganizationMcpPluginServiceError = OrganizationMcpPluginNotFound | OrganizationMcpPluginAlreadyExists | DbError;

export class OrganizationMcpPluginService {
  static create(payload: CreatableOrganizationMcpPlugin): Effect.Effect<OrganizationMcpPlugin, OrganizationMcpPluginServiceError> {
    return OrganizationMcpPluginStorage.insert(payload).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new UnknownDbError("OrganizationMcpPlugin not found")),
          onSome: (organizationMcpPlugin) => Effect.succeed(organizationMcpPlugin),
        }),
      ),
    );
  }

  static findOne(id: string): Effect.Effect<OrganizationMcpPlugin, OrganizationMcpPluginServiceError> {
    return OrganizationMcpPluginStorage.findOne(id).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OrganizationMcpPluginNotFound()),
          onSome: (organizationMcpPlugin) => Effect.succeed(organizationMcpPlugin),
        }),
      ),
    );
  }

  static find(id: string) {
    return this.findOne(id);
  }

  static findActiveByOrganizationId(organizationId: string): Effect.Effect<OrganizationMcpPlugin, OrganizationMcpPluginServiceError> {
    return OrganizationMcpPluginStorage.findActiveByOrganizationId(organizationId).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OrganizationMcpPluginNotFound()),
          onSome: (organizationMcpPlugin) => Effect.succeed(organizationMcpPlugin),
        }),
      ),
    );
  }

  static update(
    id: string,
    payload: UpdatableOrganizationMcpPlugin,
  ): Effect.Effect<OrganizationMcpPlugin, OrganizationMcpPluginServiceError> {
    return OrganizationMcpPluginStorage.update(id, payload).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OrganizationMcpPluginNotFound()),
          onSome: (organizationMcpPlugin) => Effect.succeed(organizationMcpPlugin),
        }),
      ),
    );
  }

  static remove(id: string): Effect.Effect<OrganizationMcpPlugin, OrganizationMcpPluginServiceError> {
    return OrganizationMcpPluginStorage.del(id).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OrganizationMcpPluginNotFound()),
          onSome: (organizationMcpPlugin) => Effect.succeed(organizationMcpPlugin),
        }),
      ),
    );
  }
}
