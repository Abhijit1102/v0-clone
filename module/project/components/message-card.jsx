"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MessageRole, MessageType } from "@prisma/client";
import Image from "next/image";
import { format } from "date-fns";
import { ChevronRightIcon, Code2 } from "lucide-react";

function FragmentCard({ fragment, isActiveFragment, onFragmentClick }) {
  return (
    <button
      className={cn(
        "flex items-start text-start gap-2 border rounded-lg bg-muted w-fit p-2 hover:bg-secondary transition-colors",
        isActiveFragment &&
          "bg-primary text-primary-foreground border-primary hover:bg-primary"
      )}
      onClick={() => onFragmentClick(fragment)}
    >
      <Code2 className="size-4 mt-0.5" />
      <div className="flex flex-col flex-1">
        <span className="text-sm font-medium line-clamp-1">
          {fragment.title}
        </span>
        <span className="text-sm" >Preview</span>
      </div>
      <div className="flex items-center justify-center mt-0 5">
        <span className="text-sm">
          <ChevronRightIcon className="size-4" />
        </span>
      </div>
    </button>
  );
}

function UserMessage({ content }) {
  return (
    <div className="flex justify-end p-4 pr-2">
      <Card className="rounded-l bg-muted p-2 shadow-none border-none max-w-[80%] break-words">
        {content}
      </Card>
    </div>
  );
}

function AssistantMessage({
  content,
  createdAt,
  type,
  fragment,
  isActiveFragment,
  onFragmentClick,
}) {
  return (
    <div
      className={cn(
        "flex flex-col group px-2 p-4",
        type === MessageType.ERROR && "text-red-700 dark:text-red-500"
      )}
    >
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Image
          src="/logo.svg"
          height={30}
          width={30}
          alt="Logo"
          className="hidden md:block dark:invert"
        />
        <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {format(new Date(createdAt), "HH:mm 'on' MMM dd, yyyy")}
        </span>
      </div>

      <div className="pl-8 flex flex-col gap-y-4">
        <span>{content}</span>

        {fragment && type === MessageType.RESULT && (
          <FragmentCard
            fragment={fragment}
            isActiveFragment={isActiveFragment}
            onFragmentClick={onFragmentClick}
          />
        )}
      </div>
    </div>
  );
}

export default function MessageCard({
  content,
  role,
  fragment,
  createdAt,
  type,
  isActiveFragment,
  onFragmentClick,
}) {
  if (role === MessageRole.ASSISTANT) {
    return (
      <AssistantMessage
        content={content}
        createdAt={createdAt}
        type={type}
        fragment={fragment}
        isActiveFragment={isActiveFragment}
        onFragmentClick={onFragmentClick}
      />
    );
  }

  return (
    <div className="mt-5">
      <UserMessage content={content} />
    </div>
  );
}
