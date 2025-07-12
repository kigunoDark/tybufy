export const DropPreview = ({
  dropPreview,
  getTrackColor,
  getDropPreviewStyle,
}) => {
  if (!dropPreview) return null;

  return (
    <div
      className={`absolute h-10 rounded-lg border-2 transition-all ${
        dropPreview.isValid
          ? dropPreview.isExact
            ? `${getTrackColor(
                dropPreview.trackType
              )} bg-opacity-60 border-solid`
            : `${getTrackColor(
                dropPreview.trackType
              )} bg-opacity-40 border-dashed animate-pulse`
          : "bg-red-300 border-red-500 border-dashed"
      }`}
      style={getDropPreviewStyle()}
    >
      {dropPreview.isValid && !dropPreview.isExact && (
        <div className="flex items-center justify-center h-full text-white text-xs font-bold">
          🧲
        </div>
      )}
    </div>
  );
};
