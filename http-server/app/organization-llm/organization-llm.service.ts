import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { Effect, Option } from "effect";
import { type DbError, UnknownDbError } from "@libs/dbHandler";

import { OrganizationLlmStorage } from "./organization-llm.storage";
import {
  type OrganizationLlm,
  type CreatableOrganizationLlm,
  type UpdatableOrganizationLlm,
} from "./organization-llm.entity";

type OrganizationLlmListItem = Omit<OrganizationLlm, "apiKey">;

export class OrganizationLlmNotFound {
  readonly _tag = "OrganizationLlmNotFound";
}

export class OrganizationLlmAlreadyExists {
  readonly _tag = "OrganizationLlmAlreadyExists";
}

export type OrganizationLlmServiceError = OrganizationLlmNotFound | OrganizationLlmAlreadyExists | DbError;

export class OrganizationLlmService {
  private static getEncryptionKey(): Buffer {
    const secret = process.env.API_KEY_ENCRYPTION_SECRET;

    if (!secret) {
      throw new UnknownDbError("Missing API_KEY_ENCRYPTION_SECRET");
    }

    return createHash("sha256").update(secret).digest();
  }

  private static encryptApiKey(apiKey: string): Effect.Effect<string, UnknownDbError> {
    return Effect.try({
      try: () => {
        const iv = randomBytes(12);
        const key = this.getEncryptionKey();
        const cipher = createCipheriv("aes-256-gcm", key, iv);
        const encrypted = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
        const authTag = cipher.getAuthTag();

        return `enc:v1:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
      },
      catch: () => new UnknownDbError("Failed to encrypt organization LLM apiKey"),
    });
  }

  private static decryptApiKey(apiKey: string): string {
    try {
      if (!apiKey.startsWith("enc:v1:")) {
        return apiKey;
      }

      const [, , ivHex, authTagHex, encryptedHex] = apiKey.split(":");

      if (!ivHex || !authTagHex || !encryptedHex) {
        return apiKey;
      }

      const key = this.getEncryptionKey();
      const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
      decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

      const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]);

      return decrypted.toString("utf8");
    } catch {
      return apiKey;
    }
  }

  private static mapDecryptedApiKey(organizationLlm: OrganizationLlm): OrganizationLlm {
    return { ...organizationLlm, apiKey: this.decryptApiKey(organizationLlm.apiKey) };
  }

  private static mapListItem(organizationLlm: OrganizationLlm): OrganizationLlmListItem {
    const { apiKey: _apiKey, ...rest } = organizationLlm;

    return rest;
  }

  static create(payload: CreatableOrganizationLlm): Effect.Effect<OrganizationLlm, OrganizationLlmServiceError> {
    return this.encryptApiKey(payload.apiKey).pipe(
      Effect.flatMap((apiKey) => OrganizationLlmStorage.insert({ ...payload, apiKey })),
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new UnknownDbError("OrganizationLlm not found")),
          onSome: (organizationLlm) => Effect.succeed(this.mapDecryptedApiKey(organizationLlm)),
        }),
      ),
    );
  }

  static findOne(id: string): Effect.Effect<OrganizationLlm, OrganizationLlmServiceError> {
    return OrganizationLlmStorage.findOne(id).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OrganizationLlmNotFound()),
          onSome: (organizationLlm) => Effect.succeed(this.mapDecryptedApiKey(organizationLlm)),
        }),
      ),
    );
  }

  static findMany(): Effect.Effect<OrganizationLlmListItem[], OrganizationLlmServiceError> {
    return OrganizationLlmStorage.findMany().pipe(
      Effect.map((organizationLlms) => organizationLlms.map((organizationLlm) => this.mapListItem(organizationLlm))),
    );
  }

  static find(id: string) {
    return this.findOne(id);
  }

  static update(
    id: string,
    payload: UpdatableOrganizationLlm,
  ): Effect.Effect<OrganizationLlm, OrganizationLlmServiceError> {
    const updatePayloadEffect: Effect.Effect<UpdatableOrganizationLlm, UnknownDbError> = payload.apiKey
      ? this.encryptApiKey(payload.apiKey).pipe(Effect.map((apiKey) => ({ ...payload, apiKey })))
      : Effect.succeed(payload);

    return updatePayloadEffect.pipe(
      Effect.flatMap((updatePayload) => OrganizationLlmStorage.update(id, updatePayload)),
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OrganizationLlmNotFound()),
          onSome: (organizationLlm) => Effect.succeed(this.mapDecryptedApiKey(organizationLlm)),
        }),
      ),
    );
  }

  static remove(id: string): Effect.Effect<OrganizationLlm, OrganizationLlmServiceError> {
    return OrganizationLlmStorage.del(id).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new OrganizationLlmNotFound()),
          onSome: (organizationLlm) => Effect.succeed(this.mapDecryptedApiKey(organizationLlm)),
        }),
      ),
    );
  }
}
