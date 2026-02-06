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
  const [iframeError, setIframeError] = useState(false);

  const sandboxUrl = data?.sandboxUrl;

  // Detect iframe blocking
  useEffect(() => {
    if (!sandboxUrl) return;

    const checkBlocking = () => {
      try {
        const iframe = iframeRef.current;
        if (!iframe) return;
        
        // Try to access contentWindow - will throw if blocked
        const _ = iframe.contentWindow?.location.href;
      } catch (err) {
        // X-Frame-Options or CSP blocking
        setBlocked(true);
      }
    };

    const iframe = iframeRef.current;
    if (iframe) {
      // Check after iframe loads
      iframe.addEventListener('load', checkBlocking);
      
      // Fallback check in case load event doesn't fire
      const timer = setTimeout(checkBlocking, 2000);
      
      return () => {
        iframe.removeEventListener('load', checkBlocking);
        clearTimeout(timer);
      };
    }
  }, [sandboxUrl, fragmentKey]);

  const onRefresh = () => {
    setBlocked(false);
    setIframeError(false);
    setFragmentKey((prev) => prev + 1);
  };

  const onCopy = async () => {
    if (!sandboxUrl) return;
    try {
      await navigator.clipboard.writeText(sandboxUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const openInNewTab = () => {
    if (sandboxUrl) {
      window.open(sandboxUrl, "_blank", "noopener,noreferrer");
    }
  };

  const showBlockedMessage = blocked || iframeError;

  return (
    <div className="flex flex-col w-full h-full border rounded-md overflow-hidden">
      {/* Top Bar */}
      <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
        <Hint text="Refresh" side="bottom">
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCcw className="h-4 w-4" />
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
            onClick={openInNewTab}
            disabled={!sandboxUrl}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Hint>
      </div>

      {/* Content */}
      <div className="relative flex-1 bg-background">
        {showBlockedMessage ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-4 p-6 bg-background">
            <AlertTriangle className="w-12 h-12 text-yellow-500" />
            <div className="space-y-2">
              <p className="text-base font-medium">
                Can't display embedded sandbox
              </p>
              <p className="text-sm text-muted-foreground max-w-md">
                The sandbox domain blocks embedding for security reasons.
                Please open it in a new tab to view the content.
              </p>
            </div>
            <Button
              variant="default"
              size="lg"
              onClick={openInNewTab}
              disabled={!sandboxUrl}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Sandbox in New Tab
            </Button>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            key={fragmentKey}
            src={sandboxUrl}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            className="w-full h-full border-0"
            onError={() => setIframeError(true)}
            title="Sandbox Preview"
          />
        )}
      </div>
    </div>
  );
}