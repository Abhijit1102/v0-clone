import Sandbox from "@e2b/code-interpreter";
import * as z from "zod";

import { inngest } from "../client";
import {
  openai,
  createAgent,
  createTool,
  createNetwork,
  createState,
} from "@inngest/agent-kit";

import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/prompt";
import db from "@/lib/db";
import { MessageRole, MessageType } from "@prisma/client";

import {
  lastAssistantTextMessageContent,
  normalizeDirectives,
} from "../utils";

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    // ✅ FIX: Get or create sandbox - reuse existing one if available
    const sandboxId = await step.run("get-or-create-sandbox", async () => {
  // 1️⃣ Try to find an existing sandbox URL from last RESULT fragment
      const project = await db.project.findUnique({
        where: { id: event.data.projectId },
        select: {
          messages: {
            where: {
              type: MessageType.RESULT,
              fragments: { isNot: null },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              fragments: {
                select: { sandboxUrl: true },
              },
            },
          },
        },
      });

      const existingSandboxUrl = project?.messages?.[0]?.fragments?.sandboxUrl;

      console.log("existingSandboxUrl : ", existingSandboxUrl);

      // 2️⃣ If sandbox exists → try to reconnect
      if (existingSandboxUrl) {
      try {
        const hostname = new URL(existingSandboxUrl).hostname;
        const withoutDomain = hostname.replace(".e2b.app", "");
        const [, extractedSandboxId] = withoutDomain.split("-", 2);

        if (!extractedSandboxId) {
          throw new Error("Invalid sandbox URL format");
        }

        console.log(`♻️ Attempting to reuse sandbox: ${extractedSandboxId}`);

        await Sandbox.connect(extractedSandboxId);

        console.log(`✅ Successfully reconnected to sandbox: ${extractedSandboxId}`);
        return extractedSandboxId;

      } catch (err) {
        console.log("⚠️ Failed to reconnect, creating new sandbox:", err.message);
      }
    }


      // 3️⃣ Create a new sandbox
      console.log("🆕 Creating new sandbox");
      
      const sandbox = await Sandbox.create("v0-clone-build-v1", {
        allowInternetAccess: true,
        timeoutMs: 30 * 60 * 1000, // 30 minutes
      });

      console.log(`✅ New sandbox created: ${sandbox.sandboxId}`);
      
      return sandbox.sandboxId;
    });


    // ✅ Get previous messages and return them from the step
    const previousMessages = await step.run("get-previous-messages", async() => {
      const formattedMessages = [];

      const messages = await db.message.findMany({
        where:{
          projectId: event.data.projectId
        },
        orderBy:{
          createdAt: "asc"
        }
      });

      for(const message of messages){
        formattedMessages.push({
          type:"text",
          role:message.role === "ASSISTANT" ? "assistant" : "user",
          content: message.content
        })
      };

      return formattedMessages;
    });

    // ✅ Now create state AFTER getting previousMessages
    const state = createState({
      summary:"",
      files:{},
    }, {
      messages: previousMessages
    });

    const agent = createAgent({
      name: "code-agent",
      description: "Expert coding agent that creates files using tools",
      system: PROMPT,
      model: openai({
        model: "gpt-4o-mini",
        apiKey: process.env.OPENAI_API_KEY,
      }),

      tools: [
        createTool({
          name: "terminal",
          description: "Run terminal commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return step.run("terminal", async () => {
              try {
                const sandbox = await Sandbox.connect(sandboxId);
                const result = await sandbox.commands.run(command);
                return result.stdout;
              } catch (err) {
                return String(err);
              }
            });
          },
        }),

        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update sandbox files. YOU MUST USE THIS TOOL to create all files.",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),
          handler: async ({ files }, { step }) => {
            return step.run("createOrUpdateFiles", async () => {
              const sandbox = await Sandbox.connect(sandboxId);
              const writtenFiles = {};

              for (const file of files) {
                const normalized = normalizeDirectives({
                  path: file.path,
                  content: file.content,
                });

                await sandbox.files.write(file.path, normalized);
                writtenFiles[file.path] = normalized;
              }

              return writtenFiles;
            });
          },
        }),

        createTool({
          name: "readFiles",
          description: "Read files from sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return step.run("readFiles", async () => {
              const sandbox = await Sandbox.connect(sandboxId);
              const output = [];

              for (const file of files) {
                output.push({
                  path: file,
                  content: await sandbox.files.read(file),
                });
              }

              return output;
            });
          },
        }),
      ],

      lifecycle: {
        onResponse: async ({ result, network }) => {
          const text = lastAssistantTextMessageContent(result);
          if (text) {
            network.state.data.summary = text;
          }

          for (const msg of result.output || []) {
            if (msg.role === "tool" && msg.name === "createOrUpdateFiles") {
              try {
                const toolResult = 
                  typeof msg.content === 'string' 
                    ? JSON.parse(msg.content) 
                    : msg.content;
                
                if (toolResult && typeof toolResult === 'object') {
                  network.state.data.files = {
                    ...network.state.data.files,
                    ...toolResult,
                  };
                }
              } catch (err) {
                console.error('Failed to parse tool result:', err);
              }
            }
          }
          
          return result;
        },
      },
    });

    const network = createNetwork({
      name: "code-agent-network",
      agents: [agent],
      maxIter: 10,
      initialState: {
        data: {
          files: {},
          summary: null,
        },
      },
      router: async ({ network }) => {
        if (network.state.data.summary) return;
        return agent;
      },
    });

    const result = await network.run(event.data.value, {state});

    // ✅ FALLBACK: Extract files from sandbox if agent didn't capture them
    let files = result.state.data.files || {};

    if (Object.keys(files).length === 0) {
      console.log('⚠️ No files captured, extracting from sandbox...');
      
      files = await step.run("extract-sandbox-files", async () => {
        const sandbox = await Sandbox.connect(sandboxId);
        
        try {
          // ✅ Only find files in specific directories, exclude build artifacts
          const lsResult = await sandbox.commands.run(
            'find app lib components -type f \\( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \\) 2>/dev/null || true'
          );
          
          const filePaths = lsResult.stdout
            .trim()
            .split('\n')
            .filter(Boolean)
            .filter(path => {
              // ✅ Exclude unwanted directories and files
              return !path.includes('node_modules') &&
                     !path.includes('.next') &&
                     !path.includes('.npm') &&
                     !path.includes('dist') &&
                     !path.includes('build') &&
                     !path.includes('.cache') &&
                     !path.startsWith('.');
            });
          
          console.log('📁 Files to extract:', filePaths);
          
          const extractedFiles = {};
          
          for (const rawPath of filePaths) {
            try {
              const cleanPath = rawPath.replace(/^\.\//, '');
              const content = await sandbox.files.read(cleanPath);
              extractedFiles[cleanPath] = content;
              console.log(`✅ Extracted: ${cleanPath} (${content.length} chars)`);
            } catch (err) {
              console.log(`❌ Failed to read ${rawPath}:`, err.message);
            }
          }
          
          console.log(`📦 Total files extracted: ${Object.keys(extractedFiles).length}`);
          return extractedFiles;
          
        } catch (err) {
          console.error('Extraction failed:', err);
          return {};
        }
      });
    }

    const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator",
      description: "Generate the title for the fragment",
      system:FRAGMENT_TITLE_PROMPT,
      model: openai({
        model: "gpt-4o-mini",
        apiKey: process.env.OPENAI_API_KEY,
      })
    });

    const responseGenerator = createAgent({
      name: "response-generator",
      description: "Generate the response for the fragment",
      system:RESPONSE_PROMPT,
      model: openai({
        model: "gpt-4o-mini",
        apiKey: process.env.OPENAI_API_KEY,
      })
    });

    const {output:fragmentTitleOutput} = await fragmentTitleGenerator.run(result.state.data.summary)

    const {output:responseOutput} = await responseGenerator.run(
      result.state.data.summary
    );

    const generateFragmentTitle = () => {
      if(fragmentTitleOutput[0].type !== "text"){
        return "Untitled"
      }

      if(Array.isArray(fragmentTitleOutput[0].content)){
        return fragmentTitleOutput[0].content.map((c) => c).join("");
      } else {
        return fragmentTitleOutput[0].content
      }
    };

     const generateResponse = ()=>{
       if (responseOutput[0].type !== "text") {
        return "Here you go";
      }

      if (Array.isArray(responseOutput[0].content)) {
        return responseOutput[0].content.map((c) => c).join("");
      } else {
        return responseOutput[0].content;
      }
    }

    const hasSummary = Boolean(result.state.data.summary);
    const hasFiles = files && Object.keys(files).length > 0;
    const isError = !hasSummary && !hasFiles;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await Sandbox.connect(sandboxId);

      for (let i = 0; i < 5; i++) {
        try {
          const host = sandbox.getHost(3000);
          return `http://${host}`;
        } catch {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      throw new Error("Sandbox server did not start");
    });

    await step.run("save-result", async () => {
      if (isError) {
        return db.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again",
            role: MessageRole.ASSISTANT,
            type: MessageType.ERROR,
          },
        });
      }

      return db.message.create({
        data: {
          projectId: event.data.projectId,
          content: generateResponse() || "Project generated",
          role: MessageRole.ASSISTANT,
          type: MessageType.RESULT,
          fragments: {
            create: {
              title: generateFragmentTitle(),
              sandboxUrl,
              files: files,
            },
          },
        },
      });
    });

    return {
      sandboxUrl,
      summary: result.state.data.summary,
      files: files,
    };
  }
);