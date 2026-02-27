import { Effect } from "effect";
import { Command } from "./command.entity";
import { OrganizationLlmService } from "../organization-llm/organization-llm.service";

export type CommandServiceError = {
  _tag: "CommandServiceError";
  message: string;
};

export class CommandService {
  static execute(command: Command): Effect.Effect<string, CommandServiceError> {
    return OrganizationLlmService.findOne(command.organizationLlm).pipe(
      Effect.map((organizationLlm) => `Fetched organization LLM ${organizationLlm.id} (${organizationLlm.provider})`),
      Effect.mapError((error) => ({
        _tag: "CommandServiceError",
        message:
          error && typeof error === "object" && "_tag" in error
            ? `Failed to fetch organization LLM: ${String(error._tag)}`
            : "Failed to fetch organization LLM",
      })),
    );
  }
}
