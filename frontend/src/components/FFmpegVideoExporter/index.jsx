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
  // Поддержка разных способов передачи данных
  const actualTimelineItems = React.useMemo(() => {
    const items = timelineItems || timelineData || elements || clips || mediaItems || [];

    console.log("🔄 Получили данные timeline:", {
      timelineItems: timelineItems?.length || 0,
      timelineData: timelineData?.length || 0,
      elements: elements?.length || 0,
      clips: clips?.length || 0,
      mediaItems: mediaItems?.length || 0,
      finalItems: items?.length || 0,
    });

    if (items?.length > 0) {
      console.log("📋 Первый элемент timeline:", items[0]);
    }

    return items;
  }, [timelineItems, timelineData, elements, clips, mediaItems]);

  const [exportSettings, setExportSettings] = useState({
    resolution: "1280x720",
    fps: 24,
    format: "mp4",
    filename: `video_${Date.now()}`,
    includeAudio: true,
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
  const mediaCache = useRef(new Map());

  // ✅ Состояния для управления thumbnail модалками
  const [showThumbnailQuestion, setShowThumbnailQuestion] = useState(false);
  const [showThumbnailCreator, setShowThumbnailCreator] = useState(false);

  const navigateToApp = () => {
    window.location.href = "http://localhost:3000/app";
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

  // Расчет длительности ИСПРАВЛЕННЫЙ
  const calculateTotalDuration = () => {
    if (actualTimelineItems.length === 0) return videoDuration;

    // Находим максимальное время окончания ТОЛЬКО для видео/изображений
    const visualItems = actualTimelineItems.filter(item => 
      item.trackType === "main" || item.trackType === "overlay"
    );

    if (visualItems.length === 0) return videoDuration;

    const maxEndTime = Math.max(
      ...visualItems.map(
        (item) => (item.startTime || 0) + (item.duration || 0)
      )
    );

    // ✅ ОГРАНИЧИВАЕМ максимум 30 секундами
    const calculatedDuration = Math.min(maxEndTime, 30);
    console.log(`⏱️ ИСПРАВЛЕННАЯ длительность: ${calculatedDuration.toFixed(2)}s (макс визуальный контент)`);
    return calculatedDuration;
  };

  // Инициализация FFmpeg
  useEffect(() => {
    const initFFmpeg = async () => {
      if (ffmpeg || !isOpen) return;

      setIsLoading(true);
      setExportStage("loading");
      setError(null);

      try {
        console.log("🔄 Инициализация FFmpeg...");

        const ffmpegModule = await import("@ffmpeg/ffmpeg");
        const utilModule = await import("@ffmpeg/util");

        const FFmpegClass = ffmpegModule.FFmpeg;
        const fetchFile = utilModule.fetchFile;

        const ffmpegInstance = new FFmpegClass();

        await ffmpegInstance.load({
          coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
          wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm",
        });

        ffmpegInstance.on("progress", ({ progress }) => {
          if (isExporting) {
            const adjustedProgress = 70 + Math.round(progress * 25);
            setExportProgress(Math.min(adjustedProgress, 95));
          }
        });

        window.fetchFile = fetchFile;
        setFfmpeg(ffmpegInstance);
        setExportStage("ready");
        console.log("✅ FFmpeg готов");
      } catch (error) {
        console.error("❌ Ошибка FFmpeg:", error);
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

  // Загрузка медиа элементов
  const loadMediaElement = async (item) => {
    console.log(`📦 Загружаем элемент: "${item.name}"`);
    console.log(`🔍 Тип элемента: ${item.type}, trackType: ${item.trackType}`);

    if (!item.url) {
      console.error(`❌ URL отсутствует для ${item.name}`);
      return null;
    }

    const cacheKey = `${item.id}_${item.url}`;
    if (mediaCache.current.has(cacheKey)) {
      return mediaCache.current.get(cacheKey);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout loading ${item.name}`));
      }, 10000);

      const isVideo = item.type === "videos" || item.trackType === "main" ||
        item.name?.toLowerCase().includes(".mp4") ||
        item.name?.toLowerCase().includes(".webm") ||
        item.name?.toLowerCase().includes(".mov");

      const isImage = item.type === "images" || 
        (item.type !== "videos" && item.trackType !== "audio" && !isVideo);

      console.log(`🎯 Определен тип: ${isVideo ? "ВИДЕО" : isImage ? "ИЗОБРАЖЕНИЕ" : "НЕИЗВЕСТНО"} для ${item.name}`);

      if (isVideo) {
        const video = document.createElement("video");
        if (!item.url.startsWith("blob:")) {
          video.crossOrigin = "anonymous";
        }
        video.muted = true;
        video.preload = "metadata";

        video.onloadedmetadata = () => {
          console.log(`✅ Видео загружено: ${item.name}, размер: ${video.videoWidth}x${video.videoHeight}`);
          clearTimeout(timeout);
          mediaCache.current.set(cacheKey, video);
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
        if (!item.url.startsWith("blob:")) {
          img.crossOrigin = "anonymous";
        }

        img.onload = () => {
          console.log(`✅ Изображение загружено: ${item.name}, размер: ${img.naturalWidth}x${img.naturalHeight}`);
          clearTimeout(timeout);
          mediaCache.current.set(cacheKey, img);
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

  // Рендеринг кадра С МЕНЬШИМИ ЛОГАМИ
  const renderFrameAtTime = async (ctx, currentTime, width, height) => {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    // Показываем логи только каждые 5 секунд
    if (currentTime % 5 < 0.1) {
      console.log(`🎬 Рендерим кадр на времени ${currentTime.toFixed(1)}s...`);
    }

    // Активные элементы с ДИАГНОСТИКОЙ
    const activeItems = actualTimelineItems.filter((item) => {
      const startTime = item.startTime || 0;
      const duration = item.duration || 0;
      const endTime = startTime + duration;
      const isActive = currentTime >= startTime && currentTime <= endTime;

      // Показываем только важные кадры (каждые 5 секунд)
      if (currentTime % 5 < 0.1) {
        console.log(`   📺 "${item.name}": ${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s → ${isActive ? "✅ АКТИВЕН" : "❌ неактивен"}`);
      }
      return isActive;
    });

    // Показываем только важные кадры
    if (currentTime % 5 < 0.1) {
      console.log(`📋 Найдено активных элементов: ${activeItems.length}/${actualTimelineItems.length}`);
    }

    if (activeItems.length === 0) {
      ctx.fillStyle = "#333333";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#ffffff";
      ctx.font = `${Math.min(48, width / 20)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`Время: ${currentTime.toFixed(1)}s`, width / 2, height / 2 - 30);
      ctx.fillText(`Нет активных элементов`, width / 2, height / 2 + 30);
      return;
    }

    // Сортировка: main сначала, overlay потом
    const sortedItems = activeItems.sort((a, b) => {
      const layerOrder = { main: 1, overlay: 2, audio: 0 };
      return (layerOrder[a.trackType] || 1) - (layerOrder[b.trackType] || 1);
    });

    for (const item of sortedItems) {
      if (item.trackType === "audio") continue;

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

  // Отрисовка элемента на canvas
  const drawElementOnCanvas = async (ctx, element, item, relativeTime, canvasWidth, canvasHeight) => {
    try {
      if (element.tagName === "VIDEO") {
        const trimStart = item.trimStart || 0;
        const maxTime = Math.min(
          element.duration || item.duration || 0,
          item.duration || element.duration || 0
        );
        const targetTime = Math.max(0, Math.min(trimStart + relativeTime, maxTime));

        if (Math.abs(element.currentTime - targetTime) > 0.1) {
          element.currentTime = targetTime;
          await new Promise((resolve) => {
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

      if (item.trackType === "main") {
        // Основное видео - пропорциональное масштабирование
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
      } else if (item.trackType === "overlay") {
        // Overlay с координатами + ДИАГНОСТИКА
        console.log(`🖼️ РЕНДЕРИМ OVERLAY: ${item.name}`);
        console.log(`   ID элемента: ${item.id}`);
        console.log(`   overlayTransforms[${item.id}]:`, overlayTransforms[item.id]);
        
        const overlayCoords = overlayTransforms[item.id];
        
        if (overlayCoords) {
          // Используем координаты из VideoEditor
          const baseX = 200 + (overlayCoords.x || 0);
          const baseY = 50 + (overlayCoords.y || 0);
          const scale = overlayCoords.scale || 1;
          
          const scaleX = canvasWidth / 1920;
          const scaleY = canvasHeight / 1080;
          
          drawX = baseX * scaleX;
          drawY = baseY * scaleY;
          drawWidth = 256 * scale * scaleX;
          drawHeight = 192 * scale * scaleY;
          
          console.log(`   ✅ OVERLAY с координатами: pos(${drawX.toFixed(0)}, ${drawY.toFixed(0)}) size(${drawWidth.toFixed(0)}x${drawHeight.toFixed(0)})`);
        } else {
          // ✅ ПРИНУДИТЕЛЬНЫЕ большие координаты для теста
          drawX = canvasWidth * 0.6;   // Справа
          drawY = canvasHeight * 0.1;  // Сверху  
          drawWidth = canvasWidth * 0.3;   // 30% экрана
          drawHeight = canvasHeight * 0.3; // 30% экрана
          
          console.log(`   🆘 OVERLAY БЕЗ координат - ПРИНУДИТЕЛЬНО БОЛЬШОЙ: pos(${drawX.toFixed(0)}, ${drawY.toFixed(0)}) size(${drawWidth.toFixed(0)}x${drawHeight.toFixed(0)})`);
        }
      }

      ctx.save();

      // Поворот
      if (item.rotation && item.rotation !== 0) {
        const centerX = drawX + drawWidth / 2;
        const centerY = drawY + drawHeight / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      // Прозрачность
      const opacity = item.opacity !== undefined ? item.opacity : 1;
      ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

      // Качество
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Обработка изображений с альфа-каналом
      if (element.tagName === "IMG") {
        if (item.type === "images" || element.src.includes(".png")) {
          console.log(`🖼️ Рендерим изображение с возможным альфа-каналом: ${item.name}`);

          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = elementWidth;
          tempCanvas.height = elementHeight;
          const tempCtx = tempCanvas.getContext("2d", { alpha: false });

          tempCtx.fillStyle = "#000000";
          tempCtx.fillRect(0, 0, elementWidth, elementHeight);
          tempCtx.drawImage(element, 0, 0);

          ctx.drawImage(tempCanvas, drawX, drawY, drawWidth, drawHeight);
        } else {
          ctx.drawImage(element, drawX, drawY, drawWidth, drawHeight);
        }
      } else {
        ctx.drawImage(element, drawX, drawY, drawWidth, drawHeight);
      }

      ctx.restore();
    } catch (error) {
      console.error(`❌ Ошибка отрисовки ${item.name}:`, error);
      throw error;
    }
  };

  // Создание превью
  const generatePreviewFrame = async () => {
    try {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { alpha: false });
      const [width, height] = exportSettings.resolution.split("x").map(Number);
      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      const firstItem = actualTimelineItems.find((item) => item.trackType === "main");
      let previewTime = 0;

      if (firstItem) {
        const itemStart = firstItem.startTime || 0;
        const itemDuration = firstItem.duration || 0;
        previewTime = itemStart + itemDuration / 2;
      } else {
        const totalDuration = calculateTotalDuration();
        previewTime = totalDuration / 2;
      }

      console.log(`🖼️ Генерируем превью на времени ${previewTime.toFixed(1)}s`);

      await renderFrameAtTime(ctx, previewTime, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setPreviewFrame(url);
          console.log(`✅ Превью создано: ${blob.type}, размер: ${(blob.size / 1024).toFixed(1)}KB`);
        }
      }, "image/png");
    } catch (error) {
      console.warn("⚠️ Ошибка создания превью:", error);
    }
  };

  // Эффект для создания превью
  useEffect(() => {
    if (isOpen && actualTimelineItems.length > 0 && exportStage === "ready") {
      generatePreviewFrame();
    }
  }, [isOpen, actualTimelineItems, exportSettings.resolution, exportStage]);

  // Подготовка аудио
  const prepareAudioFiles = async () => {
    if (!exportSettings.includeAudio) return [];

    const audioItems = actualTimelineItems.filter((item) => item.trackType === "audio");
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
          index: i,
        });
      } catch (error) {
        console.warn(`⚠️ Ошибка загрузки аудио ${item.name}:`, error);
      }
    }

    return audioFiles;
  };

  // Рендеринг всех кадров
  const renderAllFrames = async (duration) => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Canvas не найден");

    const ctx = canvas.getContext("2d", { alpha: false });
    const [width, height] = exportSettings.resolution.split("x").map(Number);
    canvas.width = width;
    canvas.height = height;

    console.log(`🎞️ Начинаем рендеринг кадров: ${width}x${height}`);

    const totalFrames = Math.ceil(duration * exportSettings.fps);
    const frames = [];
    const maxFrames = Math.min(totalFrames, 1200);

    for (let frame = 0; frame < maxFrames; frame++) {
      const currentTime = frame / exportSettings.fps;
      if (currentTime >= duration) break;

      try {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);

        await renderFrameAtTime(ctx, currentTime, width, height);

        const blob = await new Promise((resolve) => {
          const hasImages = actualTimelineItems.some(
            (item) => item.type !== "videos" && item.trackType !== "audio"
          );

          if (hasImages) {
            canvas.toBlob(resolve, "image/png");
          } else {
            canvas.toBlob(resolve, "image/jpeg", 0.85);
          }
        });

        if (blob) {
          frames.push(blob);
          // ✅ ДИАГНОСТИКА первых кадров
          if (frame < 5) {
            // Считаем активные элементы для диагностики
            const activeItemsForDiag = actualTimelineItems.filter((item) => {
              const startTime = item.startTime || 0;
              const duration = item.duration || 0;
              const endTime = startTime + duration;
              return currentTime >= startTime && currentTime <= endTime;
            });
            
            console.log(`📸 Кадр ${frame}: время=${currentTime.toFixed(1)}s размер=${(blob.size / 1024).toFixed(1)}KB активных=${activeItemsForDiag.length}`);
            activeItemsForDiag.forEach(item => {
              if (item.trackType !== "audio") {
                console.log(`   - ${item.name} (${item.trackType})`);
              }
            });
          }
        }

        const progress = 15 + Math.round((frame / maxFrames) * 35);
        setExportProgress(progress);

        if (frame % 100 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1));
        }
      } catch (error) {
        console.error(`❌ Ошибка рендеринга кадра ${frame}:`, error);
        break;
      }
    }

    console.log(`✅ Рендеринг завершен: ${frames.length} кадров`);
    return frames;
  };

  // Кодирование с FFmpeg
  const encodeWithFFmpeg = async (frames, audioFiles, duration) => {
    if (!window.fetchFile || frames.length === 0) {
      throw new Error("Нет кадров для кодирования");
    }

    try {
      await cleanupTempFiles(2000, 5);

      const hasImages = actualTimelineItems.some(
        (item) => item.type !== "videos" && item.trackType !== "audio"
      );

      console.log(`📦 Кодируем ${frames.length} кадров, содержат изображения: ${hasImages}`);

      for (let i = 0; i < frames.length; i++) {
        const frameData = await window.fetchFile(frames[i]);

        if (hasImages) {
          const filename = `frame_${i.toString().padStart(6, "0")}.png`;
          await ffmpeg.writeFile(filename, frameData);
        } else {
          const filename = `frame_${i.toString().padStart(6, "0")}.jpg`;
          await ffmpeg.writeFile(filename, frameData);
        }

        if (i % 50 === 0) {
          const progress = 60 + Math.round((i / frames.length) * 10);
          setExportProgress(progress);
        }
      }

      for (let i = 0; i < audioFiles.length; i++) {
        const audioFile = audioFiles[i];
        const audioFileName = `audio_${i}.mp3`;
        await ffmpeg.writeFile(audioFileName, await window.fetchFile(audioFile.blob));
      }

      setExportProgress(70);

      // ✅ ПРАВИЛЬНАЯ FFmpeg команда с обрезкой аудио
      const args = [
        "-framerate", exportSettings.fps.toString()
      ];

      // Входные файлы
      if (hasImages) {
        args.push("-i", "frame_%06d.png");
      } else {
        args.push("-i", "frame_%06d.jpg");
      }

      if (audioFiles.length > 0) {
        args.push("-i", "audio_0.mp3");
        // Маппинг потоков
        args.push("-map", "0:v");        // Видео из первого входа
        args.push("-map", "1:a");        // Аудио из второго входа
      }

      // ТОЧНАЯ длительность для ВСЕГО видео
      args.push("-t", duration.toString());

      // Видео настройки
      args.push(
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "30",
        "-pix_fmt", "yuv420p",
        "-profile:v", "baseline",
        "-level", "3.0",
        "-r", "24",
        "-g", "24",
        "-bf", "0",
        "-refs", "1"
      );

      // Аудио настройки (если есть)
      if (audioFiles.length > 0) {
        args.push(
          "-c:a", "aac",
          "-b:a", "96k",
          "-ar", "44100",
          "-ac", "2",
          "-strict", "-2"
        );
        console.log(`🎵 Аудио ОБРЕЗАЕТСЯ с ${audioFiles[0].duration || 'неизвестно'}s до ${duration}s`);
      }

      // Финальные настройки
      args.push(
        "-movflags", "+faststart",
        "output.mp4"
      );

      console.log("🔧 Команда FFmpeg:", args.join(" "));

      await ffmpeg.exec(args);

      setExportProgress(90);

      const data = await ffmpeg.readFile("output.mp4");
      const videoBlob = new Blob([data.buffer], { type: "video/mp4" });

      await cleanupTempFiles(frames.length, audioFiles.length);
      return videoBlob;
    } catch (error) {
      try {
        await cleanupTempFiles(frames.length, audioFiles.length);
      } catch (e) {}

      throw new Error(`Ошибка кодирования: ${error.message}`);
    }
  };

  // Очистка файлов
  const cleanupTempFiles = async (frameCount, audioCount) => {
    for (let i = 0; i < frameCount; i++) {
      try {
        await ffmpeg.deleteFile(`frame_${i.toString().padStart(6, "0")}.png`);
      } catch (e) {}
      try {
        await ffmpeg.deleteFile(`frame_${i.toString().padStart(6, "0")}.jpg`);
      } catch (e) {}
    }

    for (let i = 0; i < audioCount; i++) {
      try {
        await ffmpeg.deleteFile(`audio_${i}.mp3`);
      } catch (e) {}
    }

    try {
      await ffmpeg.deleteFile("output.mp4");
    } catch (e) {}
  };

  // Главная функция экспорта С ДИАГНОСТИКОЙ
  const startExport = async () => {
    if (!ffmpeg || isExporting || actualTimelineItems.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportStage("preparing");
    setError(null);

    try {
      console.log("🚀 ПОЛНАЯ ДИАГНОСТИКА ЭКСПОРТА:");
      console.log("actualTimelineItems:", actualTimelineItems);
      console.log("overlayTransforms:", overlayTransforms);
      
      // Детальная диагностика элементов С АНАЛИЗОМ ВРЕМЕНИ
      console.log("\n📊 АНАЛИЗ ЭЛЕМЕНТОВ TIMELINE:");
      actualTimelineItems.forEach((item, index) => {
        const start = item.startTime || 0;
        const duration = item.duration || 0;
        const end = start + duration;
        console.log(`${index + 1}. "${item.name}"`);
        console.log(`   Тип: ${item.type} | Трек: ${item.trackType}`);
        console.log(`   Время: ${start}s → ${end.toFixed(1)}s (длительность: ${duration}s)`);
        console.log(`   URL: ${item.url ? 'есть' : 'НЕТ'}`);
        if (item.trackType === "overlay") {
          console.log(`   Overlay координаты: ${overlayTransforms[item.id] ? 'есть' : 'НЕТ'}`);
        }
      });
      
      const visualItems = actualTimelineItems.filter(item => 
        item.trackType === "main" || item.trackType === "overlay"
      );
      const maxVisualTime = visualItems.length > 0 ? Math.max(...visualItems.map(item => (item.startTime || 0) + (item.duration || 0))) : 0;
      console.log(`\n⏱️ Максимальное время визуального контента: ${maxVisualTime}s`);
      console.log(`⏱️ Будем экспортировать: ${Math.min(maxVisualTime, 30)}s\n`);

      console.log(`🎬 Начинаем экспорт с максимальной совместимостью`);

      const totalDuration = calculateTotalDuration();
      // ✅ НЕ ограничиваем дополнительно - уже ограничено в calculateTotalDuration
      const actualDuration = totalDuration;
      
      console.log(`📐 ФИНАЛЬНАЯ длительность экспорта: ${actualDuration}s`);

      setExportStage("rendering_frames");
      const frames = await renderAllFrames(actualDuration);
      setExportProgress(50);

      setExportStage("processing_audio");
      const audioFiles = await prepareAudioFiles();
      setExportProgress(60);
      
      console.log(`🎵 Подготовленных аудио файлов: ${audioFiles.length}`);
      audioFiles.forEach((audio, i) => {
        console.log(`  Аудио ${i + 1}: ${audio.name} размер:${(audio.blob.size / 1024).toFixed(1)}KB`);
      });

      setExportStage("encoding");
      const videoBlob = await encodeWithFFmpeg(frames, audioFiles, actualDuration);

      setExportProgress(95);

      setExportStage("downloading");
      await downloadVideo(videoBlob);
      setExportProgress(100);

      setExportStage("completed");
      
      // ✅ ФИНАЛЬНАЯ ДИАГНОСТИКА
      console.log(`✅ ЭКСПОРТ ЗАВЕРШЕН!`);
      console.log(`📹 Размер видео: ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB`);
      console.log(`⏱️ Длительность: ${actualDuration}s`);
      console.log(`🎞️ Кадров: ${frames.length}`);
      console.log(`🎵 Аудио: ${audioFiles.length > 0 ? "включено" : "нет"}`);
      console.log(`🖼️ Overlay: ${actualTimelineItems.filter(i => i.trackType === "overlay").length} элементов`);
      
      setTimeout(() => {
        setExportStage("ready");
        setExportProgress(0);
      }, 3000);
      
      // ✅ ПОКАЗЫВАЕМ ВОПРОС О СОЗДАНИИ ОБЛОЖКИ
      setTimeout(() => {
        setShowThumbnailQuestion(true);
      }, 1500);
    } catch (error) {
      console.error("❌ Ошибка экспорта:", error);
      setError(error.message);
      setExportStage("error");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadVideo = async (blob) => {
    const filename = `${exportSettings.filename}.${exportSettings.format}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStageText = () => {
    switch (exportStage) {
      case "loading": return "Loading FFmpeg...";
      case "preparing": return "Analyzing timeline...";
      case "rendering_frames": return "Rendering frames...";
      case "processing_audio": return "Preparing audio tracks...";
      case "encoding": return "Encoding video...";
      case "downloading": return "Saving file...";
      case "completed": return "✅ Export completed! Video should play.";
      case "error": return "An error occurred";
      case "ready": return `Ready to export (${actualTimelineItems.length} elements)`;
      default: return "Waiting...";
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
            🎬 Video Export with Overlay & Audio
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
                  <h4 className="font-bold text-red-800 text-lg mb-2">❌ NO TIMELINE DATA!</h4>
                  <p className="text-red-700 mb-3">
                    Export component is not receiving timeline data. Check props passing.
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
                  <h4 className="font-medium text-red-800">Error</h4>
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
              Export Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Resolution</label>
                <select
                  value={exportSettings.resolution}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, resolution: e.target.value }))}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                  disabled={isExporting || isLoading}
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
                  disabled={isExporting || isLoading}
                >
                  <option value="24">24 FPS (standard)</option>
                  <option value="30">30 FPS (smooth)</option>
                  <option value="60">60 FPS (very smooth)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">File name</label>
                <input
                  type="text"
                  value={exportSettings.filename}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, filename: e.target.value }))}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                  disabled={isExporting || isLoading}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportSettings.includeAudio}
                  onChange={(e) => setExportSettings(prev => ({ ...prev, includeAudio: e.target.checked }))}
                  disabled={isExporting || isLoading}
                  className="rounded"
                />
                <span className="text-sm">Include audio</span>
              </label>
            </div>
          </div>

          {actualTimelineItems.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-medium text-blue-800 mb-2">📊 Data Diagnostics</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Timeline elements:</strong> {actualTimelineItems.length}</p>
                <p><strong>Images:</strong> {actualTimelineItems.filter(item => item.type !== "videos" && item.trackType !== "audio").length}</p>
                <p><strong>Videos:</strong> {actualTimelineItems.filter(item => item.type === "videos").length}</p>
                <p><strong>Audio:</strong> {actualTimelineItems.filter(item => item.trackType === "audio").length}</p>
                <p><strong>Calculated duration:</strong> {calculateTotalDuration().toFixed(1)}s</p>
                <p><strong>Overlay coordinates:</strong> {Object.keys(overlayTransforms).length}</p>
              </div>
            </div>
          )}

          {exportStage === "ready" && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Export Preview</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="bg-black rounded-lg aspect-video flex items-center justify-center overflow-hidden relative">
                    {previewFrame ? (
                      <img src={previewFrame} alt="Preview" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="text-white text-sm">Creating preview...</div>
                    )}
                    <button
                      onClick={generatePreviewFrame}
                      className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Update Preview
                    </button>
                  </div>
                </div>
                <div className="w-48 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resolution:</span>
                    <span className="font-medium">{exportSettings.resolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">FPS:</span>
                    <span className="font-medium">{exportSettings.fps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Audio:</span>
                    <span className="font-medium">{exportSettings.includeAudio ? "Enabled" : "Disabled"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{Math.round(calculateTotalDuration())}s</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            {exportStage === "ready" && actualTimelineItems.length > 0
              ? `Ready to export • ${actualTimelineItems.filter(i => i.trackType === "audio").length} audio • ${actualTimelineItems.filter(item => item.type !== "videos" && item.trackType !== "audio").length} images`
              : exportStage === "loading"
              ? "Loading FFmpeg..."
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
              ) : isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
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

        <canvas ref={canvasRef} style={{ display: "none" }} />
        <canvas ref={previewCanvasRef} style={{ display: "none" }} />
      </div>
      
      {/* ✅ МОДАЛКИ ДЛЯ СОЗДАНИЯ ОБЛОЖЕК */}
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