import { Effect } from "effect";
import OpenAI from "openai";
import { UnknownDbError } from "@libs/dbHandler";
import { CommandOrchestrator } from "./command-orchestrator.entity";
import { type CommandOrchestratorResultDto } from "./command-orchestrator.dto";
import { OrganizationLlmService, type OrganizationLlmServiceError } from "../organization-llm/organization-llm.service";
import {
  OrganizationMcpPluginService,
  type OrganizationMcpPluginServiceError,
} from "../organization-mcp-plugin/organization-mcp-plugin.service";
import { McpPluginService, type McpPluginServiceError } from "../mcp-plugin/mcp-plugin.service";
import { McpGoogleSearchConsolePluginService } from "../mcp-google-search-console-plugin/mcp-google-search-console-plugin.service";
import { type GscToolName } from "../mcp-google-search-console-plugin/mcp-google-search-console-plugin.dto";

type FunctionTool = OpenAI.Responses.FunctionTool;

type OpenAITool = {
  type: "function";
  function: {
    name: string;
    parameters: Record<string, unknown>;
    description?: string;
  };
};

type OpenAIFunctionCallOutputItem = {
  type: "function_call";
  call_id: string;
  name: string;
  arguments: string;
};

type ExecutedFunctionCall = {
  callId: string;
  name: string;
  arguments: Record<string, unknown>;
  result: unknown;
};

type OpenAIResponseWithOutput = OpenAI.Responses.Response & {
  output?: Array<{ type?: string } & Record<string, unknown>>;
};

function normalizeFunctionParameters(parameters: Record<string, unknown>): Record<string, unknown> {
  const schema = parameters && typeof parameters === "object" ? { ...parameters } : {};
  const properties =
    schema.properties && typeof schema.properties === "object" && !Array.isArray(schema.properties)
      ? (schema.properties as Record<string, unknown>)
      : {};

  const required = Array.isArray(schema.required) ? schema.required : [];

  return {
    ...schema,
    type: "object",
    properties,
    required,
    additionalProperties: schema.additionalProperties ?? false,
  };
}

function mapToFunctionTool(tools: OpenAITool[]): FunctionTool[] {
  return tools.map((tool) => ({
    type: "function",
    name: tool.function.name,
    parameters: normalizeFunctionParameters(tool.function.parameters ?? {}),
    description: tool.function.description ?? null,
    strict: false,
  }));
}

