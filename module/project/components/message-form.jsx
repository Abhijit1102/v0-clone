"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextAreaAutosize from "react-textarea-autosize";
import { ArrowUpIcon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { useCreateMessages } from "@/module/messages/hooks/message";

const formSchema = z.object({
  content: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message too long"),
});

export default function MessageForm({ projectId }) {
  const [isFocused, setIsFocused] = useState(false);

  const { mutateAsync, isPending } = useCreateMessages(projectId);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
    mode: "onChange",
  });

  async function onSubmit(values) {
    try {
      await mutateAsync({ content: values.content });
      form.reset();
      toast.success("Message sent");
    } catch (error) {
      toast.error(error?.message || "Failed to send message");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar transition-all",
          isFocused && "shadow-lg ring-2 ring-primary/20"
        )}
      >
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <TextAreaAutosize
                  {...field}
                  disabled={isPending}
                  placeholder="Describe what you want to create..."
                  minRows={3}
                  maxRows={8}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className={cn(
                    "pt-4 resize-none border-none w-full outline-none bg-transparent",
                    isPending && "opacity-50"
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-end justify-between pt-2">
          <div className="text-[10px] text-muted-foreground font-mono">
            <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5">
              ⌘ Enter
            </kbd>{" "}
            to submit
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="size-8 rounded-full"
          >
            {isPending ? <Spinner /> : <ArrowUpIcon className="size-4" />}
          </Button>
        </div>
      </form>
    </Form>
  );
}
