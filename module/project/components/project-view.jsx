"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useState } from "react";

import ProjectHeader from "./project-header";
import { MessageContainer } from "./message-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, CrownIcon, EyeIcon, Fullscreen } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import FragementWeb from "./fragment-web";
import { FileExplorer } from "./file-explorer";

export default function ProjectView({ projectId }) {
  const [activeFragment, setActiveFragment] = useState(null);
  const [tabState, setTabState] = useState("preview");

  return (
    <div className="h-screen">
     <ResizablePanelGroup direction="horizontal"  id="project-view-panels">
      {/* LEFT */}
      <ResizablePanel
        defaultSize={35}
        minSize={20}
        className="flex flex-col min-h-0"
      >
        <ProjectHeader projectId={projectId} />
        <MessageContainer
          projectId={projectId}
          activeFragment={activeFragment}
          setActiveFragment={setActiveFragment}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
          {/* RIGHT */}
          <ResizablePanel
            defaultSize={65}
            minSize={50}
            className="flex flex-col min-h-0"
          >
            <Tabs
              className="h-full flex flex-col"
              defaultValue="preview"
              value={tabState}
              onValueChange={setTabState}
            >
              <div className="w-full flex items-center p-2 border-b gap-x-2">
               <TabsList className="h-8 p-1 border rounded-md flex gap-x-1">
                  <TabsTrigger
                    value="preview"
                    className="rounded-md px-3 flex items-center gap-x-2"
                  >
                    <EyeIcon className="size-4" />
                    <span>Demo</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="code"
                    className="rounded-md px-3 flex items-center gap-x-2"
                  >
                    <Code2 className="size-4" />
                    <span>Code</span>
                  </TabsTrigger>
                </TabsList>
                <div className="ml-auto flex items-center gap-x-2">
                  <Button asChild size="sm">
                    <Link href="/pricing" className="flex items-center">
                      <CrownIcon className="size-4 mr-2" />
                      Upgrade
                    </Link>
                  </Button>
                </div>
              </div>
              {/* Preview */}
              <TabsContent 
              value="preview"
              className={"flex-1 h-[calc(100%-4rem)] overflow-hidden"}
              >
                {
                  activeFragment ? (
                  <>
                  <FragementWeb data={activeFragment}/>
                  </>)
                   : (<div className="flex items-center justify-center justify-center h-full text-muted-foreground">
                    Select a fragment to preview
                   </div>)
                }

              </TabsContent>

              {/* Code */}
              <TabsContent value="code"
              className={"flex-1 h-[calc(100%-4rem)] overflow-hidden"}
              >
                {
                  activeFragment?.files ? (
                    <FileExplorer files={activeFragment.files} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Select a fragment to view Code
                    </div>
                  )
                }
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
    </div>
  );
}
