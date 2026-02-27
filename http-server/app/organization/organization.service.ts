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
  private static generateSlug(name: string): string {
    return name
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  static create(payload: CreatableOrganization): Effect.Effect<Organization, OrganizationServiceError> {
    return Effect.gen(function* () {
      const baseSlug = OrganizationService.generateSlug(payload.name);
      const organizations = yield* OrganizationStorage.find({ slug: { mode: "partial", value: baseSlug } });

      // Filter organizations where slug matches baseSlug or baseSlug_\d+
      const regex = new RegExp(`^${baseSlug}(_\\d+)?$`);
      const matchingOrgs = organizations.filter((org) => regex.test(org.slug));

      // Extract suffixes
      const suffixes = matchingOrgs
        .map((org) => {
          if (org.slug === baseSlug) return 0;
          const match = org.slug.match(new RegExp(`^${baseSlug}_(\\d+)$`));
          return match ? parseInt(match[1], 10) : -1;
        })
        .filter((s) => s >= 0);

      const maxSuffix = suffixes.length > 0 ? Math.max(...suffixes) : -1;
      const nextSuffix = maxSuffix + 1;
      const slug = nextSuffix === 0 ? baseSlug : `${baseSlug}_${nextSuffix}`;

      return yield* OrganizationStorage.insert({ ...payload, slug }).pipe(
        Effect.flatMap(
          Option.match({
            onNone: () => Effect.fail(new UnknownDbError("Organization not found")),
            onSome: (organization) => Effect.succeed(organization),
          }),
        ),
      );
    });
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
