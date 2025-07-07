class MediaStorage {
  constructor() {
    this.dbName = "VideoEditorDB";
    this.version = 1;
    this.db = null;
    this.fallbackMode = false;
    this.memoryStorage = new Map();
    this.limits = {
      videos: 5,
      images: 10,
      audios: 5,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      retentionDays: 7,
    };
  }

  isIndexedDBSupported() {
    return "indexedDB" in window && indexedDB !== null;
  }

  async init() {
    if (!this.isIndexedDBSupported()) {
      console.warn("IndexedDB not supported, using fallback mode");
      this.fallbackMode = true;
      return this.initFallback();
    }

    try {
      return await this.initIndexedDB();
    } catch (error) {
      console.warn(
        "IndexedDB initialization failed, switching to fallback mode:",
        error
      );
      this.fallbackMode = true;
      return this.initFallback();
    }
  }

  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = () => {
          console.error("IndexedDB error:", request.error);
          reject(
            new Error(
              `IndexedDB error: ${request.error?.message || "Unknown error"}`
            )
          );
        };

        request.onsuccess = () => {
          this.db = request.result;
          console.log("IndexedDB initialized successfully");
          resolve(this.db);
        };

        request.onupgradeneeded = (event) => {
          try {
            const db = event.target.result;

            if (!db.objectStoreNames.contains("files")) {
              const fileStore = db.createObjectStore("files", {
                keyPath: "id",
              });
              fileStore.createIndex("type", "type");
              fileStore.createIndex("mediaType", "mediaType"); // ✅ Добавляем индекс для mediaType
              fileStore.createIndex("createdAt", "createdAt");
              console.log("IndexedDB store created");
            }
          } catch (upgradeError) {
            console.error("IndexedDB upgrade error:", upgradeError);
            reject(upgradeError);
          }
        };

        request.onblocked = () => {
          console.warn("IndexedDB blocked - another tab may be open");
          reject(new Error("IndexedDB blocked by another tab"));
        };
      } catch (error) {
        console.error("IndexedDB initialization error:", error);
        reject(error);
      }
    });
  }

  async initFallback() {
    console.log("Initializing fallback storage mode");
    this.fallbackMode = true;

    this.memoryStorage.clear();

    try {
      localStorage.removeItem("mediaFiles");
      console.log("Cleared old localStorage data for fresh start");
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
    }

    return true;
  }

  // ✅ Проверка размера файла перед сохранением
  checkFileSize(file) {
    if (file.size > this.limits.maxFileSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const limitMB = (this.limits.maxFileSize / (1024 * 1024)).toFixed(0);
      throw new Error(
        `File too large. File size: ${sizeMB}MB, Max size: ${limitMB}MB`
      );
    }
  }

  async saveFile(file, type) {
    // ✅ Проверяем размер файла перед обработкой
    this.checkFileSize(file);

    const currentFiles = await this.getFilesByType(type);
    if (currentFiles.length >= this.limits[type]) {
      throw new Error(
        `Storage limit reached. Max ${this.limits[type]} ${type} allowed.`
      );
    }

    const fileData = {
      id: Date.now() + Math.random(),
      name: file.name,
      type: type, // Оригинальный тип для совместимости
      mediaType: type, // ✅ Добавляем mediaType для правильной категоризации
      size: file.size,
      mimetype: file.type,
      blob: file,
      url: URL.createObjectURL(file),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(
        Date.now() + this.limits.retentionDays * 24 * 60 * 60 * 1000
      ).toISOString(),
    };

    try {
      if (type === "videos") {
        fileData.duration = await this.getVideoDuration(file);
      } else if (type === "audios") {
        fileData.duration = await this.getAudioDuration(file);
      } else if (type === "images") {
        const dimensions = await this.getImageDimensions(file);
        fileData.width = dimensions.width;
        fileData.height = dimensions.height;
      }
    } catch (metaError) {
      console.warn("Failed to get file metadata:", metaError);
    }

    if (this.fallbackMode) {
      return this.saveToFallback(fileData);
    } else {
      return this.saveToIndexedDB(fileData);
    }
  }

  async saveToIndexedDB(fileData) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(["files"], "readwrite");
        const store = transaction.objectStore("files");
        const request = store.add(fileData);

        request.onsuccess = () => {
          this.updateStorageInfo();
          resolve(fileData);
        };

        request.onerror = () => {
          console.error("IndexedDB save error:", request.error);
          reject(
            new Error(
              `Failed to save to IndexedDB: ${
                request.error?.message || "Unknown error"
              }`
            )
          );
        };
      } catch (error) {
        console.error("IndexedDB transaction error:", error);
        reject(error);
      }
    });
  }

  async saveToFallback(fileData) {
    try {
      this.memoryStorage.set(fileData.id.toString(), fileData);

      console.log(
        `Saved file ${fileData.name} to memory storage (fallback mode)`
      );

      this.updateStorageInfo();
      return fileData;
    } catch (error) {
      console.error("Fallback save error:", error);
      throw error;
    }
  }

  async getFilesByType(type) {
    if (this.fallbackMode) {
      return this.getFromFallback(type);
    } else {
      return this.getFromIndexedDB(type);
    }
  }

  async getFromIndexedDB(type) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(["files"], "readonly");
        const store = transaction.objectStore("files");
        
        // ✅ Используем mediaType индекс если он существует, иначе type
        let index;
        try {
          index = store.index("mediaType");
        } catch (e) {
          index = store.index("type");
        }
        
        const request = index.getAll(type);

        request.onsuccess = () => {
          const now = new Date();
          const validFiles = request.result.filter((file) => {
            return new Date(file.expiresAt) > now;
          });
          resolve(validFiles);
        };

        request.onerror = () => {
          console.error("IndexedDB get error:", request.error);
          reject(
            new Error(
              `Failed to get from IndexedDB: ${
                request.error?.message || "Unknown error"
              }`
            )
          );
        };
      } catch (error) {
        console.error("IndexedDB get transaction error:", error);
        reject(error);
      }
    });
  }

  async getFromFallback(type) {
    const now = new Date();
    const files = [];

    for (const [key, file] of this.memoryStorage.entries()) {
      // ✅ Проверяем как mediaType, так и type для совместимости
      const fileType = file.mediaType || file.type;
      if (fileType === type && new Date(file.expiresAt) > now) {
        files.push(file);
      }
    }

    return files;
  }

  async getAllFiles() {
    try {
      const videos = await this.getFilesByType("videos");
      const images = await this.getFilesByType("images");
      const audios = await this.getFilesByType("audios");

      return { videos, images, audios };
    } catch (error) {
      console.error("Get all files error:", error);
      return { videos: [], images: [], audios: [] };
    }
  }

  async deleteFile(id) {
    if (this.fallbackMode) {
      return this.deleteFromFallback(id);
    } else {
      return this.deleteFromIndexedDB(id);
    }
  }

  async deleteFromIndexedDB(id) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(["files"], "readwrite");
        const store = transaction.objectStore("files");
        const request = store.delete(id);

        request.onsuccess = () => {
          this.updateStorageInfo();
          resolve();
        };

        request.onerror = () => {
          console.error("IndexedDB delete error:", request.error);
          reject(
            new Error(
              `Failed to delete from IndexedDB: ${
                request.error?.message || "Unknown error"
              }`
            )
          );
        };
      } catch (error) {
        console.error("IndexedDB delete transaction error:", error);
        reject(error);
      }
    });
  }

  async deleteFromFallback(id) {
    try {
      const file = this.memoryStorage.get(id.toString());
      if (file && file.url) {
        URL.revokeObjectURL(file.url);
      }

      this.memoryStorage.delete(id.toString());
      this.updateStorageInfo();
      return true;
    } catch (error) {
      console.error("Fallback delete error:", error);
      throw error;
    }
  }

  async cleanupExpiredFiles() {
    try {
      const now = new Date();
      let expiredCount = 0;

      if (this.fallbackMode) {
        const keysToDelete = [];
        for (const [key, file] of this.memoryStorage.entries()) {
          if (new Date(file.expiresAt) <= now) {
            keysToDelete.push(key);
            if (file.url) {
              URL.revokeObjectURL(file.url);
            }
          }
        }

        keysToDelete.forEach((key) => this.memoryStorage.delete(key));
        expiredCount = keysToDelete.length;
      } else {
        const allFiles = await new Promise((resolve) => {
          const transaction = this.db.transaction(["files"], "readonly");
          const store = transaction.objectStore("files");
          const request = store.getAll();

          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => resolve([]);
        });

        const expiredFiles = allFiles.filter((file) => {
          return new Date(file.expiresAt) <= now;
        });

        for (const file of expiredFiles) {
          try {
            await this.deleteFromIndexedDB(file.id);
            if (file.url) {
              URL.revokeObjectURL(file.url);
            }
            expiredCount++;
          } catch (deleteError) {
            console.warn("Failed to delete expired file:", deleteError);
          }
        }
      }

      console.log(`Cleaned up ${expiredCount} expired files`);
      return expiredCount;
    } catch (error) {
      console.error("Cleanup error:", error);
      return 0;
    }
  }

  async getStorageInfo() {
    try {
      const files = await this.getAllFiles();
      const totalSize = [
        ...files.videos,
        ...files.images,
        ...files.audios,
      ].reduce((sum, file) => sum + file.size, 0);

      return {
        usage: {
          videos: files.videos.length,
          images: files.images.length,
          audios: files.audios.length,
          totalSize: totalSize,
          totalSizeMB: Math.round(totalSize / (1024 * 1024)),
        },
        limits: this.limits,
        files: files,
        mode: this.fallbackMode ? "fallback" : "indexeddb",
      };
    } catch (error) {
      console.error("Get storage info error:", error);
      return {
        usage: {
          videos: 0,
          images: 0,
          audios: 0,
          totalSize: 0,
          totalSizeMB: 0,
        },
        limits: this.limits,
        files: { videos: [], images: [], audios: [] },
        mode: this.fallbackMode ? "fallback" : "indexeddb",
      };
    }
  }

  async updateStorageInfo() {
    try {
      const info = await this.getStorageInfo();
      window.dispatchEvent(new CustomEvent("storageUpdated", { detail: info }));
    } catch (error) {
      console.error("Update storage info error:", error);
    }
  }

  async getVideoDuration(file) {
    return new Promise((resolve) => {
      try {
        const video = document.createElement("video");
        video.preload = "metadata";

        const timeout = setTimeout(() => {
          video.src = "";
          resolve(10);
        }, 5000);

        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          URL.revokeObjectURL(video.src);
          resolve(video.duration || 10);
        };

        video.onerror = () => {
          clearTimeout(timeout);
          resolve(10);
        };

        video.src = URL.createObjectURL(file);
      } catch (error) {
        console.warn("Video duration error:", error);
        resolve(10);
      }
    });
  }

  // ✅ Добавляем метод для получения длительности аудио
  async getAudioDuration(file) {
    return new Promise((resolve) => {
      try {
        const audio = document.createElement("audio");
        audio.preload = "metadata";

        const timeout = setTimeout(() => {
          audio.src = "";
          resolve(10);
        }, 5000);

        audio.onloadedmetadata = () => {
          clearTimeout(timeout);
          URL.revokeObjectURL(audio.src);
          resolve(audio.duration || 10);
        };

        audio.onerror = () => {
          clearTimeout(timeout);
          resolve(10);
        };

        audio.src = URL.createObjectURL(file);
      } catch (error) {
        console.warn("Audio duration error:", error);
        resolve(10);
      }
    });
  }

  async getImageDimensions(file) {
    return new Promise((resolve) => {
      try {
        const img = new Image();

        const timeout = setTimeout(() => {
          img.src = "";
          resolve({ width: 0, height: 0 });
        }, 5000);

        img.onload = () => {
          clearTimeout(timeout);
          URL.revokeObjectURL(img.src);
          resolve({ width: img.width, height: img.height });
        };

        img.onerror = () => {
          clearTimeout(timeout);
          resolve({ width: 0, height: 0 });
        };

        img.src = URL.createObjectURL(file);
      } catch (error) {
        console.warn("Image dimensions error:", error);
        resolve({ width: 0, height: 0 });
      }
    });
  }

  async canUpload(type) {
    try {
      const files = await this.getFilesByType(type);
      return files.length < this.limits[type];
    } catch (error) {
      console.error("Can upload check error:", error);
      return false;
    }
  }

  async getRemainingSpace(type) {
    try {
      const files = await this.getFilesByType(type);
      return this.limits[type] - files.length;
    } catch (error) {
      console.error("Get remaining space error:", error);
      return 0;
    }
  }

  // ✅ Добавляем метод для проверки размера файла
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default new MediaStorage();
