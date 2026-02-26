import { Effect, Option } from "effect";
import { type DbError, UnknownDbError } from "@libs/dbHandler";

import { OrganizationStorage } from "./organization.storage";
import { type Organization, type CreatableOrganization, type UpdatableOrganization } from "./organization.entity";

export class OrganizationNotFound {
  readonly _tag = "OrganizationNotFound";
}

export class OrganizationAlreadyExists {
  readonly _tag = "OrganizationAlreadyExists";
}

export type OrganizationServiceError = OrganizationNotFound | OrganizationAlreadyExists | DbError;

export class OrganizationService {
  static create(payload: CreatableOrganization): Effect.Effect<Organization, OrganizationServiceError> {
    return OrganizationStorage.insert(payload).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new UnknownDbError("Organization not found")),
          onSome: (organization) => Effect.succeed(organization),
        }),
      ),
    );
  }

  static findOne(id: string): Effect.Effect<Organization, OrganizationServiceError> {
    return OrganizationStorage.findOne(id).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OrganizationNotFound()),
          onSome: (organization) => Effect.succeed(organization),
        }),
      ),
    );
  }

  static find(id: string) {
    return this.findOne(id);
  }

  static update(id: string, payload: UpdatableOrganization): Effect.Effect<Organization, OrganizationServiceError> {
    return OrganizationStorage.update(id, payload).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OrganizationNotFound()),
          onSome: (organization) => Effect.succeed(organization),
        }),
      ),
    );
  }

  static remove(id: string): Effect.Effect<Organization, OrganizationServiceError> {
    return OrganizationStorage.del(id).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OrganizationNotFound()),
          onSome: (organization) => Effect.succeed(organization),
        }),
      ),
    );
  }
}
