export const TimelineRuler = ({
  videoDuration,
  timelineZoom,
  currentTime,
  formatTime,
  getPixelsPerSecond,
}) => {
  return (
    <div className="h-12 bg-gray-50 border-b border-gray-200 relative flex-shrink-0">
      {Array.from(
        { length: Math.ceil((videoDuration * timelineZoom) / 5) + 1 },
        (_, i) => {
          const timeValue = (i * 5) / timelineZoom;
          const pixelsPerSecond = getPixelsPerSecond();
          return (
            <div
              key={i}
              className="absolute top-0 h-full border-l border-gray-300"
              style={{ left: `${timeValue * pixelsPerSecond}px` }}
            >
              <span className="text-xs text-gray-600 ml-2 mt-2 inline-block font-medium">
                {formatTime(timeValue)}
              </span>
            </div>
          );
        }
      )}

      {timelineZoom > 2 &&
        Array.from(
          { length: Math.ceil(videoDuration * timelineZoom) + 1 },
          (_, i) => {
            const timeValue = i / timelineZoom;
            const pixelsPerSecond = getPixelsPerSecond();
            return (
              <div
                key={`sub-${i}`}
                className="absolute top-8 w-0 h-4 border-l border-gray-200"
                style={{ left: `${timeValue * pixelsPerSecond}px` }}
              />
            );
          }
        )}

      <div
        className="absolute top-0 w-0.5 h-full bg-red-500 z-20 shadow-sm"
        style={{
          left: `${currentTime * getPixelsPerSecond()}px`,
        }}
      />
    </div>
  );
};
