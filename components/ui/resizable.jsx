"use client"

import * as React from "react"
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels"
import { GripVerticalIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function ResizablePanelGroup({ className, ...props }) {
  return (
    <PanelGroup
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full aria-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function ResizablePanel(props) {
  return <Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({ withHandle, className, ...props }) {
  return (
    <PanelResizeHandle
      data-slot="resizable-handle"
      className={cn(
        "bg-border relative flex w-px items-center justify-center focus-visible:ring-1 focus-visible:ring-ring",
        "aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className="size-2.5 opacity-60" />
        </div>
      )}
    </PanelResizeHandle>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
