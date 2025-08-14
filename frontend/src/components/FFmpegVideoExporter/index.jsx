import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Download,
  Check,
  AlertCircle,
  Settings,
  Play,
  Film,
} from "lucide-react";
import ThumbnailQuestionModal from "../ThumbnailCreator/ThumbnailQuestionModal";
import ThumbnailCreator from "../ThumbnailCreator/ThumbnailCreator";

const FFmpegVideoExporter = ({
  isOpen,
  onClose,
  timelineItems = [],
  videoDuration = 60,
  overlayTransforms = {},
  timelineData,
  elements,
  clips,
  mediaItems,
}) => {
  const actualTimelineItems = React.useMemo(() => {
    const items = timelineItems || timelineData || elements || clips || mediaItems || [];
    return items;
  }, [timelineItems, timelineData, elements, clips, mediaItems]);

  const [exportSettings, setExportSettings] = useState({
    resolution: "1280x720",
    fps: 24,
    format: "mp4",
    filename: `video_${Date.now()}`,
    includeAudio: true,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState("idle");
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

  // Модалки для создания обложек
  const [showThumbnailQuestion, setShowThumbnailQuestion] = useState(false);
  const [showThumbnailCreator, setShowThumbnailCreator] = useState(false);

  const navigateToApp = () => {
    window.location.href = `${process.env.REACT_APP__URL}/app/video-maker` || "http://localhost:3000/app";
  };

  const handleThumbnailResponse = (wantThumbnail) => {
    setShowThumbnailQuestion(false);
    if (wantThumbnail) {
      setShowThumbnailCreator(true);
    } else {
      onClose();
      navigateToApp();
    }
  };

  const handleThumbnailCreatorClose = () => {
    setShowThumbnailCreator(false);
    onClose();
    navigateToApp();
  };

  const calculateTotalDuration = () => {
    if (actualTimelineItems.length === 0) return videoDuration;

    const visualItems = actualTimelineItems.filter(item => 
      item.trackType === "main" || item.trackType === "overlay"
    );

    if (visualItems.length === 0) return videoDuration;

    const maxEndTime = Math.max(
      ...visualItems.map(
        (item) => (item.startTime || 0) + (item.duration || 0)
      )
    );

    return Math.min(maxEndTime, 30);
  };

  // Серверный экспорт через ваш API
  const exportWithServer = async () => {
    try {
      setExportStage("preparing");
      setExportProgress(10);

      // Подготавливаем данные в формате вашего API
      const timelineForServer = actualTimelineItems.map(item => ({
        type: item.type === "videos" ? "videos" : 
              item.trackType === "audio" ? "audios" : "images",
        url: item.url,
        startTime: item.startTime || 0,
        duration: item.duration || 0,
        name: item.name,
      }));

      setExportStage("uploading");
      setExportProgress(30);

      const response = await fetch("/api/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeline: timelineForServer
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Ваш API возвращает готовый URL
        setDownloadUrl(result.url);
        setExportProgress(100);
        setExportStage("completed");
      } else {
        throw new Error(result.error || "Server export failed");
      }

    } catch (error) {
      console.error("❌ Server export error:", error);
      setError(error.message);
      setExportStage("error");
    }
  };

  const startExport = async () => {
    if (isExporting || actualTimelineItems.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportStage("preparing");
    setError(null);
    setDownloadUrl(null);

    try {
      await exportWithServer();

      // Показываем вопрос о создании обложки после успешного экспорта
      if (exportStage === "completed") {
        setTimeout(() => {
          setShowThumbnailQuestion(true);
        }, 1500);
      }

    } catch (error) {
      console.error("❌ Export error:", error);
      setError(error.message);
      setExportStage("error");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadVideo = () => {
    if (downloadUrl) {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${exportSettings.filename}.${exportSettings.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const getStageText = () => {
    switch (exportStage) {
      case "preparing": return "Preparing timeline data...";
      case "uploading": return "Sending to server...";  
      case "processing": return "Server is rendering video...";
      case "completed": return "✅ Video ready for download!";
      case "error": return "❌ Export failed";
      default: return `Ready to export (${actualTimelineItems.length} elements)`;
    }
  };

  const getStageIcon = () => {
    switch (exportStage) {
      case "completed": return <Check size={20} className="text-green-600" />;
      case "error": return <AlertCircle size={20} className="text-red-600" />;
      default: return isExporting ? 
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div> :
        <Play size={20} className="text-blue-600" />;
    }
  };

  const canExport = !isExporting && actualTimelineItems.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Film size={24} className="mr-3 text-blue-600" />
            Video Export
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isExporting}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start">
                <AlertCircle size={20} className="text-red-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Export Error</h4>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Display */}
          <div className={`rounded-xl p-4 border ${
            exportStage === "error" ? "bg-red-50 border-red-200" :
            exportStage === "completed" ? "bg-green-50 border-green-200" :
            "bg-blue-50 border-blue-200"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                {getStageIcon()}
                <span className={`ml-3 font-medium ${
                  exportStage === "error" ? "text-red-900" :
                  exportStage === "completed" ? "text-green-900" :
                  "text-blue-900"
                }`}>
                  {getStageText()}
                </span>
              </div>
              {isExporting && (
                <span className="text-sm font-medium text-blue-700">
                  {exportProgress}%
                </span>
              )}
            </div>
            {isExporting && (
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Export Settings */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Settings size={16} className="mr-2" />
              Export Settings
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Resolution</label>
                <select
                  value={exportSettings.resolution}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, resolution: e.target.value }))}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                  disabled={isExporting}
                >
                  <option value="640x480">480p (fast)</option>
                  <option value="1280x720">720p (recommended)</option>
                  <option value="1920x1080">1080p (slow)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">FPS</label>
                <select
                  value={exportSettings.fps}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, fps: parseInt(e.target.value) }))}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                  disabled={isExporting}
                >
                  <option value="24">24 FPS</option>
                  <option value="30">30 FPS</option>
                  <option value="60">60 FPS</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">File name</label>
              <input
                type="text"
                value={exportSettings.filename}
                onChange={(e) => setExportSettings(prev => ({ ...prev, filename: e.target.value }))}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                disabled={isExporting}
              />
            </div>

            <div className="mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportSettings.includeAudio}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, includeAudio: e.target.checked }))}
                  disabled={isExporting}
                  className="rounded"
                />
                <span className="text-sm">Include audio</span>
              </label>
            </div>
          </div>

          {/* Timeline Info */}
          {actualTimelineItems.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-medium text-blue-800 mb-2">📊 Timeline Summary</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Total elements:</strong> {actualTimelineItems.length}</p>
                <p><strong>Videos:</strong> {actualTimelineItems.filter(item => item.type === "videos").length}</p>
                <p><strong>Images:</strong> {actualTimelineItems.filter(item => item.type !== "videos" && item.trackType !== "audio").length}</p>
                <p><strong>Audio tracks:</strong> {actualTimelineItems.filter(item => item.trackType === "audio").length}</p>
                <p><strong>Duration:</strong> {calculateTotalDuration().toFixed(1)}s</p>
              </div>
            </div>
          )}

          {/* Download Section */}
          {exportStage === "completed" && downloadUrl && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-medium text-green-800 mb-2">✅ Export Complete!</h4>
              <button
                onClick={downloadVideo}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Download size={16} className="mr-2" />
                Download Video
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            {actualTimelineItems.length > 0
              ? `${actualTimelineItems.length} timeline elements • ${calculateTotalDuration().toFixed(1)}s duration`
              : "Add elements to timeline"}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isExporting}
            >
              Close
            </button>
            <button
              onClick={startExport}
              disabled={!canExport}
              className={`px-6 py-2 text-sm rounded-lg font-medium transition-all flex items-center ${
                !canExport
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700 shadow-lg"
              }`}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting... {exportProgress}%
                </>
              ) : (
                <>
                  <Download size={16} className="mr-2" />
                  Export Video
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Модалки для создания обложек */}
      <ThumbnailQuestionModal
        isOpen={showThumbnailQuestion}
        onResponse={handleThumbnailResponse}
      />

      <ThumbnailCreator
        isOpen={showThumbnailCreator}
        onClose={handleThumbnailCreatorClose}
        exportSettings={exportSettings}
      />
    </div>
  );
};

export const useFFmpegExporter = () => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const openExportModal = () => setIsExportModalOpen(true);
  const closeExportModal = () => setIsExportModalOpen(false);

  return {
    isExportModalOpen,
    openExportModal,
    closeExportModal,
  };
};

export default FFmpegVideoExporter;