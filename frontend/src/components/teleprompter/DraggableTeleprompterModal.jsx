// components/teleprompter/DraggableTeleprompterModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Play, Pause, RotateCcw, Move, Maximize2, Minimize2, X, Volume2 } from 'lucide-react';

const DraggableTeleprompterModal = ({ 
  isOpen, 
  onClose, 
  script = "",
  scriptTitle = "Сценарий",
  onRecordingComplete
}) => {
  // Состояния суфлёра
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [fontSize, setFontSize] = useState(32);
  const [position, setPosition] = useState(0);
  
  // Состояния записи
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  
  // Состояния модального окна
  const [modalPosition, setModalPosition] = useState({ x: 100, y: 100 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Refs
  const textRef = useRef(null);
  const modalRef = useRef(null);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(Date.now());
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Автопрокрутка суфлёра
  useEffect(() => {
    if (isPlaying && textRef.current && isOpen) {
      const animate = () => {
        const now = Date.now();
        const deltaTime = now - lastTimeRef.current;
        lastTimeRef.current = now;

        setPosition(prev => {
          const newPosition = prev + (speed * deltaTime * 100);
          const maxScroll = textRef.current.scrollHeight - textRef.current.clientHeight;
          
          if (newPosition >= maxScroll) {
            setIsPlaying(false);
            return maxScroll;
          }
          
          return Math.max(0, newPosition);
        });

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, speed, isOpen]);

  // Синхронизация прокрутки
  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = position;
    }
  }, [position]);

  // Таймер записи
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // Сброс при открытии
  useEffect(() => {
    if (isOpen) {
      setPosition(0);
      setIsPlaying(false);
      setRecordingTime(0);
      lastTimeRef.current = Date.now();
    }
  }, [isOpen]);

  // Drag and Drop функциональность
  const handleMouseDown = (e) => {
    if (!isFullscreen && e.target.closest('.drag-handle')) {
      setIsDragging(true);
      const rect = modalRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && !isFullscreen) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Ограничиваем положение в пределах экрана
        const maxX = window.innerWidth - 400;
        const maxY = window.innerHeight - 300;
        
        setModalPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, isFullscreen]);

  // Запуск записи
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        
        if (onRecordingComplete) {
          onRecordingComplete({
            blob: audioBlob,
            url: audioUrl,
            duration: recordingTime,
            timestamp: new Date().toISOString(),
            scriptTitle: scriptTitle
          });
        }
        
        // Останавливаем поток
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

    } catch (error) {
      console.error('Ошибка доступа к микрофону:', error);
      alert('Не удалось получить доступ к микрофону. Проверьте разрешения.');
    }
  };

  // Остановка записи
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPlaying(false);
    }
  };

  // Управление суфлёром
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    lastTimeRef.current = Date.now();
  };

  const resetTeleprompter = () => {
    setIsPlaying(false);
    setPosition(0);
  };

  // Старт записи с суфлёром
  const startRecordingWithTeleprompter = async () => {
    await startRecording();
    // Автоматически запускаем суфлёр через 1 секунду
    setTimeout(() => {
      setIsPlaying(true);
      lastTimeRef.current = Date.now();
    }, 1000);
  };

  // Форматирование времени
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const bloggerSpeeds = [3, 4, 5, 6, 7, 8, 10, 12];
  const fontSizes = [24, 28, 32, 36, 40, 44, 48];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" />
      
      <div
        ref={modalRef}
        className="absolute pointer-events-auto"
        style={{
          left: isFullscreen ? 0 : modalPosition.x,
          top: isFullscreen ? 0 : modalPosition.y,
          width: isFullscreen ? '100%' : '500px',
          height: isFullscreen ? '100%' : 'auto',
          maxHeight: isFullscreen ? '100%' : '80vh'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="bg-white rounded-xl shadow-2xl border-2 border-slate-200 overflow-hidden h-full flex flex-col">
          <div className="drag-handle bg-gradient-to-r from-slate-700 to-blue-700 text-white p-4 cursor-move select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Move size={18} />
                <h3 className="font-bold text-lg">🎬 {scriptTitle}</h3>
                {isRecording && (
                  <div className="flex items-center space-x-2 bg-red-500 px-3 py-1 rounded-full text-sm animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>REC {formatTime(recordingTime)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title={isFullscreen ? "Свернуть" : "На весь экран"}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Закрыть"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 border-b border-gray-200">
            <div className="flex items-center justify-center space-x-3 mb-4">
              {!isRecording ? (
                <>
                  <button
                    onClick={startRecordingWithTeleprompter}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 shadow-lg flex items-center space-x-2"
                  >
                    <Mic size={16} />
                    <span>🎬 Запись с суфлёром</span>
                  </button>
                  <button
                    onClick={startRecording}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center space-x-2"
                  >
                    <Mic size={16} />
                    <span>Только запись</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={stopRecording}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300"
                >
                  ⏹️ Остановить запись
                </button>
              )}
            </div>

            <div className="flex items-center justify-center space-x-2 mb-4">
              <button
                onClick={togglePlay}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isPlaying ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={resetTeleprompter}
                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-300"
              >
                <RotateCcw size={16} />
              </button>
            </div>


            <div className="flex items-center justify-center space-x-2 mb-3">
              <span className="text-sm font-medium text-gray-600">Скорость:</span>
              {bloggerSpeeds.map(speedValue => (
                <button
                  key={speedValue}
                  onClick={() => setSpeed(speedValue)}
                  className={`px-2 py-1 text-sm rounded transition-all duration-200 ${
                    speed === speedValue 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {speedValue}x
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm font-medium text-gray-600">Размер:</span>
              {fontSizes.map(size => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-2 py-1 text-sm rounded transition-all duration-200 ${
                    fontSize === size 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden">
            <div
              ref={textRef}
              className="bg-black text-white p-6 h-full overflow-y-auto scrollbar-hide"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: '1.7',
                fontFamily: 'Arial, sans-serif',
                minHeight: isFullscreen ? 'calc(100vh - 200px)' : '300px'
              }}
            >
              <div className="whitespace-pre-wrap text-center">
                {script || "Добавьте текст сценария для использования суфлёра"}
              </div>
            </div>

            <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <div className="h-1 bg-red-500 opacity-70 mx-6 rounded-full shadow-lg"></div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-800">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-red-500 transition-all duration-100"
                style={{ 
                  width: textRef.current ? 
                    `${(position / Math.max(1, textRef.current.scrollHeight - textRef.current.clientHeight)) * 100}%` : 
                    '0%' 
                }}
              />
            </div>
          </div>

          {audioUrl && (
            <div className="bg-green-50 p-4 border-t border-green-200">
              <div className="flex items-center space-x-3 mb-3">
                <Volume2 size={20} className="text-green-600" />
                <span className="font-semibold text-green-800">
                  Запись готова! ({formatTime(recordingTime)})
                </span>
              </div>
              <audio 
                controls 
                src={audioUrl}
                className="w-full mb-3"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = audioUrl;
                    a.download = `${scriptTitle}_${Date.now()}.webm`;
                    a.click();
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  📥 Скачать
                </button>
                <button
                  onClick={() => {
                    setAudioUrl(null);
                    setAudioBlob(null);
                    setRecordingTime(0);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  🗑️ Удалить
                </button>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-3 border-t border-blue-200">
            <p className="text-sm text-blue-700 text-center">
              💡 <strong>Совет:</strong> Перетащите окно в удобное место. Скорость 5x-8x идеальна для живой речи
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraggableTeleprompterModal;