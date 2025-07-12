import { Video, Music, Layers } from "lucide-react";

export const TrackLabels = ({ tracks, trackLabelsRef, onScroll }) => {
  const getTrackIcon = (trackType) => {
    switch (trackType) {
      case "overlay":
        return <Layers size={16} className="mr-2" />;
      case "main":
        return <Video size={16} className="mr-2" />;
      case "audio":
        return <Music size={16} className="mr-2" />;
      default:
        return null;
    }
  };

  const getTrackStyle = (trackType) => {
    switch (trackType) {
      case "overlay":
        return "text-purple-700 bg-purple-50";
      case "main":
        return "text-blue-700 bg-blue-50";
      case "audio":
        return "text-green-700 bg-green-50";
      default:
        return "text-gray-700 bg-gray-50";
    }
  };

  return (
    <div className="w-48 bg-gray-50 border-r border-gray-200 flex-shrink-0 flex flex-col">
      <div className="h-12 border-b border-gray-200 flex-shrink-0"></div>

      <div
        ref={trackLabelsRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        onScroll={onScroll}
      >
        {tracks.overlays.map((track) => (
          <div
            key={track.id}
            className={`h-15 flex items-center px-4 border-b border-gray-100 text-sm font-medium flex-shrink-0 ${getTrackStyle(
              track.type
            )}`}
            style={{ height: "60px" }}
          >
            {getTrackIcon(track.type)}
            {track.name}
          </div>
        ))}

        {tracks.main.map((track) => (
          <div
            key={track.id}
            className={`h-15 flex items-center px-4 border-b border-gray-100 text-sm font-medium flex-shrink-0 ${getTrackStyle(
              track.type
            )}`}
            style={{ height: "60px" }}
          >
            {getTrackIcon(track.type)}
            {track.name}
          </div>
        ))}

        {tracks.audio.map((track) => (
          <div
            key={track.id}
            className={`h-15 flex items-center px-4 border-b border-gray-100 text-sm font-medium flex-shrink-0 ${getTrackStyle(
              track.type
            )}`}
            style={{ height: "60px" }}
          >
            {getTrackIcon(track.type)}
            {track.name}
          </div>
        ))}
      </div>
    </div>
  );
};