export class OpenAiExecutorError {
  readonly _tag = "OpenAiExecutorError";
  constructor(readonly cause?: unknown) {}
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseFunctionArguments(rawArguments: string): Record<string, unknown> {
  if (!rawArguments || rawArguments.trim().length === 0) {
    return {};
  }

  const parsed: unknown = JSON.parse(rawArguments);

  if (!isObjectRecord(parsed)) {
    throw new OpenAiExecutorError("Function arguments must be a JSON object");
  }

  return parsed;
}

function extractFunctionCalls(response: OpenAI.Responses.Response): OpenAIFunctionCallOutputItem[] {
  const typedResponse = response as OpenAIResponseWithOutput;

  if (!Array.isArray(typedResponse.output)) {
    return [];
  }

  return typedResponse.output
    .filter((item): item is OpenAIFunctionCallOutputItem => {
      if (!isObjectRecord(item)) {
        return false;
      }

      return (
        item.type === "function_call" &&
        typeof item.call_id === "string" &&
        typeof item.name === "string" &&
        typeof item.arguments === "string"
      );
    })
    .map((item) => ({
      type: "function_call",
      call_id: item.call_id,
      name: item.name,
      arguments: item.arguments,
    }));
}

function canExecuteViaGoogleSearchConsolePlugin(mcpPluginName: string): boolean {
  return mcpPluginName.trim().toLowerCase() === "google search console";
}

function executeMcpTool(
  mcpPluginName: string,
  toolName: string,
  input: Record<string, unknown>,
  credentials: unknown,
): Effect.Effect<unknown, OpenAiExecutorError> {
  if (!canExecuteViaGoogleSearchConsolePlugin(mcpPluginName)) {
    return Effect.fail(new OpenAiExecutorError(`Unsupported MCP plugin executor for plugin '${mcpPluginName}'`));
  }

  return McpGoogleSearchConsolePluginService.executeTool(toolName as GscToolName, input, credentials).pipe(
    Effect.map((output) => output.result),
    Effect.mapError((error) => new OpenAiExecutorError(error)),
  );
}

export class CommandOrchestratorService {
  static executeCommand(
    commandOrchestrator: CommandOrchestrator,
  ): Effect.Effect<
    CommandOrchestratorResultDto,
    OrganizationLlmServiceError | OrganizationMcpPluginServiceError | McpPluginServiceError | OpenAiExecutorError
  > {
    return Effect.gen(function* () {
      const organizationLlm = yield* OrganizationLlmService.findOne(commandOrchestrator.organizationLlmId);
      const organizationMcpPlugin = yield* OrganizationMcpPluginService.findActiveByOrganizationId(organizationLlm.organizationId);
      const mcpPlugin = yield* McpPluginService.findOne(organizationMcpPlugin.mcpPluginId);

      const userMessage = commandOrchestrator.command;
      const toolsJson = Array.isArray(mcpPlugin.tools) ? (mcpPlugin.tools as OpenAITool[]) : [];
      const functionTools = mapToFunctionTool(toolsJson);
      const openai = new OpenAI({ apiKey: organizationLlm.apiKey });

      const response = yield* Effect.tryPromise({
        try: () =>
          openai.responses.create({
            model: "gpt-4.1",
            input: userMessage,
            tools: functionTools,
          }),
        catch: (error) => {
          console.error("OpenAI responses.create failed", error);

          if (error instanceof Error) {
            return new UnknownDbError(error.message);
          }

          return new UnknownDbError(error);
        },
      }).pipe(Effect.mapError(() => new OpenAiExecutorError()));

      const availableTools = new Set(functionTools.map((tool) => tool.name));

      const executedCalls: ExecutedFunctionCall[] = [];
      let currentResponse = response;

      while (true) {
        const functionCalls = extractFunctionCalls(currentResponse);

        if (functionCalls.length === 0) {
          break;
        }

        const roundExecutedCalls = yield* Effect.forEach(
          functionCalls,
          (functionCall): Effect.Effect<ExecutedFunctionCall, OpenAiExecutorError> =>
            Effect.gen(function* () {
              if (!availableTools.has(functionCall.name)) {
                return yield* Effect.fail(new OpenAiExecutorError(`Requested tool '${functionCall.name}' is not available`));
              }

              const parsedArguments = yield* Effect.try({
                try: () => parseFunctionArguments(functionCall.arguments),
                catch: (error) => new OpenAiExecutorError(error),
              });

              const result = yield* executeMcpTool(mcpPlugin.name, functionCall.name, parsedArguments, organizationMcpPlugin.config);

              return {
                callId: functionCall.call_id,
                name: functionCall.name,
                arguments: parsedArguments,
                result,
              };
            }),
        );

        executedCalls.push(...roundExecutedCalls);

        const followUpInput = roundExecutedCalls.map((call) => ({
          type: "function_call_output" as const,
          call_id: call.callId,
          output: JSON.stringify(call.result),
        }));

        currentResponse = yield* Effect.tryPromise({
          try: () =>
            openai.responses.create({
              model: "gpt-4.1",
              previous_response_id: currentResponse.id,
              input: followUpInput,
              tools: functionTools,
            }),
          catch: (error) => {
            console.error("OpenAI follow-up responses.create failed", error);

            if (error instanceof Error) {
              return new UnknownDbError(error.message);
            }

            return new UnknownDbError(error);
          },
        }).pipe(Effect.mapError((error) => new OpenAiExecutorError(error)));
      }

      if (executedCalls.length === 0) {
        return {
          organizationLlm,
          organizationMcpPlugin,
          mcpPlugin,
          response,
        };
      }

      return {
        organizationLlm,
        organizationMcpPlugin,
        mcpPlugin,
        response: {
          firstResponse: response,
          functionCalls: executedCalls,
          finalResponse: currentResponse,
        },
      };
    });
  }
}
