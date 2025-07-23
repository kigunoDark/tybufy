import { useState, useEffect } from "react";
import axios from "axios";
import VideoEditor from "../VideoEditor/VideoEditor";
import ContentStudio from "../ContentStudio";
import { cleanScript } from "../helpers/cleanScript";
import { TeleprompterModal } from "../ui/TeleprompterModal";

import { X, Sparkles, Zap, Brain, Heart, Star, Target } from "lucide-react";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
    }
    return Promise.reject(error);
  }
);

const VideoEditorApp = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [script, setScript] = useState("");
  const [topic, setTopic] = useState("");
  const [keyPoints, setKeyPoints] = useState([""]);
  const [duration, setDuration] = useState("~10 минут (1000 слов)");
  const [audioUrl, setAudioUrl] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiEditor, setShowAiEditor] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [audioMethod, setAudioMethod] = useState("ai");
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [showAudioEditor, setShowAudioEditor] = useState(false);
  const [assessment, setAssessment] = useState({});
  const [contentType, setContentType] = useState("lifestyle");
  const [loading, setLoading] = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("english");
  const [mediaLibrary, setMediaLibrary] = useState({
    videos: [],
    audios: [],
    images: [],
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsAuthenticated(true);
    } else {
      setShowAuthModal(true);
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (script.length && isAuthenticated) {
        setLoading(true);
        try {
          const res = await apiClient.post("/api/script/quality", { script });
          setAssessment(res.data.data.quality);
        } catch (error) {
          console.error("Ошибка при оценке скрипта:", error);
          setAssessment({
            total_score: 8,
            video_duration: Math.ceil(script.length / 150),
          });
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [script, isAuthenticated]);

  const handleDemoLogin = async () => {
    try {
      const response = await apiClient.post("/api/auth/login", {
        email: "demo@example.com",
        password: "demo123",
      });

      if (response.data.success) {
        localStorage.setItem("authToken", response.data.data.token);
        localStorage.setItem(
          "userData",
          JSON.stringify(response.data.data.user)
        );
        setIsAuthenticated(true);
        setShowAuthModal(false);
        setAuthError("");
      }
    } catch (error) {
      try {
        await apiClient.post("/api/auth/register", {
          name: "Demo User",
          email: "demo@example.com",
          password: "demo123",
        });

        // Затем логинимся
        const loginResponse = await apiClient.post("/api/auth/login", {
          email: "demo@example.com",
          password: "demo123",
        });

        if (loginResponse.data.success) {
          localStorage.setItem("authToken", loginResponse.data.data.token);
          localStorage.setItem(
            "userData",
            JSON.stringify(loginResponse.data.data.user)
          );
          setIsAuthenticated(true);
          setShowAuthModal(false);
          setAuthError("");
        }
      } catch (registerError) {
        console.error("Ошибка при регистрации/входе:", registerError);
        setAuthError(
          "Не удалось войти в систему. Проверьте подключение к серверу."
        );
      }
    }
  };

  const addKeyPoint = () => {
    if (keyPoints.length < 10) {
      setKeyPoints([...keyPoints, ""]);
    }
  };

  const updateKeyPoint = (index, value) => {
    const newKeyPoints = [...keyPoints];
    newKeyPoints[index] = value;
    setKeyPoints(newKeyPoints);
  };

  const removeKeyPoint = (index) => {
    const newKeyPoints = keyPoints.filter((_, i) => i !== index);
    setKeyPoints(newKeyPoints.length > 0 ? newKeyPoints : [""]);
  };

  const generateKeyPoints = async () => {
    if (!topic.trim() || !isAuthenticated) return;

    setLoading(true);

    try {
      const response = await apiClient.post("/api/script/key-points", {
        topic,
        contentType,
        language: selectedLanguage,
      });

      const keyPoints = response.data.data;
      let newKeyPoints = keyPoints.points || keyPoints;

      if (Array.isArray(newKeyPoints) && newKeyPoints.length > 0) {
        if (
          newKeyPoints[0] === "```json" &&
          newKeyPoints[newKeyPoints.length - 1] === "```"
        ) {
          const realPoints = newKeyPoints
            .slice(2, -2)
            .map((point) => {
              return point.replace(/^"/, "").replace(/",?$/, "").trim();
            })
            .filter((point) => point.length > 0);

          newKeyPoints = realPoints;
        } else if (
          newKeyPoints.some(
            (point) => typeof point === "string" && point.startsWith('"')
          )
        ) {
          newKeyPoints = newKeyPoints.map((point) =>
            point.replace(/^"/, "").replace(/",?$/, "").trim()
          );
        }
      }

      if (Array.isArray(newKeyPoints) && newKeyPoints.length > 0) {
        setKeyPoints(newKeyPoints.slice(0, 10));
      } else {
        throw new Error("Неверный формат ответа от сервера");
      }
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateScript = async () => {
    if (!topic.trim() || !isAuthenticated) return;

    setLoading(true);
    const validKeyPoints = keyPoints.filter((point) => point.trim() !== "");

    try {
      const res = await apiClient.post("/api/script/generate", {
        topic,
        duration,
        keyPoints: validKeyPoints,
        contentType,
        language: selectedLanguage,
      });

      setScript(cleanScript(res.data.data.script));
      setCurrentStep(2);
    } catch (error) {
      console.error("Ошибка при генерации скрипта:", error);
      setAuthError(
        "Ошибка при генерации скрипта. Проверьте подключение к серверу."
      );
    } finally {
      setLoading(false);
    }
  };

  const extendScript = async () => {
    if (!script.trim() || !topic.trim() || !isAuthenticated) return;

    setLoading(true);

    try {
      const res = await apiClient.post("/api/script/extend", {
        script,
        topic,
        contentType,
        language: selectedLanguage,
      });

      setScript(script + "\n\n" + cleanScript(res.data.data.extension));
    } catch (error) {
      console.error("Ошибка при расширении скрипта:", error);
    } finally {
      setLoading(false);
    }
  };

const handleTeleprompterSave = async (recordingData) => {
  try {
    const libraryType = recordingData.type === "video" ? "videos" : "audios";

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const extension = recordingData.type === "video" ? "webm" : "webm";
    const fileName = `teleprompter-${recordingData.type}-${timestamp}.${extension}`;

    const file = new File([recordingData.blob], fileName, {
      type:
        recordingData.blob.type ||
        (recordingData.type === "video" ? "video/webm" : "audio/webm"),
      lastModified: Date.now(),
    });

    const fileData = {
      id: Date.now() + Math.random(),
      name: fileName,
      type: libraryType,
      mimeType: file.type,
      mediaType: libraryType,
      size: file.size,
      blob: file,
      duration: recordingData.duration || 0,
      width: 0,
      height: 0,
      createdAt: recordingData.timestamp || new Date().toISOString(),
      source: "teleprompter",
      url: URL.createObjectURL(file),
    };

    // ✅ ДОБАВИМ: Попытаемся сохранить в IndexedDB
    try {
      const request = indexedDB.open('MVP_VideoEditor', 1);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        
        const dbData = { ...fileData };
        delete dbData.url;
      
      };
    } catch (dbError) {
      console.warn('⚠️ Не удалось сохранить в IndexedDB:', dbError);
    }
    setMediaLibrary((prev) => ({
      ...prev,
      [libraryType]: [...(prev[libraryType] || []), fileData],
    }));

    console.log(`✅ Файл из телесуфлера добавлен в библиотеку: ${fileName}`);
    return true;
  } catch (error) {
    console.error("❌ Ошибка сохранения записи из телесуфлера:", error);
    return false;
  }
};
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText && selectedText.length > 10) {
      setSelectedText(selectedText);
      setShowAiEditor(true);
      setAiPrompt("");
    }
  };

  const generateAiText = async () => {
    if (!aiPrompt.trim() || !isAuthenticated) return;

    setIsGeneratingText(true);

    try {
      const res = await apiClient.post("/api/script/improve", {
        selectedText,
        improvementCommand: aiPrompt,
        script,
        language: selectedLanguage,
      });

      const newScript = script.replace(
        selectedText,
        cleanScript(res.data.data.improvedText)
      );
      setScript(newScript);
    } catch (error) {
      console.error("Ошибка при улучшении текста:", error);
    } finally {
      setIsGeneratingText(false);
      setShowAiEditor(false);
      setSelectedText("");
    }
  };

const generateAudio = async () => {
  if (!isAuthenticated || !script.trim()) {
    console.warn("Нет авторизации или пустой скрипт");
    return;
  }

  setLoading(true);
  setAudioUrl("");

  try {
    const response = await apiClient.post("/api/audio/generate", {
      text: script,
      voiceId: 'JBFqnCBsd6RMkjVDRZzb', // ElevenLabs voice ID
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
      },
      output_format: "mp3_44100_128"
    });

    if (response.data.success) {
      const audioData = response.data.data;
      
      if (audioData.audioUrl) {
        // Прямая ссылка на аудио
        setAudioUrl(audioData.audioUrl);
      } else if (audioData.audioData) {
        // Base64 данные
        const audioBlob = new Blob(
          [Uint8Array.from(atob(audioData.audioData), c => c.charCodeAt(0))], 
          { type: 'audio/mpeg' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
      }
      
      setCurrentStep(4);
      console.log("✅ Аудио успешно сгенерировано");
      
    } else {
      throw new Error(response.data.error || "Ошибка сервера");
    }
    
  } catch (error) {
    console.error("❌ Ошибка при генерации аудио:", error);
    
    setAuthError(
      `Не удалось сгенерировать аудио: ${error.response?.data?.error || error.message}`
    );
    
    // Fallback для демо
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        setAudioUrl("demo-generated");
        setCurrentStep(4);
      }, 2000);
    }
  } finally {
    setLoading(false);
  }
};

  const handleTeleprompterRecording = (blob, type) => {
    if (type === "video") {
      const newVideoUrl = URL.createObjectURL(blob);
      const videoFile = new File(
        [blob],
        `teleprompter-video-${Date.now()}.webm`,
        {
          type: "video/webm",
        }
      );

      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }

      setVideoFile(videoFile);
      setVideoUrl(newVideoUrl);
      setCurrentStep(3);
    } else {
      setRecordedAudio({
        blob: blob,
        type: type,
        url: URL.createObjectURL(blob),
      });
      setCurrentStep(3);
    }
  };

  const contentTypes = [
    {
      id: "lifestyle",
      name: "Lifestyle",
      icon: Heart,
      color: "slate",
      emoji: "💖",
    },
    { id: "gaming", name: "Gaming", icon: Target, color: "blue", emoji: "🎮" },
    { id: "tech", name: "Technology", icon: Zap, color: "indigo", emoji: "⚡" },
    {
      id: "education",
      name: "Education",
      icon: Brain,
      color: "blue",
      emoji: "🧠",
    },
    {
      id: "entertainment",
      name: "Entertainment",
      icon: Star,
      color: "slate",
      emoji: "⭐",
    },
  ];

  if (showAuthModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md border border-slate-200/50 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-slate-600 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Brain size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent mb-2">
              Добро пожаловать в Scriptify
            </h2>
            <p className="text-gray-600 font-medium">
              Для работы требуется авторизация
            </p>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              {authError}
            </div>
          )}

          <button
            onClick={handleDemoLogin}
            className="w-full bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Войти в демо режиме
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Демо режим создаст временный аккаунт для тестирования
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-gray-900 flex flex-col">
      <div className="flex flex-1 relative">
        <ContentStudio
          isLeftPanelCollapsed={isLeftPanelCollapsed}
          setIsLeftPanelCollapsed={setIsLeftPanelCollapsed}
          contentType={contentType}
          setContentType={setContentType}
          setSelectedLanguage={setSelectedLanguage}
          selectedLanguage={selectedLanguage}
          topic={topic}
          setTopic={setTopic}
          keyPoints={keyPoints}
          setKeyPoints={setKeyPoints}
          duration={duration}
          setDuration={setDuration}
          script={script}
          setScript={setScript}
          isAuthenticated={isAuthenticated}
          audioMethod={audioMethod}
          setAudioMethod={setAudioMethod}
          recordedAudio={recordedAudio}
          setShowTeleprompter={setShowTeleprompter}
          setShowAudioEditor={setShowAudioEditor}
          audioUrl={audioUrl}
          assessment={assessment}
          loading={loading}
          currentStep={currentStep} 
          handleTextSelection={handleTextSelection}
          generateKeyPoints={generateKeyPoints}
          generateScript={generateScript}
          extendScript={extendScript}
          generateAudio={generateAudio}
          addKeyPoint={addKeyPoint}
          updateKeyPoint={updateKeyPoint}
          removeKeyPoint={removeKeyPoint}
          contentTypes={contentTypes}
        />

        <div className="w-2 bg-gradient-to-b from-transparent via-blue-400 to-transparent transition-all duration-300 relative group">
          <div className="absolute inset-y-0 -left-2 -right-2 bg-blue-400/10 transition-colors duration-300"></div>
        </div>

        <div
          className={`bg-gradient-to-br from-white/70 to-slate-50/70 backdrop-blur-xl p-6 flex flex-col transition-all duration-300 ease-in-out ${
            isLeftPanelCollapsed ? "w-[95%] min-w-[92%]" : "w-[74%] min-w-[69%]"
          }`}
        >
          <VideoEditor
            mediaLibrary={mediaLibrary}
            setMediaLibrary={setMediaLibrary}
            videoFile={videoFile}
            videoUrl={videoUrl}
            showAudioEditor={showAudioEditor}
          />
        </div>
      </div>

      {showAiEditor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 w-full max-w-3xl max-h-[85vh] overflow-y-auto border border-slate-200/50 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold flex items-center bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent">
                <Sparkles className="mr-3 text-slate-600" size={28} />
                AI Text Editor
              </h3>
              <button
                onClick={() => setShowAiEditor(false)}
                className="p-3 hover:bg-slate-100 rounded-xl transition-all duration-300"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-3">
                  Selected text:
                </label>
                <div className="p-6 bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-slate-200 rounded-xl text-gray-800 leading-relaxed font-medium shadow-lg">
                  "{selectedText}"
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-3">
                  How can this segment be improved?
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="For example: Make this segment more interesting and detailed, add examples..."
                  rows={4}
                  className="w-full p-4 bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-lg resize-none font-medium"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={generateAiText}
                  disabled={
                    !aiPrompt.trim() || isGeneratingText || !isAuthenticated
                  }
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
                >
                  {isGeneratingText ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2" size={16} />
                      Improve with AI
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowAiEditor(false)}
                  className="px-6 py-3 border border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl transition-all duration-300 bg-white hover:bg-slate-50 shadow-lg font-medium"
                >
                  Cancel
                </button>
              </div>

              <div>
                <p className="text-gray-700 font-semibold text-lg mb-4">
                  ⚡ Quick commands:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "Make it more detailed",
                    "Simplify explanation",
                    "Add examples",
                    "Make it more emotional",
                    "Add statistics",
                    "Improve structure",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setAiPrompt(prompt)}
                      className="px-4 py-3 text-sm bg-gradient-to-r from-slate-100 to-blue-100 hover:from-slate-200 hover:to-blue-200 text-slate-700 hover:text-blue-700 rounded-xl transition-all duration-300 border border-slate-200 hover:border-blue-300 font-medium shadow-lg hover:shadow-xl"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <TeleprompterModal
        setCurrentStep={setCurrentStep}
        isOpen={showTeleprompter}
        onClose={() => setShowTeleprompter(false)}
        script={script}
        onRecordingComplete={handleTeleprompterRecording}
        onSaveToLibrary={handleTeleprompterSave}
      />
    </div>
  );
};

export default VideoEditorApp;
