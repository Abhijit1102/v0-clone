"use server";

import { inngest } from "@/inngest/client";
import db from "@/lib/db";
import { getCurrentUser } from "@/module/auth/actions";
import { MessageRole, MessageType } from "@prisma/client";

export async function createMessages({ value, projectId }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const project = await db.project.findUnique({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    const newMessage = await db.message.create({
      data: {
        projectId,
        content: value.content,
        role: MessageRole.USER,
        type: MessageType.RESULT,
      },
    });

    await inngest.send({
      name: "code-agent/run",
      data: {
        value: value.content, // ✅ pass string, not object
        projectId,
      },
    });

    return { success: true, data: newMessage };
  } catch (error) {
    console.error("createMessages error:", error);
    return { success: false, error: "Failed to create message" };
  }
}

export async function getMessages(projectId) {
  try {
    const user = await getCurrentUser();

    if (!user) return [];

    const project = await db.project.findUnique({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    if (!project) return [];

    return await db.message.findMany({
      where: { projectId },
      orderBy: { updatedAt: "asc" },
      include: { fragments: true },
    });
  } catch (error) {
    console.error("getMessages error:", error);
    return [];
  }
}
