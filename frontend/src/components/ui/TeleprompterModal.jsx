import { useState, useRef, useEffect } from "react";

export const TeleprompterModal = ({
  isOpen = true,
  onClose = () => {},
  script = "Welcome to the teleprompter! This is a demonstration of the prompter with recording capability. Here you can adjust the scroll speed, font size, and recording type. Scrolling will automatically start when recording begins. Use the control buttons to pause, continue, or reset the text. When recording video, you will see a preview window in the upper right corner. This will help you see exactly what is being recorded. The teleprompter supports both audio and video recording. Adjust the settings according to your needs and start recording!",
  onRecordingComplete = () => {},
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingType, setRecordingType] = useState("audio");
  const [speed, setSpeed] = useState(50);
  const [fontSize, setFontSize] = useState(24);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const scrollContainerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const videoPreviewRef = useRef(null);

  const startScrolling = () => {
    if (scrollIntervalRef.current) return;

    setIsScrolling(true);
    scrollIntervalRef.current = setInterval(() => {
      if (scrollContainerRef.current && isScrolling && !isPaused) {
        const container = scrollContainerRef.current;
        const scrollStep = (speed / 50) * 2;
        container.scrollTop += scrollStep;

        if (
          container.scrollTop >=
          container.scrollHeight - container.clientHeight
        ) {
          stopScrolling();
        }
      }
    }, 50);
  };

  const stopScrolling = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    setIsScrolling(false);
  };

  const resetScroll = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    stopScrolling();
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;

    }
  };

  const stopRecordingAndResetTimer = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    stopTimer();
    setRecordingTime(0);


    stopScrolling();
    setIsPaused(false);


    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
      videoPreviewRef.current.pause();
      videoPreviewRef.current.load();
    }


    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    setRecordedBlob(null);
  };

  const resetAllStates = () => {
    stopRecordingAndResetTimer();

    stopScrolling();
    setIsPaused(false);
    resetScroll();
    setShowSettings(false);
  };

  const startRecording = async () => {
    try {
      const constraints =
        recordingType === "video"
          ? { video: true, audio: true }
          : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (recordingType === "video") {
        const setupVideoPreview = () => {
          if (videoPreviewRef.current) {
            const videoElement = videoPreviewRef.current;
            videoElement.srcObject = stream;

            videoElement.onloadedmetadata = () => {
              videoElement.play().catch((e) => console.log("Play error:", e));
            };

            videoElement.oncanplay = () => {
              console.log("Video ready to play");
            };

            videoElement.onerror = (e) => {
              console.log("Video error:", e);
            };

            // Force try to start
            setTimeout(() => {
              if (videoElement.srcObject) {
                videoElement
                  .play()
                  .catch((e) => console.log("Delayed play error:", e));
              }
            }, 100);

            return true;
          }
          return false;
        };

        if (!setupVideoPreview()) {
          const maxAttempts = 10;
          let attempts = 0;

          const waitForVideoElement = () => {
            attempts++;
            if (setupVideoPreview()) {
              return;
            }

            if (attempts < maxAttempts) {
              setTimeout(waitForVideoElement, 100);
            } else {
              console.log(
                "Failed to setup video element after",
                maxAttempts,
                "attempts"
              );
            }
          };

          setTimeout(waitForVideoElement, 50);
        }
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, {
          type: recordingType === "video" ? "video/webm" : "audio/webm",
        });
        setRecordedBlob(blob);

        // Stop preview
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();

      if (!isScrolling) {
        startScrolling();
      }
    } catch (error) {
      alert("Failed to access microphone/camera");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
      stopScrolling();
      setIsPaused(false);

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
        videoPreviewRef.current.pause();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
    }
  };

  const downloadRecording = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recording-${Date.now()}.${
        recordingType === "video" ? "webm" : "webm"
      }`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // NEW FUNCTION for using recording
  const useRecording = () => {
    if (recordedBlob && onRecordingComplete) {
      onRecordingComplete(recordedBlob, recordingType);
    }
    handleClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Modal close handler with full reset
  const handleClose = () => {
    resetAllStates();
    onClose();
  };

  // useEffect for additional video setup
  useEffect(() => {
    if (
      isRecording &&
      recordingType === "video" &&
      streamRef.current &&
      videoPreviewRef.current
    ) {
      const videoElement = videoPreviewRef.current;
      if (!videoElement.srcObject) {
        console.log("Additional video setup through useEffect");
        videoElement.srcObject = streamRef.current;
        videoElement
          .play()
          .catch((e) => console.log("UseEffect play error:", e));
      }
    }
  }, [isRecording, recordingType, streamRef.current]);

  // Fixed useEffect for correct scroll update
  useEffect(() => {
    if (isScrolling && !isPaused && scrollIntervalRef.current) {
      // Restart interval when speed changes
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = setInterval(() => {
        if (scrollContainerRef.current && isScrolling && !isPaused) {
          const container = scrollContainerRef.current;
          const scrollStep = (speed / 50) * 2;
          container.scrollTop += scrollStep;

          if (
            container.scrollTop >=
            container.scrollHeight - container.clientHeight
          ) {
            stopScrolling();
          }
        }
      }, 50);
    }
  }, [speed, isScrolling, isPaused]);

  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      console.log("Component unmounting, cleaning up resources");

      // Stop all intervals
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop recording
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      // Stop all media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }

      // Clear video element
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
        videoPreviewRef.current.pause();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden border border-slate-200/50 shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">👁️</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent">
                Teleprompter
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                Professional recording with a prompter
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 hover:bg-slate-100/80 rounded-xl transition-all duration-300 backdrop-blur-sm border border-slate-200/50"
            >
              ⚙️
            </button>
            <button
              onClick={handleClose}
              className="p-3 hover:bg-slate-100/80 rounded-xl transition-all duration-300 backdrop-blur-sm border border-slate-200/50"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main area with teleprompter */}
          <div className="flex-1 flex flex-col">
            {/* Settings */}
            {showSettings && (
              <div className="bg-gradient-to-r from-slate-50/90 to-blue-50/90 backdrop-blur-xl p-6 border-b border-slate-200/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Scroll speed: {speed}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={speed}
                      onChange={(e) => setSpeed(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Slow</span>
                      <span>Fast</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Font size: {fontSize}px
                    </label>
                    <input
                      type="range"
                      min="16"
                      max="48"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Small</span>
                      <span>Large</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Recording type
                    </label>
                    <select
                      value={recordingType}
                      onChange={(e) => setRecordingType(e.target.value)}
                      className="w-full p-3 bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-lg font-medium"
                    >
                      <option value="audio">Audio only</option>
                      <option value="video">Video + audio</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Teleprompter area */}
            <div className="flex-1 relative bg-black overflow-hidden">
              <div
                ref={scrollContainerRef}
                className="h-full overflow-y-scroll px-12 py-20"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <style>{`
                  .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <div
                  className="text-white leading-relaxed max-w-4xl mx-auto text-center font-medium"
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: "1.8",
                    textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                  }}
                >
                  {script}
                </div>
                <div className="h-screen"></div>
              </div>

              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute top-6 left-6 flex items-center space-x-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border border-red-400/30">
                  <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                  <span className="font-mono font-bold text-lg">
                    {formatTime(recordingTime)}
                  </span>
                  <span className="text-sm opacity-90">REC</span>
                </div>
              )}

              {/* Scroll indicator */}
              {isScrolling && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-500/80 text-white px-4 py-2 rounded-xl backdrop-blur-xl border border-blue-400/30">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">
                      {isPaused ? "Paused" : "Scrolling active"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Control panel */}
          <div className="w-96 bg-gradient-to-br from-white/90 to-slate-50/90 backdrop-blur-xl border-l border-slate-200/50 p-6 flex flex-col overflow-y-auto max-h-full">
            {/* Video preview */}
            {recordingType === "video" && (
              <div className="mb-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center text-lg">
                  <span className="mr-2">📹</span>
                  Video preview
                </h3>
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-slate-200 rounded-xl p-4 shadow-lg">
                  <div className="relative">
                    <video
                      ref={videoPreviewRef}
                      className="w-full h-48 rounded-xl object-cover bg-gray-900 border border-gray-600"
                      autoPlay
                      muted
                      playsInline
                      style={{
                        display: "block",
                        backgroundColor: "#1f2937",
                      }}
                    />
                    {isRecording && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse">
                        LIVE
                      </div>
                    )}
                    {/* Status indicator */}
                    {!isRecording && (
                      <div className="absolute inset-0 flex items-center justify-center text-white text-sm bg-black/50 rounded-xl">
                        <div className="text-center">
                          <div className="text-2xl mb-2">📹</div>
                          <span>Ready to record</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-slate-700 text-sm text-center mt-3 font-medium">
                    {isRecording ? "Recording video" : "Video mode active"}
                  </p>
                </div>
              </div>
            )}

            {/* Scroll control */}
            <div className="mb-8">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center text-lg">
                <span className="mr-2">📄</span>
                Text management
              </h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    if (isScrolling) {
                      // Completely stop scrolling
                      stopScrolling();
                      setIsPaused(false);
                    } else {
                      // Start scrolling
                      startScrolling();
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 text-white py-4 px-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  {isScrolling ? (
                    <>
                      <span className="mr-2">⏹️</span> Stop
                    </>
                  ) : (
                    <>
                      <span className="mr-2">▶️</span> Start
                    </>
                  )}
                </button>
                <button
                  onClick={resetScroll}
                  className="bg-slate-500 hover:bg-slate-600 text-white py-4 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  🔄
                </button>
              </div>

              {/* Scroll status */}
              <div className="mt-3 text-center">
                <span
                  className={`text-sm font-medium ${
                    isScrolling ? "text-green-600" : "text-slate-500"
                  }`}
                >
                  {isScrolling ? "Scrolling active" : "Scrolling stopped"}
                </span>
              </div>
            </div>

            {/* Recording control */}
            <div className="mb-8">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center text-lg">
                <span className="mr-2">🎤</span>
                Recording
              </h3>

              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center group"
                >
                  {recordingType === "video" ? (
                    <>
                      <span className="mr-3 text-xl group-hover:scale-110 transition-transform">
                        📹
                      </span>
                      Record video
                    </>
                  ) : (
                    <>
                      <span className="mr-3 text-xl group-hover:scale-110 transition-transform">
                        🎤
                      </span>
                      Record audio
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={stopRecording}
                    className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg flex items-center justify-center"
                  >
                    <span className="mr-3">⏹️</span>
                    Stop recording
                  </button>

                  {/* Emergency stop button */}
                  <button
                    onClick={stopRecordingAndResetTimer}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg flex items-center justify-center text-sm"
                  >
                    <span className="mr-2">🛑</span>
                    Abort and reset
                  </button>
                </div>
              )}

              {/* Show timer information */}
              {recordingTime > 0 && (
                <div className="mt-4 text-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-3xl font-mono font-bold text-slate-800 mb-2">
                    {formatTime(recordingTime)}
                  </div>
                  {!isRecording && (
                    <button
                      onClick={() => setRecordingTime(0)}
                      className="text-sm text-slate-600 hover:text-slate-800 underline font-medium"
                    >
                      Reset timer
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Recording result */}
            {recordedBlob && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-6 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl">🔊</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-800 text-lg">Ready!</h4>
                    <p className="text-sm text-green-600 font-medium">
                      {recordingType === "video" ? "Video" : "Audio"}{" "}
                      successfully recorded
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={downloadRecording}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                  >
                    <span className="mr-2">📥</span>
                    Download
                  </button>
                  <button
                    onClick={useRecording}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Use
                  </button>
                </div>
              </div>
            )}

            {(isRecording ||
              recordingTime > 0 ||
              recordedBlob ||
              isScrolling) && (
              <div className="mb-6">
                <button
                  onClick={resetAllStates}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <span className="mr-2">🔄</span>
                  Reset everything
                </button>
              </div>
            )}

            <div className="mt-auto">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
                <h4 className="font-bold text-blue-800 mb-3 flex items-center">
                  <span className="mr-2">✨</span>
                  Recording Tips
                </h4>
                <ul className="text-sm text-blue-700 space-y-2 font-medium">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Scrolling will start automatically when recording
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Adjust the speed to suit your speaking pace
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Use video preview to frame your shot
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Read naturally and with expression
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeleprompterModal;