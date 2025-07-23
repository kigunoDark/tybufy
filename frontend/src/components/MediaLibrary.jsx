import { useRef, useEffect, useState } from "react";
import { Upload, Video, Music, Trash2, Image, AlertTriangle, Loader2, X } from "lucide-react";

export const MediaLibrary = ({
  mediaLibrary,
  setMediaLibrary,
  activeTab,
  setActiveTab,
  draggedItem,
  setDraggedItem,
  setIsDragging,
  addToTimeline,
  formatTime,
}) => {
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const imageInputRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [db, setDb] = useState(null);

  // Инициализация IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        const request = indexedDB.open('MVP_VideoEditor', 1);
        
        request.onupgradeneeded = (event) => {
          const database = event.target.result;
          if (!database.objectStoreNames.contains('files')) {
            database.createObjectStore('files', { keyPath: 'id' });
          }
        };
        
        request.onsuccess = (event) => {
          const database = event.target.result;
          setDb(database);
          loadFilesFromDB(database);
        };
        
        request.onerror = () => {
          console.error('❌ IndexedDB не поддерживается');
          setError('Ваш браузер не поддерживает сохранение файлов');
        };
      } catch (error) {
        console.error('❌ Ошибка инициализации DB:', error);
      }
    };

    initDB();
  }, []);

  // Загрузка файлов из IndexedDB
  const loadFilesFromDB = async (database) => {
    try {
      const transaction = database.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const files = request.result;
        const groupedFiles = {
          videos: [],
          audios: [],
          images: []
        };
        
        files.forEach(file => {
          const url = URL.createObjectURL(file.blob);
          const fileWithUrl = { 
            ...file, 
            url,
            type: file.mediaType || file.type
          };
          
          if (file.mediaType && groupedFiles[file.mediaType]) {
            groupedFiles[file.mediaType].push(fileWithUrl);
          }
        });
        
        setMediaLibrary(groupedFiles);
      };
    } catch (error) {
      console.error('❌ Ошибка загрузки из DB:', error);
    }
  };

  // Сохранение файла в IndexedDB
  const saveFileToDB = async (fileData) => {
    if (!db) return false;
    
    try {
      const transaction = db.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      await store.add(fileData);
      console.log('💾 Файл сохранен в DB:', fileData.name);
      return true;
    } catch (error) {
      console.error('❌ Ошибка сохранения в DB:', error);
      return false;
    }
  };

  // Удаление файла из IndexedDB
  const deleteFileFromDB = async (fileId) => {
    if (!db) return;
    
    try {
      const transaction = db.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      await store.delete(fileId);
      console.log('🗑️ Файл удален из DB:', fileId);
    } catch (error) {
      console.error('❌ Ошибка удаления из DB:', error);
    }
  };

  // Очистка всех файлов
  const clearAllFiles = async () => {
    if (window.confirm('Удалить ВСЕ загруженные файлы? Это действие нельзя отменить.')) {
      try {
        if (db) {
          const transaction = db.transaction(['files'], 'readwrite');
          const store = transaction.objectStore('files');
          await store.clear();
        }
        
        setMediaLibrary({
          videos: [],
          audios: [],
          images: []
        });
        console.log('🗑️ Все файлы удалены');
      } catch (error) {
        console.error('❌ Ошибка очистки:', error);
      }
    }
  };

  // Получение метаданных файла
  const getFileMetadata = async (file, type) => {
    const metadata = { duration: 0, width: 0, height: 0 };

    try {
      if (type === 'videos') {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(file);
        
        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            metadata.duration = video.duration || 0;
            URL.revokeObjectURL(video.src);
            resolve();
          };
          video.onerror = () => {
            URL.revokeObjectURL(video.src);
            resolve();
          };
          setTimeout(resolve, 3000);
        });
      } else if (type === 'audios') {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.src = URL.createObjectURL(file);
        
        await new Promise((resolve) => {
          audio.onloadedmetadata = () => {
            metadata.duration = audio.duration || 0;
            URL.revokeObjectURL(audio.src);
            resolve();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(audio.src);
            resolve();
          };
          setTimeout(resolve, 3000);
        });
      } else if (type === 'images') {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        await new Promise((resolve) => {
          img.onload = () => {
            metadata.width = img.width;
            metadata.height = img.height;
            URL.revokeObjectURL(img.src);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(img.src);
            resolve();
          };
          setTimeout(resolve, 3000);
        });
      }
    } catch (e) {
      console.warn('Не удалось получить метаданные файла:', e);
    }

    return metadata;
  };

  // Обработка загрузки файлов
  const handleFileUpload = async (files, type) => {
    setError(null);
    setIsLoading(true);
    
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      try {
        console.log(`📂 Обрабатываем файл: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        
        // Получаем метаданные
        const metadata = await getFileMetadata(file, type);
        
        // Создаем объект файла для сохранения
        const fileData = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: type, // ✅ ИСПРАВЛЕНО: теперь "videos", "audios", "images"
          mimeType: file.type, // MIME тип файла (video/mp4, audio/mp3, etc)
          mediaType: type,
          size: file.size,
          blob: file, // Сохраняем оригинальный blob
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
          createdAt: new Date().toISOString(),
        };
        
        // Сохраняем в IndexedDB
        const saved = await saveFileToDB(fileData);
        
        if (saved) {
          // Создаем URL для отображения
          const fileWithUrl = {
            ...fileData,
            url: URL.createObjectURL(file)
          };
          
          // Добавляем в состояние
          setMediaLibrary((prev) => ({
            ...prev,
            [type]: [...(prev[type] || []), fileWithUrl],
          }));
          
          console.log(`✅ Файл загружен и сохранен: ${file.name}`);
        } else {
          setError(`Не удалось сохранить файл: ${file.name}`);
        }

      } catch (error) {
        console.error(`❌ Ошибка обработки ${file.name}:`, error);
        setError(`Ошибка обработки ${file.name}: ${error.message}`);
      }
    }
    
    setIsLoading(false);
  };

  // Обработчики для каждого типа файлов
  const handleVideoUpload = async (event) => {
    const files = event.target.files;
    if (files?.length) {
      await handleFileUpload(files, 'videos');
      event.target.value = '';
    }
  };

  const handleAudioUpload = async (event) => {
    const files = event.target.files;
    if (files?.length) {
      await handleFileUpload(files, 'audios');
      event.target.value = '';
    }
  };

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (files?.length) {
      await handleFileUpload(files, 'images');
      event.target.value = '';
    }
  };

  // Удаление отдельного файла
  const removeFromLibrary = async (itemId, type) => {
    await deleteFileFromDB(itemId);
    
    setMediaLibrary((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item.id !== itemId),
    }));
    console.log(`🗑️ Удален файл: ${itemId}`);
  };

  const handleDragStart = (e, mediaItem) => {
    setDraggedItem(mediaItem);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", "");
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setIsDragging(false);
  };

  const clearError = () => {
    setError(null);
  };

  // Подсчет общего количества файлов
  const getTotalFiles = () => {
    return (mediaLibrary.videos?.length || 0) + 
           (mediaLibrary.audios?.length || 0) + 
           (mediaLibrary.images?.length || 0);
  };

  return (
    <div className="w-80 min-w-72 max-w-80 bg-white border-2 border-blue-200 flex flex-col rounded-2xl shadow-lg overflow-hidden flex-shrink-0">
      <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-blue-800 flex items-center">
            <Upload size={18} className="mr-2" />
            Media Library
            {isLoading && <Loader2 size={16} className="ml-2 animate-spin" />}
          </h3>
          
          {/* Кнопка очистки */}
          {getTotalFiles() > 0 && (
            <button
              onClick={clearAllFiles}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
              title="Очистить все файлы"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        {/* Счетчик файлов */}
        {getTotalFiles() > 0 && (
          <div className="text-xs text-blue-600 mt-1">
            All files: {getTotalFiles()} • saved in browser
          </div>
        )}
      </div>

      {/* Отображение ошибок */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 mx-4 mt-2 rounded">
          <div className="flex items-center">
            <AlertTriangle size={16} className="text-red-400 mr-2" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Табы */}
      <div className="p-4 pb-0">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {[
            { id: "videos", name: "Videos", icon: Video },
            { id: "audios", name: "Audio", icon: Music },
            { id: "images", name: "Images", icon: Image },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const count = mediaLibrary[tab.id]?.length || 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 p-3 text-sm font-medium transition-all duration-200 rounded-lg ${
                  activeTab === tab.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <IconComponent size={16} className="mr-2 inline" />
                {tab.name}
                {count > 0 && (
                  <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Кнопка загрузки */}
      <div className="p-4">
        <button
          onClick={() => {
            if (isLoading) return;
            if (activeTab === "videos") fileInputRef.current?.click();
            else if (activeTab === "audios") audioInputRef.current?.click();
            else imageInputRef.current?.click();
          }}
          disabled={isLoading}
          className={`w-full p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 text-center group ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
            {isLoading ? (
              <Loader2 size={20} className="text-blue-500 animate-spin" />
            ) : (
              <Upload
                size={20}
                className="text-gray-500 group-hover:text-blue-500"
              />
            )}
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
            {isLoading ? 'Загрузка...' : `Загрузить ${
              activeTab === "videos"
                ? "видео"
                : activeTab === "audios"
                ? "аудио"
                : "изображения"
            }`}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            {activeTab === "videos"
              ? "MP4, AVI, MOV, WebM"
              : activeTab === "audios"
              ? "MP3, WAV, M4A, OGG"
              : "JPG, PNG, GIF, WebP"}
          </p>
        </button>
      </div>

      {/* Скрытые input'ы для файлов */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleVideoUpload}
        className="hidden"
        disabled={isLoading}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleAudioUpload}
        className="hidden"
        disabled={isLoading}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
        disabled={isLoading}
      />

      {/* Список файлов */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-2">
          {(mediaLibrary[activeTab] || []).map((item) => (
            <div
              key={item.id}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, item)}
              onDragEnd={handleDragEnd}
              className={`flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 hover:shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing group ${
                draggedItem?.id === item.id ? "opacity-50" : ""
              }`}
              onClick={() => addToTimeline(item)}
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-3 shadow-sm group-hover:shadow">
                {activeTab === "videos" && (
                  <Video data-item-id={item.id} size={20} className="text-blue-500" />
                )}
                {activeTab === "audios" && (
                  <Music  data-item-id={item.id} size={20} className="text-green-500" />
                )}
                {activeTab === "images" && (
                  <Image size={20} className="text-purple-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500">
                  {activeTab === "images"
                    ? `${item.width || 0}×${item.height || 0}`
                    : formatTime(item.duration || 0)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromLibrary(item.id, activeTab);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          
          {/* Пустое состояние */}
          {(!mediaLibrary[activeTab] || mediaLibrary[activeTab].length === 0) && !isLoading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                {activeTab === "videos" && (
                  <Video  size={24} className="text-gray-400" />
                )}
                {activeTab === "audios" && (
                  <Music size={24} className="text-gray-400" />
                )}
                {activeTab === "images" && (
                  <Image size={24} className="text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-500">
                Нет {activeTab === "videos" ? "видео" : activeTab === "audios" ? "аудио" : "изображений"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Нажмите кнопку загрузки выше
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};