import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";

export const runtime = "nodejs";

import {
  codeAgentFunction,
} from "../../../inngest/functions";

// Inngest API Route
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    codeAgentFunction,
  ],
});