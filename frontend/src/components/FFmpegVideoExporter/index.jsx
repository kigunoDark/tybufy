import { useState, useRef, useCallback, useEffect } from "react";
import { X, Download, Settings, Play, Loader2 } from "lucide-react";
import ThumbnailQuestionModal from "../ThumbnailCreator/ThumbnailQuestionModal";
import ThumbnailCreator from "../ThumbnailCreator/ThumbnailCreator";

const FFmpegVideoExporter = ({
  isOpen,
  onClose,
  timelineData,
  overlayTransforms = {},
  videoContainerRef,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showThumbnailModal, setShowThumbnailModal] = useState(false);
  const [exportedVideoUrl, setExportedVideoUrl] = useState(null);
  const [exportSettings, setExportSettings] = useState({
    resolution: "1920x1080",
    fps: 30,
    quality: "high",
    format: "mp4",
    imageScaling: "fit",
  });
  const [currentStep, setCurrentStep] = useState("settings");
  const [isThumbnailModalOpen, setThumbnailModalOpen] = useState(false);

  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep("settings");
      setProgress(0);
      setExportedVideoUrl(null);
      if (exportedVideoUrl) {
        URL.revokeObjectURL(exportedVideoUrl);
      }
    }
  }, [isOpen, exportedVideoUrl]);

  const resolutions = {
    "1920x1080": { width: 1920, height: 1080, label: "1080p HD" },
    "1280x720": { width: 1280, height: 720, label: "720p HD" },
    "854x480": { width: 854, height: 480, label: "480p SD" },
  };

  const loadMediaElement = async (item) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Timeout loading media")),
        15000
      );

      if (item.type === "videos") {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.muted = false;
        video.preload = "metadata";
        video.playsInline = true;

        const onLoaded = () => {
          clearTimeout(timeout);
          video.removeEventListener("loadedmetadata", onLoaded);
          video.removeEventListener("error", onError);
          resolve(video);
        };

        const onError = (e) => {
          clearTimeout(timeout);
          video.removeEventListener("loadedmetadata", onLoaded);
          video.removeEventListener("error", onError);
          reject(
            new Error(`Failed to load video: ${item.name} - ${e.message}`)
          );
        };

        video.addEventListener("loadedmetadata", onLoaded);
        video.addEventListener("error", onError);
        video.src = item.url;
      } else if (item.type === "images") {
        const img = new Image();
        img.crossOrigin = "anonymous";

        const onLoaded = () => {
          clearTimeout(timeout);
          img.removeEventListener("load", onLoaded);
          img.removeEventListener("error", onError);
          resolve(img);
        };

        const onError = (e) => {
          clearTimeout(timeout);
          img.removeEventListener("load", onLoaded);
          img.removeEventListener("error", onError);
          reject(new Error(`Failed to load image: ${item.name}`));
        };

        img.addEventListener("load", onLoaded);
        img.addEventListener("error", onError);
        img.src = item.url;
      } else if (item.type === "audios") {
        const audio = document.createElement("audio");
        audio.crossOrigin = "anonymous";
        audio.preload = "metadata";
        audio.playsInline = true;

        const onLoaded = () => {
          clearTimeout(timeout);
          audio.removeEventListener("loadedmetadata", onLoaded);
          audio.removeEventListener("error", onError);
          resolve(audio);
        };

        const onError = (e) => {
          clearTimeout(timeout);
          audio.removeEventListener("loadedmetadata", onLoaded);
          audio.removeEventListener("error", onError);
          reject(new Error(`Failed to load audio: ${item.name}`));
        };

        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("error", onError);
        audio.src = item.url;
      }
    });
  };

  const renderFrame = async (
    ctx,
    mediaElements,
    currentTime,
    canvasWidth,
    canvasHeight
  ) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const sortedItems = [...timelineData]
      .filter((item) => item.type !== "audios")
      .sort((a, b) => {
        if (a.trackType === "main") return -1;
        if (b.trackType === "main") return 1;
        return 0;
      });

    for (const item of sortedItems) {
      if (
        currentTime >= item.startTime &&
        currentTime <= item.startTime + item.duration
      ) {
        const element = mediaElements[item.id];
        if (!element) continue;

        const localTime = currentTime - item.startTime;

        try {
          if (item.type === "videos") {
            const targetTime = Math.max(
              0,
              Math.min(localTime, element.duration || item.duration)
            );

            if (Math.abs(element.currentTime - targetTime) > 0.033) {
              element.currentTime = targetTime;

              await new Promise((resolve) => {
                let attempts = 0;
                const maxAttempts = 10;

                const checkTime = () => {
                  if (
                    Math.abs(element.currentTime - targetTime) < 0.1 ||
                    element.readyState >= 2 ||
                    attempts >= maxAttempts
                  ) {
                    resolve();
                  } else {
                    attempts++;
                    setTimeout(checkTime, 5);
                  }
                };
                checkTime();
              });
            }

            ctx.save();
            ctx.globalAlpha = item.opacity;

            if (element.videoWidth && element.videoHeight) {
              const videoAspect = element.videoWidth / element.videoHeight;
              const canvasAspect = canvasWidth / canvasHeight;

              let drawWidth, drawHeight, drawX, drawY;

              if (videoAspect > canvasAspect) {
                drawWidth = canvasWidth;
                drawHeight = canvasWidth / videoAspect;
                drawX = 0;
                drawY = (canvasHeight - drawHeight) / 2;
              } else {
                drawHeight = canvasHeight;
                drawWidth = canvasHeight * videoAspect;
                drawX = (canvasWidth - drawWidth) / 2;
                drawY = 0;
              }

              ctx.drawImage(element, drawX, drawY, drawWidth, drawHeight);
            }
            ctx.restore();
          } else if (item.type === "images") {
            ctx.save();
            ctx.globalAlpha = item.opacity;

            if (item.trackType === "overlay") {
              const transform = overlayTransforms[item.id] || {
                x: 0,
                y: 0,
                scale: 1,
                opacity: 1,
              };

              let containerWidth = 800;
              let containerHeight = 600;

              if (videoContainerRef?.current) {
                const rect = videoContainerRef.current.getBoundingClientRect();
                containerWidth = rect.width;
                containerHeight = rect.height;
              }

              const scaleX = canvasWidth / containerWidth;
              const scaleY = canvasHeight / containerHeight;

              const baseWidth = 128;
              const baseHeight = 96;
              const drawWidth = baseWidth * transform.scale * scaleX;
              const drawHeight = baseHeight * transform.scale * scaleY;

              const overlayIndex = timelineData
                .filter((t) => t.trackType === "overlay" && t.type === "images")
                .findIndex((t) => t.id === item.id);

              const baseX = 200 * scaleX;
              const baseY = (50 + overlayIndex * 120) * scaleY;

              const drawX = baseX + transform.x * scaleX;
              const drawY = baseY + transform.y * scaleY;

              ctx.globalAlpha = item.opacity * transform.opacity;

              ctx.drawImage(element, drawX, drawY, drawWidth, drawHeight);
            } else {
              const imgAspect = element.width / element.height;
              const canvasAspect = canvasWidth / canvasHeight;

              let drawWidth, drawHeight, drawX, drawY;

              switch (exportSettings.imageScaling) {
                case "original":
                  drawWidth = element.width;
                  drawHeight = element.height;
                  drawX = (canvasWidth - drawWidth) / 2;
                  drawY = (canvasHeight - drawHeight) / 2;

                  if (drawWidth > canvasWidth || drawHeight > canvasHeight) {
                    const scaleX = canvasWidth / drawWidth;
                    const scaleY = canvasHeight / drawHeight;
                    const scale = Math.min(scaleX, scaleY);

                    drawWidth = drawWidth * scale;
                    drawHeight = drawHeight * scale;
                    drawX = (canvasWidth - drawWidth) / 2;
                    drawY = (canvasHeight - drawHeight) / 2;
                  }
                  break;

                case "stretch":
                  drawWidth = canvasWidth;
                  drawHeight = canvasHeight;
                  drawX = 0;
                  drawY = 0;
                  break;

                case "fill":
                  if (imgAspect > canvasAspect) {
                    drawHeight = canvasHeight;
                    drawWidth = canvasHeight * imgAspect;
                    drawX = (canvasWidth - drawWidth) / 2;
                    drawY = 0;
                  } else {
                    drawWidth = canvasWidth;
                    drawHeight = canvasWidth / imgAspect;
                    drawX = 0;
                    drawY = (canvasHeight - drawHeight) / 2;
                  }
                  break;

                case "fit":
                default:
                  if (imgAspect > canvasAspect) {
                    drawWidth = canvasWidth;
                    drawHeight = canvasWidth / imgAspect;
                    drawX = 0;
                    drawY = (canvasHeight - drawHeight) / 2;
                  } else {
                    drawHeight = canvasHeight;
                    drawWidth = canvasHeight * imgAspect;
                    drawX = (canvasWidth - drawWidth) / 2;
                    drawY = 0;
                  }
                  break;
              }

              ctx.drawImage(element, drawX, drawY, drawWidth, drawHeight);
            }
            ctx.restore();
          }
        } catch (error) {
          console.error("Error rendering element:", error);
        }
      }
    }
  };

  const createCompositeVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Canvas not found");

    const ctx = canvas.getContext("2d");
    const resolution = resolutions[exportSettings.resolution];

    canvas.width = resolution.width;
    canvas.height = resolution.height;

    setProgress(5);

    const mediaElements = {};
    let loadedCount = 0;

    for (const item of timelineData) {
      try {
        mediaElements[item.id] = await loadMediaElement(item);
        loadedCount++;
        setProgress(5 + (loadedCount / timelineData.length) * 20);
      } catch (error) {
        console.error(`Loading error ${item.name}:`, error);
      }
    }

    setProgress(25);

    const totalDuration = Math.max(
      ...timelineData.map((item) => item.startTime + item.duration)
    );

    const fps = exportSettings.fps;
    const frameInterval = 1 / fps;
    const totalFrames = Math.ceil(totalDuration * fps);

    const audioContext = new (window.AudioContext || window.webkitAudioContext)(
      {
        sampleRate: 48000,
      }
    );

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const audioDestination = audioContext.createMediaStreamDestination();
    const audioSources = [];

    const audioItems = timelineData.filter(
      (item) => item.type === "audios" || item.type === "videos"
    );

    for (const item of audioItems) {
      const element = mediaElements[item.id];
      if (!element) continue;

      try {
        element.volume = item.volume * item.opacity;
        element.muted = false;
        element.playbackRate = 1.0;

        const source = audioContext.createMediaElementSource(element);
        const gainNode = audioContext.createGain();
        gainNode.gain.value = item.volume * item.opacity;

        source.connect(gainNode);
        gainNode.connect(audioDestination);

        audioSources.push({ source, gainNode, item, element });
      } catch (error) {
        console.warn(`Failed to connect audio ${item.name}:`, error);
      }
    }

    const videoStream = canvas.captureStream(fps);

    const combinedStream = new MediaStream();

    videoStream.getVideoTracks().forEach((track) => {
      combinedStream.addTrack(track);
    });

    audioDestination.stream.getAudioTracks().forEach((track) => {
      combinedStream.addTrack(track);
    });

    const mimeTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=h264,opus",
      "video/webm",
      "video/mp4",
    ];

    let selectedMimeType = null;
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }

    if (!selectedMimeType) {
      throw new Error("The browser does not support video recording");
    }

    const recordOptions = {
      mimeType: selectedMimeType,
      videoBitsPerSecond:
        exportSettings.quality === "high"
          ? 8000000
          : exportSettings.quality === "medium"
          ? 4000000
          : 2000000,
      audioBitsPerSecond: 128000,
    };

    const mediaRecorder = new MediaRecorder(combinedStream, recordOptions);
    mediaRecorderRef.current = mediaRecorder;
    const recordedChunks = [];

    return new Promise((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        try {
          const blob = new Blob(recordedChunks, {
            type: selectedMimeType.split(";")[0],
          });
          audioContext.close();

          const url = URL.createObjectURL(blob);
          resolve(url);
        } catch (error) {
          console.error("Error creating blob:", error);
          reject(error);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder Error", event);
        audioContext.close();
        reject(new Error("Video recording error"));
      };

      mediaRecorder.start(100);
      setProgress(30);

      let currentFrame = 0;

      const renderInterval = setInterval(async () => {
        const currentTime = currentFrame * frameInterval;

        try {
          for (const audioSource of audioSources) {
            const { item, element } = audioSource;
            const itemStartTime = item.startTime;
            const itemEndTime = item.startTime + item.duration;

            if (currentTime >= itemStartTime && currentTime <= itemEndTime) {
              const localTime = currentTime - itemStartTime;

              const targetTime = Math.min(
                localTime,
                element.duration || item.duration
              );

              if (element.paused) {
                element.currentTime = targetTime;
                try {
                  await element.play();
                } catch (error) {
                  console.warn(`Failed to play audio ${item.name}:`, error);
                }
              } else {
                if (Math.abs(element.currentTime - targetTime) > 0.1) {
                  element.currentTime = targetTime;
                }
              }
            } else {
              if (!element.paused) {
                element.pause();
                element.currentTime = 0;
              }
            }
          }

          await renderFrame(
            ctx,
            mediaElements,
            currentTime,
            canvas.width,
            canvas.height
          );

          const renderProgress = 30 + (currentFrame / totalFrames) * 65;
          setProgress(renderProgress);

          currentFrame++;

          if (currentFrame >= totalFrames) {
            clearInterval(renderInterval);

            for (const audioSource of audioSources) {
              audioSource.element.pause();
              audioSource.element.currentTime = 0;
            }

            setTimeout(() => {
              if (mediaRecorder.state === "recording") {
                mediaRecorder.stop();
              }
            }, 500);
          }
        } catch (error) {
          console.error("Frame rendering error:", error);
          clearInterval(renderInterval);

          for (const audioSource of audioSources) {
            audioSource.element.pause();
          }

          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
          reject(error);
        }
      }, frameInterval * 1000);
    });
  };

  const handleExport = useCallback(async () => {
    if (!timelineData || timelineData.length === 0) {
      return;
    }

    setIsExporting(true);
    setCurrentStep("exporting");
    setProgress(0);

    try {
      const videoUrl = await createCompositeVideo();
      setExportedVideoUrl(videoUrl);
      setCurrentStep("completed");
      setProgress(100);
    } catch (error) {
      console.error("Export error:", error);
      alert(`Export error: ${error.message}`);
      setCurrentStep("settings");
    } finally {
      setIsExporting(false);
      mediaRecorderRef.current = null;
    }
  }, [timelineData, exportSettings]);

  const downloadVideo = () => {
    if (exportedVideoUrl) {
      const a = document.createElement("a");
      a.href = exportedVideoUrl;
      const extension = exportedVideoUrl.includes("webm") ? "webm" : "mp4";
      a.download = `exported-video.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setThumbnailModalOpen(true);
    }
  };

  const handleStartThumbnail = (state) => {
    setShowThumbnailModal(state);
    setThumbnailModalOpen(false)
  }

  const handleClose = () => {
    if (exportedVideoUrl) {
      URL.revokeObjectURL(exportedVideoUrl);
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Экспорт видео</h2>
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
          {currentStep === "settings" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Export settings
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permission
                    </label>
                    <select
                      value={exportSettings.resolution}
                      onChange={(e) =>
                        setExportSettings((prev) => ({
                          ...prev,
                          resolution: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Object.entries(resolutions).map(([key, res]) => (
                        <option key={key} value={key}>
                          {res.label} ({key})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frame rate
                    </label>
                    <select
                      value={exportSettings.fps}
                      onChange={(e) =>
                        setExportSettings((prev) => ({
                          ...prev,
                          fps: parseInt(e.target.value),
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={24}>24 FPS</option>
                      <option value={30}>30 FPS</option>
                      <option value={60}>60 FPS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality
                    </label>
                    <select
                      value={exportSettings.quality}
                      onChange={(e) =>
                        setExportSettings((prev) => ({
                          ...prev,
                          quality: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low (2 Mbps)</option>
                      <option value="medium">Average (4 Mbps)</option>
                      <option value="high">High (8 Mbps)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Format
                    </label>
                    <div className="p-2 bg-blue-50 rounded-md text-sm text-blue-800">
                      WebM (Automatic selection of the best codec)
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scaling images
                  </label>
                  <select
                    value={exportSettings.imageScaling}
                    onChange={(e) =>
                      setExportSettings((prev) => ({
                        ...prev,
                        imageScaling: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="original">
                      Original size (recommended)
                    </option>
                    <option value="fit">Fit (with black stripes)</option>
                    <option value="fill">Fill (cut off edges)</option>
                    <option value="stretch">
                      Stretch (may distort proportions)
                    </option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === "exporting" && (
            <div className="text-center space-y-6">
              <Loader2 className="w-16 h-16 animate-spin mx-auto text-blue-600" />
              <div>
                <h3 className="text-lg font-medium mb-2">Экспорт видео...</h3>
                <p className="text-gray-600">
                  Please do not close this window.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === "completed" && (
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Export completed!</h3>
                <p className="text-gray-600">Your video is ready to download</p>
              </div>

              {exportedVideoUrl && (
                <div className="space-y-4">
                  <video
                    controls
                    className="w-full max-w-md mx-auto rounded-lg shadow-md"
                    src={exportedVideoUrl}
                  />

                  <button
                    onClick={downloadVideo}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors mx-auto"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download video</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          {currentStep === "settings" && (
            <>
              <div className="text-sm text-gray-500">
                {timelineData
                  ? `${timelineData.length} элементов`
                  : "0 элементов"}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  disabled={isExporting}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={!timelineData || timelineData.length === 0}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Start export</span>
                </button>
              </div>
            </>
          )}

          {currentStep === "completed" && (
            <div className="flex space-x-3 ml-auto">
              <button
                onClick={() => setCurrentStep("settings")}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                New export
              </button>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
      <ThumbnailQuestionModal
        isOpen={isThumbnailModalOpen}
        onResponse={handleStartThumbnail}
      />

      <ThumbnailCreator
        isOpen={showThumbnailModal}
        onClose={setShowThumbnailModal}
        exportSettings={exportSettings}
      />

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default FFmpegVideoExporter;
