
// export function lastAssistantTextMessageContent(result){
//     const lastAssistantTextMessageIndex = result.output.findLastIndex(
//         (message) => message.role === "assistant"
//     )

//     const message = result.output[lastAssistantTextMessageIndex] 


//     return message?.content ? typeof message.content === "string" ? message.content : message.content.map((c)=>c.text).join("") : undefined
// }

export function lastAssistantTextMessageContent(result) {
  if (!result) return undefined;

  // ✅ Case 1: Raw OpenAI response (your current case)
  if (Array.isArray(result.choices)) {
    return result.choices[0]?.message?.content;
  }

  // ✅ Case 2: Agent Kit output (fallback)
  if (Array.isArray(result.output)) {
    const index = result.output.findLastIndex(
      (m) => m?.role === "assistant"
    );

    if (index === -1) return undefined;

    const message = result.output[index];

    if (typeof message.content === "string") return message.content;

    if (Array.isArray(message.content)) {
      return message.content.map((c) => c?.text ?? "").join("");
    }
  }

  return undefined;
};

export function normalizeDirectives({ path, content }) {
  let code = content
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, `"`)
    .replace(/\r\n/g, "\n");

  // Fix CSS @import inside TS/TSX
  if (/\.(ts|tsx)$/.test(path)) {
    code = code.replace(
      /^\s*@import\s+["'](.+?)["'];?/gm,
      `import "$1";`
    );
  }

  // 🔥 STEP 1: Normalize ALL directive variants (quoted + unquoted)
  code = code
    .replace(/^\s*use client;?/gm, `"use client";`)
    .replace(/^\s*use server;?/gm, `"use server";`)
    .replace(/^["']use client["'];?/gm, `"use client";`)
    .replace(/^["']use server["'];?/gm, `"use server";`);

  const isTSX = path.endsWith(".tsx");
  const isForbidden = /layout\.tsx$|route\.ts$|middleware\.ts$/.test(path);

  const usesHooks =
    /\buse(State|Effect|Memo|Callback|Ref|Reducer|Context)\b/.test(code);

  const hasServer = /^\s*["']use server["'];/.test(code);

  // 🔥 STEP 2: REMOVE ALL directives
  code = code.replace(/^\s*["']use (client|server)["'];\s*/gm, "");

  // 🔥 STEP 3: Re-inject exactly one valid directive
  if (usesHooks && isTSX && !isForbidden) {
    return `"use client";\n\n${code}`;
  }

  if (hasServer && !usesHooks) {
    return `"use server";\n\n${code}`;
  }

  return code;
}


