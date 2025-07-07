import { useState, useRef, useEffect, useCallback } from "react";
import { HelpButtonWithTooltip } from "./HelpButtonWithTooltip";
import {
  Video,
  Music,
  Copy,
  Trash2,
  Scissors,
  Film,
  Plus,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

export const Timeline = ({
  timelineItems,
  setTimelineItems,
  currentTime,
  videoDuration,
  setVideoDuration,
  selectedTimelineItem,
  setSelectedTimelineItem,
  timelineZoom,
  setTimelineZoom,
  tracks,
  setTracks,
  draggedItem,
  draggedTimelineItem,
  setDraggedTimelineItem,
  dropPreview,
  setDropPreview,
  isDragging,
  isTimelineDragging,
  setIsTimelineDragging,
  isResizing,
  setIsResizing,
  copiedItem,
  formatTime,
  seekTo,
  splitTimelineItem,
  copyTimelineItem,
  pasteTimelineItem,
  deleteSelectedItem,
  addToTimeline,
  insertWithRipple,
  applyRippleEffect,
  removeFromTimeline,
  // Добавляем новую функцию для передачи наружу
  onSmartAddToTimeline,
}) => {
  const timelineRef = useRef(null);
  const timelineScrollRef = useRef(null);
  const trackLabelsRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);

  // Timeline-specific states
  const [dragOffset, setDragOffset] = useState(0);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [resizeItem, setResizeItem] = useState(null);
  const [originalItemData, setOriginalItemData] = useState(null);

  // Автопрокрутка
  const stopAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(
    (direction, speed = 1) => {
      stopAutoScroll();

      autoScrollIntervalRef.current = setInterval(() => {
        if (timelineScrollRef.current) {
          const scrollAmount = 15 * speed;
          const currentScrollLeft = timelineScrollRef.current.scrollLeft;
          const maxScroll =
            timelineScrollRef.current.scrollWidth -
            timelineScrollRef.current.clientWidth;

          if (direction === "left" && currentScrollLeft > 0) {
            timelineScrollRef.current.scrollLeft = Math.max(
              0,
              currentScrollLeft - scrollAmount
            );
          } else if (direction === "right" && currentScrollLeft < maxScroll) {
            timelineScrollRef.current.scrollLeft = Math.min(
              maxScroll,
              currentScrollLeft + scrollAmount
            );
          }
        }
      }, 16);
    },
    [stopAutoScroll]
  );

  const checkAutoScroll = useCallback(
    (clientX) => {
      if (!timelineScrollRef.current) return;

      const rect = timelineScrollRef.current.getBoundingClientRect();
      const scrollZoneWidth = 120;
      const relativeX = clientX - rect.left;

      if (
        relativeX < scrollZoneWidth &&
        timelineScrollRef.current.scrollLeft > 0
      ) {
        const speed = ((scrollZoneWidth - relativeX) / scrollZoneWidth) * 3;
        startAutoScroll("left", speed);
      } else if (relativeX > rect.width - scrollZoneWidth) {
        const maxScroll =
          timelineScrollRef.current.scrollWidth -
          timelineScrollRef.current.clientWidth;
        if (timelineScrollRef.current.scrollLeft < maxScroll) {
          const speed =
            ((relativeX - (rect.width - scrollZoneWidth)) / scrollZoneWidth) *
            3;
          startAutoScroll("right", speed);
        }
      } else {
        stopAutoScroll();
      }
    },
    [startAutoScroll, stopAutoScroll]
  );

  const getTargetTrackForType = useCallback(
    (mediaType) => {
      switch (mediaType) {
        case "videos":
          const mainTrack = tracks.main?.[0];
          return mainTrack?.id;
        case "audios":
          const audioTrack = tracks.audio?.[0];
          return audioTrack?.id;
        case "images":
          const overlayTrack = tracks.overlays?.[0];
          return overlayTrack?.id
          ;
        default:
          return tracks.main?.[0]?.id;
      }
    },
    [tracks]
  );

  const addToTimelineAtCurrentTime = useCallback(() => {
    if (!draggedItem) return;

    const targetTrackId = getTargetTrackForType(draggedItem.type);
    if (!targetTrackId) return;

    const bestPosition = findBestPositionForItem(draggedItem, targetTrackId);
    addToTimeline(draggedItem, bestPosition, targetTrackId);
  }, [draggedItem, getTargetTrackForType, addToTimeline]);

  const findBestPositionForItem = useCallback(
    (item, targetTrackId) => {
      const duration = item.duration || (item.type === "image" ? 5 : 10);

      const itemsOnTrack = timelineItems
        .filter((timelineItem) => timelineItem.trackId === targetTrackId)
        .sort((a, b) => a.startTime - b.startTime);

      if (itemsOnTrack.length === 0) {
        return currentTime;
      }

      const hasSpaceAtCurrentTime = !itemsOnTrack.some((existingItem) => {
        const existingStart = existingItem.startTime;
        const existingEnd = existingItem.startTime + existingItem.duration;
        const newStart = currentTime;
        const newEnd = currentTime + duration;
        return !(newEnd <= existingStart || newStart >= existingEnd);
      });

      if (hasSpaceAtCurrentTime) {
        return currentTime;
      }

      const lastItem = itemsOnTrack[itemsOnTrack.length - 1];
      return lastItem.startTime + lastItem.duration;
    },
    [timelineItems, currentTime]
  );

  const handleWheel = useCallback(
    (e) => {
      if (e.ctrlKey) {
 
        e.preventDefault();

        if (!timelineScrollRef.current) return;

        const rect = timelineScrollRef.current.getBoundingClientRect();
        const mouseX =
          e.clientX - rect.left + timelineScrollRef.current.scrollLeft;
        const currentPixelsPerSecond = 50 * timelineZoom;
        const timeAtMouse = mouseX / currentPixelsPerSecond;

        const zoomDirection = e.deltaY < 0 ? 1 : -1;
        const zoomStep = 1.2;

        setTimelineZoom((prevZoom) => {
          let newZoom;
          if (zoomDirection > 0) {
            newZoom = Math.min(20, prevZoom * zoomStep);
          } else {
            newZoom = Math.max(0.1, prevZoom / zoomStep);
          }

          requestAnimationFrame(() => {
            if (timelineScrollRef.current) {
              const newPixelsPerSecond = 50 * newZoom;
              const newMouseX = timeAtMouse * newPixelsPerSecond;
              const targetScrollLeft = newMouseX - (e.clientX - rect.left);
              timelineScrollRef.current.scrollLeft = Math.max(
                0,
                targetScrollLeft
              );
            }
          });

          return newZoom;
        });
      } else if (e.shiftKey) {
        // Shift + колесо = горизонтальная прокрутка
        e.preventDefault();

        if (timelineScrollRef.current) {
          const scrollAmount = e.deltaY * 2;
          timelineScrollRef.current.scrollLeft += scrollAmount;
        }
      }
    },
    [timelineZoom, setTimelineZoom]
  );

  // Функции зума
  const zoomIn = () => {
    setTimelineZoom((prev) => Math.min(20, prev * 1.5));
  };

  const zoomOut = () => {
    setTimelineZoom((prev) => Math.max(0.1, prev / 1.5));
  };

  const resetZoom = () => {
    setTimelineZoom(1);
  };

  // Функции для resize
  const handleResizeStart = useCallback(
    (e, item, handle) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setResizeHandle(handle);
      setResizeItem(item);
      setOriginalItemData({
        startTime: item.startTime,
        duration: item.duration,
      });

      setIsTimelineDragging(false);
      setDraggedTimelineItem(null);
    },
    [setIsResizing, setIsTimelineDragging, setDraggedTimelineItem]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
    setResizeItem(null);
    setOriginalItemData(null);
    stopAutoScroll();
  }, [setIsResizing, stopAutoScroll]);

  // Добавление треков
  const addOverlayTrack = () => {
    const newTrackId = `overlay-${Date.now()}`;
    setTracks((prev) => ({
      ...prev,
      overlays: [
        ...prev.overlays,
        {
          id: newTrackId,
          name: `Overlay ${prev.overlays.length + 1}`,
          type: "overlay",
        },
      ],
    }));
  };

  const addAudioTrack = () => {
    const newTrackId = `audio-${Date.now()}`;
    setTracks((prev) => ({
      ...prev,
      audio: [
        ...prev.audio,
        {
          id: newTrackId,
          name: `Audio ${prev.audio.length + 1}`,
          type: "audio",
        },
      ],
    }));
  };

  // Синхронизация скролла
  const handleTrackAreaScroll = (e) => {
    if (trackLabelsRef.current) {
      trackLabelsRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const handleTrackLabelsScroll = (e) => {
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const getTimelineWidth = () => {
    const baseWidth = videoDuration * 50 * timelineZoom;
    return Math.max(baseWidth, 2000);
  };

  const getPixelsPerSecond = () => {
    return 50 * timelineZoom;
  };

  // Обработчики событий
  const handleTimelineClick = (e) => {
    if (isDragging || isTimelineDragging || isResizing) return;

    const rect = timelineScrollRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + timelineScrollRef.current.scrollLeft;
    const pixelsPerSecond = getPixelsPerSecond();
    const clickTime = clickX / pixelsPerSecond;
    seekTo(clickTime);
  };

  const handleTimelineDoubleClick = useCallback(
    (e) => {
      if (isDragging || isTimelineDragging || isResizing || !draggedItem)
        return;

      const rect = timelineScrollRef.current.getBoundingClientRect();
      const clickX =
        e.clientX - rect.left + timelineScrollRef.current.scrollLeft;
      const pixelsPerSecond = getPixelsPerSecond();
      const clickTime = clickX / pixelsPerSecond;

      const targetTrackId = getTargetTrackForType(draggedItem.type);
      if (targetTrackId) {
        // Используем точную позицию клика для двойного клика
        addToTimeline(draggedItem, clickTime, targetTrackId);
      }
    },
    [
      isDragging,
      isTimelineDragging,
      isResizing,
      draggedItem,
      getTargetTrackForType,
      addToTimeline,
    ]
  );

  // Умная функция добавления на правильную дорожку (для использования в MediaLibrary)
  const smartAddToTimeline = useCallback(
    (item, specifiedTime = null, specifiedTrackId = null) => {
      console.log(
        `Умное добавление элемента "${item.name}" типа "${item.type}"`
      );

      // Если указаны конкретные параметры, используем их
      if (specifiedTime !== null && specifiedTrackId !== null) {
        console.log(
          `Используем указанные параметры: время=${specifiedTime}, дорожка=${specifiedTrackId}`
        );
        addToTimeline(item, specifiedTime, specifiedTrackId);
        return;
      }

      // Иначе используем умную логику
      const targetTrackId =
        specifiedTrackId || getTargetTrackForType(item.type);
      if (!targetTrackId) {
        console.error(`Не найдена подходящая дорожка для типа ${item.type}`);
        return;
      }

      const bestPosition =
        specifiedTime !== null
          ? specifiedTime
          : findBestPositionForItem(item, targetTrackId);
      console.log(
        `Добавляем "${item.name}" на дорожку ${targetTrackId} в позицию ${bestPosition}`
      );

      // Находим название дорожки для отладки
      const targetTrack = [
        ...tracks.overlays,
        ...tracks.main,
        ...tracks.audio,
      ].find((track) => track.id === targetTrackId);
      console.log(`Дорожка найдена:`, targetTrack);

      addToTimeline(item, bestPosition, targetTrackId);
    },
    [addToTimeline, getTargetTrackForType, findBestPositionForItem, tracks]
  );

  const handleTimelineItemDragStart = (e, timelineItem) => {
    if (isResizing) {
      e.preventDefault();
      return;
    }

    e.stopPropagation();
    setDraggedTimelineItem(timelineItem);
    setIsTimelineDragging(true);

    const rect = timelineScrollRef.current.getBoundingClientRect();
    const itemRect = e.target.getBoundingClientRect();
    setDragOffset(
      e.clientX - itemRect.left + timelineScrollRef.current.scrollLeft
    );

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
  };

  const handleTimelineItemDragEnd = () => {
    setDraggedTimelineItem(null);
    setDropPreview(null);
    setIsTimelineDragging(false);
    setDragOffset(0);
    stopAutoScroll();
  };

  const handleDragOver = (e) => {
    if (!draggedItem && !draggedTimelineItem) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = draggedItem ? "copy" : "move";

    if (draggedTimelineItem || isResizing) {
      checkAutoScroll(e.clientX);
    }

    const timelineRect = timelineScrollRef.current.getBoundingClientRect();
    const dragX =
      e.clientX -
      timelineRect.left +
      timelineScrollRef.current.scrollLeft -
      (draggedTimelineItem ? dragOffset : 0);
    const pixelsPerSecond = getPixelsPerSecond();
    const dropTime = Math.max(0, dragX / pixelsPerSecond);

    const dragY =
      e.clientY - timelineRect.top + timelineScrollRef.current.scrollTop;
    const trackHeight = 60;
    const timeRulerHeight = 48;

    const relativeY = dragY - timeRulerHeight;
    const trackIndex = Math.floor(relativeY / trackHeight);

    const allTracks = [...tracks.overlays, ...tracks.main, ...tracks.audio];
    const targetTrack = allTracks[trackIndex];

    if (draggedItem && targetTrack) {
      const duration =
        draggedItem.duration || (draggedItem.type === "image" ? 5 : 10);
      const insertResult = insertWithRipple(targetTrack.id, dropTime, duration);

      setDropPreview({
        time: insertResult.time,
        duration: duration,
        trackId: targetTrack.id,
        trackType: targetTrack.type,
        isValid: true,
        shouldRipple: insertResult.shouldRipple,
        affectedItems: insertResult.affectedItems || [],
      });
    } else if (draggedTimelineItem && targetTrack) {
      const insertResult = insertWithRipple(
        targetTrack.id,
        dropTime,
        draggedTimelineItem.duration,
        draggedTimelineItem.id
      );

      setDropPreview({
        time: insertResult.time,
        duration: draggedTimelineItem.duration,
        trackId: targetTrack.id,
        trackType: targetTrack.type,
        isValid: true,
        shouldRipple: insertResult.shouldRipple,
        affectedItems: insertResult.affectedItems || [],
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    stopAutoScroll();

    // Если нет валидного preview, но есть draggedItem - используем умную логику размещения
    if (!dropPreview && draggedItem) {
      const targetTrackId = getTargetTrackForType(draggedItem.type);
      if (targetTrackId) {
        const bestPosition = findBestPositionForItem(
          draggedItem,
          targetTrackId
        );
        addToTimeline(draggedItem, bestPosition, targetTrackId);
      }
      setDropPreview(null);
      setIsTimelineDragging(false);
      return;
    }

    if ((!draggedItem && !draggedTimelineItem) || !dropPreview) return;

    if (dropPreview.isValid) {
      if (draggedItem) {
        if (dropPreview.shouldRipple && dropPreview.affectedItems?.length > 0) {
          applyRippleEffect(dropPreview.affectedItems, dropPreview.duration);
        }
        addToTimeline(draggedItem, dropPreview.time, dropPreview.trackId);
      } else if (draggedTimelineItem) {
        if (dropPreview.shouldRipple && dropPreview.affectedItems?.length > 0) {
          applyRippleEffect(
            dropPreview.affectedItems,
            draggedTimelineItem.duration
          );
        }

        setTimelineItems((prev) =>
          prev.map((item) =>
            item.id === draggedTimelineItem.id
              ? {
                  ...item,
                  startTime: dropPreview.time,
                  trackId: dropPreview.trackId,
                  trackType: dropPreview.trackType,
                }
              : item
          )
        );

        const newEndTime = dropPreview.time + draggedTimelineItem.duration;
        if (newEndTime > videoDuration) {
          setVideoDuration(newEndTime + 10);
        }
      }
    }

    setDropPreview(null);
    setIsTimelineDragging(false);
  };

  const handleDragLeave = (e) => {
    if (!timelineRef.current?.contains(e.relatedTarget)) {
      setDropPreview(null);
      stopAutoScroll();
    }
  };

  const getTimelineItemStyle = (item) => {
    const allTracks = [...tracks.overlays, ...tracks.main, ...tracks.audio];
    const trackIndex = allTracks.findIndex(
      (track) => track.id === item.trackId
    );
    const pixelsPerSecond = getPixelsPerSecond();

    return {
      left: `${item.startTime * pixelsPerSecond}px`,
      width: `${item.duration * pixelsPerSecond}px`,
      top: `${trackIndex * 60 + 10}px`,
    };
  };

  const getDropPreviewStyle = () => {
    if (!dropPreview) return {};

    const allTracks = [...tracks.overlays, ...tracks.main, ...tracks.audio];
    const trackIndex = allTracks.findIndex(
      (track) => track.id === dropPreview.trackId
    );
    const pixelsPerSecond = getPixelsPerSecond();

    return {
      left: `${dropPreview.time * pixelsPerSecond}px`,
      width: `${dropPreview.duration * pixelsPerSecond}px`,
      top: `${trackIndex * 60 + 10}px`,
    };
  };

  const getTrackColor = (trackType) => {
    switch (trackType) {
      case "overlay":
        return "bg-purple-500 border-purple-400";
      case "main":
        return "bg-blue-500 border-blue-400";
      case "audio":
        return "bg-green-500 border-green-400";
      default:
        return "bg-gray-500 border-gray-400";
    }
  };

  // Эффекты
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !resizeItem || !timelineScrollRef.current) return;

      checkAutoScroll(e.clientX);

      const rect = timelineScrollRef.current.getBoundingClientRect();
      const mouseX =
        e.clientX - rect.left + timelineScrollRef.current.scrollLeft;
      const pixelsPerSecond = getPixelsPerSecond();
      const newTime = mouseX / pixelsPerSecond;

      setTimelineItems((prev) =>
        prev.map((item) => {
          if (item.id !== resizeItem.id) return item;

          const minDuration = 0.1;

          if (resizeHandle === "left") {
            const rightEdge =
              originalItemData.startTime + originalItemData.duration;
            const newStartTime = Math.max(
              0,
              Math.min(rightEdge - minDuration, newTime)
            );
            const newDuration = rightEdge - newStartTime;

            return {
              ...item,
              startTime: newStartTime,
              duration: newDuration,
            };
          } else if (resizeHandle === "right") {
            const leftEdge = originalItemData.startTime;
            const newEndTime = Math.max(leftEdge + minDuration, newTime);
            const newDuration = newEndTime - leftEdge;

            return {
              ...item,
              duration: newDuration,
            };
          }

          return item;
        })
      );
    };

    const handleMouseUp = () => {
      if (isResizing) {
        handleResizeEnd();
      }
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isResizing,
    resizeItem,
    resizeHandle,
    originalItemData,
    getPixelsPerSecond,
    checkAutoScroll,
    handleResizeEnd,
    setTimelineItems,
  ]);

  // Передаем smartAddToTimeline наружу через колбэк
  useEffect(() => {
    if (onSmartAddToTimeline) {
      onSmartAddToTimeline(smartAddToTimeline);
    }
  }, [onSmartAddToTimeline, smartAddToTimeline]);

  // Эффект для отладки - показывает куда будет добавлен элемент
  useEffect(() => {
    if (draggedItem) {
      console.log(`=== ОТЛАДКА DRAGGEDITEM ===`);
      console.log(`Элемент: "${draggedItem.name}", тип: "${draggedItem.type}"`);

      const targetTrackId = getTargetTrackForType(draggedItem.type);
      const targetTrack = [
        ...tracks.overlays,
        ...tracks.main,
        ...tracks.audio,
      ].find((track) => track.id === targetTrackId);

      console.log(`Целевая дорожка ID: ${targetTrackId}`);
      console.log(`Целевая дорожка объект:`, targetTrack);

      if (targetTrack) {
        const bestPosition = findBestPositionForItem(
          draggedItem,
          targetTrackId
        );
        console.log(
          `Будет добавлен на дорожку "${
            targetTrack.name
          }" в позицию ${formatTime(bestPosition)}`
        );
      } else {
        console.error(`Дорожка с ID ${targetTrackId} не найдена!`);
      }
      console.log(`=== КОНЕЦ ОТЛАДКИ ===`);
    }
  }, [
    draggedItem,
    tracks,
    getTargetTrackForType,
    findBestPositionForItem,
    formatTime,
  ]);

  useEffect(() => {
    return () => {
      stopAutoScroll();
    };
  }, [stopAutoScroll]);

  return (
    <div
      className={`h-80 bg-white rounded-2xl shadow-sm border-2 transition-all duration-200 overflow-hidden flex flex-col flex-shrink-0 ${
        isDragging || isTimelineDragging || isResizing
          ? "border-blue-400 bg-blue-50/20"
          : "border-gray-200"
      }`}
      onWheel={handleWheel}
    >
      <div className="bg-gray-50 p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-gray-800 font-semibold flex items-center space-x-2">
            <Film size={18} />
            <span>Timeline Pro</span>
            {draggedItem && (
              <span className="text-blue-600 text-sm">
                - Готов добавить: "{draggedItem.name}" на{" "}
                {draggedItem.type === "video"
                  ? "Main Video"
                  : draggedItem.type === "audio" || draggedItem.type === "music"
                  ? "Audio"
                  : "Overlay"}{" "}
                дорожку
              </span>
            )}
            {isDragging && dropPreview && (
              <span className="text-green-600">
                - Adding "{draggedItem?.name}"{" "}
                {dropPreview.shouldRipple ? "⚡ ripple" : "📍 exact"}
              </span>
            )}
            {isTimelineDragging && dropPreview && (
              <span className="text-blue-600">
                - Moving "{draggedTimelineItem?.name}"{" "}
                {dropPreview.shouldRipple ? "⚡ push blocks" : "📍 exact"}
              </span>
            )}
            {isResizing && resizeItem && (
              <span className="text-orange-600">
                - Trimming "{resizeItem.name}" ({resizeHandle} edge)
              </span>
            )}
            {copiedItem && (
              <span className="text-blue-600 text-sm">
                - "{copiedItem.name}" copied (Ctrl+V to paste)
              </span>
            )}
          </h4>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white rounded-xl p-2 border border-gray-200">
              <button
                onClick={zoomOut}
                className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-xs text-gray-500 min-w-12 text-center">
                {(timelineZoom * 100).toFixed(0)}%
              </span>
              <button
                onClick={zoomIn}
                className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                title="Zoom In (+), or Ctrl+Wheel"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={resetZoom}
                className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                title="Reset Zoom (0)"
              >
                <RotateCcw size={16} />
              </button>
              <HelpButtonWithTooltip />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={addOverlayTrack}
                className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-xl transition-all duration-200"
                title="Add Overlay Track"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={addAudioTrack}
                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-xl transition-all duration-200"
                title="Add Audio Track"
              >
                <Music size={16} />
              </button>
              {draggedItem && (
                <button
                  onClick={addToTimelineAtCurrentTime}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-200 animate-pulse bg-blue-100"
                  title={`Добавить "${draggedItem.name}" на ${
                    draggedItem.type === "video"
                      ? "Main Video"
                      : draggedItem.type === "audio" ||
                        draggedItem.type === "music"
                      ? "Audio"
                      : "Overlay"
                  } дорожку в оптимальную позицию`}
                >
                  <Plus size={16} />
                </button>
              )}
              <button
                onClick={splitTimelineItem}
                disabled={!selectedTimelineItem}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  selectedTimelineItem
                    ? "text-red-600 hover:text-red-800 hover:bg-red-50"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                title="Split Selected Item (Ctrl+B) - Cuts item at current time"
              >
                <Scissors size={16} />
              </button>
              <button
                onClick={copyTimelineItem}
                disabled={!selectedTimelineItem}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  selectedTimelineItem
                    ? "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                title="Copy Selected Item (Ctrl+C) - Copy item to clipboard"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={pasteTimelineItem}
                disabled={!copiedItem}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  copiedItem
                    ? "text-green-600 hover:text-green-800 hover:bg-green-50"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                title="Paste Item (Ctrl+V) - Paste copied item"
              >
                <Copy size={16} className="rotate-180" />
              </button>
              <button
                onClick={deleteSelectedItem}
                disabled={!selectedTimelineItem}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  selectedTimelineItem
                    ? "text-red-600 hover:text-red-800 hover:bg-red-50"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                title="Delete Selected Item (Del/Backspace) - Remove from timeline"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-48 bg-gray-50 border-r border-gray-200 flex-shrink-0 flex flex-col">
          <div className="h-12 border-b border-gray-200 flex-shrink-0"></div>

          <div
            ref={trackLabelsRef}
            className="flex-1 overflow-y-auto overflow-x-hidden"
            onScroll={handleTrackLabelsScroll}
          >
            {tracks.overlays.map((track) => (
              <div
                key={track.id}
                className="h-15 flex items-center px-4 border-b border-gray-100 text-sm font-medium text-purple-700 bg-purple-50 flex-shrink-0"
                style={{ height: "60px" }}
              >
                <Layers size={16} className="mr-2" />
                {track.name}
              </div>
            ))}

            {tracks.main.map((track) => (
              <div
                key={track.id}
                className="h-15 flex items-center px-4 border-b border-gray-100 text-sm font-medium text-blue-700 bg-blue-50 flex-shrink-0"
                style={{ height: "60px" }}
              >
                <Video size={16} className="mr-2" />
                {track.name}
              </div>
            ))}

            {tracks.audio.map((track) => (
              <div
                key={track.id}
                className="h-15 flex items-center px-4 border-b border-gray-100 text-sm font-medium text-green-700 bg-green-50 flex-shrink-0"
                style={{ height: "60px" }}
              >
                <Music size={16} className="mr-2" />
                {track.name}
              </div>
            ))}
          </div>
        </div>

        <div
          ref={(el) => {
            timelineRef.current = el;
            timelineScrollRef.current = el;
          }}
          className="flex-1 relative overflow-auto bg-white"
          onScroll={handleTrackAreaScroll}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          style={{
            overflowX: "auto",
            overflowY: "auto",
            scrollbarWidth: "thin",
          }}
        >
          <div
            style={{
              width: `${getTimelineWidth()}px`,
              minHeight: "100%",
              position: "relative",
            }}
            onClick={handleTimelineClick}
            onDoubleClick={handleTimelineDoubleClick}
          >
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

            <div
              className="relative flex-1"
              style={{
                height: `${
                  (tracks.overlays.length +
                    tracks.main.length +
                    tracks.audio.length) *
                  60
                }px`,
                minHeight: "100%",
              }}
            >
              {timelineItems.map((item) => (
                <div
                  key={item.id}
                  className={`absolute h-10 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all shadow-sm hover:shadow-md group ${getTrackColor(
                    item.trackType
                  )} ${
                    selectedTimelineItem?.id === item.id
                      ? "ring-2 ring-blue-300"
                      : ""
                  } ${
                    draggedTimelineItem?.id === item.id ? "opacity-50 z-30" : ""
                  } ${
                    copiedItem?.id === item.id
                      ? "ring-2 ring-green-300 ring-dashed"
                      : ""
                  }`}
                  style={getTimelineItemStyle(item)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTimelineItem(item);
                  }}
                >
                  <div
                    className="absolute left-0 top-0 w-3 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/50 rounded-l-lg z-10 flex items-center justify-center"
                    onMouseDown={(e) => handleResizeStart(e, item, "left")}
                    title="Trim start - Drag to adjust start time"
                    style={{
                      background:
                        "linear-gradient(to right, rgba(255,255,255,0.8), transparent)",
                    }}
                  >
                    <div className="w-0.5 h-6 bg-white rounded-full opacity-80"></div>
                  </div>

                  <div
                    draggable="true"
                    onDragStart={(e) => handleTimelineItemDragStart(e, item)}
                    onDragEnd={handleTimelineItemDragEnd}
                    className="p-2 text-white text-xs truncate font-medium flex items-center h-full mx-3 cursor-grab active:cursor-grabbing"
                    title="Drag to move item on timeline - Ripple mode: pushes other blocks"
                  >
                    {item.name}
                    {copiedItem?.id === item.id && (
                      <span className="ml-2 text-green-200">📋</span>
                    )}
                  </div>

                  <div
                    className="absolute right-0 top-0 w-3 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/50 rounded-r-lg z-10 flex items-center justify-center"
                    onMouseDown={(e) => handleResizeStart(e, item, "right")}
                    title="Trim end - Drag to adjust duration"
                    style={{
                      background:
                        "linear-gradient(to left, rgba(255,255,255,0.8), transparent)",
                    }}
                  >
                    <div className="w-0.5 h-6 bg-white rounded-full opacity-80"></div>
                  </div>
                </div>
              ))}

              {dropPreview && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
