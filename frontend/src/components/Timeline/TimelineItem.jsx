import { useState, useRef, useEffect } from 'react';

export const TimelineItem = ({
  item,
  isSelected,
  isDragged,
  isCopied,
  getTrackColor,
  getTimelineItemStyle,
  onSelect,
  onDragStart,
  onDragEnd,
  onResizeStart,
  onVolumeChange,
  onOpacityChange, // Новый prop для opacity
  showVolumeControls = true,
  showOpacityControls = true, // Новый prop для opacity controls
  hasAudio = false,
  hasOpacity = false, // Новый prop для определения элементов с opacity
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);
  const [volume, setVolume] = useState(() => {
    const itemVolume = item.volume ?? 1;
    return itemVolume <= 1 ? Math.round(itemVolume * 100) : itemVolume;
  });
  const [opacity, setOpacity] = useState(() => {
    const itemOpacity = item.opacity ?? 1;
    return itemOpacity <= 1 ? Math.round(itemOpacity * 100) : itemOpacity;
  });
  const volumeControlRef = useRef(null);
  const opacityControlRef = useRef(null);

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value); // 0-100 для UI
    setVolume(newVolume);
    onVolumeChange?.(item.id, newVolume / 100); // 0-1 для HTML media
  };

  const handleOpacityChange = (e) => {
    const newOpacity = parseInt(e.target.value); // 0-100 для UI
    setOpacity(newOpacity);
    onOpacityChange?.(item.id, newOpacity / 100); // 0-1 для CSS
  };

  const toggleVolumeSlider = (e) => {
    e.stopPropagation();
    setShowVolumeSlider(!showVolumeSlider);
    setShowOpacitySlider(false); // Закрываем opacity slider
  };

  const toggleOpacitySlider = (e) => {
    e.stopPropagation();
    setShowOpacitySlider(!showOpacitySlider);
    setShowVolumeSlider(false); // Закрываем volume slider
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const newVolume = volume === 0 ? 100 : 0;
    setVolume(newVolume);
    onVolumeChange?.(item.id, newVolume / 100);
  };

  const toggleOpacityMute = (e) => {
    e.stopPropagation();
    const newOpacity = opacity === 0 ? 100 : 0;
    setOpacity(newOpacity);
    onOpacityChange?.(item.id, newOpacity / 100);
  };

  // Синхронизируем локальное состояние с props
  useEffect(() => {
    const itemVolume = item.volume ?? 1;
    const volumePercent = itemVolume <= 1 ? Math.round(itemVolume * 100) : itemVolume;
    if (volumePercent !== volume) {
      setVolume(volumePercent);
    }

    const itemOpacity = item.opacity ?? 1;
    const opacityPercent = itemOpacity <= 1 ? Math.round(itemOpacity * 100) : itemOpacity;
    if (opacityPercent !== opacity) {
      setOpacity(opacityPercent);
    }
  }, [item.volume, item.opacity, volume, opacity]);

  // Закрываем sliders при клике вне них
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showVolumeSlider && volumeControlRef.current && !volumeControlRef.current.contains(e.target)) {
        setShowVolumeSlider(false);
      }
      if (showOpacitySlider && opacityControlRef.current && !opacityControlRef.current.contains(e.target)) {
        setShowOpacitySlider(false);
      }
    };

    if (showVolumeSlider || showOpacitySlider) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showVolumeSlider, showOpacitySlider]);

  const getVolumeIcon = () => {
    if (volume === 0) return "🔇";
    if (volume < 30) return "🔈";
    if (volume < 70) return "🔉";
    return "🔊";
  };

  const getOpacityIcon = () => {
    if (opacity === 0) return "👻"; // Полностью прозрачный
    if (opacity < 30) return "🌫️"; // Почти прозрачный
    if (opacity < 70) return "☁️"; // Полупрозрачный
    return "🖼️"; // Непрозрачный
  };

  return (
    <div
      className={`absolute h-10 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all shadow-sm hover:shadow-md group ${getTrackColor(
        item.trackType
      )} ${isSelected ? "ring-2 ring-blue-300" : ""} ${
        isDragged ? "opacity-50 z-30" : ""
      } ${isCopied ? "ring-2 ring-green-300 ring-dashed" : ""}`}
      style={getTimelineItemStyle(item)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item);
      }}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 w-3 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/50 rounded-l-lg z-10 flex items-center justify-center"
        onMouseDown={(e) => onResizeStart(e, item, "left")}
        title="Trim start - Drag to adjust start time"
        style={{
          background:
            "linear-gradient(to right, rgba(255,255,255,0.8), transparent)",
        }}
      >
        <div className="w-0.5 h-6 bg-white rounded-full opacity-80"></div>
      </div>

      {/* ОТДЕЛЬНЫЕ зоны: draggable область и controls */}
      <div className="h-full mx-3 flex items-center">
        {/* Draggable область - только название файла */}
        <div
          draggable="true"
          onDragStart={(e) => onDragStart(e, item)}
          onDragEnd={onDragEnd}
          className="flex-1 p-2 text-white text-xs truncate font-medium cursor-grab active:cursor-grabbing flex items-center"
          title="Drag to move item on timeline - Ripple mode: pushes other blocks"
        >
          {item.name}
          {isCopied && <span className="ml-2 text-green-200">📋</span>}
        </div>

        {/* Controls: Volume для audio/video, Opacity для изображений */}
        <div className="ml-2 flex items-center gap-1">
          {/* Volume controls */}
          {hasAudio && showVolumeControls && (
            <div 
              ref={volumeControlRef}
              className="relative flex-shrink-0"
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
              onDragStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
              style={{ cursor: 'default' }}
            >
              {showVolumeSlider ? (
                // Expanded volume control
                <div 
                  className="flex items-center gap-1 bg-black/30 rounded-md px-2 py-1 min-w-[80px]"
                  onMouseDown={(e) => e.stopPropagation()}
                  onDragStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                >
                  <button
                    className="text-white/80 hover:text-white transition-colors"
                    onClick={volume === 0 ? toggleMute : toggleVolumeSlider}
                    onDoubleClick={toggleMute}
                    onMouseDown={(e) => e.stopPropagation()}
                    title={volume === 0 ? "Unmute (double-click)" : "Volume controls (double-click to mute)"}
                    style={{ fontSize: '8px', cursor: 'pointer' }}
                  >
                    {getVolumeIcon()}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-1 bg-white/30 rounded appearance-none cursor-pointer min-w-[40px]"
                    style={{
                      background: `linear-gradient(to right, #ffffff 0%, #ffffff ${volume}%, rgba(255,255,255,0.3) ${volume}%, rgba(255,255,255,0.3) 100%)`
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onDragStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }}
                  />
                  <span 
                    className="text-white text-xs min-w-[24px] text-center" 
                    style={{ fontSize: '9px' }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {volume}
                  </span>
                </div>
              ) : (
                // Collapsed volume icon
                <button
                  className="text-white/80 hover:text-white transition-colors p-1 rounded"
                  onClick={volume === 0 ? toggleMute : toggleVolumeSlider}
                  onDoubleClick={toggleMute}
                  onMouseDown={(e) => e.stopPropagation()}
                  title={volume === 0 ? `Muted - Click to unmute` : `Volume: ${volume}% - Click for controls, double-click to mute`}
                  style={{ 
                    fontSize: '10px',
                    lineHeight: 1,
                    minWidth: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {getVolumeIcon()}
                </button>
              )}
            </div>
          )}

          {/* Opacity controls */}
          {hasOpacity && showOpacityControls && (
            <div 
              ref={opacityControlRef}
              className="relative flex-shrink-0"
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
              onDragStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
              style={{ cursor: 'default' }}
            >
              {showOpacitySlider ? (
                // Expanded opacity control
                <div 
                  className="flex items-center gap-1 bg-black/30 rounded-md px-2 py-1 min-w-[80px]"
                  onMouseDown={(e) => e.stopPropagation()}
                  onDragStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                >
                  <button
                    className="text-white/80 hover:text-white transition-colors"
                    onClick={opacity === 0 ? toggleOpacityMute : toggleOpacitySlider}
                    onDoubleClick={toggleOpacityMute}
                    onMouseDown={(e) => e.stopPropagation()}
                    title={opacity === 0 ? "Show (double-click)" : "Opacity controls (double-click to hide)"}
                    style={{ fontSize: '8px', cursor: 'pointer' }}
                  >
                    {getOpacityIcon()}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={opacity}
                    onChange={handleOpacityChange}
                    className="flex-1 h-1 bg-white/30 rounded appearance-none cursor-pointer min-w-[40px]"
                    style={{
                      background: `linear-gradient(to right, #ffffff 0%, #ffffff ${opacity}%, rgba(255,255,255,0.3) ${opacity}%, rgba(255,255,255,0.3) 100%)`
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onDragStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }}
                  />
                  <span 
                    className="text-white text-xs min-w-[24px] text-center" 
                    style={{ fontSize: '9px' }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {opacity}
                  </span>
                </div>
              ) : (
                // Collapsed opacity icon
                <button
                  className="text-white/80 hover:text-white transition-colors p-1 rounded"
                  onClick={opacity === 0 ? toggleOpacityMute : toggleOpacitySlider}
                  onDoubleClick={toggleOpacityMute}
                  onMouseDown={(e) => e.stopPropagation()}
                  title={opacity === 0 ? `Hidden - Click to show` : `Opacity: ${opacity}% - Click for controls, double-click to hide`}
                  style={{ 
                    fontSize: '10px',
                    lineHeight: 1,
                    minWidth: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {getOpacityIcon()}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 w-3 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/50 rounded-r-lg z-10 flex items-center justify-center"
        onMouseDown={(e) => onResizeStart(e, item, "right")}
        title="Trim end - Drag to adjust duration"
        style={{
          background:
            "linear-gradient(to left, rgba(255,255,255,0.8), transparent)",
        }}
      >
        <div className="w-0.5 h-6 bg-white rounded-full opacity-80"></div>
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: 1px solid rgba(0,0,0,0.2);
          box-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        
        input[type="range"]::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: 1px solid rgba(0,0,0,0.2);
          box-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};