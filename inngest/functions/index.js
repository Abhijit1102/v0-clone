import Sandbox from "@e2b/code-interpreter";
import * as z from "zod";

import { inngest } from "../client";
import { openai, createAgent, createTool, createNetwork } from "@inngest/agent-kit";
import { PROMPT } from "@/prompt";
import db from "@/lib/db";
import { MessageRole, MessageType } from "@prisma/client";
import {lastAssistantTextMessageContent, normalizeDirectives} from "../utils"

export const codeAgent = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    // Step 1: Create sandbox
    const sandboxId = await step.run("create-sandbox", async () => {
      const sandbox = await Sandbox.create("v0-clone-build-v1", {
        allowInternetAccess: true,
        timeoutMs: 30 * 60 * 1000,
      });
      return sandbox.sandboxId;
    });

    const codeAgent = createAgent({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: openai({ model: "gpt-4o-mini", apiKey: process.env.OPENAI_API_KEY }),
      tools: [
        // Terminal
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({ command: z.string() }),
          handler: async ({ command }, { step,  network }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };
              try {
                const sandbox = await Sandbox.connect(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data) => (buffers.stdout += data),
                  onStderr: (data) => (buffers.stderr += data),
                });
                return result.stdout;
              } catch (error) {
                console.log(
                  `Command failed: ${error}\nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`
                );
                return `Command failed: ${error}\nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
              }
            });
          },
        }),

        // createOrUpdateFiles
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(z.object({ path: z.string(), content: z.string() })),
          }),
          handler: async ({ files }, { step }) => {
            const newFiles = await step?.run("createOrUpdateFiles", async () => {
              try {
                const updatedFiles = network?.state?.data.files || {};
                const sandbox = await Sandbox.connect(sandboxId);

                for (const file of files) {
                  const normalized = normalizeDirectives({
                    path: file.path,
                    content: file.content,
                  });

                  await sandbox.files.write(file.path, normalized);
                  updatedFiles[file.path] = normalized;
                }

                return updatedFiles;
              } catch (error) {
                return "Error: " + error;
              }
            });

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          },
        }),

        // readFiles
        createTool({
          name: "readFiles",
          description: "Read files in the sandbox",
          parameters: z.object({ files: z.array(z.string()) }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await Sandbox.connect(sandboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (error) {
                return "Error: " + error;
              }
            });
          },
        }),
      ],

      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText = lastAssistantTextMessageContent(result);
          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }
          return result;
        },
      },
    });

    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 10,
      router: async ({ network }) => {
        if (network.state.data.summary) return;
        return codeAgent;
      },
    });

    const result = await network.run(event.data.value);

    // const isError = !result.state.data.summary || Object.keys(result.state.data.files || {}).length === 0;

    const hasSummary = Boolean(result.state.data.summary);
    const hasFiles =
      result.state.data.files &&
      Object.keys(result.state.data.files).length > 0;

    const isError = !hasSummary && !hasFiles;


    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await Sandbox.connect(sandboxId);
      const host = sandbox.getHost(3000);
      return `http://${host}`;
    });

    await step.run("save-result", async () => {
      if (isError) {
        return await db.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again",
            role: MessageRole.ASSISTANT,
            type: MessageType.ERROR,
          },
        });
      }
    
      const files = result.state.data.files ?? {};
      return await db.message.create({
        data: {
          projectId: event.data.projectId,
          content: result.state.data.summary || "Generated project files",
          role: MessageRole.ASSISTANT,
          type: MessageType.RESULT,
          fragments: {
            create: {
              sandboxUrl,
              title: "Untitled",
              files,
            },
          },
        },
      });
    });

    return {
      url: sandboxUrl,
      title: "Untitled",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  }
);
