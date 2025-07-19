import { useState, useRef, useEffect, useCallback } from "react";
import { TimelineCanvas } from "./TimelineCanvas";
import { TimelineHeader } from "./TimelineHeader";

import { TrackLabels } from "./TrackLabels";
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
  setShowExportModal,
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
  handleVolumeChange,
  insertWithRipple,
  onOpacityChange,
  applyRippleEffect,
  onSmartAddToTimeline,
}) => {
  const timelineRef = useRef(null);
  const timelineScrollRef = useRef(null);
  const trackLabelsRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [resizeItem, setResizeItem] = useState(null);
  const [originalItemData, setOriginalItemData] = useState(null);

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
          return overlayTrack?.id;
        default:
          return tracks.main?.[0]?.id;
      }
    },
    [tracks]
  );

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

  // Утилиты
  const getTimelineWidth = () => {
    const baseWidth = videoDuration * 50 * timelineZoom;
    return Math.max(baseWidth, 2000);
  };

  const getPixelsPerSecond = () => {
    return 50 * timelineZoom;
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

  const zoomIn = () => setTimelineZoom((prev) => Math.min(20, prev * 1.5));
  const zoomOut = () => setTimelineZoom((prev) => Math.max(0.1, prev / 1.5));
  const resetZoom = () => setTimelineZoom(1);

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

  const addToTimelineAtCurrentTime = useCallback(() => {
    if (!draggedItem) return;

    const targetTrackId = getTargetTrackForType(draggedItem.type);
    if (!targetTrackId) return;

    const bestPosition = findBestPositionForItem(draggedItem, targetTrackId);
    addToTimeline(draggedItem, bestPosition, targetTrackId);
  }, [
    draggedItem,
    getTargetTrackForType,
    findBestPositionForItem,
    addToTimeline,
  ]);

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
        e.preventDefault();

        if (timelineScrollRef.current) {
          const scrollAmount = e.deltaY * 2;
          timelineScrollRef.current.scrollLeft += scrollAmount;
        }
      }
    },
    [timelineZoom, setTimelineZoom]
  );

  const smartAddToTimeline = useCallback(
    (item, specifiedTime = null, specifiedTrackId = null) => {
      if (specifiedTime !== null && specifiedTrackId !== null) {
        addToTimeline(item, specifiedTime, specifiedTrackId);
        return;
      }

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

      addToTimeline(item, bestPosition, targetTrackId);
    },
    [addToTimeline, getTargetTrackForType, findBestPositionForItem]
  );

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

  useEffect(() => {
    if (onSmartAddToTimeline) {
      onSmartAddToTimeline(smartAddToTimeline);
    }
  }, [onSmartAddToTimeline, smartAddToTimeline]);

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
      <TimelineHeader
        draggedItem={draggedItem}
        isDragging={isDragging}
        isTimelineDragging={isTimelineDragging}
        isResizing={isResizing}
        setShowExportModal={setShowExportModal}
        dropPreview={dropPreview}
        draggedTimelineItem={draggedTimelineItem}
        resizeItem={resizeItem}
        resizeHandle={resizeHandle}
        copiedItem={copiedItem}
        timelineZoom={timelineZoom}
        selectedTimelineItem={selectedTimelineItem}
        addOverlayTrack={addOverlayTrack}
        addAudioTrack={addAudioTrack}
        addToTimelineAtCurrentTime={addToTimelineAtCurrentTime}
        splitTimelineItem={splitTimelineItem}
        copyTimelineItem={copyTimelineItem}
        pasteTimelineItem={pasteTimelineItem}
        deleteSelectedItem={deleteSelectedItem}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        resetZoom={resetZoom}
      />

      <div className="flex-1 flex min-h-0">
        <TrackLabels
          tracks={tracks}
          trackLabelsRef={trackLabelsRef}
          onScroll={handleTrackLabelsScroll}
        />

        <TimelineCanvas
          timelineRef={timelineRef}
          timelineScrollRef={timelineScrollRef}
          tracks={tracks}
          onVolumeChange={handleVolumeChange}
          showVolumeControls={true}
          timelineItems={timelineItems}
          selectedTimelineItem={selectedTimelineItem}
          draggedTimelineItem={draggedTimelineItem}
          copiedItem={copiedItem}
          dropPreview={dropPreview}
          getTimelineWidth={getTimelineWidth}
          getPixelsPerSecond={getPixelsPerSecond}
          getTrackColor={getTrackColor}
          getTimelineItemStyle={getTimelineItemStyle}
          getDropPreviewStyle={getDropPreviewStyle}
          videoDuration={videoDuration}
          timelineZoom={timelineZoom}
          currentTime={currentTime}
          formatTime={formatTime}
          onScroll={handleTrackAreaScroll}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          showOpacityControls={true}
          onOpacityChange={onOpacityChange}
          onClick={handleTimelineClick}
          onDoubleClick={handleTimelineDoubleClick}
          onTimelineItemSelect={setSelectedTimelineItem}
          onTimelineItemDragStart={handleTimelineItemDragStart}
          onTimelineItemDragEnd={handleTimelineItemDragEnd}
          onResizeStart={handleResizeStart}
        />
      </div>
    </div>
  );
};
