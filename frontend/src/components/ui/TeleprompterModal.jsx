import { useState, useRef, useEffect } from "react";

export const TeleprompterModal = ({
  isOpen = true,
  onClose = () => {},
  script = "Welcome to the teleprompter!...",
  onRecordingComplete = () => {},
  setCurrentStep,
  onSaveToLibrary = null,
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [windowPosition, setWindowPosition] = useState({ 
    x: window.innerWidth * 0.1, 
    y: window.innerHeight * 0.05 
  });
  const [windowSize, setWindowSize] = useState({ 
    width: Math.min(1200, window.innerWidth * 0.8),
    height: Math.min(800, window.innerHeight * 0.9)
  });

  const modalRef = useRef(null);
  const headerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const videoPreviewRef = useRef(null);

  const handleMouseDown = (e) => {
    if (isFullscreen || e.target.closest('.no-drag')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = modalRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleResizeMouseDown = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeDirection(direction);
  };

  const handleMouseMove = (e) => {
    if (isFullscreen) return;

    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const maxX = window.innerWidth - windowSize.width;
      const maxY = window.innerHeight - windowSize.height;
      
      setWindowPosition({
        x: Math.max(-50, Math.min(newX, maxX + 50)),
        y: Math.max(-50, Math.min(newY, maxY + 50))
      });
    }

    if (isResizing) {
      const rect = modalRef.current.getBoundingClientRect();
      const minWidth = 300;
      const minHeight = 200;
      const maxWidth = window.innerWidth;
      const maxHeight = window.innerHeight;

      let newWidth = windowSize.width;
      let newHeight = windowSize.height;
      let newX = windowPosition.x;
      let newY = windowPosition.y;

      switch (resizeDirection) {
        case 'e': // right
          newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX - rect.left));
          break;
        case 'w': // left
          const deltaW = rect.left - e.clientX;
          newWidth = Math.max(minWidth, Math.min(maxWidth, windowSize.width + deltaW));
          if (newWidth > minWidth) {
            newX = Math.max(0, windowPosition.x - deltaW);
          }
          break;
        case 's': // bottom
          newHeight = Math.max(minHeight, Math.min(maxHeight, e.clientY - rect.top));
          break;
        case 'n': // top
          const deltaN = rect.top - e.clientY;
          newHeight = Math.max(minHeight, Math.min(maxHeight, windowSize.height + deltaN));
          if (newHeight > minHeight) {
            newY = Math.max(0, windowPosition.y - deltaN);
          }
          break;
        case 'se': // bottom-right
          newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX - rect.left));
          newHeight = Math.max(minHeight, Math.min(maxHeight, e.clientY - rect.top));
          break;
        case 'sw': // bottom-left
          const deltaSW = rect.left - e.clientX;
          newWidth = Math.max(minWidth, Math.min(maxWidth, windowSize.width + deltaSW));
          newHeight = Math.max(minHeight, Math.min(maxHeight, e.clientY - rect.top));
          if (newWidth > minWidth) {
            newX = Math.max(0, windowPosition.x - deltaSW);
          }
          break;
        case 'ne': // top-right
          const deltaNE = rect.top - e.clientY;
          newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX - rect.left));
          newHeight = Math.max(minHeight, Math.min(maxHeight, windowSize.height + deltaNE));
          if (newHeight > minHeight) {
            newY = Math.max(0, windowPosition.y - deltaNE);
          }
          break;
        case 'nw': // top-left
          const deltaNW_W = rect.left - e.clientX;
          const deltaNW_N = rect.top - e.clientY;
          newWidth = Math.max(minWidth, Math.min(maxWidth, windowSize.width + deltaNW_W));
          newHeight = Math.max(minHeight, Math.min(maxHeight, windowSize.height + deltaNW_N));
          if (newWidth > minWidth) {
            newX = Math.max(0, windowPosition.x - deltaNW_W);
          }
          if (newHeight > minHeight) {
            newY = Math.max(0, windowPosition.y - deltaNW_N);
          }
          break;
      }

      setWindowSize({ width: newWidth, height: newHeight });
      setWindowPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
  };

  // Полноэкранный режим
  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        if (modalRef.current?.requestFullscreen) {
          await modalRef.current.requestFullscreen();
        } else if (modalRef.current?.webkitRequestFullscreen) {
          await modalRef.current.webkitRequestFullscreen();
        } else if (modalRef.current?.msRequestFullscreen) {
          await modalRef.current.msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  // Развернуть/свернуть окно
  const toggleMaximize = () => {
    if (isFullscreen) return;
    
    if (windowSize.width >= window.innerWidth * 0.95 && windowSize.height >= window.innerHeight * 0.95) {
      // Restore previous size
      setWindowSize({ 
        width: Math.min(1200, window.innerWidth * 0.8),
        height: Math.min(800, window.innerHeight * 0.9)
      });
      setWindowPosition({ 
        x: window.innerWidth * 0.1, 
        y: window.innerHeight * 0.05 
      });
    } else {
      // Maximize
      setWindowSize({ 
        width: window.innerWidth, 
        height: window.innerHeight 
      });
      setWindowPosition({ x: 0, y: 0 });
    }
  };

  // Минимизировать окно
  const minimizeWindow = () => {
    setWindowSize({ 
      width: Math.max(400, windowSize.width),
      height: 60
    });
  };

  // Открыть в отдельном окне
  const openInNewWindow = () => {
    const width = 1200;
    const height = 800;
    const left = window.screen.availWidth - width;
    const top = (window.screen.availHeight - height) / 2;

    const newWindow = window.open(
      "",
      "teleprompter",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,menubar=no,toolbar=no,location=no`
    );

    if (newWindow) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Teleprompter - External Window</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #000;
              overflow: hidden;
              height: 100vh;
            }
            .teleprompter-container {
              height: 100vh;
              overflow-y: auto;
              padding: 80px 48px;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            .teleprompter-container::-webkit-scrollbar {
              display: none;
            }
            .teleprompter-text {
              color: white;
              line-height: 1.8;
              max-width: 1000px;
              margin: 0 auto;
              text-align: center;
              font-weight: 500;
              text-shadow: 0 2px 4px rgba(0,0,0,0.5);
            }
            .controls {
              position: fixed;
              bottom: 20px;
              left: 20px;
              right: 20px;
              background: rgba(0, 0, 0, 0.8);
              backdrop-filter: blur(10px);
              border-radius: 12px;
              padding: 16px;
              display: flex;
              justify-content: center;
              gap: 12px;
              z-index: 1000;
            }
            .control-btn {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 12px 20px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              transition: background-color 0.2s;
            }
            .control-btn:hover {
              background: #2563eb;
            }
            .control-btn.recording {
              background: #ef4444;
            }
            .control-btn.recording:hover {
              background: #dc2626;
            }
            .timer {
              position: fixed;
              top: 20px;
              left: 20px;
              background: rgba(239, 68, 68, 0.9);
              color: white;
              padding: 12px 20px;
              border-radius: 12px;
              font-family: monospace;
              font-weight: bold;
              font-size: 18px;
              backdrop-filter: blur(10px);
              display: none;
            }
            .timer.visible {
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="timer" id="timer">00:00</div>
          <div class="teleprompter-container" id="container">
            <div class="teleprompter-text" id="text" style="font-size: ${fontSize}px;">
              ${script}
            </div>
            <div style="height: 100vh;"></div>
          </div>
          <div class="controls">
            <button class="control-btn" id="scrollBtn">▶️ Start Scroll</button>
            <button class="control-btn" id="recordBtn">🎤 Record</button>
            <button class="control-btn" id="resetBtn">🔄 Reset</button>
            <button class="control-btn" id="closeBtn">✕ Close</button>
          </div>

          <script>
            let isScrolling = false;
            let isRecording = false;
            let scrollInterval = null;
            let recordingTimer = null;
            let recordingTime = 0;
            let mediaRecorder = null;
            let stream = null;

            const container = document.getElementById('container');
            const scrollBtn = document.getElementById('scrollBtn');
            const recordBtn = document.getElementById('recordBtn');
            const resetBtn = document.getElementById('resetBtn');
            const closeBtn = document.getElementById('closeBtn');
            const timer = document.getElementById('timer');

            function startScrolling() {
              isScrolling = true;
              scrollBtn.textContent = '⏹️ Stop Scroll';
              scrollInterval = setInterval(() => {
                const scrollStep = (${speed} / 50) * 2;
                container.scrollTop += scrollStep;
                if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
                  stopScrolling();
                }
              }, 50);
            }

            function stopScrolling() {
              isScrolling = false;
              scrollBtn.textContent = '▶️ Start Scroll';
              if (scrollInterval) {
                clearInterval(scrollInterval);
                scrollInterval = null;
              }
            }

            scrollBtn.addEventListener('click', () => {
              if (isScrolling) {
                stopScrolling();
              } else {
                startScrolling();
              }
            });

            async function startRecording() {
              try {
                stream = await navigator.mediaDevices.getUserMedia({
                  audio: { echoCancellation: true, noiseSuppression: true },
                  video: ${recordingType === 'video' ? 'true' : 'false'}
                });

                mediaRecorder = new MediaRecorder(stream);
                const chunks = [];

                mediaRecorder.ondataavailable = (event) => {
                  if (event.data.size > 0) {
                    chunks.push(event.data);
                  }
                };

                mediaRecorder.onstop = () => {
                  const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = \`recording-\${Date.now()}.webm\`;
                  a.click();
                  URL.revokeObjectURL(url);
                  
                  stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                isRecording = true;
                recordBtn.textContent = '⏹️ Stop Record';
                recordBtn.classList.add('recording');
                timer.classList.add('visible');

                recordingTimer = setInterval(() => {
                  recordingTime++;
                  const mins = Math.floor(recordingTime / 60);
                  const secs = recordingTime % 60;
                  timer.textContent = \`\${mins.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
                }, 1000);

                if (!isScrolling) {
                  startScrolling();
                }
              } catch (error) {
                alert('Failed to access microphone/camera: ' + error.message);
              }
            }

            function stopRecording() {
              if (mediaRecorder && isRecording) {
                mediaRecorder.stop();
                isRecording = false;
                recordBtn.textContent = '🎤 Record';
                recordBtn.classList.remove('recording');
                timer.classList.remove('visible');
                
                if (recordingTimer) {
                  clearInterval(recordingTimer);
                  recordingTimer = null;
                }
                recordingTime = 0;
              }
            }

            recordBtn.addEventListener('click', () => {
              if (isRecording) {
                stopRecording();
              } else {
                startRecording();
              }
            });

            resetBtn.addEventListener('click', () => {
              stopScrolling();
              stopRecording();
              container.scrollTop = 0;
            });

            closeBtn.addEventListener('click', () => {
              stopScrolling();
              stopRecording();
              window.close();
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
              if (e.code === 'Space') {
                e.preventDefault();
                if (isScrolling) {
                  stopScrolling();
                } else {
                  startScrolling();
                }
              } else if (e.code === 'KeyR') {
                e.preventDefault();
                if (isRecording) {
                  stopRecording();
                } else {
                  startRecording();
                }
              } else if (e.code === 'Escape') {
                resetBtn.click();
              }
            });

            window.addEventListener('beforeunload', () => {
              stopScrolling();
              stopRecording();
            });
          </script>
        </body>
        </html>
      `;

      newWindow.document.write(htmlContent);
      newWindow.document.close();

      handleClose();
    }
  };

  // События мыши для перетаскивания и изменения размера
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      if (isDragging) {
        document.body.style.cursor = 'grabbing';
      } else if (isResizing) {
        const cursors = {
          'n': 'ns-resize',
          's': 'ns-resize',
          'e': 'ew-resize',
          'w': 'ew-resize',
          'ne': 'nesw-resize',
          'sw': 'nesw-resize',
          'nw': 'nwse-resize',
          'se': 'nwse-resize'
        };
        document.body.style.cursor = cursors[resizeDirection] || 'default';
      }
      
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, isResizing, dragOffset, resizeDirection]);

  // Обработка изменения размера окна браузера
  useEffect(() => {
    const handleResize = () => {
      const maxX = window.innerWidth - windowSize.width;
      const maxY = window.innerHeight - windowSize.height;
      
      setWindowPosition(prev => ({
        x: Math.max(0, Math.min(prev.x, maxX)),
        y: Math.max(0, Math.min(prev.y, maxY))
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [windowSize]);

  // Обработка выхода из полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Функция сохранения в медиабиблиотеку
  const saveToMediaLibrary = async () => {
    if (!recordedBlob || !onSaveToLibrary) return;
    setCurrentStep(4);
    setSaveSuccess(false);

    try {
      const recordingData = {
        blob: recordedBlob,
        type: recordingType,
        duration: recordingTime,
        timestamp: new Date().toISOString(),
      };

      const success = await onSaveToLibrary(recordingData);

      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Ошибка сохранения в библиотеку:", error);
    } finally {
      setIsSaving(false);
    }
  };

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
    setIsSaving(false);
    setSaveSuccess(false);
  };

  const startRecording = async () => {
    try {
      const constraints =
        recordingType === "video"
          ? {
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 },
              },
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100,
              },
            }
          : {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100,
              },
            };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      let mediaRecorder;

      if (recordingType === "video") {
        const videoCodecs = [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm;codecs=h264,opus",
          "video/webm",
          "video/mp4",
        ];

        let selectedCodec = null;
        for (const codec of videoCodecs) {
          if (MediaRecorder.isTypeSupported(codec)) {
            selectedCodec = codec;
            break;
          }
        }

        mediaRecorder = new MediaRecorder(stream, {
          mimeType: selectedCodec,
          videoBitsPerSecond: 2500000,
          audioBitsPerSecond: 128000,
        });
      } else {
        const audioCodecs = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/mp4",
        ];

        let selectedCodec = null;
        for (const codec of audioCodecs) {
          if (MediaRecorder.isTypeSupported(codec)) {
            selectedCodec = codec;
            break;
          }
        }

        mediaRecorder = new MediaRecorder(stream, {
          mimeType: selectedCodec,
          audioBitsPerSecond: 128000,
        });
      }

      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType;
        const blob = new Blob(chunks, { type: mimeType });
        setRecordedBlob(blob);

        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      startTimer();

      if (!isScrolling) {
        startScrolling();
      }
    } catch (error) {
      console.error("❌ Ошибка записи:", error);
      alert("Failed to access microphone/camera: " + error.message);
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

  const handleClose = () => {
    resetAllStates();
    if (isFullscreen) {
      document.exitFullscreen?.();
    }
    onClose();
  };

  useEffect(() => {
    if (
      isRecording &&
      recordingType === "video" &&
      streamRef.current &&
      videoPreviewRef.current
    ) {
      const videoElement = videoPreviewRef.current;
      if (!videoElement.srcObject) {
        videoElement.srcObject = streamRef.current;
        videoElement
          .play()
          .catch((e) => console.log("UseEffect play error:", e));
      }
    }
  }, [isRecording, recordingType, streamRef.current]);

  useEffect(() => {
    if (isScrolling && !isPaused && scrollIntervalRef.current) {
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
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
        videoPreviewRef.current.pause();
      }
    };
  }, []);

  if (!isOpen) return null;

  const isMinimized = windowSize.height <= 60;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20"
        style={{ zIndex: 99998 }}
      />
      
      <div
        ref={modalRef}
        className={`fixed bg-white/95 backdrop-blur-xl rounded-2xl flex flex-col overflow-hidden border border-slate-200/50 shadow-2xl transition-all duration-300 ${
          isFullscreen ? 'inset-0 rounded-none' : ''
        }`}
        style={
          isFullscreen 
            ? { zIndex: 99999 }
            : {
                left: `${windowPosition.x}px`,
                top: `${windowPosition.y}px`,
                width: `${windowSize.width}px`,
                height: `${windowSize.height}px`,
                zIndex: 99999,
              }
        }
      >
        {!isFullscreen && (
          <>
            <div
              className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-10"
              onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
            />
            <div
              className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize z-10"
              onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
            />
            <div
              className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-10"
              onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            />
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10"
              onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            />
            
            <div
              className="absolute top-0 left-4 right-4 h-2 cursor-n-resize z-10"
              onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
            />
            <div
              className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize z-10"
              onMouseDown={(e) => handleResizeMouseDown(e, 's')}
            />
            <div
              className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize z-10"
              onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
            />
            <div
              className="absolute right-0 top-4 bottom-4 w-2 cursor-e-resize z-10"
              onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
            />
          </>
        )}

        <div
          ref={headerRef}
          className={`flex items-center justify-between p-4 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-blue-50 ${
            !isFullscreen ? 'cursor-grab active:cursor-grabbing' : ''
          } ${isDragging ? 'cursor-grabbing' : ''}`}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">👁️</span>
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent">
                Teleprompter
              </h2>
              {!isMinimized && (
                <p className="text-xs text-gray-600 font-medium">
                  Professional recording studio
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 no-drag">
            {!isFullscreen && (
              <>
                <button
                  onClick={minimizeWindow}
                  className="p-2 hover:bg-slate-100/80 rounded-lg transition-all duration-200 backdrop-blur-sm border border-slate-200/50"
                  title="Minimize"
                >
                  <span className="text-slate-600 text-xs">−</span>
                </button>
                <button
                  onClick={toggleMaximize}
                  className="p-2 hover:bg-slate-100/80 rounded-lg transition-all duration-200 backdrop-blur-sm border border-slate-200/50"
                  title="Maximize/Restore"
                >
                  <span className="text-slate-600 text-xs">□</span>
                </button>
              </>
            )}
            
            {!isMinimized && (
              <>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-slate-100/80 rounded-lg transition-all duration-200 backdrop-blur-sm border border-slate-200/50"
                  title="Settings"
                >
                  <span className="text-xs">⚙️</span>
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-slate-100/80 rounded-lg transition-all duration-200 backdrop-blur-sm border border-slate-200/50"
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  <span className="text-xs">{isFullscreen ? '🗗' : '⛶'}</span>
                </button>
                <button
                  onClick={openInNewWindow}
                  className="p-2 hover:bg-slate-100/80 rounded-lg transition-all duration-200 backdrop-blur-sm border border-slate-200/50"
                  title="Open in new window"
                >
                  <span className="text-xs">🪟</span>
                </button>
              </>
            )}
            
            <button
              onClick={handleClose}
              className="p-2 hover:bg-red-100/80 rounded-lg transition-all duration-200 backdrop-blur-sm border border-slate-200/50 hover:border-red-200"
              title="Close"
            >
              <span className="text-red-600 text-xs">✕</span>
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {showSettings && (
              <div className="bg-gradient-to-r from-slate-50/90 to-blue-50/90 backdrop-blur-xl p-4 border-b border-slate-200/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Recording type
                    </label>
                    <select
                      value={recordingType}
                      onChange={(e) => setRecordingType(e.target.value)}
                      className="w-full p-2 bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-lg text-sm font-medium no-drag"
                    >
                      <option value="audio">Audio only</option>
                      <option value="video">Video + audio</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 flex flex-col">
                <div className="flex-1 relative bg-black overflow-hidden">
                  <div
                    ref={scrollContainerRef}
                    className="h-full overflow-y-scroll px-8 py-12"
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

                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-xl shadow-2xl backdrop-blur-xl border border-red-400/30">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      <span className="font-mono font-bold text-sm">
                        {formatTime(recordingTime)}
                      </span>
                      <span className="text-xs opacity-90">REC</span>
                    </div>
                  )}

                  {isScrolling && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500/80 text-white px-3 py-1 rounded-lg backdrop-blur-xl border border-blue-400/30">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium">
                          {isPaused ? "Paused" : "Scrolling"}
                        </span>
                      </div>
                    </div>
                  )}

                  {isFullscreen && (
                    <div className="absolute bottom-6 right-6 flex space-x-3">
                      <button
                        onClick={() => {
                          if (isScrolling) {
                            stopScrolling();
                            setIsPaused(false);
                          } else {
                            startScrolling();
                          }
                        }}
                        className="bg-blue-500/80 hover:bg-blue-600/80 text-white p-3 rounded-xl backdrop-blur-xl border border-blue-400/30 transition-all"
                      >
                        {isScrolling ? '⏹️' : '▶️'}
                      </button>
                      {!isRecording ? (
                        <button
                          onClick={startRecording}
                          className="bg-red-500/80 hover:bg-red-600/80 text-white p-3 rounded-xl backdrop-blur-xl border border-red-400/30 transition-all"
                        >
                          🎤
                        </button>
                      ) : (
                        <button
                          onClick={stopRecording}
                          className="bg-slate-500/80 hover:bg-slate-600/80 text-white p-3 rounded-xl backdrop-blur-xl border border-slate-400/30 transition-all"
                        >
                          ⏹️
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {!isFullscreen && (
                <div className="w-80 bg-gradient-to-br from-white/90 to-slate-50/90 backdrop-blur-xl border-l border-slate-200/50 p-4 flex flex-col overflow-y-auto max-h-full">
                  {recordingType === "video" && (
                    <div className="mb-4">
                      <h3 className="font-bold text-slate-800 mb-3 flex items-center text-sm">
                        <span className="mr-2">📹</span>
                        Video preview
                      </h3>
                      <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-slate-200 rounded-xl p-3 shadow-lg">
                        <div className="relative">
                          <video
                            ref={videoPreviewRef}
                            className="w-full h-32 rounded-lg object-cover bg-gray-900 border border-gray-600"
                            autoPlay
                            muted
                            playsInline
                            style={{
                              display: "block",
                              backgroundColor: "#1f2937",
                            }}
                          />
                          {isRecording && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                              LIVE
                            </div>
                          )}
                          {!isRecording && (
                            <div className="absolute inset-0 flex items-center justify-center text-white text-xs bg-black/50 rounded-lg">
                              <div className="text-center">
                                <div className="text-lg mb-1">📹</div>
                                <span>Ready</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-slate-700 text-xs text-center mt-2 font-medium">
                          {isRecording ? "Recording video" : "Video mode"}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center text-sm">
                      <span className="mr-2">📄</span>
                      Text control
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          if (isScrolling) {
                            stopScrolling();
                            setIsPaused(false);
                          } else {
                            startScrolling();
                          }
                        }}
                        className="flex-1 bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 text-white py-3 px-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center text-sm"
                      >
                        {isScrolling ? (
                          <>
                            <span className="mr-1">⏹️</span> Stop
                          </>
                        ) : (
                          <>
                            <span className="mr-1">▶️</span> Start
                          </>
                        )}
                      </button>
                      <button
                        onClick={resetScroll}
                        className="bg-slate-500 hover:bg-slate-600 text-white py-3 px-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        🔄
                      </button>
                    </div>

                    <div className="mt-2 text-center">
                      <span
                        className={`text-xs font-medium ${
                          isScrolling ? "text-green-600" : "text-slate-500"
                        }`}
                      >
                        {isScrolling ? "Scrolling" : "Stopped"}
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center text-sm">
                      <span className="mr-2">🎤</span>
                      Recording
                    </h3>

                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center group text-sm"
                      >
                        {recordingType === "video" ? (
                          <>
                            <span className="mr-2 text-lg group-hover:scale-110 transition-transform">
                              📹
                            </span>
                            Record video
                          </>
                        ) : (
                          <>
                            <span className="mr-2 text-lg group-hover:scale-110 transition-transform">
                              🎤
                            </span>
                            Record audio
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <button
                          onClick={stopRecording}
                          className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 shadow-lg flex items-center justify-center text-sm"
                        >
                          <span className="mr-2">⏹️</span>
                          Stop recording
                        </button>

                        <button
                          onClick={stopRecordingAndResetTimer}
                          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-2 px-4 rounded-xl font-semibold transition-all duration-300 shadow-lg flex items-center justify-center text-xs"
                        >
                          <span className="mr-1">🛑</span>
                          Abort
                        </button>
                      </div>
                    )}

                    {recordingTime > 0 && (
                      <div className="mt-3 text-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="text-2xl font-mono font-bold text-slate-800 mb-1">
                          {formatTime(recordingTime)}
                        </div>
                        {!isRecording && (
                          <button
                            onClick={() => setRecordingTime(0)}
                            className="text-xs text-slate-600 hover:text-slate-800 underline font-medium"
                          >
                            Reset timer
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {recordedBlob && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-4 shadow-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                          <span className="text-white text-sm">🔊</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-green-800 text-sm">Ready!</h4>
                          <p className="text-xs text-green-600 font-medium">
                            {recordingType === "video" ? "Video" : "Audio"} recorded
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={downloadRecording}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-2 px-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center text-xs"
                          >
                            <span className="mr-1">📥</span>
                            Download
                          </button>
                          <button
                            onClick={useRecording}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 px-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl text-xs"
                          >
                            Use
                          </button>
                        </div>

                        {onSaveToLibrary && (
                          <button
                            onClick={saveToMediaLibrary}
                            disabled={isSaving || saveSuccess}
                            className={`w-full py-2 px-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center text-xs ${
                              saveSuccess
                                ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white cursor-default"
                                : isSaving
                                ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed"
                                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                            }`}
                          >
                            {isSaving ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                Saving...
                              </>
                            ) : saveSuccess ? (
                              <>
                                <span className="mr-1">✅</span>
                                Saved
                              </>
                            ) : (
                              <>
                                <span className="mr-1">💾</span>
                                Save to media
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {(isRecording || recordingTime > 0 || recordedBlob || isScrolling) && (
                    <div className="mb-4">
                      <button
                        onClick={resetAllStates}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-2 px-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center text-xs"
                      >
                        <span className="mr-1">🔄</span>
                        Reset all
                      </button>
                    </div>
                  )}

                  <div className="mt-auto">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3 shadow-lg">
                      <h4 className="font-bold text-blue-800 mb-2 flex items-center text-xs">
                        <span className="mr-1">✨</span>
                        Tips
                      </h4>
                      <ul className="text-xs text-blue-700 space-y-1 font-medium">
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-1">•</span>
                          Drag window header to move
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-1">•</span>
                          Resize by dragging edges/corners
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-1">•</span>
                          Use fullscreen for focus
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-1">•</span>
                          Space to start/stop scrolling
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default TeleprompterModal;