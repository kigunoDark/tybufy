import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Download,
  Volume2,
  VolumeX,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const AudioPlayer = ({ generatedAudio, onClose }) => {
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playMode, setPlayMode] = useState('full'); // 'full' или 'chunks'
  const audioRef = useRef(null);

  // Создаем список аудиофайлов для воспроизведения (мемоизируем)
  const audioDataList = React.useMemo(() => {
    if (!generatedAudio) return [];
    
    return [
      // Полное аудио
      {
        ...generatedAudio,
        displayName: 'Полное аудио',
        type: 'full'
      },
      // Чанки (если есть)
      ...(generatedAudio.audioChunks || []).map((chunk, index) => ({
        ...chunk,
        displayName: `Часть ${index + 1}`,
        type: 'chunk',
        chunkIndex: index
      }))
    ];
  }, [generatedAudio]);

  // Получаем текущий аудиофайл
  const currentAudioData = audioDataList && audioDataList.length > 0 ? audioDataList[currentAudioIndex] : null;

  useEffect(() => {
    if (currentAudioData?.audioUrl) {
      // Останавливаем предыдущее аудио
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      const audio = new Audio(currentAudioData.audioUrl);
      audioRef.current = audio;
      setIsLoading(true);
      setIsPlaying(false);
      setCurrentTime(0);

      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
        setIsLoading(false);
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        // Автоматически переходим к следующему аудио
        setCurrentAudioIndex(prevIndex => {
          if (prevIndex < audioDataList.length - 1) {
            return prevIndex + 1;
          }
          return prevIndex; // Остаемся на последнем треке
        });
      };

      const handleError = (e) => {
        console.error("Audio error:", e);
        console.error("Audio URL:", currentAudioData.audioUrl.substring(0, 100));
        setIsLoading(false);
      };

      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError);

      return () => {
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("error", handleError);
        audio.pause();
        audio.src = "";
      };
    }
  }, [currentAudioIndex]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const previousTrack = () => {
    if (currentAudioIndex > 0) {
      setCurrentAudioIndex(currentAudioIndex - 1);
    }
  };

  const nextTrack = () => {
    if (currentAudioIndex < audioDataList.length - 1) {
      setCurrentAudioIndex(currentAudioIndex + 1);
    }
  };

  const downloadAudio = () => {
    if (currentAudioData?.audioBase64) {
      const blob = new Blob(
        [
          new Uint8Array(
            atob(currentAudioData.audioBase64)
              .split("")
              .map((char) => char.charCodeAt(0))
          ),
        ],
        { type: "audio/mpeg" }
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentAudioData.filename || `audio_${currentAudioIndex + 1}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!generatedAudio) return null;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 space-y-3">
      {/* Header с навигацией */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <Volume2 className="text-blue-600" size={14} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-800">
              {currentAudioData?.displayName || `Аудио ${currentAudioIndex + 1}`}
            </h4>
            <p className="text-xs text-gray-500">
              {currentAudioData?.voiceId} • {formatTime(duration)}
              {currentAudioData?.type === 'full' && generatedAudio.isChunked && ` • ${generatedAudio.totalChunks} частей`}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          title="Close"
        >
          <span className="text-sm">×</span>
        </button>
      </div>

      {/* Навигация между треками */}
      {audioDataList.length > 1 && (
        <div className="flex items-center justify-between py-2 bg-gray-50 rounded-md px-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={previousTrack}
              disabled={currentAudioIndex === 0}
              className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Предыдущий"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-gray-600 min-w-[80px] text-center">
              {currentAudioIndex + 1} / {audioDataList.length}
            </span>
            <button
              onClick={nextTrack}
              disabled={currentAudioIndex === audioDataList.length - 1}
              className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Следующий"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          
          {generatedAudio.isChunked && (
            <div className="text-xs text-blue-600 font-medium">
              {currentAudioData?.type === 'full' ? '🎵 Полная версия' : '📚 Фрагмент'}
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-1">
        <div
          className="w-full h-1.5 bg-gray-200 rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-100"
            style={{
              width: duration ? `${(currentTime / duration) * 100}%` : "0%",
            }}
          />
          {isLoading && (
            <div className="absolute inset-0 bg-gray-300 animate-pulse rounded-full" />
          )}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Play Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={restart}
            disabled={isLoading}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all disabled:opacity-50"
            title="Restart"
          >
            <RotateCcw size={12} />
          </button>

          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : isPlaying ? (
              <Pause size={14} />
            ) : (
              <Play size={14} />
            )}
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center space-x-1">
          <button
            onClick={toggleMute}
            className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-12 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Download */}
        <button
          onClick={downloadAudio}
          className="flex items-center space-x-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md transition-all text-xs font-medium"
          title="Download Audio"
        >
          <Download size={12} />
          <span className="hidden sm:inline">Save</span>
        </button>
      </div>

      {/* Info Bar */}
      <div className="bg-gray-50 rounded-md p-2">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>{currentAudioData?.textLength || currentAudioData?.originalTextLength || 0} chars</span>
          <span>{currentAudioData?.size ? (currentAudioData.size / 1024 / 1024).toFixed(1) : '0'}MB</span>
          {currentAudioData?.type === 'full' && generatedAudio.isChunked ? (
            <span className="text-blue-600">📚 {generatedAudio.totalChunks} parts</span>
          ) : currentAudioData?.type === 'chunk' ? (
            <span className="text-orange-600">📄 Часть {(currentAudioData.chunkIndex || 0) + 1}</span>
          ) : (
            <span className="text-green-600">✓ Ready</span>
          )}
        </div>
        
        {currentAudioData?.type === 'full' && generatedAudio.isChunked && (
          <div className="mt-1 text-xs text-blue-600">
            🎵 Полное аудио из {generatedAudio.totalChunks} частей ({generatedAudio.originalTextLength} chars)
          </div>
        )}
        
        {generatedAudio.wasTruncated && (
          <div className="mt-1 text-xs text-orange-600">
            ⚠ Текст был сокращен для обработки
          </div>
        )}

        {currentAudioData?.type === 'chunk' && (
          <div className="mt-1 text-xs text-orange-600">
            📄 Фрагмент {(currentAudioData.chunkIndex || 0) + 1} из {generatedAudio.totalChunks}
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;