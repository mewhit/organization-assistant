import { Effect, Option } from "effect";
import { type DbError, UnknownDbError } from "@libs/dbHandler";

import { OrganizationContextStorage } from "./organization-context.storage";
import {
  type OrganizationContext,
  type CreatableOrganizationContext,
  type UpdatableOrganizationContext,
} from "./organization-context.entity";

export class OrganizationContextNotFound {
  readonly _tag = "OrganizationContextNotFound";
}

export class OrganizationContextAlreadyExists {
  readonly _tag = "OrganizationContextAlreadyExists";
}

export type OrganizationContextServiceError = OrganizationContextNotFound | OrganizationContextAlreadyExists | DbError;

export class OrganizationContextService {
  static create(
    payload: CreatableOrganizationContext,
  ): Effect.Effect<OrganizationContext, OrganizationContextServiceError> {
    return OrganizationContextStorage.insert(payload).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new UnknownDbError("OrganizationContext not found")),
          onSome: (organizationContext) => Effect.succeed(organizationContext),
        }),
      ),
    );
  }

  static findOne(id: string): Effect.Effect<OrganizationContext, OrganizationContextServiceError> {
    return OrganizationContextStorage.findOne(id).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OrganizationContextNotFound()),
          onSome: (organizationContext) => Effect.succeed(organizationContext),
        }),
      ),
    );
  }

  static find(id: string) {
    return this.findOne(id);
  }

  static update(
    id: string,
    payload: UpdatableOrganizationContext,
  ): Effect.Effect<OrganizationContext, OrganizationContextServiceError> {
    return OrganizationContextStorage.update(id, payload).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OrganizationContextNotFound()),
          onSome: (organizationContext) => Effect.succeed(organizationContext),
        }),
      ),
    );
  }

  static remove(id: string): Effect.Effect<OrganizationContext, OrganizationContextServiceError> {
    return OrganizationContextStorage.del(id).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OrganizationContextNotFound()),
          onSome: (organizationContext) => Effect.succeed(organizationContext),
        }),
      ),
    );
  }
}
