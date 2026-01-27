"use server";
import { inngest } from "@/inngest/client";

export default async function OnInvoke() {
  await inngest.send({ name: "codeAgent" });
}