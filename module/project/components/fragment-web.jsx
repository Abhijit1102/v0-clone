"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCcw, AlertTriangle } from "lucide-react";
import { Hint } from "@/components/ui/hint";

export default function FragmentWeb({ data }) {
  const iframeRef = useRef(null);

  const [fragmentKey, setFragmentKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const sandboxUrl = data?.sandboxUrl;

  // Detect iframe blocking
  useEffect(() => {
    if (!sandboxUrl) return;

    const timer = setTimeout(() => {
      try {
        const iframe = iframeRef.current;
        if (!iframe) return;

        // If iframe is blocked, contentWindow is inaccessible
        iframe.contentWindow.location.href;
      } catch (err) {
        setBlocked(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [sandboxUrl, fragmentKey]);

  const onRefresh = () => {
    setBlocked(false);
    setFragmentKey((prev) => prev + 1);
  };

  const onCopy = async () => {
    if (!sandboxUrl) return;
    await navigator.clipboard.writeText(sandboxUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full h-full border rounded-md overflow-hidden">
      {/* Top Bar */}
      <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
        <Hint text="Refresh" side="bottom">
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCcw />
          </Button>
        </Hint>

        <Hint text={copied ? "Copied!" : "Copy URL"} side="bottom">
          <Button
            size="sm"
            variant="outline"
            onClick={onCopy}
            disabled={!sandboxUrl || copied}
            className="flex-1 justify-start font-normal truncate"
          >
            {sandboxUrl || "No sandbox URL"}
          </Button>
        </Hint>

        <Hint text="Open in new tab" side="bottom">
          <Button
            size="sm"
            variant="outline"
            onClick={() => sandboxUrl && window.open(sandboxUrl, "_blank")}
          >
            <ExternalLink />
          </Button>
        </Hint>
      </div>

      {/* Content */}
      <div className="relative flex-1 bg-background">
        {blocked ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-4 p-6">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <p className="text-sm text-muted-foreground">
              This sandbox can’t be embedded due to browser security.
            </p>
            <Button
              variant="default"
              onClick={() => window.open(sandboxUrl, "_blank")}
            >
              Open Sandbox in New Tab
            </Button>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            key={fragmentKey}
            src={sandboxUrl}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            className="w-full h-full border-0"
          />
        )}
      </div>
    </div>
  );
}
