import { useState, useRef, useEffect } from "react";
import axios from "axios";
import VideoEditor from "../VideoEditor/VideoEditor";
import ContentStudio from "../ContentStudio";
import { cleanScript } from "../helpers/cleanScript";
import { TeleprompterModal } from "../ui/TeleprompterModal";

import {
  Upload,
  Scissors,
  Volume2,
  FileText,
  X,
  Sparkles,
  Zap,
  Brain,
  Mic,
  Eye,
  Heart,
  Share2,
  Star,
  Target,
} from "lucide-react";

const apiClient = axios.create({
  baseURL: "http://localhost:5000",
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
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingKeyPoints, setIsGeneratingKeyPoints] = useState(false);
  const [audioMethod, setAudioMethod] = useState("ai");
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [showAudioEditor, setShowAudioEditor] = useState(false);
  const [assessment, setAssessment] = useState({});
  const [contentType, setContentType] = useState("lifestyle");
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [isExtendingScript, setIsExtendingScript] = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(false);

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
        setAssessmentLoading(true);
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
          setAssessmentLoading(false);
        }
      }
    })();
  }, [script, isAuthenticated]);

  // Функция для демо-аутентификации (в реальном приложении замените на настоящую)
  const handleDemoLogin = async () => {
    try {
      // Для демо создаем временный токен или используем тестовый аккаунт
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
      // Если демо аккаунт не существует, создаем его
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

    setIsGeneratingKeyPoints(true);

    try {
      const response = await apiClient.post("/api/script/key-points", {
        topic,
        contentType,
      });

      
      const { keyPoints } = response.data.data;
      const newKeyPoints = keyPoints.points || keyPoints;

      if (Array.isArray(newKeyPoints) && newKeyPoints.length > 0) {
        setKeyPoints(newKeyPoints);
      } else {
        throw new Error("Неверный формат ответа от сервера");
      }
    } catch (error) {
      console.error("Ошибка при генерации ключевых пунктов:", error);

      setKeyPoints([
        `Анализ "${topic}"`,
        "Основные моменты",
        "Перспективы развития",
        "Практическое применение",
      ]);
    } finally {
      setIsGeneratingKeyPoints(false);
    }
  };

  const generateScript = async () => {
    if (!topic.trim() || !isAuthenticated) return;

    setIsGeneratingScript(true);
    const validKeyPoints = keyPoints.filter((point) => point.trim() !== "");

    try {
      const res = await apiClient.post("/api/script/generate", {
        topic,
        duration,
        keyPoints: validKeyPoints,
        contentType,
      });
      setScript(cleanScript(res.data.data.script));
      setCurrentStep(2);
    } catch (error) {
      console.error("Ошибка при генерации скрипта:", error);
      setAuthError(
        "Ошибка при генерации скрипта. Проверьте подключение к серверу."
      );
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const extendScript = async () => {
    if (!script.trim() || !topic.trim() || !isAuthenticated) return;

    setIsExtendingScript(true);

    try {
      const res = await apiClient.post("/api/script/extend", {
        script,
        topic,
        contentType,
      });

      setScript(script + "\n\n" + cleanScript(res.data.data.extension));
    } catch (error) {
      console.error("Ошибка при расширении скрипта:", error);
    } finally {
      setIsExtendingScript(false);
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
    if (!isAuthenticated) return;

    try {
      // Здесь можно добавить реальную генерацию аудио
      setTimeout(() => {
        setAudioUrl("generated");
        setCurrentStep(4);
      }, 2000);
    } catch (error) {
      console.error("Ошибка при генерации аудио:", error);
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

      if (script) {
        setCurrentStep(3);
      } else {
        setCurrentStep(2);
      }
    } else {
      setRecordedAudio({
        blob: blob,
        type: type,
        url: URL.createObjectURL(blob),
      });
      setCurrentStep(4);
    }
  };

  const steps = [
    {
      num: 1,
      title: "Create Script",
      active: currentStep >= 1,
      completed: currentStep > 1,
      icon: FileText,
      desc: "AI will create professional content",
    },
    {
      num: 2,
      title: "Upload Video",
      active: currentStep >= 2,
      completed: currentStep > 2,
      icon: Upload,
      desc: "Add your footage",
    },
    {
      num: 3,
      title: "AI Voiceover",
      active: currentStep >= 3,
      completed: currentStep > 3,
      icon: Mic,
      desc: "High-quality voiceover",
    },
    {
      num: 4,
      title: "Editing",
      active: currentStep >= 4,
      completed: currentStep > 4,
      icon: Scissors,
      desc: "Automatic processing",
    },
  ];

  const contentTypes = [
    { id: "lifestyle", name: "Lifestyle", icon: Heart, color: "slate" },
    { id: "gaming", name: "Gaming", icon: Target, color: "blue" },
    { id: "tech", name: "Technology", icon: Zap, color: "indigo" },
    { id: "education", name: "Education", icon: Brain, color: "blue" },
    { id: "entertainment", name: "Entertainment", icon: Star, color: "slate" },
  ];

  // Модальное окно авторизации
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
      {/* Progress Steps */}
      <div className="bg-gradient-to-r from-slate-100/80 to-blue-100/80 backdrop-blur-lg border-b border-slate-200/50 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent mb-2">
              Create professional content
            </h2>
            <p className="text-gray-600 font-medium">
              From idea to finished video in 4 simple steps
            </p>
          </div>
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={step.num} className="flex items-center">
                  <div className="flex flex-col items-center text-center max-w-xs">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-semibold transition-all duration-500 shadow-lg relative overflow-hidden ${
                        step.completed
                          ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-500/30"
                          : step.active
                          ? "bg-gradient-to-br from-slate-600 to-blue-600 text-white shadow-slate-500/30"
                          : "bg-white/80 text-gray-400 shadow-gray-200/50"
                      }`}
                    >
                      {step.completed ? (
                        <div className="text-xl">✓</div>
                      ) : (
                        <IconComponent size={18} />
                      )}
                    </div>
                    <span
                      className={`mt-4 text-lg font-semibold transition-colors duration-300 ${
                        step.active ? "text-slate-700" : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </span>
                    <span className="text-xs text-gray-500 mt-1 font-medium">
                      {step.desc}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-32 h-2 mx-8 rounded-full transition-all duration-500 ${
                        currentStep > step.num
                          ? "bg-gradient-to-r from-green-500 to-emerald-600"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-1 relative">
        {/* Content Studio Component */}
        <ContentStudio
          isLeftPanelCollapsed={isLeftPanelCollapsed}
          setIsLeftPanelCollapsed={setIsLeftPanelCollapsed}
          contentType={contentType}
          setContentType={setContentType}
          topic={topic}
          setTopic={setTopic}
          keyPoints={keyPoints}
          setKeyPoints={setKeyPoints}
          duration={duration}
          setDuration={setDuration}
          script={script}
          setScript={setScript}
          isGeneratingKeyPoints={isGeneratingKeyPoints}
          isGeneratingScript={isGeneratingScript}
          isExtendingScript={isExtendingScript}
          isAuthenticated={isAuthenticated}
          audioMethod={audioMethod}
          setAudioMethod={setAudioMethod}
          recordedAudio={recordedAudio}
          setShowTeleprompter={setShowTeleprompter}
          setShowAudioEditor={setShowAudioEditor}
          audioUrl={audioUrl}
          assessment={assessment}
          assessmentLoading={assessmentLoading}
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

        {/* Right Panel */}
        <div
          className={`bg-gradient-to-br from-white/70 to-slate-50/70 backdrop-blur-xl p-6 flex flex-col transition-all duration-300 ease-in-out ${
            isLeftPanelCollapsed ? "w-[92%] min-w-[92%]" : "w-[90%] min-w-[69%]"
          }`}
        >
          <VideoEditor />
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl mt-5 p-6 border border-slate-200/50 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-5 h-5 rounded-full shadow-lg ${
                    currentStep === 1
                      ? "bg-slate-500 shadow-slate-500/50"
                      : currentStep === 2
                      ? "bg-blue-500 shadow-blue-500/50"
                      : currentStep === 3
                      ? "bg-indigo-500 shadow-indigo-500/50"
                      : "bg-green-500 shadow-green-500/50"
                  } animate-pulse`}
                ></div>
                <span className="font-semibold text-gray-800 text-lg">
                  Control panel
                </span>
              </div>
              <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                Step {currentStep} of 4
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600 leading-relaxed font-medium">
                {currentStep === 1
                  ? "📝 Ready to create a professional script. Enter a topic or use AI to generate key points"
                  : currentStep === 2
                  ? "📹 Script created! Now upload your video for further processing"
                  : currentStep === 3
                  ? "🎤 Create voiceover: choose AI generation or record your voice manually"
                  : "🎬 Project ready for final editing and export in high quality"}
              </p>
              {/* Action Buttons */}
              {currentStep === 3 &&
                script &&
                videoFile &&
                !audioUrl &&
                !recordedAudio && (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      Go to the left panel to create voiceover
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <Brain
                          size={20}
                          className="mx-auto mb-2 text-blue-600"
                        />
                        <span className="text-xs font-medium text-blue-700">
                          AI voiceover
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <Mic
                          size={20}
                          className="mx-auto mb-2 text-slate-600"
                        />
                        <span className="text-xs font-medium text-slate-700">
                          Microphone recording
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              {currentStep === 4 && (
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold">
                    <Scissors className="mr-3" size={18} />
                    Start editing
                  </button>
                  {/* Features */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-200">
                      <div className="flex items-center space-x-2">
                        <Eye size={14} className="text-blue-500" />
                        <span className="text-xs font-medium text-blue-700">
                          Smart transitions
                        </span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center space-x-2">
                        <Share2 size={14} className="text-slate-500" />
                        <span className="text-xs font-medium text-slate-700">
                          Auto trimming
                        </span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-xl border border-indigo-200">
                      <div className="flex items-center space-x-2">
                        <Volume2 size={14} className="text-indigo-500" />
                        <span className="text-xs font-medium text-indigo-700">
                          Audio enhancement
                        </span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-xl border border-purple-200">
                      <div className="flex items-center space-x-2">
                        <Star size={14} className="text-purple-500" />
                        <span className="text-xs font-medium text-purple-700">
                          HD export
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Project Stats */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Brain size={16} className="mr-2 text-slate-600" />
                  Project analysis
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-slate-600">8.5</div>
                    <div className="text-xs text-gray-600 font-medium">
                      Quality
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-blue-600">95%</div>
                    <div className="text-xs text-gray-600 font-medium">
                      Readiness
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-indigo-600">HD</div>
                    <div className="text-xs text-gray-600 font-medium">
                      Export quality
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Editor Modal */}
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
              {/* Quick Prompts */}
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
        isOpen={showTeleprompter}
        onClose={() => setShowTeleprompter(false)}
        script={script}
        onRecordingComplete={handleTeleprompterRecording}
      />
    </div>
  );
};

export default VideoEditorApp;
