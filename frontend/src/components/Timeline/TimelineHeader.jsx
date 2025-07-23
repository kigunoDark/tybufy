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
  timelineItems = [], // ✅ ДОБАВИТЬ ЭТОТ ПРОП
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
  };

  // ✅ Проверяем есть ли элементы в таймлайне
  const hasTimelineItems = timelineItems && timelineItems.length > 0;

  return (
    <div className="bg-gray-50 p-4 border-b border-gray-200 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-gray-800 font-semibold flex items-center space-x-2">
          <Film size={18} />
          <span>Timeline Pro</span>
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
          
          {/* ✅ Показываем кнопку только если есть элементы в таймлайне */}
          {hasTimelineItems && (
            <button
              onClick={handleDownloadOpen}
              className="relative px-3 py-1.5 bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 text-white font-semibold text-xs rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-pulse hover:animate-none group overflow-hidden"
              title="Экспорт готового видео"
            >
              {/* Анимированный фон в цветах сайта */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative flex items-center gap-1.5">
                <Download 
                  size={14} 
                  className="group-hover:translate-y-0.5 transition-transform duration-200" 
                />
                <span className="tracking-wide">Export</span>
                <div className="w-1 h-1 bg-white rounded-full opacity-75 animate-pulse"></div>
              </div>
              
              {/* Минимальные блестки */}
              <div 
                className="absolute top-0.5 right-2 w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-ping" 
                style={{ animationDelay: "0.5s" }}
              ></div>
            </button>
          )}
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