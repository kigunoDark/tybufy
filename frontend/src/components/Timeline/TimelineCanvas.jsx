import { DropPreview } from "./DropPreview";
import { TimelineItem } from "./TimelineItem";
import { TimelineRuler } from "./TimelineRuler";

export const TimelineCanvas = ({
  timelineRef,
  timelineScrollRef,
  tracks,
  timelineItems,
  selectedTimelineItem,
  draggedTimelineItem,
  copiedItem,
  dropPreview,
  getTimelineWidth,
  getPixelsPerSecond,
  getTrackColor,
  getTimelineItemStyle,
  getDropPreviewStyle,
  videoDuration,
  timelineZoom,
  currentTime,
  formatTime,
  onScroll,
  onDragOver,
  onDrop,
  onDragLeave,
  onClick,
  onDoubleClick,
  onTimelineItemSelect,
  onTimelineItemDragStart,
  onTimelineItemDragEnd,
  onResizeStart,
  onVolumeChange,
  showVolumeControls = true,
  onOpacityChange,
  showOpacityControls = true,
}) => {
  return (
    <div
      ref={(el) => {
        timelineRef.current = el;
        timelineScrollRef.current = el;
      }}
      className="flex-1 relative overflow-auto bg-white"
      onScroll={onScroll}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      style={{
        overflowX: "auto",
        overflowY: "auto",
        scrollbarWidth: "thin",
      }}
    >
      <div
        style={{
          width: `${getTimelineWidth()}px`,
          minHeight: "100%",
          position: "relative",
        }}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      >
        <TimelineRuler
          videoDuration={videoDuration}
          timelineZoom={timelineZoom}
          currentTime={currentTime}
          formatTime={formatTime}
          getPixelsPerSecond={getPixelsPerSecond}
          getTimelineWidth={getTimelineWidth}
        />

        <div
          className="relative flex-1"
          style={{
            height: `${
              (tracks.overlays.length +
                tracks.main.length +
                tracks.audio.length) *
              60
            }px`,
            minHeight: "100%",
          }}
        >
          {timelineItems.map((item) => (
            <TimelineItem
              key={item.id}
              item={item}
              isSelected={selectedTimelineItem?.id === item.id}
              isDragged={draggedTimelineItem?.id === item.id}
              isCopied={copiedItem?.id === item.id}
              getTrackColor={getTrackColor}
              getTimelineItemStyle={getTimelineItemStyle}
              onSelect={onTimelineItemSelect}
              onDragStart={onTimelineItemDragStart}
              onDragEnd={onTimelineItemDragEnd}
              onResizeStart={onResizeStart}
              onVolumeChange={onVolumeChange}
              showVolumeControls={showVolumeControls}
              onOpacityChange={onOpacityChange} 
                showOpacityControls={showOpacityControls} 
              hasAudio={item.type === "audios" || item.type === "videos"}
              hasOpacity={item.type !== "audios" || item.type !== "videos"} 
            />
          ))}

          <DropPreview
            dropPreview={dropPreview}
            getTrackColor={getTrackColor}
            getDropPreviewStyle={getDropPreviewStyle}
          />
        </div>
      </div>
    </div>
  );
};
