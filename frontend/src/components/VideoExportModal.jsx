import { useState, useEffect } from "react";
import {
  X,
  Download,
  Check,
  AlertCircle,
  FolderOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export const VideoExportModal = ({
  isOpen,
  onClose,
  timelineItems = [],
  tracks,
  videoDuration,
}) => {
  const [exportSettings, setExportSettings] = useState({
    resolution: "1920x1080",
    fps: 30,
    bitrate: 5000,
    format: "mp4",
    quality: "high",
    saveDirectory: null,
    filename: `video_${Date.now()}`,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState("idle");
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [showAllElements, setShowAllElements] = useState(false);

  // Предустановки для быстрого выбора
  const presets = [
    {
      name: "YouTube 1080p",
      resolution: "1920x1080",
      fps: 30,
      quality: "high",
      format: "mp4",
    },
    {
      name: "Instagram",
      resolution: "1080x1080",
      fps: 30,
      quality: "medium",
      format: "mp4",
    },
    {
      name: "TikTok",
      resolution: "1080x1920",
      fps: 30,
      quality: "medium",
      format: "mp4",
    },
    {
      name: "Web",
      resolution: "1280x720",
      fps: 30,
      quality: "medium",
      format: "webm",
    },
  ];

  const qualityOptions = [
    { value: "low", label: "Низкое", bitrate: 1000 },
    { value: "medium", label: "Среднее", bitrate: 3000 },
    { value: "high", label: "Высокое", bitrate: 5000 },
    { value: "ultra", label: "Ультра", bitrate: 10000 },
  ];

  const formatOptions = [
    { value: "mp4", label: "MP4" },
    { value: "webm", label: "WebM" },
    { value: "mov", label: "MOV" },
  ];

  // Быстрый расчет времени экспорта
  useEffect(() => {
    if (videoDuration && timelineItems?.length) {
      const complexity = timelineItems.filter(
        (item) => item.trackType === "overlay"
      ).length;
      const baseTime = Math.max(2, videoDuration * 0.1);
      const complexityMultiplier = 1 + complexity * 0.1;
      setEstimatedTime(Math.ceil(baseTime * complexityMultiplier));
    }
  }, [videoDuration, timelineItems]);

  useEffect(() => {
    const quality = qualityOptions.find(
      (q) => q.value === exportSettings.quality
    );
    if (quality && quality.bitrate !== exportSettings.bitrate) {
      setExportSettings((prev) => ({ ...prev, bitrate: quality.bitrate }));
    }
  }, [exportSettings.quality]);

  const handleSelectDirectory = async () => {
    try {
      if ("showDirectoryPicker" in window) {
        const directoryHandle = await window.showDirectoryPicker();
        setExportSettings((prev) => ({
          ...prev,
          saveDirectory: directoryHandle,
        }));
      } else {
        alert(
          "Ваш браузер не поддерживает выбор папки. Файл будет сохранен в папку загрузок."
        );
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Ошибка выбора папки:", error);
      }
    }
  };

  const applyPreset = (preset) => {
    setExportSettings((prev) => ({
      ...prev,
      ...preset,
    }));
  };

  const getFileSize = () => {
    if (!videoDuration) return "~";
    const sizeInMB =
      (exportSettings.bitrate * videoDuration * 1000) / (8 * 1024 * 1024);
    return sizeInMB < 1024
      ? `~${sizeInMB.toFixed(0)} МБ`
      : `~${(sizeInMB / 1024).toFixed(1)} ГБ`;
  };

  const handleExport = async () => {
    if (!timelineItems || timelineItems.length === 0) {
      alert("Нет элементов для экспорта!");
      return;
    }

    setIsExporting(true);
    setExportStatus("processing");
    setExportProgress(0);

    try {
      const videoExporter = new VideoExporter({
        timelineItems,
        tracks,
        videoDuration,
        settings: exportSettings,
        onProgress: setExportProgress,
      });

      const exportedVideoBlob = await videoExporter.render();
      await downloadVideo(exportedVideoBlob);

      setExportStatus("success");
      setTimeout(() => {
        setExportStatus("idle");
        setExportProgress(0);
      }, 3000);
    } catch (error) {
      console.error("❌ ОШИБКА ЭКСПОРТА:", error);
      alert(`Ошибка экспорта: ${error.message}`);
      setExportStatus("error");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadVideo = async (blob) => {
    const filename = `${exportSettings.filename}.${exportSettings.format}`;

    try {
      if (exportSettings.saveDirectory && "showDirectoryPicker" in window) {
        const fileHandle = await exportSettings.saveDirectory.getFileHandle(
          filename,
          {
            create: true,
          }
        );
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Ошибка сохранения:", error);
      throw error;
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      setExportStatus("idle");
      setExportProgress(0);
      onClose();
    }
  };

  if (!isOpen) return null;

  const hasTimelineItems = timelineItems && timelineItems.length > 0;
  const elementsToShow = hasTimelineItems
    ? showAllElements
      ? timelineItems
      : timelineItems.slice(0, 3)
    : [];
  const hasMoreElements = hasTimelineItems && timelineItems.length > 3;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <Download size={20} className="mr-2 text-blue-600" />
            Экспорт видео
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isExporting}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
          {exportStatus !== "idle" && (
            <div
              className={`p-3 rounded-lg ${
                exportStatus === "processing"
                  ? "bg-blue-50 border border-blue-200"
                  : exportStatus === "success"
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-center">
                {exportStatus === "processing" && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm text-blue-700 mb-1">
                        <span>Экспорт...</span>
                        <span>{exportProgress}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${exportProgress}%` }}
                        />
                      </div>
                    </div>
                  </>
                )}
                {exportStatus === "success" && (
                  <>
                    <Check size={16} className="text-green-600 mr-2" />
                    <span className="text-green-700 text-sm font-medium">
                      Готово!
                    </span>
                  </>
                )}
                {exportStatus === "error" && (
                  <>
                    <AlertCircle size={16} className="text-red-600 mr-2" />
                    <span className="text-red-700 text-sm font-medium">
                      Ошибка экспорта
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Быстрые настройки
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="p-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isExporting}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Разрешение
              </label>
              <select
                value={exportSettings.resolution}
                onChange={(e) =>
                  setExportSettings((prev) => ({
                    ...prev,
                    resolution: e.target.value,
                  }))
                }
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isExporting}
              >
                <option value="3840x2160">4K</option>
                <option value="1920x1080">1080p</option>
                <option value="1280x720">720p</option>
                <option value="854x480">480p</option>
                <option value="1080x1920">9:16 (TikTok)</option>
                <option value="1080x1080">1:1 (Instagram)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                FPS
              </label>
              <select
                value={exportSettings.fps}
                onChange={(e) =>
                  setExportSettings((prev) => ({
                    ...prev,
                    fps: parseInt(e.target.value),
                  }))
                }
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isExporting}
              >
                <option value="24">24</option>
                <option value="30">30</option>
                <option value="60">60</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Качество
              </label>
              <select
                value={exportSettings.quality}
                onChange={(e) =>
                  setExportSettings((prev) => ({
                    ...prev,
                    quality: e.target.value,
                  }))
                }
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isExporting}
              >
                {qualityOptions.map((quality) => (
                  <option key={quality.value} value={quality.value}>
                    {quality.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Формат
              </label>
              <select
                value={exportSettings.format}
                onChange={(e) =>
                  setExportSettings((prev) => ({
                    ...prev,
                    format: e.target.value,
                  }))
                }
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isExporting}
              >
                {formatOptions.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Имя файла
              </label>
              <input
                type="text"
                value={exportSettings.filename}
                onChange={(e) =>
                  setExportSettings((prev) => ({
                    ...prev,
                    filename: e.target.value,
                  }))
                }
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isExporting}
                placeholder="Имя файла"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Папка для сохранения
              </label>
              <button
                onClick={handleSelectDirectory}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                disabled={isExporting}
              >
                <span className="text-gray-600">
                  {exportSettings.saveDirectory
                    ? exportSettings.saveDirectory.name
                    : "Выберите папку"}
                </span>
                <FolderOpen size={16} />
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600">Длительность:</span>
                <span className="ml-1 font-medium">
                  {Math.round(videoDuration)}с
                </span>
              </div>
              <div>
                <span className="text-gray-600">Размер:</span>
                <span className="ml-1 font-medium">{getFileSize()}</span>
              </div>
              <div>
                <span className="text-gray-600">Битрейт:</span>
                <span className="ml-1 font-medium">
                  {exportSettings.bitrate} kbps
                </span>
              </div>
              <div>
                <span className="text-gray-600">Время:</span>
                <span className="ml-1 font-medium">~{estimatedTime}с</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-800">
                Элементы для экспорта
              </span>
              <span className="text-xs text-gray-600">
                {hasTimelineItems ? timelineItems.length : 0}
              </span>
            </div>
            {hasTimelineItems ? (
              <div className="space-y-1">
                {elementsToShow.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-gray-700 truncate">{item.name}</span>
                    <span
                      className={`px-1 py-0.5 rounded text-xs ${
                        item.trackType === "main"
                          ? "bg-blue-100 text-blue-700"
                          : item.trackType === "audio"
                          ? "bg-green-100 text-green-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {item.trackType}
                    </span>
                  </div>
                ))}
                {hasMoreElements && (
                  <button
                    onClick={() => setShowAllElements(!showAllElements)}
                    className="w-full text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center py-1 transition-colors"
                  >
                    {showAllElements ? (
                      <>
                        Скрыть <ChevronUp size={12} className="ml-1" />
                      </>
                    ) : (
                      <>
                        +{timelineItems.length - 3} ещё{" "}
                        <ChevronDown size={12} className="ml-1" />
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-500 text-center py-2">
                Нет элементов для экспорта
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isExporting}
          >
            Отмена
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !hasTimelineItems}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all flex items-center ${
              isExporting || !hasTimelineItems
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                Экспорт...
              </>
            ) : (
              <>
                <Download size={14} className="mr-2" />
                Экспортировать
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Полностью переписанный VideoExporter класс для правильного экспорта
class VideoExporter {
  constructor({ timelineItems, tracks, videoDuration, settings, onProgress }) {
    this.timelineItems = timelineItems;
    this.tracks = tracks;
    this.videoDuration = videoDuration;
    this.settings = settings;
    this.onProgress = onProgress;

    // Создаем основной canvas для композиции
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");

    const [width, height] = settings.resolution.split("x").map(Number);
    this.canvas.width = width;
    this.canvas.height = height;

    // Создаем аудио контекст для работы со звуком
    this.audioContext = null;
    this.audioSources = [];
    this.audioBuffers = new Map();
    this.audioDestination = null;

    // Подготовленные элементы
    this.preparedElements = new Map();
    this.loadedMedia = new Map();
  }

  async render() {
    try {
      if (!this.timelineItems || this.timelineItems.length === 0) {
        throw new Error("Нет элементов для экспорта");
      }

      if (!this.videoDuration || this.videoDuration <= 0) {
        throw new Error("Неверная длительность видео");
      }

      await this.prepareAllElements();
      this.onProgress?.(30);

      await this.setupAudio();
      this.onProgress?.(40);

      const stream = this.canvas.captureStream(this.settings.fps);

      if (this.audioContext && this.audioDestination) {
        const audioTracks = this.audioDestination.stream.getAudioTracks();
        audioTracks.forEach((track) => {
          stream.addTrack(track);
        });
      }

      const mimeType = this.getMimeType();

      const options = {
        mimeType: mimeType,
        videoBitsPerSecond: this.settings.bitrate * 1000,
      };

      if (this.audioDestination) {
        options.audioBitsPerSecond = 128000;
      }

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn("⚠️ MIME тип не поддерживается, используем базовый");
        options.mimeType = "video/webm";
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      const chunks = [];
      let recordedSize = 0;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          recordedSize += event.data.size;
        }
      };

      return new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
          if (chunks.length === 0 || recordedSize === 0) {
            reject(new Error("Не удалось записать видео - нет данных"));
            return;
          }

          const blob = new Blob(chunks, {
            type: `video/${this.settings.format}`,
          });

          this.cleanup();

          resolve(blob);
        };

        mediaRecorder.onerror = (error) => {
          console.error("❌ Ошибка MediaRecorder:", error);
          this.cleanup();
          reject(new Error(`Ошибка записи: ${error.message || error}`));
        };

        mediaRecorder.start(100);

        this.renderFrames()
          .then(() => {
            setTimeout(() => {
              if (mediaRecorder.state === "recording") {
                mediaRecorder.stop();
              }
            }, 500);
          })
          .catch((error) => {
            console.error("💥 Ошибка рендеринга:", error);
            if (mediaRecorder.state === "recording") {
              mediaRecorder.stop();
            }
            reject(error);
          });
      });
    } catch (error) {
      console.error("💥 КРИТИЧЕСКАЯ ОШИБКА render():", error);
      this.cleanup();
      throw error;
    }
  }

  async prepareAllElements() {
    const preparationPromises = this.timelineItems.map(async (item, index) => {
      try {
        const elementType = this.determineElementType(item);

        if (elementType === "video") {
          await this.prepareVideoElement(item);
        } else if (elementType === "image") {
          await this.prepareImageElement(item);
        } else if (elementType === "audio") {
          await this.prepareAudioElement(item);
        }

        this.preparedElements.set(item.id, item);
      } catch (error) {
        console.warn(`⚠️ Ошибка подготовки ${item.name}:`, error);
      }
    });

    await Promise.all(preparationPromises);
  }

  determineElementType(item) {
    if (
      item.type === "videos" ||
      item.type === "video" ||
      item.trackType === "main"
    ) {
      return "video";
    }
    if (
      item.type === "images" ||
      item.type === "image" ||
      item.trackType === "overlay"
    ) {
      return "image";
    }
    if (
      item.type === "audios" ||
      item.type === "audio" ||
      item.trackType === "audio"
    ) {
      return "audio";
    }

    const url = item.url || item.src || "";
    if (/\.(mp4|webm|mov|avi)$/i.test(url)) return "video";
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return "image";
    if (/\.(mp3|wav|ogg|m4a)$/i.test(url)) return "audio";

    return "unknown";
  }

  async prepareVideoElement(item) {
    if (this.loadedMedia.has(item.id)) return;

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "metadata";

    const videoUrl = item.url || item.src;
    if (!videoUrl) {
      console.warn(`❌ Не найден URL для видео: ${item.name}`);
      return;
    }

    video.src = videoUrl;

    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn(`⏰ Таймаут загрузки видео: ${item.name}`);
        resolve();
      }, 10000);

      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        this.loadedMedia.set(item.id, video);
        resolve();
      };

      video.onerror = (e) => {
        clearTimeout(timeout);
        console.error(`❌ Ошибка загрузки видео: ${item.name}`, e);
        resolve();
      };
    });
  }

  async prepareImageElement(item) {
    if (this.loadedMedia.has(item.id)) return;

    const img = new Image();
    img.crossOrigin = "anonymous";

    const imageUrl = item.url || item.src;
    if (!imageUrl) {
      console.warn(`❌ Не найден URL для изображения: ${item.name}`);
      return;
    }

    img.src = imageUrl;

    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn(`⏰ Таймаут загрузки изображения: ${item.name}`);
        resolve();
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        this.loadedMedia.set(item.id, img);
        resolve();
      };

      img.onerror = (e) => {
        clearTimeout(timeout);
        console.error(`❌ Ошибка загрузки изображения: ${item.name}`, e);
        resolve();
      };
    });
  }

  async prepareAudioElement(item) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    const audioUrl = item.url || item.src;
    if (!audioUrl) {
      console.warn(`❌ Не найден URL для аудио: ${item.name}`);
      return;
    }

    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.audioBuffers.set(item.id, audioBuffer);
    } catch (error) {
      console.error(`❌ Ошибка подготовки аудио ${item.name}:`, error);
    }
  }

  async setupAudio() {
    if (!this.audioContext || this.audioBuffers.size === 0) return;

    this.audioDestination = this.audioContext.createMediaStreamDestination();
    for (const [itemId, audioBuffer] of this.audioBuffers) {
      const item = this.timelineItems.find((i) => i.id === itemId);
      if (!item) continue;

      this.audioSources.push({
        buffer: audioBuffer,
        item,
        startTime: item.startTime || 0,
        duration: item.duration || audioBuffer.duration,
      });
    }
  }

  async renderFrames() {
    const frameCount = Math.ceil(this.videoDuration * this.settings.fps);
    const frameDuration = 1 / this.settings.fps;

    this.startAudioSources();

    for (let frame = 0; frame < frameCount; frame++) {
      const currentTime = frame * frameDuration;

      try {
        await this.renderFrame(currentTime);

        const progress = 40 + Math.round((frame / frameCount) * 50);
        this.onProgress?.(progress);
        if (frame % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1));
        }
      } catch (error) {
        console.error(`❌ Ошибка рендеринга кадра ${frame}:`, error);
        this.renderErrorFrame(currentTime, error.message);
      }
    }

    this.onProgress?.(90);
  }

  startAudioSources() {
    if (!this.audioContext || this.audioSources.length === 0) return;
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    this.audioSources.forEach(({ buffer, item, startTime, duration }) => {
      try {
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioDestination);

        const when = this.audioContext.currentTime + startTime;
        const sourceDuration = Math.min(duration, buffer.duration);

        source.start(when, 0, sourceDuration);
      } catch (error) {
        console.warn(`⚠️ Ошибка запуска аудио ${item.name}:`, error);
      }
    });
  }

  async renderFrame(currentTime) {
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const activeItems = this.getActiveItems(currentTime);

    if (activeItems.length === 0) {
      this.renderTimestamp(currentTime);
      return;
    }

    const sortedItems = this.sortItemsByLayer(activeItems);
    for (const item of sortedItems) {
      const relativeTime = currentTime - (item.startTime || 0);
      await this.renderItem(item, relativeTime);
    }
  }

  getActiveItems(currentTime) {
    return this.timelineItems.filter((item) => {
      const startTime = item.startTime || 0;
      const duration = item.duration || this.videoDuration;
      const endTime = startTime + duration;

      return currentTime >= startTime && currentTime < endTime;
    });
  }

  sortItemsByLayer(items) {
    const layerOrder = {
      audio: 0,
      main: 1,
      video: 1,
      overlay: 2,
      image: 2,
    };

    return [...items].sort((a, b) => {
      const orderA = layerOrder[a.trackType] || layerOrder[a.type] || 1;
      const orderB = layerOrder[b.trackType] || layerOrder[b.type] || 1;
      return orderA - orderB;
    });
  }

  async renderItem(item, relativeTime) {
    try {
      this.ctx.save();

      const elementType = this.determineElementType(item);

      if (elementType === "audio") {
        return;
      }

      const mediaElement = this.loadedMedia.get(item.id);
      if (!mediaElement) {
        this.renderPlaceholder(item.name || "Неизвестный элемент");
        return;
      }

      if (elementType === "video") {
        await this.renderVideoItem(mediaElement, relativeTime);
      } else if (elementType === "image") {
        this.renderImageItem(mediaElement);
      }
    } catch (error) {
      console.warn(`⚠️ Ошибка рендеринга элемента ${item.name}:`, error);
      this.renderPlaceholder(`Ошибка: ${item.name}`);
    } finally {
      this.ctx.restore();
    }
  }

  async renderVideoItem(video, relativeTime) {
    if (!video || video.readyState < 2) {
      this.renderPlaceholder("Загрузка видео...");
      return;
    }

    try {
      const targetTime = Math.max(0, Math.min(relativeTime, video.duration));

      if (Math.abs(video.currentTime - targetTime) > 0.1) {
        video.currentTime = targetTime;

        let attempts = 0;
        while (video.readyState < 2 && attempts < 10) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          attempts++;
        }
      }

      this.drawScaledElement(video);
    } catch (error) {
      console.warn(`⚠️ Ошибка рендеринга видео:`, error);
      this.renderPlaceholder("Ошибка видео");
    }
  }

  renderImageItem(img) {
    if (!img || !img.complete || img.naturalWidth === 0) {
      this.renderPlaceholder("Изображение не загружено");
      return;
    }

    try {
      this.drawScaledElement(img);
    } catch (error) {
      console.warn(`⚠️ Ошибка рендеринга изображения:`, error);
      this.renderPlaceholder("Ошибка изображения");
    }
  }

  drawScaledElement(element) {
    const elementWidth =
      element.videoWidth || element.naturalWidth || element.width;
    const elementHeight =
      element.videoHeight || element.naturalHeight || element.height;

    if (!elementWidth || !elementHeight) {
      console.warn("⚠️ Элемент не имеет размеров");
      return;
    }

    const canvasRatio = this.canvas.width / this.canvas.height;
    const elementRatio = elementWidth / elementHeight;

    let drawWidth, drawHeight, drawX, drawY;

    if (elementRatio > canvasRatio) {
      drawWidth = this.canvas.width;
      drawHeight = this.canvas.width / elementRatio;
      drawX = 0;
      drawY = (this.canvas.height - drawHeight) / 2;
    } else {
      drawHeight = this.canvas.height;
      drawWidth = this.canvas.height * elementRatio;
      drawX = (this.canvas.width - drawWidth) / 2;
      drawY = 0;
    }

    try {
      this.ctx.drawImage(element, drawX, drawY, drawWidth, drawHeight);
    } catch (error) {
      console.error("💥 Ошибка отрисовки:", error);
      this.renderPlaceholder("Ошибка отрисовки");
    }
  }

  renderPlaceholder(text) {
    this.ctx.fillStyle = "rgba(64, 64, 64, 0.8)";
    this.ctx.fillRect(10, 10, this.canvas.width - 20, 60);

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = `${Math.min(24, this.canvas.width / 40)}px Arial`;
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(text, 20, 40);
  }

  renderTimestamp(currentTime) {
    this.ctx.fillStyle = "#333333";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = `${Math.min(32, this.canvas.width / 30)}px Arial`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(
      `Время: ${currentTime.toFixed(1)}с`,
      this.canvas.width / 2,
      this.canvas.height / 2
    );
  }

  renderErrorFrame(currentTime, errorMessage) {
    this.ctx.fillStyle = "#ff0000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = `${Math.min(24, this.canvas.width / 40)}px Arial`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    const x = this.canvas.width / 2;
    const y = this.canvas.height / 2;

    this.ctx.fillText(`ОШИБКА КАДРА`, x, y - 30);
    this.ctx.fillText(`Время: ${currentTime.toFixed(1)}с`, x, y);
    this.ctx.fillText(errorMessage.substring(0, 50), x, y + 30);
  }

  getMimeType() {
    const formats = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/mp4;codecs=h264,aac",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];

    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format)) {
        return format;
      }
    }

    return "video/webm";
  }

  cleanup() {
    this.audioSources.forEach(({ source }) => {
      try {
        if (source && source.buffer) {
          source.stop();
        }
      } catch (error) {
        console.error(error);
      }
    });

    this.loadedMedia.forEach((element) => {
      if (element.src && element.src.startsWith("blob:")) {
        URL.revokeObjectURL(element.src);
      }
    });

    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
    }

    this.audioSources = [];
    this.audioBuffers.clear();
    this.preparedElements.clear();
    this.loadedMedia.clear();
    this.audioDestination = null;
  }
}

export const useVideoExporter = () => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const openExportModal = () => setIsExportModalOpen(true);
  const closeExportModal = () => setIsExportModalOpen(false);

  return {
    isExportModalOpen,
    openExportModal,
    closeExportModal,
  };
};
