export const TimelineItem = ({
  item,
  isSelected,
  isDragged,
  isCopied,
  getTrackColor,
  getTimelineItemStyle,
  onSelect,
  onDragStart,
  onDragEnd,
  onResizeStart,
}) => {
  return (
    <div
      className={`absolute h-10 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all shadow-sm hover:shadow-md group ${getTrackColor(
        item.trackType
      )} ${isSelected ? "ring-2 ring-blue-300" : ""} ${
        isDragged ? "opacity-50 z-30" : ""
      } ${isCopied ? "ring-2 ring-green-300 ring-dashed" : ""}`}
      style={getTimelineItemStyle(item)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item);
      }}
    >
      <div
        className="absolute left-0 top-0 w-3 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/50 rounded-l-lg z-10 flex items-center justify-center"
        onMouseDown={(e) => onResizeStart(e, item, "left")}
        title="Trim start - Drag to adjust start time"
        style={{
          background:
            "linear-gradient(to right, rgba(255,255,255,0.8), transparent)",
        }}
      >
        <div className="w-0.5 h-6 bg-white rounded-full opacity-80"></div>
      </div>

      <div
        draggable="true"
        onDragStart={(e) => onDragStart(e, item)}
        onDragEnd={onDragEnd}
        className="p-2 text-white text-xs truncate font-medium flex items-center h-full mx-3 cursor-grab active:cursor-grabbing"
        title="Drag to move item on timeline - Ripple mode: pushes other blocks"
      >
        {item.name}
        {isCopied && <span className="ml-2 text-green-200">📋</span>}
      </div>

      <div
        className="absolute right-0 top-0 w-3 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/50 rounded-r-lg z-10 flex items-center justify-center"
        onMouseDown={(e) => onResizeStart(e, item, "right")}
        title="Trim end - Drag to adjust duration"
        style={{
          background:
            "linear-gradient(to left, rgba(255,255,255,0.8), transparent)",
        }}
      >
        <div className="w-0.5 h-6 bg-white rounded-full opacity-80"></div>
      </div>
    </div>
  );
};
