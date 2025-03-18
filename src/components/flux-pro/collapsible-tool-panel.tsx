"use client";

import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  SparklesIcon,
  ImageIcon,
  PencilIcon,
  LayersIcon,
  DownloadIcon,
  SaveIcon,
  WandIcon,
  SlidersIcon,
  PaintbrushIcon,
  FilmIcon,
} from "lucide-react";
import { WithTooltip } from "@/components/ui/tooltip";

// Types
interface CollapsibleToolPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  children?: ReactNode;
  className?: string;
}

interface ToolCategoryProps {
  icon: ReactNode;
  label: string;
  isCollapsed: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  children?: ReactNode;
  className?: string;
}

interface ToolItemProps {
  icon: ReactNode;
  label: string;
  isCollapsed: boolean;
  isActive?: boolean;
  onClick?: () => void;
  shortcut?: string;
  className?: string;
  disabled?: boolean;
}

// Main CollapsibleToolPanel component
export const CollapsibleToolPanel = ({
  isCollapsed,
  onToggleCollapse,
  children,
  className,
}: CollapsibleToolPanelProps) => {
  return (
    <div
      className={cn(
        "tool-panel flex flex-col h-full transition-all duration-300 ease-in-out bg-black/80 backdrop-blur-md border-r border-white/10",
        isCollapsed ? "w-16" : "w-64",
        className,
      )}
    >
      <div className="tool-panel-header flex justify-between items-center p-4 border-b border-white/5 bg-black/50">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <FilmIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold text-blue-400">Tools</span>
          </div>
        )}
        <WithTooltip tooltip={isCollapsed ? "Expand panel" : "Collapse panel"}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className={`h-8 w-8 p-0 rounded-full hover:bg-white/5 transition-all duration-200 ${isCollapsed ? "ml-auto" : ""}`}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-blue-400" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-blue-400" />
            )}
          </Button>
        </WithTooltip>
      </div>
      <div className="tool-panel-content flex-1 overflow-y-auto py-2">
        {children}
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-12 pointer-events-none" />
    </div>
  );
};

// ToolCategory component
export const ToolCategory = ({
  icon,
  label,
  isCollapsed,
  isExpanded = false,
  onToggleExpand,
  children,
  className,
}: ToolCategoryProps) => {
  const [isExpandedInternal, setIsExpandedInternal] = useState(isExpanded);

  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setIsExpandedInternal(!isExpandedInternal);
    }
  };

  const expanded = onToggleExpand ? isExpanded : isExpandedInternal;

  return (
    <div className={cn("tool-category mb-2", className)}>
      <WithTooltip tooltip={isCollapsed ? label : ""}>
        <div
          className={cn(
            "tool-category-header flex items-center px-4 py-2 cursor-pointer hover:bg-white/5 transition-colors",
            expanded ? "text-blue-400" : "text-gray-300",
          )}
          onClick={handleToggle}
        >
          <div
            className={cn(
              "flex-shrink-0",
              !isCollapsed && "mr-3",
              expanded && "text-blue-400",
            )}
          >
            {icon}
          </div>
          {!isCollapsed && (
            <>
              <span className="flex-1 text-sm font-medium">{label}</span>
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </>
          )}
        </div>
      </WithTooltip>

      {expanded && !isCollapsed && (
        <div className="tool-category-content pl-10 pr-3 py-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

// ToolItem component
export const ToolItem = ({
  icon,
  label,
  isCollapsed,
  isActive = false,
  onClick,
  shortcut,
  className,
  disabled = false,
}: ToolItemProps) => {
  return (
    <WithTooltip
      tooltip={isCollapsed ? `${label} ${shortcut ? `(${shortcut})` : ""}` : ""}
    >
      <button
        className={cn(
          "tool-item flex items-center w-full px-3 py-2 rounded-xl transition-colors",
          isActive
            ? "bg-blue-500/20 text-blue-400"
            : "text-gray-300 hover:bg-white/5",
          disabled && "opacity-50 cursor-not-allowed",
          isCollapsed ? "justify-center" : "justify-between",
          className,
        )}
        onClick={onClick}
        disabled={disabled}
      >
        <div className="flex items-center">
          <div className={cn("flex-shrink-0", !isCollapsed && "mr-3")}>
            {icon}
          </div>
          {!isCollapsed && <span className="text-sm">{label}</span>}
        </div>
        {!isCollapsed && shortcut && (
          <span className="text-xs text-gray-500 ml-2">{shortcut}</span>
        )}
      </button>
    </WithTooltip>
  );
};

// Predefined tool categories and items for the Image Studio
export const GenerationTools = ({
  isCollapsed,
  activeTab,
  onSelectTab,
}: {
  isCollapsed: boolean;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}) => {
  return (
    <ToolCategory
      icon={<SparklesIcon className="h-5 w-5" />}
      label="Generation"
      isCollapsed={isCollapsed}
      isExpanded={true}
    >
      <ToolItem
        icon={<WandIcon className="h-4 w-4" />}
        label="Text-to-Image"
        isCollapsed={isCollapsed}
        isActive={activeTab === "flux-pro"}
        onClick={() => onSelectTab("flux-pro")}
        shortcut="Alt+1"
      />
      <ToolItem
        icon={<PaintbrushIcon className="h-4 w-4" />}
        label="Fill & Inpaint"
        isCollapsed={isCollapsed}
        isActive={activeTab === "fill"}
        onClick={() => onSelectTab("fill")}
        shortcut="Alt+2"
      />
      <ToolItem
        icon={<PencilIcon className="h-4 w-4" />}
        label="Edge-Guided"
        isCollapsed={isCollapsed}
        isActive={activeTab === "canny"}
        onClick={() => onSelectTab("canny")}
        shortcut="Alt+3"
      />
      <ToolItem
        icon={<LayersIcon className="h-4 w-4" />}
        label="Depth-Guided"
        isCollapsed={isCollapsed}
        isActive={activeTab === "depth"}
        onClick={() => onSelectTab("depth")}
        shortcut="Alt+4"
      />
      <ToolItem
        icon={<ImageIcon className="h-4 w-4" />}
        label="Restyle"
        isCollapsed={isCollapsed}
        isActive={activeTab === "redux"}
        onClick={() => onSelectTab("redux")}
        shortcut="Alt+5"
      />
      <ToolItem
        icon={<SlidersIcon className="h-4 w-4" />}
        label="Custom Training"
        isCollapsed={isCollapsed}
        isActive={activeTab === "finetune"}
        onClick={() => onSelectTab("finetune")}
        shortcut="Alt+6"
      />
    </ToolCategory>
  );
};

export const ExportTools = ({
  isCollapsed,
  onExportToVideo,
  onSaveToGallery,
  hasEdits,
  isExporting,
  isSaving,
}: {
  isCollapsed: boolean;
  onExportToVideo: () => void;
  onSaveToGallery: () => void;
  hasEdits: boolean;
  isExporting: boolean;
  isSaving: boolean;
}) => {
  return (
    <ToolCategory
      icon={<DownloadIcon className="h-5 w-5" />}
      label="Export"
      isCollapsed={isCollapsed}
      isExpanded={true}
    >
      <ToolItem
        icon={<DownloadIcon className="h-4 w-4" />}
        label={isExporting ? "Exporting..." : "Export to Video"}
        isCollapsed={isCollapsed}
        onClick={onExportToVideo}
        disabled={isExporting || !hasEdits}
      />
      <ToolItem
        icon={<SaveIcon className="h-4 w-4" />}
        label={isSaving ? "Saving..." : "Save & Exit"}
        isCollapsed={isCollapsed}
        onClick={onSaveToGallery}
        disabled={isSaving || !hasEdits}
      />
    </ToolCategory>
  );
};
