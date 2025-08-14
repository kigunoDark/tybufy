import { useState, useRef, useEffect, useCallback } from "react";
import { MediaLibrary } from "../MediaLibrary";
import { Timeline } from "../Timeline/Timeline";
import FFmpegVideoExporter, { useFFmpegExporter } from "../FFmpegVideoExporter";

import {
  Play,
  Pause,
  Volume2,
  SkipBack,
  SkipForward,
  VolumeX,
  Film,
} from "lucide-react";

const VideoEditor = ({ mediaLibrary, setMediaLibrary }) => {
  const [timelineItems, setTimelineItems] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(60);
  const [selectedTimelineItem, setSelectedTimelineItem] = useState(null);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [activeTab, setActiveTab] = useState("videos");
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoSource, setCurrentVideoSource] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedTimelineItem, setDraggedTimelineItem] = useState(null);
  const [dropPreview, setDropPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTimelineDragging, setIsTimelineDragging] = useState(false);
  const [copiedItem, setCopiedItem] = useState(null);
  const { isExportModalOpen, openExportModal, closeExportModal } =
    useFFmpegExporter();

  const [isResizing, setIsResizing] = useState(false);

  // Состояния для управления overlays на видео
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [overlayTransforms, setOverlayTransforms] = useState({});
  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const [isResizingOverlay, setIsResizingOverlay] = useState(false);
  const [overlayDragStart, setOverlayDragStart] = useState({ x: 0, y: 0 });
  const [resizeOverlayHandle, setResizeOverlayHandle] = useState(null);
  const [initialOverlayTransform, setInitialOverlayTransform] = useState(null);

  // Модальное окно помощи
  const [showHelp, setShowHelp] = useState(false);

  // ✅ НОВОЕ: Состояние для умной функции добавления из Timeline
  const [smartAddFunction, setSmartAddFunction] = useState(null);

  // Треки
  const [tracks, setTracks] = useState({
    overlays: [
      { id: "overlay-1", name: "Overlay 1", type: "overlay" },
      { id: "overlay-2", name: "Overlay 2", type: "overlay" },
    ],
    main: [{ id: "main-video", name: "Main Video", type: "main" }],
    audio: [
      { id: "audio-1", name: "Audio 1", type: "audio" },
      { id: "audio-2", name: "Audio 2", type: "audio" },
    ],
  });

  const intervalRef = useRef(null);
  const audioElementsRef = useRef(new Map());
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return timelineZoom > 5
      ? `${mins}:${secs.toString().padStart(2, "0")}.${ms
          .toString()
          .padStart(2, "0")}`
      : `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = useCallback(
    (itemId, volumeDecimal) => {
      const clampedVolume = Math.max(0, Math.min(1, volumeDecimal));

      setTimelineItems((items) =>
        items.map((item) =>
          item.id === itemId ? { ...item, volume: clampedVolume } : item
        )
      );

      const audioElement = audioElementsRef.current.get(itemId);
      if (audioElement) {
        const finalVolume = clampedVolume * volume;
        audioElement.volume = finalVolume;
      }

      const item = timelineItems.find((t) => t.id === itemId);
      if (item && item.trackType === "main" && videoRef.current) {
        const finalVolume = clampedVolume * volume;
        videoRef.current.volume = finalVolume;
      }
    },
    
    [timelineItems, volume]
  );

  const seekTo = (time) => {
    const newTime = Math.max(0, Math.min(videoDuration, time));
    setCurrentTime(newTime);

    const content = getCurrentTimelineContent();
    content.audio.forEach((audioItem) => {
      const audioElement = createAudioElement(audioItem);
      const relativeTime = currentTime - audioItem.startTime;

      const itemVolume = audioItem.volume ?? 1;
      const safeItemVolume = itemVolume > 1 ? itemVolume / 100 : itemVolume;

      audioElement.volume = safeItemVolume * volume;
      audioElement.muted = isMuted;

      if (isPlaying && relativeTime >= 0) {
        syncAudioTime(audioItem, relativeTime);
        if (audioElement.paused) {
          audioElement.play().catch(console.error);
        }
      } else {
        if (!audioElement.paused) {
          audioElement.pause();
        }
      }
    });
  };

  const getCurrentTimelineContent = useCallback(() => {
    const currentItems = timelineItems.filter(
      (item) =>
        currentTime >= item.startTime &&
        currentTime < item.startTime + item.duration
    );

    return {
      mainVideo: currentItems.find(
        (item) => item.trackType === "main" && item.type === "videos"
      ),
      overlays: currentItems.filter((item) => item.trackType === "overlay"),
      audio: currentItems.filter((item) => item.trackType === "audio"),
    };
  }, [currentTime, timelineItems]);

  const createAudioElement = useCallback(
    (audioItem) => {
      if (!audioElementsRef.current.has(audioItem.id)) {
        const audio = document.createElement("audio");
        audio.src = audioItem.url;
        audio.volume = (audioItem.volume || 1) * volume;
        audio.muted = isMuted;
        audio.preload = "metadata";
        audioElementsRef.current.set(audioItem.id, audio);
      }
      return audioElementsRef.current.get(audioItem.id);
    },
    [volume, isMuted]
  );

  const syncAudioTime = useCallback((audioItem, relativeTime) => {
    const audioElement = audioElementsRef.current.get(audioItem.id);
    if (audioElement) {
      const timeDiff = Math.abs(audioElement.currentTime - relativeTime);
      if (timeDiff > 0.2) {
        audioElement.currentTime = Math.max(0, relativeTime);
      }
    }
  }, []);

  const insertWithRipple = useCallback(
    (trackId, insertTime, duration, excludeId = null) => {
      const trackItems = timelineItems
        .filter((item) => item.trackId === trackId && item.id !== excludeId)
        .sort((a, b) => a.startTime - b.startTime);

      if (trackItems.length === 0) {
        return {
          time: Math.max(0, insertTime),
          shouldRipple: false,
          affectedItems: [],
        };
      }

      let insertPosition = insertTime;
      let shouldRipple = false;
      let affectedItems = [];

      const blockAtPosition = trackItems.find(
        (item) =>
          insertTime >= item.startTime &&
          insertTime < item.startTime + item.duration
      );

      if (blockAtPosition) {
        insertPosition = blockAtPosition.startTime;
        shouldRipple = true;
        affectedItems = trackItems.filter(
          (item) => item.startTime >= insertPosition
        );
      } else {
        const blocksToShift = trackItems.filter(
          (item) => item.startTime >= insertTime
        );

        if (blocksToShift.length > 0) {
          const nextBlock = blocksToShift[0];
          const availableSpace = nextBlock.startTime - insertTime;

          if (availableSpace >= duration) {
            insertPosition = insertTime;
            shouldRipple = false;
          } else {
            insertPosition = insertTime;
            shouldRipple = true;
            affectedItems = blocksToShift;
          }
        } else {
          insertPosition = insertTime;
          shouldRipple = false;
        }
      }

      return {
        time: Math.max(0, insertPosition),
        shouldRipple,
        affectedItems,
        shiftAmount: shouldRipple ? duration : 0,
      };
    },
    [timelineItems]
  );

  const applyRippleEffect = useCallback(
    (affectedItems, shiftAmount) => {
      if (!affectedItems.length || shiftAmount <= 0) return;

      setTimelineItems((prev) =>
        prev.map((item) => {
          const affectedItem = affectedItems.find(
            (affected) => affected.id === item.id
          );
          if (affectedItem) {
            return {
              ...item,
              startTime: item.startTime + shiftAmount,
            };
          }
          return item;
        })
      );

      if (affectedItems.length > 0) {
        const maxEndTime = Math.max(
          ...affectedItems.map(
            (item) => item.startTime + item.duration + shiftAmount
          )
        );
        if (maxEndTime > videoDuration) {
          setVideoDuration(maxEndTime + 10);
        }
      }
    },
    [videoDuration]
  );

  const removeFromTimeline = (itemId) => {
    const audioElement = audioElementsRef.current.get(itemId);
    if (audioElement) {
      audioElement.pause();
      audioElement.src = "";
      audioElementsRef.current.delete(itemId);
    }

    setTimelineItems((prev) => prev.filter((item) => item.id !== itemId));
    setSelectedTimelineItem(null);
  };

  const getOverlayTransform = useCallback(
    (overlayId) => {
      return (
        overlayTransforms[overlayId] || { x: 0, y: 0, scale: 1, opacity: 1 }
      );
    },
    [overlayTransforms]
  );

  const updateOverlayTransform = useCallback(
    (overlayId, updates) => {
      setOverlayTransforms((prev) => ({
        ...prev,
        [overlayId]: { ...getOverlayTransform(overlayId), ...updates },
      }));
    },
    [getOverlayTransform]
  );

  const handleOpacityChange = useCallback(
    (itemId, opacityDecimal) => {
      const clampedOpacity = Math.max(0, Math.min(1, opacityDecimal));

      setTimelineItems((items) =>
        items.map((item) =>
          item.id === itemId ? { ...item, opacity: clampedOpacity } : item
        )
      );

      updateOverlayTransform(itemId, { opacity: clampedOpacity });
    },
    [timelineItems, updateOverlayTransform]
  );

  const handleOverlayMouseDown = useCallback((e, overlay) => {
    if (e.target.closest(".resize-handle")) return;

    e.preventDefault();
    e.stopPropagation();

    setSelectedOverlay(overlay);
    setIsDraggingOverlay(true);

    const container = videoContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const overlayElement = e.currentTarget;
    const overlayRect = overlayElement.getBoundingClientRect();

    setOverlayDragStart({
      x: e.clientX - overlayRect.left,
      y: e.clientY - overlayRect.top,
      containerX: containerRect.left,
      containerY: containerRect.top,
    });
  }, []);

  const handleOverlayResizeStart = useCallback(
    (e, overlay, handle) => {
      e.preventDefault();
      e.stopPropagation();

      setSelectedOverlay(overlay);
      setIsResizingOverlay(true);
      setResizeOverlayHandle(handle);

      const currentTransform = getOverlayTransform(overlay.id);
      setInitialOverlayTransform(currentTransform);

      setOverlayDragStart({
        x: e.clientX,
        y: e.clientY,
        startScale: currentTransform.scale,
        startX: currentTransform.x,
        startY: currentTransform.y,
      });
    },
    [getOverlayTransform]
  );

  const handleOverlayMouseMove = useCallback(
    (e) => {
      if (!selectedOverlay) return;

      if (isDraggingOverlay) {
        const container = videoContainerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const overlaySize = 128 * getOverlayTransform(selectedOverlay.id).scale;

        const newX =
          e.clientX - overlayDragStart.containerX - overlayDragStart.x;
        const newY =
          e.clientY - overlayDragStart.containerY - overlayDragStart.y;

        const padding = 5;
        const limitedX = Math.max(
          padding,
          Math.min(rect.width - overlaySize - padding, newX)
        );
        const limitedY = Math.max(
          padding,
          Math.min(rect.height - overlaySize - padding, newY)
        );

        const baseX = 200;
        const baseY = 50 + selectedOverlay.index * 120;

        updateOverlayTransform(selectedOverlay.id, {
          x: limitedX - baseX,
          y: limitedY - baseY,
        });
      } else if (
        isResizingOverlay &&
        overlayDragStart.startScale !== undefined &&
        resizeOverlayHandle
      ) {
        const deltaX = e.clientX - overlayDragStart.x;
        const deltaY = e.clientY - overlayDragStart.y;

        let scaleFactor = 1;
        const sensitivity = 0.005;

        switch (resizeOverlayHandle) {
          case "nw":
            scaleFactor = 1 - (deltaX + deltaY) * sensitivity;
            break;
          case "ne":
            scaleFactor = 1 + (deltaX - deltaY) * sensitivity;
            break;
          case "sw":
            scaleFactor = 1 + (-deltaX + deltaY) * sensitivity;
            break;
          case "se":
            scaleFactor = 1 + (deltaX + deltaY) * sensitivity;
            break;
          default:
            break;
        }

        const newScale = Math.max(
          0.2,
          Math.min(4, overlayDragStart.startScale * scaleFactor)
        );

        updateOverlayTransform(selectedOverlay.id, {
          scale: newScale,
        });
      }
    },
    [
      selectedOverlay,
      isDraggingOverlay,
      isResizingOverlay,
      overlayDragStart,
      updateOverlayTransform,
      getOverlayTransform,
      resizeOverlayHandle,
    ]
  );

  const handleOverlayMouseUp = useCallback(() => {
    setIsDraggingOverlay(false);
    setIsResizingOverlay(false);
    setResizeOverlayHandle(null);
    setInitialOverlayTransform(null);
  }, []);

  const handleOverlayWheel = useCallback(
    (e, overlayId) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      e.stopPropagation();

      const transform = getOverlayTransform(overlayId);
      const scaleDelta = e.deltaY > 0 ? -0.05 : 0.05;
      const newScale = Math.max(0.2, Math.min(4, transform.scale + scaleDelta));

      updateOverlayTransform(overlayId, { scale: newScale });
    },
    [getOverlayTransform, updateOverlayTransform]
  );

  const splitTimelineItem = useCallback(() => {
    if (!selectedTimelineItem) return;

    const item = selectedTimelineItem;
    const splitTime = currentTime;

    if (
      splitTime <= item.startTime ||
      splitTime >= item.startTime + item.duration
    ) {
      return;
    }

    const firstPartDuration = splitTime - item.startTime;
    const secondPartStart = splitTime;
    const secondPartDuration = item.duration - firstPartDuration;

    const secondPart = {
      ...item,
      id: Date.now() + Math.random(),
      startTime: secondPartStart,
      duration: secondPartDuration,
    };

    const updatedFirstPart = {
      ...item,
      duration: firstPartDuration,
    };

    setTimelineItems((prev) =>
      prev
        .map((timelineItem) =>
          timelineItem.id === item.id ? updatedFirstPart : timelineItem
        )
        .concat(secondPart)
    );

    setSelectedTimelineItem(null);
  }, [selectedTimelineItem, currentTime]);

  const copyTimelineItem = useCallback(() => {
    if (!selectedTimelineItem) return;
    setCopiedItem(selectedTimelineItem);
  }, [selectedTimelineItem]);

  const pasteTimelineItem = useCallback(() => {
    if (!copiedItem) return;

    const targetTrackId = copiedItem.trackId;
    const insertResult = insertWithRipple(
      targetTrackId,
      currentTime,
      copiedItem.duration
    );

    if (insertResult.shouldRipple && insertResult.affectedItems?.length > 0) {
      applyRippleEffect(insertResult.affectedItems, copiedItem.duration);
    }

    const newItem = {
      ...copiedItem,
      id: Date.now() + Math.random(),
      startTime: insertResult.time,
    };

    setTimelineItems((prev) => [...prev, newItem]);

    const newEndTime = newItem.startTime + newItem.duration;
    if (newEndTime > videoDuration) {
      setVideoDuration(newEndTime + 10);
    }

    setSelectedTimelineItem(newItem);
  }, [
    copiedItem,
    currentTime,
    insertWithRipple,
    applyRippleEffect,
    videoDuration,
  ]);

  const deleteSelectedItem = useCallback(() => {
    if (!selectedTimelineItem) return;
    removeFromTimeline(selectedTimelineItem.id);
  }, [selectedTimelineItem]);

  const addToTimeline = useCallback(
    (mediaItem, startTime = null, targetTrackId = null) => {
      if (!mediaItem || !mediaItem.name || !mediaItem.type) {
        return;
      }
      let trackId, trackType;

      if (mediaItem.type === "videos" || mediaItem.type === "video") {
        trackId = "main-video";
        trackType = "main";
      } else if (mediaItem.type === "images" || mediaItem.type === "image") {
        trackId = "overlay-1";
        trackType = "overlay";
      } else if (mediaItem.type === "audios" || mediaItem.type === "audio") {
        trackId = "audio-1";
        trackType = "audio";
      } else {
        return;
      }

      const duration =
        mediaItem.duration || (mediaItem.type.includes("image") ? 5 : 10);

      setTimelineItems((prevItems) => {
        const trackItems = prevItems
          .filter((item) => item.trackId === trackId)
          .sort((a, b) => a.startTime - b.startTime);

        let newStartTime;
        if (startTime !== null) {
          newStartTime = startTime;
        } else if (trackItems.length === 0) {
          newStartTime = 0;
        } else {
          const lastItem = trackItems[trackItems.length - 1];
          newStartTime = lastItem.startTime + lastItem.duration;
        }
        const newTimelineItem = {
          id: Date.now() + Math.random(),
          mediaId: mediaItem.id,
          type: mediaItem.type,
          name: mediaItem.name,
          url: mediaItem.url,
          startTime: newStartTime,
          duration: duration,
          trackId: trackId,
          trackType: trackType,
          volume: 1,
          opacity: 1,
        };

        return [...prevItems, newTimelineItem];
      });

      const estimatedEndTime = (startTime || 0) + duration;
      if (estimatedEndTime > videoDuration) {
        setVideoDuration(estimatedEndTime + 10);
      }
    },
    [videoDuration]
  );

  const handleMediaLibraryClick = (item) => {
    if (!item || !item.name || !item.type) {
      return;
    }

    if (smartAddFunction) {
      smartAddFunction(item);
    } else {
      addToTimeline(item);
    }
  };

  useEffect(() => {
    if (isDraggingOverlay || isResizingOverlay) {
      document.addEventListener("mousemove", handleOverlayMouseMove);
      document.addEventListener("mouseup", handleOverlayMouseUp);
      document.body.style.cursor = isDraggingOverlay ? "grabbing" : "nw-resize";

      return () => {
        document.removeEventListener("mousemove", handleOverlayMouseMove);
        document.removeEventListener("mouseup", handleOverlayMouseUp);
        document.body.style.cursor = "";
      };
    }
  }, [
    isDraggingOverlay,
    isResizingOverlay,
    handleOverlayMouseMove,
    handleOverlayMouseUp,
  ]);

  useEffect(() => {
    const content = getCurrentTimelineContent();

    if (content.mainVideo && content.mainVideo.url !== currentVideoSource) {
      setCurrentVideoSource(content.mainVideo.url);
      if (videoRef.current) {
        const relativeTime = currentTime - content.mainVideo.startTime;
        videoRef.current.currentTime = Math.max(0, relativeTime);
      }
    } else if (
      !content.mainVideo &&
      content.overlays.find((o) => o.type === "image")
    ) {
      const firstImage = content.overlays.find((o) => o.type === "image");
      setCurrentVideoSource(firstImage.url);
    } else if (
      !content.mainVideo &&
      !content.overlays.find((o) => o.type === "image")
    ) {
      setCurrentVideoSource(null);
    }

    const currentAudioIds = new Set(content.audio.map((item) => item.id));

    audioElementsRef.current.forEach((audioElement, id) => {
      if (!currentAudioIds.has(id)) {
        if (!audioElement.paused) {
          audioElement.pause();
        }
      }
    });

    content.audio.forEach((audioItem) => {
      const audioElement = createAudioElement(audioItem);
      const relativeTime = currentTime - audioItem.startTime;

      audioElement.volume = (audioItem.volume || 1) * volume;
      audioElement.muted = isMuted;

      if (isPlaying && relativeTime >= 0) {
        syncAudioTime(audioItem, relativeTime);
        if (audioElement.paused) {
          audioElement.play().catch(console.error);
        }
      } else {
        if (!audioElement.paused) {
          audioElement.pause();
        }
      }
    });
  }, [
    currentTime,
    timelineItems,
    getCurrentTimelineContent,
    isPlaying,
    volume,
    isMuted,
    createAudioElement,
    syncAudioTime,
    currentVideoSource,
  ]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 0.1;
          if (newTime >= videoDuration) {
            setIsPlaying(false);
            return videoDuration;
          }
          return newTime;
        });
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, videoDuration]);

  useEffect(() => {
    if (videoRef.current && currentVideoSource) {
      const content = getCurrentTimelineContent();
      if (content.mainVideo) {
        const relativeTime = currentTime - content.mainVideo.startTime;
        const timeDiff = Math.abs(videoRef.current.currentTime - relativeTime);

        if (timeDiff > 0.5) {
          videoRef.current.currentTime = Math.max(0, relativeTime);
        }

        if (isPlaying && videoRef.current.paused) {
          videoRef.current.play().catch(console.error);
        } else if (!isPlaying && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      }
    }
  }, [currentTime, currentVideoSource, getCurrentTimelineContent, isPlaying]);

  useEffect(() => {
    const currentAudioIds = new Set(
      timelineItems
        .filter((item) => item.type === "audio")
        .map((item) => item.id)
    );

    audioElementsRef.current.forEach((audioElement, id) => {
      if (!currentAudioIds.has(id)) {
        audioElement.pause();
        audioElement.src = "";
        audioElementsRef.current.delete(id);
      }
    });
  }, [timelineItems]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelectedItem();
      }

      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        splitTimelineItem();
      }

      if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        copyTimelineItem();
      }

      if (e.ctrlKey && e.key === "v") {
        e.preventDefault();
        pasteTimelineItem();
      }

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const step = e.ctrlKey ? 5 : e.shiftKey ? 1 : 0.1;
        seekTo(Math.max(0, currentTime - step));
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const step = e.ctrlKey ? 5 : e.shiftKey ? 1 : 0.1;
        seekTo(Math.min(videoDuration, currentTime + step));
      }

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowHelp(true);
      }

      if (e.key === "Escape") {
        e.preventDefault();
        if (showHelp) {
          setShowHelp(false);
        } else if (selectedOverlay) {
          setSelectedOverlay(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedTimelineItem,
    copiedItem,
    currentTime,
    videoDuration,
    showHelp,
    selectedOverlay,
    deleteSelectedItem,
    splitTimelineItem,
    copyTimelineItem,
    pasteTimelineItem,
    seekTo,
  ]);

  return (
    <div className="flex h-screen w-full gap-4 p-4 bg-gray-100 overflow-hidden">
      <MediaLibrary
        mediaLibrary={mediaLibrary}
        setMediaLibrary={setMediaLibrary}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        draggedItem={draggedItem}
        setDraggedItem={setDraggedItem}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        addToTimeline={handleMediaLibraryClick}
        formatTime={formatTime}
      />

      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
        <div
          ref={videoContainerRef}
          className="flex-1 bg-black rounded-2xl relative overflow-hidden shadow-sm min-h-0"
          title="Video Preview - Click overlays to select, drag to move, Ctrl+scroll to resize, use opacity slider"
        >
          {currentVideoSource ? (
            <div
              className="relative w-full h-full"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedOverlay(null);
                }
              }}
            >
              {getCurrentTimelineContent().mainVideo ? (
                <video
                  ref={videoRef}
                  src={currentVideoSource}
                  className="w-full h-full object-contain rounded-2xl"
                  muted={isMuted}
                />
              ) : (
                <img
                  src={currentVideoSource}
                  alt="Timeline content"
                  className="w-full h-full object-contain rounded-2xl"
                />
              )}

              {getCurrentTimelineContent().overlays.map((item, index) => {
                const transform = getOverlayTransform(item.id);
                const isSelected = selectedOverlay?.id === item.id;
                const isDraggingThis = isDraggingOverlay && isSelected;
                const isResizingThis = isResizingOverlay && isSelected;

                return (
                  <div
                    key={item.id}
                    className={`absolute select-none ${
                      isSelected
                        ? "ring-2 ring-blue-400 ring-opacity-75 shadow-xl"
                        : "hover:ring-2 hover:ring-blue-300 hover:ring-opacity-50"
                    } ${
                      isDraggingThis
                        ? "cursor-grabbing z-50"
                        : isResizingThis
                        ? "cursor-nw-resize"
                        : "cursor-grab hover:shadow-lg"
                    }`}
                    style={{
                      left: `${200 + transform.x}px`,
                      top: `${50 + index * 120 + transform.y}px`,
                      width: `${128 * transform.scale}px`,
                      height: `${96 * transform.scale}px`,
                      opacity: transform.opacity,
                      zIndex: isSelected ? 1000 : 10 + index,
                      transform: isDraggingThis ? "scale(1.02)" : "scale(1)",
                      transition:
                        isDraggingThis || isResizingThis
                          ? "none"
                          : "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onMouseDown={(e) =>
                      handleOverlayMouseDown(e, { ...item, index })
                    }
                    onWheel={(e) => handleOverlayWheel(e, item.id)}
                  >
                    <div
                      className={`relative w-full h-full border-2 rounded-lg overflow-hidden shadow-lg group ${
                        isSelected
                          ? "border-blue-400"
                          : "border-white hover:border-blue-300"
                      }`}
                      style={{
                        transition:
                          isDraggingThis || isResizingThis
                            ? "none"
                            : "border-color 0.2s ease",
                      }}
                    >
                      {item.type === "video" ? (
                        <video
                          src={item.url}
                          className="w-full h-full object-cover pointer-events-none"
                          muted
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover pointer-events-none"
                          draggable={false}
                        />
                      )}

                      <div
                        className={`absolute inset-0 bg-blue-500 bg-opacity-0 hover:bg-opacity-10 ${
                          isSelected ? "bg-opacity-10" : ""
                        }`}
                        style={{
                          transition:
                            isDraggingThis || isResizingThis
                              ? "none"
                              : "background-color 0.2s ease",
                        }}
                      ></div>

                      {isSelected && (
                        <>
                          {/* Resize handles */}
                          <div
                            className={`resize-handle absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full cursor-nw-resize opacity-90 hover:opacity-100 hover:scale-125 shadow-md border-2 border-white ${
                              isResizingThis && resizeOverlayHandle === "nw"
                                ? "scale-150 bg-red-500"
                                : ""
                            }`}
                            onMouseDown={(e) =>
                              handleOverlayResizeStart(e, item, "nw")
                            }
                            style={{
                              transition:
                                isDraggingThis || isResizingThis
                                  ? "none"
                                  : "all 0.2s ease",
                            }}
                          ></div>
                          <div
                            className={`resize-handle absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-ne-resize opacity-90 hover:opacity-100 hover:scale-125 shadow-md border-2 border-white ${
                              isResizingThis && resizeOverlayHandle === "ne"
                                ? "scale-150 bg-red-500"
                                : ""
                            }`}
                            onMouseDown={(e) =>
                              handleOverlayResizeStart(e, item, "ne")
                            }
                            style={{
                              transition:
                                isDraggingThis || isResizingThis
                                  ? "none"
                                  : "all 0.2s ease",
                            }}
                          ></div>
                          <div
                            className={`resize-handle absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full cursor-sw-resize opacity-90 hover:opacity-100 hover:scale-125 shadow-md border-2 border-white ${
                              isResizingThis && resizeOverlayHandle === "sw"
                                ? "scale-150 bg-red-500"
                                : ""
                            }`}
                            onMouseDown={(e) =>
                              handleOverlayResizeStart(e, item, "sw")
                            }
                            style={{
                              transition:
                                isDraggingThis || isResizingThis
                                  ? "none"
                                  : "all 0.2s ease",
                            }}
                          ></div>
                          <div
                            className={`resize-handle absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize opacity-90 hover:opacity-100 hover:scale-125 shadow-md border-2 border-white ${
                              isResizingThis && resizeOverlayHandle === "se"
                                ? "scale-150 bg-red-500"
                                : ""
                            }`}
                            onMouseDown={(e) =>
                              handleOverlayResizeStart(e, item, "se")
                            }
                            style={{
                              transition:
                                isDraggingThis || isResizingThis
                                  ? "none"
                                  : "all 0.2s ease",
                            }}
                          ></div>

                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-60 pointer-events-none"></div>

                          {/* Opacity slider */}
                          <div className="absolute -bottom-12 left-0 right-0 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20 shadow-lg">
                            <div className="flex items-center space-x-2">
                              <span className="text-white text-xs font-medium min-w-fit">
                                Opacity:
                              </span>
                              <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.05"
                                value={transform.opacity}
                                onChange={(e) =>
                                  updateOverlayTransform(item.id, {
                                    opacity: parseFloat(e.target.value),
                                  })
                                }
                                className="flex-1 h-2 accent-blue-500 cursor-pointer"
                                onMouseDown={(e) => e.stopPropagation()}
                              />
                              <span className="text-white text-xs min-w-8 text-right font-mono">
                                {Math.round(transform.opacity * 100)}%
                              </span>
                            </div>
                          </div>
                        </>
                      )}

                      <div
                        className={`absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none ${
                          isSelected
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                        style={{
                          transition:
                            isDraggingThis || isResizingThis
                              ? "none"
                              : "opacity 0.2s ease",
                        }}
                      >
                        {item.name} • {Math.round(transform.scale * 100)}% •{" "}
                        {Math.round(transform.opacity * 100)}%
                      </div>

                      {isSelected && (
                        <div className="absolute -top-0.5 -left-0.5 -right-0.5 -bottom-0.5 border-2 border-blue-400 rounded-lg pointer-events-none animate-pulse"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Film size={40} className="opacity-50" />
                </div>
                <p className="text-xl opacity-75 font-medium">
                  No content at current time
                </p>
                <p className="text-sm opacity-50 mb-4">
                  Drag media to timeline tracks to start editing
                </p>
                <div className="text-xs opacity-40 space-y-1">
                  <p>💡 Overlays are interactive • Ripple mode enabled</p>
                  <p>
                    Press{" "}
                    <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">
                      ?
                    </kbd>{" "}
                    for help & shortcuts
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-md rounded-2xl p-4">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => seekTo(Math.max(0, currentTime - 10))}
                className="text-white hover:text-blue-400 transition-colors p-1 rounded-lg hover:bg-white/10"
                title="Skip back 10 seconds"
              >
                <SkipBack size={20} />
              </button>
              <button
                onClick={handlePlayPause}
                className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center text-white transition-all hover:scale-105"
                title="Play/Pause (Space)"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button
                onClick={() =>
                  seekTo(Math.min(videoDuration, currentTime + 10))
                }
                className="text-white hover:text-blue-400 transition-colors p-1 rounded-lg hover:bg-white/10"
                title="Skip forward 10 seconds"
              >
                <SkipForward size={20} />
              </button>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:text-blue-400 transition-colors p-1 rounded-lg hover:bg-white/10"
                  title="Toggle mute"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 accent-blue-500"
                  title="Volume control"
                />
              </div>
              <span
                className="text-white text-sm font-medium min-w-0"
                title="Current time / Total duration"
              >
                {formatTime(currentTime)} / {formatTime(videoDuration)}
              </span>
            </div>
          </div>
        </div>

        <Timeline
          handleVolumeChange={handleVolumeChange}
          timelineItems={timelineItems}
          setTimelineItems={setTimelineItems}
          setShowExportModal={openExportModal}
          currentTime={currentTime}
          videoDuration={videoDuration}
          setVideoDuration={setVideoDuration}
          selectedTimelineItem={selectedTimelineItem}
          setSelectedTimelineItem={setSelectedTimelineItem}
          timelineZoom={timelineZoom}
          setTimelineZoom={setTimelineZoom}
          tracks={tracks}
          setTracks={setTracks}
          draggedItem={draggedItem}
          draggedTimelineItem={draggedTimelineItem}
          setDraggedTimelineItem={setDraggedTimelineItem}
          dropPreview={dropPreview}
          setDropPreview={setDropPreview}
          isDragging={isDragging}
          isTimelineDragging={isTimelineDragging}
          setIsTimelineDragging={setIsTimelineDragging}
          isResizing={isResizing}
          setIsResizing={setIsResizing}
          copiedItem={copiedItem}
          formatTime={formatTime}
          seekTo={seekTo}
          splitTimelineItem={splitTimelineItem}
          copyTimelineItem={copyTimelineItem}
          pasteTimelineItem={pasteTimelineItem}
          deleteSelectedItem={deleteSelectedItem}
          addToTimeline={addToTimeline}
          insertWithRipple={insertWithRipple}
          applyRippleEffect={applyRippleEffect}
          removeFromTimeline={removeFromTimeline}
          onVolumeChange={handleVolumeChange}
          onOpacityChange={handleOpacityChange}
          onSmartAddToTimeline={(func) => {
            setSmartAddFunction(() => func);
          }}
        />
      </div>

      <FFmpegVideoExporter
        isOpen={isExportModalOpen}
        onClose={closeExportModal}
        timelineItems={timelineItems}
        tracks={tracks}
        videoDuration={videoDuration}
        overlayTransforms={overlayTransforms} 
      />
    </div>
  );
};

export default VideoEditor;
