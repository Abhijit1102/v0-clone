import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";

import {
  codeAgent,
} from "../../../inngest/functions";

// Inngest API Route
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    codeAgent,
  ],
});