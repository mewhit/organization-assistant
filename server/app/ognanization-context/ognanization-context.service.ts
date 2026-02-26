import { Effect, Option } from "effect";
import { type DbError, UnknownDbError } from "@libs/dbHandler";

import { OgnanizationContextStorage } from "./ognanization-context.storage";
import {
  type OgnanizationContext,
  type CreatableOgnanizationContext,
  type UpdatableOgnanizationContext,
} from "./ognanization-context.entity";

export class OgnanizationContextNotFound {
  readonly _tag = "OgnanizationContextNotFound";
}

export class OgnanizationContextAlreadyExists {
  readonly _tag = "OgnanizationContextAlreadyExists";
}

export type OgnanizationContextServiceError = OgnanizationContextNotFound | OgnanizationContextAlreadyExists | DbError;

export class OgnanizationContextService {
  static create(
    payload: CreatableOgnanizationContext,
  ): Effect.Effect<OgnanizationContext, OgnanizationContextServiceError> {
    return OgnanizationContextStorage.insert(payload).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new UnknownDbError("OgnanizationContext not found")),
          onSome: (ognanizationContext) => Effect.succeed(ognanizationContext),
        }),
      ),
    );
  }

  static findOne(id: string): Effect.Effect<OgnanizationContext, OgnanizationContextServiceError> {
    return OgnanizationContextStorage.findOne(id).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OgnanizationContextNotFound()),
          onSome: (ognanizationContext) => Effect.succeed(ognanizationContext),
        }),
      ),
    );
  }

  static find(id: string) {
    return this.findOne(id);
  }

  static update(
    id: string,
    payload: UpdatableOgnanizationContext,
  ): Effect.Effect<OgnanizationContext, OgnanizationContextServiceError> {
    return OgnanizationContextStorage.update(id, payload).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OgnanizationContextNotFound()),
          onSome: (ognanizationContext) => Effect.succeed(ognanizationContext),
        }),
      ),
    );
  }

  static remove(id: string): Effect.Effect<OgnanizationContext, OgnanizationContextServiceError> {
    return OgnanizationContextStorage.del(id).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OgnanizationContextNotFound()),
          onSome: (ognanizationContext) => Effect.succeed(ognanizationContext),
        }),
      ),
    );
  }
}
