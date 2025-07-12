import React, { useState, useRef, useEffect } from "react";
import { X, Download, Check, AlertCircle, Settings, Play, Film } from "lucide-react";

const FFmpegVideoExporter = ({
  isOpen,
  onClose,
  timelineItems = [],
  videoDuration = 60,
  timelineData,
  elements,
  clips,
  mediaItems,
}) => {
  const actualTimelineItems = React.useMemo(() => {
    const items = timelineItems || timelineData || elements || clips || mediaItems || [];
    
    console.log('🔄 Получили данные timeline:', {
      timelineItems: timelineItems?.length || 0,
      timelineData: timelineData?.length || 0,
      elements: elements?.length || 0,
      clips: clips?.length || 0,
      mediaItems: mediaItems?.length || 0,
      finalItems: items?.length || 0
    });
    
    if (items?.length > 0) {
      console.log('📋 Первый элемент timeline:', items[0]);
    }
    
    return items;
  }, [timelineItems, timelineData, elements, clips, mediaItems]);

  const [exportSettings, setExportSettings] = useState({
    resolution: "1280x720",
    fps: 24, 
    bitrate: 2000,
    format: "mp4",
    quality: "medium",
    filename: `video_${Date.now()}`,
    compatibilityMode: "standard",
    audioQuality: "standard"
  });

  const [ffmpeg, setFfmpeg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState("idle");
  const [previewFrame, setPreviewFrame] = useState(null);
  const [error, setError] = useState(null);
  
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);

  // Автоматический расчет длительности на основе timeline
  const calculateTotalDuration = () => {
    if (actualTimelineItems.length === 0) return videoDuration;
    
    const maxEndTime = Math.max(...actualTimelineItems.map(item => 
      (item.startTime || 0) + (item.duration || 0)
    ));
    
    const calculatedDuration = Math.max(maxEndTime, videoDuration);
    console.log(`⏱️ Рассчитанная длительность: ${calculatedDuration.toFixed(2)}s`);
    return calculatedDuration;
  };

  const getPreviewDimensions = () => {
    return {
      width: 1920,
      height: 1080,
    };
  };

  // Инициализация FFmpeg
  useEffect(() => {
    const initFFmpeg = async () => {
      if (ffmpeg || !isOpen) return;

      setIsLoading(true);
      setExportStage("loading");
      setError(null);
      
      try {
        console.log('🔄 Инициализация FFmpeg...');
        
        const ffmpegModule = await import('@ffmpeg/ffmpeg');
        const utilModule = await import('@ffmpeg/util');
        
        const FFmpegClass = ffmpegModule.FFmpeg;
        const fetchFile = utilModule.fetchFile;
        
        const ffmpegInstance = new FFmpegClass();
        
        await ffmpegInstance.load({
          coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
          wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
        });

        ffmpegInstance.on('progress', ({ progress }) => {
          if (isExporting) {
            const adjustedProgress = 70 + Math.round(progress * 25);
            setExportProgress(Math.min(adjustedProgress, 95));
          }
        });

        window.fetchFile = fetchFile;
        setFfmpeg(ffmpegInstance);
        setExportStage("ready");
        console.log('✅ FFmpeg готов');
        
      } catch (error) {
        console.error('❌ Ошибка FFmpeg:', error);
        setError(error.message);
        setExportStage("error");
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      initFFmpeg();
    }
  }, [isOpen]);

  const getActiveItemsAtTime = (currentTime) => {
    console.log(`🔍 Проверяем активные элементы на времени ${currentTime.toFixed(1)}s`);
    
    const activeItems = actualTimelineItems.filter(item => {
      const startTime = item.startTime || 0;
      const duration = item.duration || 0;
      const endTime = startTime + duration;
      const isActive = currentTime >= startTime && currentTime <= endTime;
      
      console.log(`   📺 "${item.name}": ${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s → ${isActive ? '✅ АКТИВЕН' : '❌ неактивен'}`);
      return isActive;
    });

    console.log(`📋 Найдено активных элементов: ${activeItems.length}/${actualTimelineItems.length}`);
    return activeItems;
  };

  const renderFrameAtTime = async (ctx, currentTime, width, height) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    console.log(`🎬 Рендерим кадр на времени ${currentTime.toFixed(1)}s...`);

    const activeItems = getActiveItemsAtTime(currentTime);

    if (activeItems.length === 0) {
      ctx.fillStyle = '#333333';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.min(48, width / 20)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Время: ${currentTime.toFixed(1)}s`, width / 2, height / 2 - 30);
      ctx.fillText(`Нет активных элементов`, width / 2, height / 2 + 30);
      return;
    }

    const sortedItems = activeItems.sort((a, b) => {
      const layerOrder = { main: 1, overlay: 2, audio: 0 };
      return (layerOrder[a.trackType] || 1) - (layerOrder[b.trackType] || 1);
    });

    for (let i = 0; i < sortedItems.length; i++) {
      const item = sortedItems[i];
      
      if (item.trackType === 'audio') continue;

      try {
        const element = await loadMediaElement(item);
        
        if (element) {
          const relativeTime = currentTime - (item.startTime || 0);
          await drawElementOnCanvas(ctx, element, item, relativeTime, width, height);
        }
      } catch (error) {
        console.error(`❌ Ошибка рендеринга ${item.name}:`, error);
      }
    }
  };

  const loadMediaElement = async (item) => {
    console.log(`📦 Загружаем элемент: "${item.name}"`);
    console.log(`🔍 Тип элемента: ${item.type}, trackType: ${item.trackType}`);
    
    if (!item.url) {
      console.error(`❌ URL отсутствует для ${item.name}`);
      return null;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout loading ${item.name}`));
      }, 10000);

      const isVideo = item.type === 'videos' || 
                     item.trackType === 'main' || 
                     item.name?.toLowerCase().includes('.mp4') ||
                     item.name?.toLowerCase().includes('.webm') ||
                     item.name?.toLowerCase().includes('.mov');
      
      const isImage = item.type === 'images' || 
                     item.type !== 'videos' && 
                     item.trackType !== 'audio' &&
                     !isVideo;

      console.log(`🎯 Определен тип: ${isVideo ? 'ВИДЕО' : isImage ? 'ИЗОБРАЖЕНИЕ' : 'НЕИЗВЕСТНО'} для ${item.name}`);

      if (isVideo) {
        const video = document.createElement('video');
        if (!item.url.startsWith('blob:')) {
          video.crossOrigin = 'anonymous';
        }
        video.muted = true;
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          console.log(`✅ Видео загружено: ${item.name}, размер: ${video.videoWidth}x${video.videoHeight}`);
          clearTimeout(timeout);
          resolve(video);
        };
        
        video.onerror = (e) => {
          console.error(`❌ Ошибка загрузки видео ${item.name}:`, e);
          clearTimeout(timeout);
          reject(new Error(`Failed to load video: ${item.name}`));
        };
        
        video.src = item.url;
        video.load();
        
      } else {
        const img = new Image();
        if (!item.url.startsWith('blob:')) {
          img.crossOrigin = 'anonymous';
        }
        
        img.onload = () => {
          console.log(`✅ Изображение загружено: ${item.name}, размер: ${img.naturalWidth}x${img.naturalHeight}`);
          
          // Проверяем формат изображения
          const canvas = document.createElement('canvas');
          canvas.width = 1;
          canvas.height = 1;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 1, 1);
          const imageData = ctx.getImageData(0, 0, 1, 1);
          const hasAlpha = imageData.data[3] < 255;
          
          console.log(`🔍 Изображение ${item.name} имеет альфа-канал: ${hasAlpha}`);
          
          clearTimeout(timeout);
          resolve(img);
        };
        
        img.onerror = (e) => {
          console.error(`❌ Ошибка загрузки изображения ${item.name}:`, e);
          clearTimeout(timeout);
          reject(new Error(`Failed to load image: ${item.name}`));
        };
        
        img.src = item.url;
      }
    });
  };

  const drawElementOnCanvas = async (ctx, element, item, relativeTime, canvasWidth, canvasHeight) => {
    try {
      if (element.tagName === 'VIDEO') {
        const trimStart = item.trimStart || 0;
        const maxTime = Math.min(element.duration || item.duration || 0, item.duration || element.duration || 0);
        const targetTime = Math.max(0, Math.min(trimStart + relativeTime, maxTime));
        
        if (Math.abs(element.currentTime - targetTime) > 0.1) {
          element.currentTime = targetTime;
          await new Promise(resolve => {
            const checkReady = () => {
              if (element.readyState >= 2) {
                resolve();
              } else {
                setTimeout(checkReady, 10);
              }
            };
            checkReady();
            setTimeout(resolve, 200);
          });
        }
      }

      const elementWidth = element.videoWidth || element.naturalWidth || element.width;
      const elementHeight = element.videoHeight || element.naturalHeight || element.height;

      if (!elementWidth || !elementHeight) return;

      let drawWidth, drawHeight, drawX, drawY;

      if (item.trackType === 'main') {
        const canvasRatio = canvasWidth / canvasHeight;
        const elementRatio = elementWidth / elementHeight;

        if (elementRatio > canvasRatio) {
          drawWidth = canvasWidth;
          drawHeight = canvasWidth / elementRatio;
          drawX = 0;
          drawY = (canvasHeight - drawHeight) / 2;
        } else {
          drawHeight = canvasHeight;
          drawWidth = canvasHeight * elementRatio;
          drawX = (canvasWidth - drawWidth) / 2;
          drawY = 0;
        }
      } else if (item.trackType === 'overlay') {
        const uiX = item.x || 0;
        const uiY = item.y || 0;
        const uiWidth = item.width || 200;
        const uiHeight = item.height || 150;
        const uiScale = item.scale || 1;
        
        const previewDims = getPreviewDimensions();
        const scaleX = canvasWidth / previewDims.width;
        const scaleY = canvasHeight / previewDims.height;
        
        drawX = uiX * scaleX;
        drawY = uiY * scaleY;
        drawWidth = uiWidth * scaleX * uiScale;
        drawHeight = uiHeight * scaleY * uiScale;
      }

      // ИСПРАВЛЕНИЕ: Сохраняем состояние контекста перед изменениями
      ctx.save();

      if (item.rotation && item.rotation !== 0) {
        const centerX = drawX + drawWidth / 2;
        const centerY = drawY + drawHeight / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      const opacity = item.opacity !== undefined ? item.opacity : 1;
      ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

      // ИСПРАВЛЕНИЕ: Настройки для правильного рендеринга изображений
      if (element.tagName === 'IMG') {
        // Для изображений используем настройки сглаживания
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Проверяем, есть ли у изображения альфа-канал
        if (item.type === 'images' || element.src.includes('.png')) {
          console.log(`🖼️ Рендерим изображение с возможным альфа-каналом: ${item.name}`);
          
          // Создаем временный canvas для предварительной обработки изображения
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = elementWidth;
          tempCanvas.height = elementHeight;
          const tempCtx = tempCanvas.getContext('2d', { alpha: false });
          
          // Заполняем черным фоном для удаления альфа-канала
          tempCtx.fillStyle = '#000000';
          tempCtx.fillRect(0, 0, elementWidth, elementHeight);
          
          // Рисуем изображение поверх черного фона
          tempCtx.drawImage(element, 0, 0);
          
          // Теперь рисуем обработанное изображение на основной canvas
          ctx.drawImage(tempCanvas, drawX, drawY, drawWidth, drawHeight);
        } else {
          // Обычные изображения без альфа-канала
          ctx.drawImage(element, drawX, drawY, drawWidth, drawHeight);
        }
      } else {
        // Видео элементы
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(element, drawX, drawY, drawWidth, drawHeight);
      }
      
      // ИСПРАВЛЕНИЕ: Всегда восстанавливаем состояние контекста
      ctx.restore();
      
    } catch (error) {
      console.error(`❌ Ошибка отрисовки ${item.name}:`, error);
      throw error;
    }
  };

  useEffect(() => {
    if (isOpen && actualTimelineItems.length > 0 && exportStage === "ready") {
      generatePreviewFrame();
    }
  }, [isOpen, actualTimelineItems, exportSettings.resolution, exportStage]);

  const generatePreviewFrame = async () => {
    try {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;

      // ИСПРАВЛЕНИЕ: Используем контекст без альфа-канала для превью
      const ctx = canvas.getContext('2d', { 
        alpha: false,
        colorSpace: 'srgb',
        willReadFrequently: false
      });
      
      const [width, height] = exportSettings.resolution.split('x').map(Number);
      canvas.width = width;
      canvas.height = height;

      // Принудительно заполняем черным фоном
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const firstItem = actualTimelineItems.find(item => item.trackType === 'main');
      let previewTime = 0;
      
      if (firstItem) {
        const itemStart = firstItem.startTime || 0;
        const itemDuration = firstItem.duration || 0;
        previewTime = itemStart + (itemDuration / 2);
      } else {
        const totalDuration = calculateTotalDuration();
        previewTime = totalDuration / 2;
      }
      
      console.log(`🖼️ Генерируем превью с поддержкой изображений на времени ${previewTime.toFixed(1)}s`);
      
      await renderFrameAtTime(ctx, previewTime, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setPreviewFrame(url);
          console.log(`✅ Превью создано: ${blob.type}, размер: ${(blob.size / 1024).toFixed(1)}KB`);
        }
      }, 'image/png'); // Используем PNG для превью с изображениями
    } catch (error) {
      console.warn('⚠️ Ошибка создания превью:', error);
    }
  };

  // ИСПРАВЛЕННЫЙ экспорт с выбором режима совместимости
  const startExport = async () => {
    if (!ffmpeg || isExporting || actualTimelineItems.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportStage("preparing");
    setError(null);

    try {
      console.log(`🎬 Начинаем экспорт в режиме: ${exportSettings.compatibilityMode}`);
      
      const totalDuration = calculateTotalDuration();
      const maxDuration = Math.min(totalDuration, 120);
      const actualDuration = maxDuration;

      setExportStage("loading_media");
      const mediaElements = await prepareMediaElements();
      setExportProgress(15);

      setExportStage("rendering_frames");
      const frames = await renderAllFrames(mediaElements, actualDuration);
      setExportProgress(50);

      setExportStage("processing_audio");
      const audioFiles = await prepareAudioFiles();
      setExportProgress(60);

      setExportStage("encoding");
      
      // Выбираем метод кодирования в зависимости от режима совместимости
      let videoBlob;
      switch (exportSettings.compatibilityMode) {
        case "baseline":
          videoBlob = await encodeWithFFmpegBaseline(frames, audioFiles, actualDuration);
          break;
        case "maximum":
          videoBlob = await encodeWithFFmpegMaxCompatibility(frames, audioFiles, actualDuration);
          break;
        default:
          videoBlob = await encodeWithFFmpeg(frames, audioFiles, actualDuration);
      }
      
      setExportProgress(95);

      setExportStage("downloading");
      await downloadVideo(videoBlob);
      setExportProgress(100);

      setExportStage("completed");
      setTimeout(() => {
        setExportStage("ready");
        setExportProgress(0);
      }, 3000);

    } catch (error) {
      console.error('❌ Ошибка экспорта:', error);
      setError(error.message);
      setExportStage("error");
    } finally {
      setIsExporting(false);
    }
  };

  const prepareMediaElements = async () => {
    const elements = new Map();
    const videoElements = actualTimelineItems.filter(item => item.trackType !== 'audio');
    
    for (const item of videoElements) {
      try {
        const element = await loadMediaElement(item);
        if (element) {
          elements.set(item.id, element);
        }
      } catch (error) {
        console.warn(`⚠️ Не удалось загрузить ${item.name}:`, error);
      }
    }

    return elements;
  };

  const renderAllFrames = async (mediaElements, duration) => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas не найден');

    // ИСПРАВЛЕНИЕ: Используем 2D контекст с отключенным альфа-каналом
    const ctx = canvas.getContext('2d', { 
      alpha: false,  // Отключаем альфа-канал для совместимости
      colorSpace: 'srgb',  // Стандартное цветовое пространство
      willReadFrequently: false,
      desynchronized: false
    });
    
    const [width, height] = exportSettings.resolution.split('x').map(Number);
    canvas.width = width;
    canvas.height = height;

    console.log(`🎞️ Начинаем рендеринг кадров: ${width}x${height}, контекст без альфа-канала`);

    const totalFrames = Math.ceil(duration * exportSettings.fps);
    const frames = [];
    const maxFrames = Math.min(totalFrames, 1200);
    
    for (let frame = 0; frame < maxFrames; frame++) {
      const currentTime = (frame / exportSettings.fps);
      if (currentTime >= duration) break;
      
      try {
        // ИСПРАВЛЕНИЕ: Принудительно заполняем фон черным для удаления альфа-канала
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        
        await renderFrameAtTime(ctx, currentTime, width, height);

        // ИСПРАВЛЕНИЕ: Используем PNG для лучшей совместимости с изображениями
        const blob = await new Promise(resolve => {
          // Проверяем есть ли изображения в timeline
          const hasImages = actualTimelineItems.some(item => 
            item.type !== 'videos' && item.trackType !== 'audio'
          );
          
          if (hasImages) {
            // Для изображений используем PNG без альфа-канала
            canvas.toBlob(resolve, 'image/png');
          } else {
            // Для видео используем JPEG
            canvas.toBlob(resolve, 'image/jpeg', 0.85);
          }
        });
        
        if (blob) {
          frames.push(blob);
          
          // Логируем первый кадр для диагностики
          if (frame === 0) {
            console.log(`🖼️ Первый кадр: ${blob.type}, размер: ${(blob.size / 1024).toFixed(1)}KB`);
          }
        }

        const progress = 15 + Math.round((frame / maxFrames) * 35);
        setExportProgress(progress);

        if (frame % 100 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
        
      } catch (error) {
        console.error(`❌ Ошибка рендеринга кадра ${frame}:`, error);
        break;
      }
    }

    console.log(`✅ Рендеринг завершен: ${frames.length} кадров`);
    return frames;
  };

  const prepareAudioFiles = async () => {
    const audioItems = actualTimelineItems.filter(item => item.trackType === 'audio');
    const audioFiles = [];

    for (let i = 0; i < Math.min(audioItems.length, 3); i++) {
      const item = audioItems[i];
      try {
        const response = await fetch(item.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const blob = await response.blob();
        audioFiles.push({
          blob,
          startTime: item.startTime || 0,
          duration: item.duration || videoDuration,
          name: item.name,
          index: i
        });
        
      } catch (error) {
        console.warn(`⚠️ Ошибка загрузки аудио ${item.name}:`, error);
      }
    }

    return audioFiles;
  };

  // ИСПРАВЛЕННОЕ кодирование с поддержкой изображений
  const encodeWithFFmpeg = async (frames, audioFiles, duration) => {
    if (!window.fetchFile || frames.length === 0) {
      throw new Error('Нет кадров для кодирования');
    }

    try {
      await cleanupTempFiles(2000, 5);

      // ИСПРАВЛЕНИЕ: Определяем тип кадров и выбираем правильное расширение
      const hasImages = actualTimelineItems.some(item => 
        item.type !== 'videos' && item.trackType !== 'audio'
      );
      
      console.log(`📦 Кодируем ${frames.length} кадров, содержат изображения: ${hasImages}`);
      
      // Записываем кадры с правильным форматом
      for (let i = 0; i < frames.length; i++) {
        const frameData = await window.fetchFile(frames[i]);
        
        if (hasImages) {
          // Для изображений используем PNG
          const filename = `frame_${i.toString().padStart(6, '0')}.png`;
          await ffmpeg.writeFile(filename, frameData);
        } else {
          // Для видео используем JPEG
          const filename = `frame_${i.toString().padStart(6, '0')}.jpg`;
          await ffmpeg.writeFile(filename, frameData);
        }
        
        if (i % 50 === 0) {
          const progress = 60 + Math.round((i / frames.length) * 10);
          setExportProgress(progress);
        }
      }

      // Записываем аудио файлы
      for (let i = 0; i < audioFiles.length; i++) {
        const audioFile = audioFiles[i];
        const audioFileName = `audio_${i}.mp3`;
        await ffmpeg.writeFile(audioFileName, await window.fetchFile(audioFile.blob));
      }

      setExportProgress(70);

      // ИСПРАВЛЕННАЯ команда FFmpeg с поддержкой изображений
      const args = [
        '-framerate', exportSettings.fps.toString(),
      ];
      
      // Выбираем правильный input pattern
      if (hasImages) {
        args.push('-i', 'frame_%06d.png');
      } else {
        args.push('-i', 'frame_%06d.jpg');
      }
      
      args.push('-t', Math.min(duration, frames.length / exportSettings.fps).toString());

      // Добавляем аудио если есть
      if (audioFiles.length > 0) {
        args.push('-i', 'audio_0.mp3');
        
        if (audioFiles.length > 1) {
          for (let i = 1; i < audioFiles.length; i++) {
            args.push('-i', `audio_${i}.mp3`);
          }
          
          const filterComplex = audioFiles.map((_, i) => `[${i + 1}:a]`).join('') + 
            `amix=inputs=${audioFiles.length}:duration=shortest:dropout_transition=0.5[aout]`;
          
          args.push('-filter_complex', filterComplex);
          args.push('-map', '0:v');
          args.push('-map', '[aout]');
        } else {
          args.push('-c:a', 'aac');
          args.push('-b:a', '128k');
          args.push('-ar', '44100');
        }
        
        args.push('-shortest');
      }

      // УЛУЧШЕННЫЕ настройки для работы с изображениями
      args.push(
        // Видео кодек и профиль
        '-c:v', 'libx264',
        '-profile:v', 'main',
        '-level', '3.1',
        
        // Качество и скорость
        '-preset', 'medium',
        '-crf', '23',
        
        // КРИТИЧЕСКИ ВАЖНО: Pixel format для изображений
        '-pix_fmt', 'yuv420p',
        
        // ИСПРАВЛЕНИЕ: Фильтры для правильной обработки изображений
        '-vf', 'format=yuv420p,scale=trunc(iw/2)*2:trunc(ih/2)*2', // Обеспечиваем четные размеры
        
        // Цветовые настройки
        '-colorspace', 'bt709',
        '-color_primaries', 'bt709',
        '-color_trc', 'bt709',
        
        // Частота кадров и GOP
        '-r', exportSettings.fps.toString(),
        '-g', (exportSettings.fps * 2).toString(),
        '-keyint_min', exportSettings.fps.toString(),
        
        // Дополнительные настройки совместимости
        '-movflags', '+faststart',
        '-strict', '-2',
        '-threads', '0',
        '-tune', hasImages ? 'stillimage' : 'film', // ИСПРАВЛЕНИЕ: Разные настройки для изображений
        
        'output.mp4'
      );

      console.log('🔧 Команда FFmpeg для изображений:', args.join(' '));

      await ffmpeg.exec(args);
      
      setExportProgress(90);

      const data = await ffmpeg.readFile('output.mp4');
      const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });

      await cleanupTempFiles(frames.length, audioFiles.length);
      return videoBlob;

    } catch (error) {
      try {
        await cleanupTempFiles(frames.length, audioFiles.length);
      } catch (e) {}
      
      throw new Error(`Ошибка кодирования: ${error.message}`);
    }
  };

  // BASELINE профиль с поддержкой изображений
  const encodeWithFFmpegBaseline = async (frames, audioFiles, duration) => {
    if (!window.fetchFile || frames.length === 0) {
      throw new Error('Нет кадров для кодирования');
    }

    try {
      await cleanupTempFiles(2000, 5);

      // Определяем тип кадров
      const hasImages = actualTimelineItems.some(item => 
        item.type !== 'videos' && item.trackType !== 'audio'
      );

      // Записываем кадры
      for (let i = 0; i < frames.length; i++) {
        const frameData = await window.fetchFile(frames[i]);
        
        if (hasImages) {
          const filename = `frame_${i.toString().padStart(6, '0')}.png`;
          await ffmpeg.writeFile(filename, frameData);
        } else {
          const filename = `frame_${i.toString().padStart(6, '0')}.jpg`;
          await ffmpeg.writeFile(filename, frameData);
        }
        
        if (i % 50 === 0) {
          const progress = 60 + Math.round((i / frames.length) * 10);
          setExportProgress(progress);
        }
      }

      // Записываем аудио файлы
      for (let i = 0; i < audioFiles.length; i++) {
        const audioFile = audioFiles[i];
        const audioFileName = `audio_${i}.mp3`;
        await ffmpeg.writeFile(audioFileName, await window.fetchFile(audioFile.blob));
      }

      setExportProgress(70);

      const args = [
        '-framerate', exportSettings.fps.toString(),
      ];
      
      if (hasImages) {
        args.push('-i', 'frame_%06d.png');
      } else {
        args.push('-i', 'frame_%06d.jpg');
      }
      
      args.push('-t', Math.min(duration, frames.length / exportSettings.fps).toString());

      // Добавляем аудио если есть
      if (audioFiles.length > 0) {
        args.push('-i', 'audio_0.mp3');
        args.push('-c:a', 'aac');
        args.push('-b:a', '128k');
        args.push('-ar', '44100');
        args.push('-shortest');
      }

      // BASELINE профиль H.264 с поддержкой изображений
      args.push(
        '-c:v', 'libx264',
        '-profile:v', 'baseline',
        '-level', '3.0',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-vf', 'format=yuv420p,scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-r', exportSettings.fps.toString(),
        '-g', (exportSettings.fps * 3).toString(),
        '-movflags', '+faststart',
        '-strict', '-2',
        '-tune', hasImages ? 'stillimage' : 'film',
        'output.mp4'
      );

      await ffmpeg.exec(args);
      
      setExportProgress(90);

      const data = await ffmpeg.readFile('output.mp4');
      const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });

      await cleanupTempFiles(frames.length, audioFiles.length);
      return videoBlob;

    } catch (error) {
      try {
        await cleanupTempFiles(frames.length, audioFiles.length);
      } catch (e) {}
      
      throw new Error(`Ошибка baseline кодирования: ${error.message}`);
    }
  };

  // МАКСИМАЛЬНО СОВМЕСТИМАЯ функция с поддержкой изображений
  const encodeWithFFmpegMaxCompatibility = async (frames, audioFiles, duration) => {
    if (!window.fetchFile || frames.length === 0) {
      throw new Error('Нет кадров для кодирования');
    }

    try {
      await cleanupTempFiles(2000, 5);

      // Определяем тип кадров
      const hasImages = actualTimelineItems.some(item => 
        item.type !== 'videos' && item.trackType !== 'audio'
      );

      // Записываем кадры
      for (let i = 0; i < frames.length; i++) {
        const frameData = await window.fetchFile(frames[i]);
        
        if (hasImages) {
          const filename = `frame_${i.toString().padStart(6, '0')}.png`;
          await ffmpeg.writeFile(filename, frameData);
        } else {
          const filename = `frame_${i.toString().padStart(6, '0')}.jpg`;
          await ffmpeg.writeFile(filename, frameData);
        }
        
        if (i % 50 === 0) {
          const progress = 60 + Math.round((i / frames.length) * 10);
          setExportProgress(progress);
        }
      }

      // Записываем аудио
      for (let i = 0; i < audioFiles.length; i++) {
        const audioFile = audioFiles[i];
        const audioFileName = `audio_${i}.mp3`;
        await ffmpeg.writeFile(audioFileName, await window.fetchFile(audioFile.blob));
      }

      setExportProgress(70);

      const args = [
        '-framerate', '24', // Принудительно 24 FPS
      ];
      
      if (hasImages) {
        args.push('-i', 'frame_%06d.png');
      } else {
        args.push('-i', 'frame_%06d.jpg');
      }
      
      args.push('-t', Math.min(duration, frames.length / 24).toString());

      // Простое аудио
      if (audioFiles.length > 0) {
        args.push('-i', 'audio_0.mp3');
        args.push('-c:a', 'aac');
        args.push('-b:a', '96k');
        args.push('-ar', '44100');
        args.push('-ac', '2');
        args.push('-shortest');
      }

      // САМЫЕ КОНСЕРВАТИВНЫЕ настройки H.264 с поддержкой изображений
      args.push(
        '-c:v', 'libx264',
        '-profile:v', 'baseline',
        '-level', '3.0',
        '-b:v', '1500k', // Фиксированный битрейт
        '-maxrate', '1500k',
        '-bufsize', '3000k',
        '-pix_fmt', 'yuv420p',
        
        // КРИТИЧЕСКИЕ фильтры для изображений
        '-vf', 'format=yuv420p,scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=24',
        
        '-r', '24',
        '-g', '48',
        '-keyint_min', '24',
        '-preset', 'slow',
        '-tune', hasImages ? 'stillimage' : 'film',
        '-movflags', '+faststart',
        '-avoid_negative_ts', 'make_zero',
        'output.mp4'
      );

      console.log('🔧 Максимально совместимая команда для изображений:', args.join(' '));

      await ffmpeg.exec(args);
      
      setExportProgress(90);

      const data = await ffmpeg.readFile('output.mp4');
      const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });

      await cleanupTempFiles(frames.length, audioFiles.length);
      return videoBlob;

    } catch (error) {
      try {
        await cleanupTempFiles(frames.length, audioFiles.length);
      } catch (e) {}
      
      throw new Error(`Ошибка кодирования максимальной совместимости: ${error.message}`);
    }
  };

  const cleanupTempFiles = async (frameCount, audioCount) => {
    console.log('🧹 Очистка временных файлов...');
    
    // ИСПРАВЛЕНИЕ: Удаляем как PNG, так и JPEG кадры
    for (let i = 0; i < frameCount; i++) {
      try {
        // Пытаемся удалить PNG
        await ffmpeg.deleteFile(`frame_${i.toString().padStart(6, '0')}.png`);
      } catch (e) {}
      
      try {
        // Пытаемся удалить JPEG
        await ffmpeg.deleteFile(`frame_${i.toString().padStart(6, '0')}.jpg`);
      } catch (e) {}
    }

    // Удаляем аудио файлы
    for (let i = 0; i < audioCount; i++) {
      try {
        await ffmpeg.deleteFile(`audio_${i}.mp3`);
      } catch (e) {}
    }

    // Удаляем выходной файл
    try {
      await ffmpeg.deleteFile('output.mp4');
    } catch (e) {}
    
    console.log('✅ Временные файлы очищены');
  };

  const downloadVideo = async (blob) => {
    const filename = `${exportSettings.filename}.${exportSettings.format}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStageText = () => {
    switch (exportStage) {
      case "loading": return "Загрузка FFmpeg...";
      case "preparing": return "Анализ timeline...";
      case "loading_media": return "Загрузка медиа файлов...";
      case "rendering_frames": return `Рендеринг кадров...`;
      case "processing_audio": return "Подготовка аудио треков...";
      case "encoding": return `Кодирование (${exportSettings.compatibilityMode} режим)...`;
      case "downloading": return "Сохранение файла...";
      case "completed": return "✅ Экспорт завершен! Видео должно воспроизводиться.";
      case "error": return "Произошла ошибка";
      case "ready": return `Готов к экспорту (${actualTimelineItems.length} элементов, ${exportSettings.compatibilityMode} режим)`;
      default: return "Ожидание...";
    }
  };

  const getStageIcon = () => {
    switch (exportStage) {
      case "completed": return <Check size={20} className="text-green-600" />;
      case "error": return <AlertCircle size={20} className="text-red-600" />;
      case "ready": return <Play size={20} className="text-blue-600" />;
      case "loading": return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>;
      default: return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>;
    }
  };

  const canExport = ffmpeg && !isExporting && !isLoading && actualTimelineItems.length > 0 && exportStage === "ready";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[100vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Film size={24} className="mr-3 text-blue-600" />
            🖼️ ЭКСПОРТ С ПОДДЕРЖКОЙ ИЗОБРАЖЕНИЙ (исправлена проблема альфа-канала)
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isExporting}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(95vh-140px)] overflow-y-auto">
          
          {actualTimelineItems.length === 0 && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
              <div className="flex items-start">
                <AlertCircle size={24} className="text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-red-800 text-lg mb-2">❌ НЕТ ДАННЫХ TIMELINE!</h4>
                  <p className="text-red-700 mb-3">
                    Компонент экспорта не получает данные из timeline. Проверьте передачу пропсов.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start">
                <AlertCircle size={20} className="text-red-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Ошибка</h4>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
          <div className={`rounded-xl p-4 border ${
            exportStage === "error" ? "bg-red-50 border-red-200" :
            exportStage === "completed" ? "bg-green-50 border-green-200" :
            exportStage === "loading" ? "bg-orange-50 border-orange-200" :
            "bg-blue-50 border-blue-200"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                {getStageIcon()}
                <span className={`ml-3 font-medium ${
                  exportStage === "error" ? "text-red-900" :
                  exportStage === "completed" ? "text-green-900" :
                  exportStage === "loading" ? "text-orange-900" :
                  "text-blue-900"
                }`}>
                  {getStageText()}
                </span>
              </div>
              {(isExporting || isLoading) && (
                <span className={`text-sm font-medium ${
                  exportStage === "loading" ? "text-orange-700" : "text-blue-700"
                }`}>
                  {exportProgress}%
                </span>
              )}
            </div>
            {(isExporting || isLoading) && (
              <div className={`w-full rounded-full h-2 ${
                exportStage === "loading" ? "bg-orange-200" : "bg-blue-200"
              }`}>
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    exportStage === "loading" ? "bg-orange-600" : "bg-blue-600"
                  }`}
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Settings size={16} className="mr-2" />
              Настройки экспорта (исправлена совместимость)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Разрешение
                </label>
                <select
                  value={exportSettings.resolution}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, resolution: e.target.value }))}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                  disabled={isExporting || isLoading}
                >
                  <option value="640x480">480p (быстро)</option>
                  <option value="1280x720">720p (рекомендуется)</option>
                  <option value="1920x1080">1080p (медленно)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  FPS
                </label>
                <select
                  value={exportSettings.fps}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, fps: parseInt(e.target.value) }))}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                  disabled={isExporting || isLoading}
                >
                  <option value="24">24 FPS (стандарт)</option>
                  <option value="30">30 FPS (плавно)</option>
                  <option value="60">60 FPS (очень плавно)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  🔧 Режим совместимости
                </label>
                <select
                  value={exportSettings.compatibilityMode}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, compatibilityMode: e.target.value }))}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                  disabled={isExporting || isLoading}
                >
                  <option value="standard">Стандартный (Main Profile)</option>
                  <option value="baseline">Baseline (максимальная совместимость)</option>
                  <option value="maximum">Максимальная (для старых устройств)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Имя файла
                </label>
                <input
                  type="text"
                  value={exportSettings.filename}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, filename: e.target.value }))}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                  disabled={isExporting || isLoading}
                />
              </div>
            </div>
          </div>

          {actualTimelineItems.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-medium text-blue-800 mb-2">📊 Диагностика данных</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Элементов timeline:</strong> {actualTimelineItems.length}</p>
                <p><strong>Изображений:</strong> {actualTimelineItems.filter(item => item.type !== 'videos' && item.trackType !== 'audio').length}</p>
                <p><strong>Видео:</strong> {actualTimelineItems.filter(item => item.type === 'videos').length}</p>
                <p><strong>Аудио:</strong> {actualTimelineItems.filter(item => item.trackType === 'audio').length}</p>
                <p><strong>Расчетная длительность:</strong> {calculateTotalDuration().toFixed(1)}s</p>
                <p><strong>Режим совместимости:</strong> {exportSettings.compatibilityMode}</p>
              </div>
            </div>
          )}
          {exportStage === "ready" && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Превью экспорта</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="bg-black rounded-lg aspect-video flex items-center justify-center overflow-hidden relative">
                    {previewFrame ? (
                      <img 
                        src={previewFrame} 
                        alt="Preview" 
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-white text-sm">Создание превью...</div>
                    )}
                    
                    <button
                      onClick={generatePreviewFrame}
                      className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Обновить превью
                    </button>
                  </div>
                </div>
                <div className="w-48 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Разрешение:</span>
                    <span className="font-medium">{exportSettings.resolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">FPS:</span>
                    <span className="font-medium">{exportSettings.fps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Режим:</span>
                    <span className="font-medium">{exportSettings.compatibilityMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Длительность:</span>
                    <span className="font-medium">{Math.round(calculateTotalDuration())}s</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 relative z-[10000]">
          <div className="text-xs text-gray-500">
            {exportStage === "ready" && actualTimelineItems.length > 0 ? (
              `Готов к экспорту • ${exportSettings.compatibilityMode} режим • ${actualTimelineItems.filter(i => i.trackType === 'audio').length} аудио • ${actualTimelineItems.filter(item => item.type !== 'videos' && item.trackType !== 'audio').length} изображений`
            ) : exportStage === "loading" ? (
              'Загрузка FFmpeg...'
            ) : (
              'Добавьте элементы в таймлайн'
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors relative z-[10001]"
              disabled={isExporting}
            >
              Закрыть
            </button>
            <button
              onClick={startExport}
              disabled={!canExport}
              className={`px-6 py-2 text-sm rounded-lg font-medium transition-all flex items-center relative z-[10001] ${
                !canExport
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700 shadow-lg"
              }`}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Экспорт... {exportProgress}%
                </>
              ) : isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Загрузка...
                </>
              ) : (
                <>
                  <Download size={16} className="mr-2" />
                  Экспорт с изображениями
                </>
              )}
            </button>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
      </div>
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