import { Download, Film, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { HelpButtonWithTooltip } from "../HelpButtonWithTooltip";
import { TimelineControls } from "./TimelineControls";

export const TimelineHeader = ({
  draggedItem,
  isDragging,
  setShowExportModal,
  isTimelineDragging,
  isResizing,
  dropPreview,
  draggedTimelineItem,
  resizeItem,
  resizeHandle,
  copiedItem,
  timelineZoom,
  selectedTimelineItem,
  onOpenExportModal,
  addOverlayTrack,
  addAudioTrack,
  addToTimelineAtCurrentTime,
  splitTimelineItem,
  copyTimelineItem,
  pasteTimelineItem,
  deleteSelectedItem,
  zoomIn,
  zoomOut,
  resetZoom,
}) => {
  const getStatusMessage = () => {
    if (draggedItem) {
      const trackType =
        draggedItem.type === "video"
          ? "Main Video"
          : draggedItem.type === "audio" || draggedItem.type === "music"
          ? "Audio"
          : "Overlay";
      return `- Готов добавить: "${draggedItem.name}" на ${trackType} дорожку`;
    }

    if (isDragging && dropPreview) {
      return `- Adding "${draggedItem?.name}" ${
        dropPreview.shouldRipple ? "⚡ ripple" : "📍 exact"
      }`;
    }

    if (isTimelineDragging && dropPreview) {
      return `- Moving "${draggedTimelineItem?.name}" ${
        dropPreview.shouldRipple ? "⚡ push blocks" : "📍 exact"
      }`;
    }

    if (isResizing && resizeItem) {
      return `- Trimming "${resizeItem.name}" (${resizeHandle} edge)`;
    }

    if (copiedItem) {
      return `- "${copiedItem.name}" copied (Ctrl+V to paste)`;
    }

    return "";
  };

  const handleDownloadOpen = () => {
    setShowExportModal(true);
    console.log("Hey")
  };
  return (
    <div className="bg-gray-50 p-4 border-b border-gray-200 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-gray-800 font-semibold flex items-center space-x-2">
          <Film size={18} />
          <span>Timeline Pro</span>
          <button
            onClick={handleDownloadOpen}
            className="p-2 rounded-full hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors group"
            title="Экспорт видео"
          >
            <Download size={20} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></span>
          </button>
          <span className="text-blue-600 text-sm">{getStatusMessage()}</span>
        </h4>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white rounded-xl p-2 border border-gray-200">
            <button
              onClick={zoomOut}
              className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs text-gray-500 min-w-12 text-center">
              {(timelineZoom * 100).toFixed(0)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
              title="Zoom In (+), or Ctrl+Wheel"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={resetZoom}
              className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
              title="Reset Zoom (0)"
            >
              <RotateCcw size={16} />
            </button>
            <HelpButtonWithTooltip />
          </div>
        </div>
      </div>

      <TimelineControls
        draggedItem={draggedItem}
        selectedTimelineItem={selectedTimelineItem}
        copiedItem={copiedItem}
        addOverlayTrack={addOverlayTrack}
        addAudioTrack={addAudioTrack}
        addToTimelineAtCurrentTime={addToTimelineAtCurrentTime}
        splitTimelineItem={splitTimelineItem}
        copyTimelineItem={copyTimelineItem}
        pasteTimelineItem={pasteTimelineItem}
        deleteSelectedItem={deleteSelectedItem}
      />
    </div>
  );
};
