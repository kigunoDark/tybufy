import { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";

const VideoBlock = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef(null);

  const handleVideoClick = async (e) => {
    e.stopPropagation();
    
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        try {
          videoRef.current.muted = false;
          await videoRef.current.play();
          setIsVideoPlaying(true);
        } catch (error) {
          try {
            videoRef.current.muted = true;
            await videoRef.current.play();
            setIsVideoPlaying(true);
          } catch (mutedError) {
            console.error("Muted video play error:", mutedError);
          }
        }
      }
    }
  };

  const handleVideoEnd = () => {
    setIsVideoPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleMouseEnter = () => {
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    setShowControls(false);
  };

  return (
    <div className="relative">

      <div 
        className="relative bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl border border-slate-200/50 group cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <video
          ref={videoRef}
          className="w-full h-auto"
          muted={false}
          playsInline
          preload="metadata"
          poster="/videoWrapper.png"
          onLoadedData={() => console.log("Video loaded")}
          onError={(e) => console.log("Video error:", e)}
          onEnded={handleVideoEnd}
        >
          <source src="/demo-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div 
          className={`absolute inset-0 bg-transparent transition-all duration-500 ${
            isVideoPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >

          <div className={`w-full h-full ${showControls && !isVideoPlaying ? 'bg-white/95 backdrop-blur-sm' : 'bg-transparent'} transition-all duration-300`}>
            {showControls && !isVideoPlaying && (
              <div className="p-8 h-full flex flex-col justify-between min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">
                    🎬 TubeHi Studio
                  </h3>
                  <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-700 font-semibold text-sm">
                      AI Working
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-700 font-semibold">
                      Content Score
                    </span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      92/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: "92%" }}
                    ></div>
                  </div>
                </div>

                <div className="bg-black rounded-lg p-4 mb-6 flex-grow flex items-center">
                  <div className="w-full">
                    <div className="text-white text-center text-lg leading-relaxed mb-2">
                      "Hey everyone! Today I'll show you how to..."
                    </div>
                    <div className="h-0.5 bg-blue-500 rounded-full opacity-60 animate-pulse"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <div className="bg-green-500 text-white px-3 py-1 rounded text-sm flex items-center space-x-1">
                      <span>✨</span>
                      <span>Script</span>
                    </div>
                    <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center space-x-1">
                      <span>🎙️</span>
                      <span>Voice</span>
                    </div>
                    <div className="bg-purple-500 text-white px-3 py-1 rounded text-sm flex items-center space-x-1">
                      <span>🖼️</span>
                      <span>Thumbnail</span>
                    </div>
                  </div>
                  <span className="text-gray-500 text-sm font-medium">Generated</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            isVideoPlaying && !showControls ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'
          }`}
          onClick={handleVideoClick}
        >
          <div className={`bg-white/95 backdrop-blur-sm rounded-full p-6 shadow-xl transition-all duration-300 ${
            showControls ? 'scale-110 shadow-2xl' : 'scale-100'
          }`}>
            {isVideoPlaying ? (
              <Pause size={32} className="text-blue-600 fill-current" />
            ) : (
              <Play size={32} className="text-blue-600 fill-current" />
            )}
          </div>
        </div>

        <div 
          className={`absolute inset-0 bg-gray-100 flex items-center justify-center transition-opacity duration-300 ${
            videoRef.current && videoRef.current.readyState >= 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading video...</p>
          </div>
        </div>
      </div>

      <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg z-10">
        🚀 AI Powered
      </div>
    </div>
  );
};

export default VideoBlock;