import { Plus, Music, Scissors, Copy, Trash2 } from "lucide-react";

export const TimelineControls = ({
  draggedItem,
  selectedTimelineItem,
  copiedItem,
  addOverlayTrack,
  addAudioTrack,
  addToTimelineAtCurrentTime,
  splitTimelineItem,
  copyTimelineItem,
  pasteTimelineItem,
  deleteSelectedItem,
}) => {
  const getTrackTypeForDraggedItem = (item) => {
    if (!item) return "";

    return item.type === "video"
      ? "Main Video"
      : item.type === "audio" || item.type === "music"
      ? "Audio"
      : "Overlay";
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={addOverlayTrack}
            className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-xl transition-all duration-200"
            title="Add Overlay Track"
          >
            <Plus size={16} />
          </button>

          <button
            onClick={addAudioTrack}
            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-xl transition-all duration-200"
            title="Add Audio Track"
          >
            <Music size={16} />
          </button>

          {draggedItem && (
            <button
              onClick={addToTimelineAtCurrentTime}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-200 animate-pulse bg-blue-100"
              title={`Добавить "${
                draggedItem.name
              }" на ${getTrackTypeForDraggedItem(
                draggedItem
              )} дорожку в оптимальную позицию`}
            >
              <Plus size={16} />
            </button>
          )}

          <button
            onClick={splitTimelineItem}
            disabled={!selectedTimelineItem}
            className={`p-2 rounded-xl transition-all duration-200 ${
              selectedTimelineItem
                ? "text-red-600 hover:text-red-800 hover:bg-red-50"
                : "text-gray-400 cursor-not-allowed"
            }`}
            title="Split Selected Item (Ctrl+B) - Cuts item at current time"
          >
            <Scissors size={16} />
          </button>

          <button
            onClick={copyTimelineItem}
            disabled={!selectedTimelineItem}
            className={`p-2 rounded-xl transition-all duration-200 ${
              selectedTimelineItem
                ? "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                : "text-gray-400 cursor-not-allowed"
            }`}
            title="Copy Selected Item (Ctrl+C) - Copy item to clipboard"
          >
            <Copy size={16} />
          </button>

          <button
            onClick={pasteTimelineItem}
            disabled={!copiedItem}
            className={`p-2 rounded-xl transition-all duration-200 ${
              copiedItem
                ? "text-green-600 hover:text-green-800 hover:bg-green-50"
                : "text-gray-400 cursor-not-allowed"
            }`}
            title="Paste Item (Ctrl+V) - Paste copied item"
          >
            <Copy size={16} className="rotate-180" />
          </button>

          <button
            onClick={deleteSelectedItem}
            disabled={!selectedTimelineItem}
            className={`p-2 rounded-xl transition-all duration-200 ${
              selectedTimelineItem
                ? "text-red-600 hover:text-red-800 hover:bg-red-50"
                : "text-gray-400 cursor-not-allowed"
            }`}
            title="Delete Selected Item (Del/Backspace) - Remove from timeline"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
