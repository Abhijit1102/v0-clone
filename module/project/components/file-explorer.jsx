"use client";

import { useState, useMemo, useCallback, Fragment } from "react";
import {
  ResizablePanel,
  ResizableHandle,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";

import { TreeView } from "./tree-view";
import { convertFilesToTreeItems } from "@/lib/utils";
import { CopyCheckIcon, CopyIcon } from "lucide-react";
import { Hint } from "@/components/ui/hint";
import { Button } from "@/components/ui/button";
import { CodeView } from "./code-view";

/* ---------------------------------- */
/* File Breadcrumb */
/* ---------------------------------- */
const FileBreadcrumb = ({ filePath }) => {
  const segments = filePath.split("/");
  const maxSegments = 4;

  const items =
    segments.length <= maxSegments
      ? segments
      : [segments[0], "...", segments[segments.length - 1]];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((segment, index) => {
          const isLast = index === items.length - 1;

          return (
            <Fragment key={index}>
              <BreadcrumbItem>
                {segment === "..." ? (
                  <BreadcrumbEllipsis />
                ) : isLast ? (
                  <BreadcrumbPage>{segment}</BreadcrumbPage>
                ) : (
                  <span className="text-muted-foreground">{segment}</span>
                )}
              </BreadcrumbItem>

              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

function getLanguageFromExtension(filename) {
  const extension = filename.split(".").pop()?.toLowerCase();

  const languageMap = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    html: "html",
    css: "css",
    json: "json",
    md: "markdown",
  };

  return languageMap[extension] || "text";
}


/* ---------------------------------- */
/* File Explorer */
/* ---------------------------------- */
export function FileExplorer({ files }) {
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState(() => {
    const keys = Object.keys(files);
    return keys.length ? keys[0] : null;
  });

  const treeData = useMemo(
    () => convertFilesToTreeItems(files),
    [files]
  );

  const handleFileSelect = useCallback(
    (filePath) => {
      if (files[filePath]) {
        setSelectedFile(filePath);
      }
    },
    [files]
  );

  const handleCopy = useCallback(() => {
    if (selectedFile && files[selectedFile]) {
      navigator.clipboard
        .writeText(files[selectedFile])
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((error) => {
          console.error("Failed to copy:", error);
        });
    }
  }, [selectedFile, files]);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      id="sandbox-view-panels"
      className="h-full"
    >
      <ResizablePanel
        defaultSize={25}
        minSize={20}
        maxSize={40}
        className="bg-sidebar"
      >
        <div className="h-full overflow-auto">
          <TreeView
            data={treeData}
            value={selectedFile}
            onSelect={handleFileSelect}
          />
        </div>
      </ResizablePanel>

      <ResizableHandle className="w-1.5 hover:bg-primary/20 transition-colors" />

      <ResizablePanel defaultSize={75} minSize={40}>
        {selectedFile ? (
          <div className="h-full w-full flex flex-col">
            <div className="border-b bg-sidebar/50 px-4 py-2 flex items-center justify-between">
              <FileBreadcrumb filePath={selectedFile} />

              <Hint text="Copy to clipboard" side="bottom">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-background/80"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <CopyCheckIcon className="size-4 text-green-500" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                </Button>
              </Hint>
            </div>
            <div className="flex-1 overflow-auto relative">
               <CodeView 
               code={files[selectedFile]}
               lang={getLanguageFromExtension(selectedFile)}
               />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p className="text-sm">Select a file to view its content</p>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
