import { useEffect, useRef, useState } from "react";
import AudioPlayer from "./AudioPlayer";

import {
  Upload,
  Scissors,
  Volume2,
  FileText,
  Wand2,
  Plus,
  X,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Brain,
  Mic,
  Users,
  Eye,
  Clock,
  TrendingUp,
  BookOpen,
  Heart,
  Search,
  Lightbulb,
  Music,
  Target,
  AlertCircle,
  Award,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const ContentStudio = ({
  isLeftPanelCollapsed,
  setIsLeftPanelCollapsed,
  contentType,
  setContentType,
  selectedLanguage,
  onAudioSaved,
  setSelectedLanguage,
  topic,
  loading,
  setTopic,
  keyPoints,
  duration,
  setDuration,
  script,
  setScript,
  isAuthenticated,
  audioMethod,
  generatedAudio,
  onGenerateAudio,
  setAudioMethod,
  recordedAudio,
  setShowTeleprompter,
  setShowAudioEditor,
  audioUrl,
  assessment,
  assessmentLoading,
  handleTextSelection,
  generateKeyPoints,
  generateScript,
  extendScript,
  generateAudio,
  addKeyPoint,
  updateKeyPoint,
  removeKeyPoint,
  contentTypes,
}) => {
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isContentTypeDropdownOpen, setIsContentTypeDropdownOpen] =
    useState(false);

  const [voices, setVoices] = useState([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState(
    "JBFqnCBsd6RMkjVDRZzb"
  );
  const [voicesLoading, setVoicesLoading] = useState(false);

  const { getAvailableVoices } = useAuth();

  const languages = [
    { id: "english", name: "English", flag: "🇺🇸" },
    { id: "russian", name: "Русский", flag: "🇷🇺" },
    { id: "spanish", name: "Español", flag: "🇪🇸" },
    { id: "french", name: "Français", flag: "🇫🇷" },
    { id: "german", name: "Deutsch", flag: "🇩🇪" },
    { id: "chinese", name: "中文", flag: "🇨🇳" },
  ];

  useEffect(() => {
    const fetchVoices = async () => {
      if (!isAuthenticated) return;

      setVoicesLoading(true);
      try {
        const result = await getAvailableVoices();

        if (result.success && result.voices) {
          setVoices(result.voices);

          // Устанавливаем первый голос как выбранный, если текущий не найден
          if (
            result.voices.length > 0 &&
            !result.voices.find((v) => v.voice_id === selectedVoiceId)
          ) {
            setSelectedVoiceId(result.voices[0].voice_id);
          }
        } else {
          console.error("❌ Ошибка загрузки голосов:", result.error);
        }
      } catch (error) {
        console.error("❌ Ошибка при загрузке голосов:", error);
      } finally {
        setVoicesLoading(false);
      }
    };

    fetchVoices();
  }, [isAuthenticated, getAvailableVoices]);

  const scriptRef = useRef(null);

  const ScriptEditorSkeleton = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
      </div>
      <div className="space-y-1">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-2 bg-gray-200 rounded animate-pulse"
            style={{ width: `${80 + Math.random() * 20}%` }}
          ></div>
        ))}
      </div>
    </div>
  );

  const DetailedAnalytics = ({ assessmentLoading, assessment }) => {
    const getScoreStyle = (score) => {
      if (score >= 8)
        return {
          text: "text-white",
          bg: "bg-gradient-to-br from-blue-500 to-indigo-600",
        };
      if (score >= 6)
        return {
          text: "text-white",
          bg: "bg-gradient-to-br from-indigo-500 to-purple-600",
        };
      return {
        text: "text-white",
        bg: "bg-gradient-to-br from-slate-500 to-gray-600",
      };
    };

    const getProgressStyle = (score) => {
      if (score >= 8) return "bg-gradient-to-r from-blue-400 to-blue-600";
      if (score >= 6) return "bg-gradient-to-r from-indigo-400 to-indigo-600";
      return "bg-gradient-to-r from-slate-400 to-slate-600";
    };

    const CompactMetric = ({ icon: Icon, label, score }) => {
      const style = getScoreStyle(score);
      return (
        <div className="bg-white/80 rounded p-1 border border-white/30 hover:border-white/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <div className="p-0.5 rounded bg-gradient-to-br from-indigo-500 to-purple-600">
                <Icon size={6} className="text-white" />
              </div>
              <span className="text-xs font-medium text-gray-800 truncate">
                {label}
              </span>
            </div>
            <div
              className={`px-1 py-0.5 rounded text-xs font-bold ${style.bg} ${style.text}`}
            >
              {score}
            </div>
          </div>
          <div className="w-full bg-gray-200/50 rounded-full h-0.5 mt-0.5">
            <div
              className={`h-0.5 rounded-full ${getProgressStyle(
                score
              )} transition-all duration-500`}
              style={{ width: `${Math.min(score * 10, 100)}%` }}
            />
          </div>
        </div>
      );
    };

    const CompactCircularScore = ({ score }) => {
      const percentage = Math.round(score * 10);
      const circumference = 2 * Math.PI * 8;
      const strokeDashoffset =
        circumference - (percentage / 100) * circumference;

      const getGradeStyle = (score) => {
        if (score >= 8)
          return { gradient: "from-blue-500 to-indigo-600", grade: "A" };
        if (score >= 6)
          return { gradient: "from-indigo-500 to-purple-600", grade: "B" };
        return { gradient: "from-slate-500 to-gray-600", grade: "C" };
      };

      const gradeStyle = getGradeStyle(score);

      return (
        <div
          className={`bg-gradient-to-br ${gradeStyle.gradient} rounded p-1 text-white shadow`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1">
                <Award size={6} className="text-white" />
                <span className="text-xs font-bold">Score</span>
              </div>
            </div>
            <div className="relative">
              <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 16 16">
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="1"
                  fill="none"
                />
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="white"
                  strokeWidth="1"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-bold">{score}</span>
              </div>
            </div>
          </div>
        </div>
      );
    };

    if (assessmentLoading) {
      return (
        <div className="bg-gradient-to-br from-slate-100 to-purple-50 border border-indigo-200/50 p-1 rounded shadow">
          <div className="flex items-center space-x-1">
            <div className="animate-spin rounded-full h-2 w-2 border border-indigo-500 border-t-transparent"></div>
            <span className="text-xs font-bold text-gray-800">
              Analyzing...
            </span>
          </div>
        </div>
      );
    }

    if (!assessment) {
      return (
        <div className="bg-gray-100 border border-gray-300 p-1 rounded text-center">
          <AlertCircle size={8} className="text-gray-400 mx-auto" />
          <p className="text-xs text-gray-600">No analysis</p>
        </div>
      );
    }

    const parsedAssessment = JSON.parse(assessment);

    const metrics = [
      {
        icon: Target,
        label: "Structure",
        score: parsedAssessment.structure || 0,
      },
      {
        icon: Clock,
        label: "Duration",
        score: parsedAssessment.video_duration || 0,
      },
      {
        icon: TrendingUp,
        label: "Engage",
        score: parsedAssessment.engagement || 0,
      },
      {
        icon: BookOpen,
        label: "Read",
        score: parsedAssessment.readability || 0,
      },
      {
        icon: Heart,
        label: "Emotion",
        score: parsedAssessment.emotional_tone || 0,
      },
      { icon: Eye, label: "Clarity", score: parsedAssessment.clarity || 0 },
      {
        icon: Search,
        label: "SEO",
        score: parsedAssessment.seo_optimization || 0,
      },
      { icon: Music, label: "Rhythm", score: parsedAssessment.rhythm || 0 },
    ];

    return (
      <div className="bg-gradient-to-br from-slate-50 to-purple-50 border border-indigo-200/50 p-1 rounded shadow">
        <div className="flex items-center space-x-1 mb-3">
          <div className="w-3 h-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center">
            <Award className="text-white" size={6} />
          </div>
          <h3 className="text-xs font-bold text-indigo-600">Analysis</h3>
        </div>

        <div className="mb-3">
          <CompactCircularScore score={parsedAssessment.total_score || 0} />
        </div>

        <div className="grid grid-cols-2 gap-0.5">
          {metrics.map((metric, index) => (
            <CompactMetric
              key={index}
              icon={metric.icon}
              label={metric.label}
              score={metric.score}
            />
          ))}
        </div>

        {parsedAssessment.recommendations &&
          parsedAssessment.recommendations.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 rounded p-1 border border-blue-200/50 mt-1">
              <div className="flex items-center space-x-1">
                <Lightbulb size={6} className="text-indigo-600" />
                <span className="font-bold text-gray-800 text-xs">Tip</span>
              </div>
              <div className="bg-white/80 rounded p-1">
                <p className="text-xs text-gray-700 leading-tight">
                  {parsedAssessment.recommendations[0]}
                </p>
              </div>
            </div>
          )}
      </div>
    );
  };

  return (
    <div
      className={`${
        isLeftPanelCollapsed ? "w-12" : "w-[350px]"
      } h-[106vh] overflow-hidden bg-white/90 backdrop-blur-xl border-r border-slate-200/50 transition-all duration-300 ease-in-out flex flex-col shadow-xl shadow-slate-500/10 flex-shrink-0`}
    >
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
            margin: 4px 0;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
            transition: all 0.2s ease;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 #f1f5f9;
          }
        `}
      </style>

      <div className="flex items-center justify-between p-4 border-b border-slate-200/50 flex-shrink-0">
        {!isLeftPanelCollapsed && (
          <div className="flex flex-col">
            <h2 className="text-sm font-bold bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent">
              Content Studio
            </h2>
            <p className="text-xs text-gray-600">
              Professional content creation
            </p>
          </div>
        )}
        <button
          onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
          className="p-1 hover:bg-slate-100 rounded transition-all duration-300 group"
        >
          {isLeftPanelCollapsed ? (
            <ChevronRight
              size={12}
              className="text-gray-600 group-hover:text-slate-700"
            />
          ) : (
            <ChevronLeft
              size={12}
              className="text-gray-600 group-hover:text-slate-700"
            />
          )}
        </button>
      </div>

      {isLeftPanelCollapsed ? (
        <div className="p-1 space-y-1">
          <div className="flex flex-col items-center space-y-1">
            <button
              onClick={() => setIsLeftPanelCollapsed(false)}
              className="p-1 bg-gradient-to-br from-slate-100 to-blue-100 hover:from-slate-200 hover:to-blue-200 rounded transition-all duration-300 group hover:scale-110 shadow"
              title="Create script"
            >
              <FileText
                size={12}
                className="text-slate-600 group-hover:text-blue-600"
              />
            </button>
            <button
              onClick={() => setIsLeftPanelCollapsed(false)}
              className="p-1 bg-gradient-to-br from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 rounded transition-all duration-300 group hover:scale-110 shadow"
              title="Upload video"
            >
              <Upload
                size={12}
                className="text-blue-600 group-hover:text-indigo-600"
              />
            </button>
            <button
              onClick={() => setIsLeftPanelCollapsed(false)}
              className="p-1 bg-gradient-to-br from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 rounded transition-all duration-300 group hover:scale-110 shadow"
              title="AI voiceover"
            >
              <Mic
                size={12}
                className="text-indigo-600 group-hover:text-purple-600"
              />
            </button>
            <button
              onClick={() => setIsLeftPanelCollapsed(false)}
              className="p-1 bg-gradient-to-br from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 rounded transition-all duration-300 group hover:scale-110 shadow"
              title="Editing"
            >
              <Scissors
                size={12}
                className="text-purple-600 group-hover:text-pink-600"
              />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-r from-slate-600 to-blue-600 text-white p-4 rounded">
              <div className="flex items-center space-x-1 mb-0.5">
                <Brain size={12} />
                <span className="font-semibold text-xs">AI-Powered</span>
              </div>
              <p className="text-xs opacity-90">
                Create professional content using AI
              </p>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-3">
                Content Language
              </label>
              <div className="relative">
                <button
                  onClick={() =>
                    setIsLanguageDropdownOpen(!isLanguageDropdownOpen)
                  }
                  className="w-full bg-white/90 backdrop-blur-sm border border-slate-200 rounded p-2 text-left transition-all duration-300 hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-xs">
                        {
                          languages.find((lang) => lang.id === selectedLanguage)
                            ?.flag
                        }
                      </span>
                      <span className="text-xs font-medium text-gray-900">
                        {
                          languages.find((lang) => lang.id === selectedLanguage)
                            ?.name
                        }
                      </span>
                    </div>

                    <div
                      className={`transform transition-transform duration-200 ${
                        isLanguageDropdownOpen ? "rotate-180" : ""
                      }`}
                    >
                      <svg
                        className="w-3 h-3 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                {isLanguageDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-xl border border-slate-200 rounded shadow-xl overflow-hidden">
                    {languages.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => {
                          setSelectedLanguage(lang.id);
                          setIsLanguageDropdownOpen(false);
                        }}
                        className={`w-full p-2 text-left transition-all duration-200 flex items-center space-x-1 hover:bg-blue-50 ${
                          selectedLanguage === lang.id
                            ? "bg-blue-50 text-blue-700 border-l-2 border-blue-500"
                            : "text-gray-700 hover:text-blue-600"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{lang.flag}</span>
                          <span className="text-xs font-medium">
                            {lang.name}
                          </span>
                        </div>
                        {selectedLanguage === lang.id && (
                          <div className="ml-auto">
                            <svg
                              className="w-3 h-3 text-blue-500"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-3">
                Content Type
              </label>
              <div className="relative">
                <button
                  onClick={() =>
                    setIsContentTypeDropdownOpen(!isContentTypeDropdownOpen)
                  }
                  className="w-full bg-white/90 backdrop-blur-sm border border-slate-200 rounded p-1 text-left transition-all duration-300 hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center ${
                          contentTypes.find((type) => type.id === contentType)
                            ?.color === "slate"
                            ? "bg-slate-100"
                            : contentTypes.find(
                                (type) => type.id === contentType
                              )?.color === "blue"
                            ? "bg-blue-100"
                            : "bg-indigo-100"
                        }`}
                      >
                        <span className="text-xs">
                          {
                            contentTypes.find((type) => type.id === contentType)
                              ?.emoji
                          }
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 text-xs block">
                          {
                            contentTypes.find((type) => type.id === contentType)
                              ?.name
                          }
                        </span>
                      </div>
                    </div>
                    <div
                      className={`transform transition-transform duration-200 ${
                        isContentTypeDropdownOpen ? "rotate-180" : ""
                      }`}
                    >
                      <svg
                        className="w-3 h-3 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                {isContentTypeDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-xl border border-slate-200 rounded shadow-xl overflow-hidden">
                    {contentTypes.map((type) => {
                      return (
                        <button
                          key={type.id}
                          onClick={() => {
                            setContentType(type.id);
                            setIsContentTypeDropdownOpen(false);
                          }}
                          className={`w-full p-1 text-left transition-all duration-200 flex items-center space-x-1 hover:bg-gray-50 ${
                            contentType === type.id
                              ? `${
                                  type.color === "slate"
                                    ? "bg-slate-50 border-l-2 border-slate-500"
                                    : type.color === "blue"
                                    ? "bg-blue-50 border-l-2 border-blue-500"
                                    : "bg-indigo-50 border-l-2 border-indigo-500"
                                }`
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-300 ${
                              contentType === type.id
                                ? type.color === "slate"
                                  ? "bg-slate-100 shadow shadow-slate-500/20"
                                  : type.color === "blue"
                                  ? "bg-blue-100 shadow shadow-blue-500/20"
                                  : "bg-indigo-100 shadow shadow-indigo-500/20"
                                : "bg-gray-50"
                            }`}
                          >
                            <span className="text-xs">{type.emoji}</span>
                          </div>

                          <div className="flex-1">
                            <div
                              className={`font-semibold transition-colors text-xs ${
                                contentType === type.id
                                  ? type.color === "slate"
                                    ? "text-slate-700"
                                    : type.color === "blue"
                                    ? "text-blue-700"
                                    : "text-indigo-700"
                                  : "text-gray-700"
                              }`}
                            >
                              {type.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {type.id === "lifestyle" && "Personal growth"}
                              {type.id === "gaming" && "Gaming content"}
                              {type.id === "tech" && "Technology"}
                              {type.id === "education" && "Learning"}
                              {type.id === "entertainment" && "Fun content"}
                            </div>
                          </div>

                          {contentType === type.id && (
                            <div className="ml-auto">
                              <svg
                                className={`w-3 h-3 ${
                                  type.color === "slate"
                                    ? "text-slate-500"
                                    : type.color === "blue"
                                    ? "text-blue-500"
                                    : "text-indigo-500"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Topic Input */}
            <div className="space-y-1">
              <label className="block text-gray-700 font-semibold text-xs">
                What is the video about?
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Example: Review of S.T.A.L.K.E.R. 2 game"
                  className="w-full p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow font-medium text-xs"
                />
                <div className="absolute right-1 top-1">
                  <Brain size={10} className="text-slate-400" />
                </div>
              </div>
            </div>

            {/* Key Points */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-gray-700 font-semibold text-xs">
                    Key points
                  </label>
                  <p className="text-xs text-gray-500">
                    What will engage viewers?
                  </p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={generateKeyPoints}
                    disabled={!topic.trim() || loading || !isAuthenticated}
                    className="flex items-center px-1 py-0.5 text-xs bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow hover:shadow-lg hover:scale-105 font-semibold"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-2 w-2 border border-white border-t-transparent mr-1"></div>
                        Gen...
                      </>
                    ) : (
                      <>
                        <Brain size={8} className="mr-1" />
                        AI
                      </>
                    )}
                  </button>
                  <button
                    onClick={addKeyPoint}
                    disabled={keyPoints.length >= 10 || loading}
                    className="flex items-center px-1 py-0.5 text-xs bg-gradient-to-r from-slate-500 to-blue-500 hover:from-slate-600 hover:to-blue-600 text-white rounded disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow hover:shadow-lg hover:scale-105 font-semibold"
                  >
                    <Plus size={8} className="mr-1" />
                    Add
                  </button>
                </div>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                {keyPoints.map((point, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-1 group"
                  >
                    <div className="w-3 h-3 bg-gradient-to-br from-slate-400 to-blue-400 rounded flex items-center justify-center text-white font-semibold text-xs">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => updateKeyPoint(index, e.target.value)}
                      placeholder="Enter key point..."
                      className="flex-1 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:shadow-md font-medium text-xs"
                    />
                    {keyPoints.length > 1 && (
                      <button
                        onClick={() => removeKeyPoint(index)}
                        className="p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-300 opacity-0 group-hover:opacity-100"
                      >
                        <X size={8} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <label className="block text-gray-700 font-semibold text-xs">
                Video duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow hover:shadow-lg font-medium text-xs"
              >
                <option value="short">~5 minutes</option>
                <option value="medium">~10 minutes</option>
                <option value="long">~15 minutes</option>
                <option value="extra_long">~20 minutes</option>
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateScript}
              disabled={!topic || loading || !isAuthenticated}
              className="w-full bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-2 px-2 rounded transition-all duration-300 flex items-center justify-center shadow hover:shadow-lg hover:scale-105 group overflow-hidden relative text-xs"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1"></div>
                    Generating script...
                  </>
                ) : loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1"></div>
                    Waiting for key points...
                  </>
                ) : loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1"></div>
                    Expanding script...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-1" size={12} />
                    Generate Script
                  </>
                )}
              </span>
            </button>

            {/* Tips */}
            {!script && (
              <div className="space-y-2">
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-300 p-4 rounded">
                  <div className="flex items-start space-x-1">
                    <div className="text-sm">💡</div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 text-xs">
                        Tip from Scriptify:
                      </h4>
                      <p className="text-xs text-gray-700">
                        Structure content logically: introduction, main section
                        with key points, conclusion.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Script Editor */}
            {script && !loading ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-gray-700 font-semibold text-xs">
                      Your script is ready ✨
                    </label>
                    <p className="text-xs text-gray-500">
                      Professional content for your video
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-200">
                      <Edit3 size={6} className="mr-0.5" />
                      Select text
                    </div>
                    <button
                      onClick={extendScript}
                      disabled={loading || !isAuthenticated}
                      className="flex items-center px-1 py-0.5 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded transition-all duration-300 shadow hover:shadow-lg hover:scale-105 font-semibold"
                      title="Add more content to script"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-2 w-2 border border-white border-t-transparent mr-0.5"></div>
                          Exp...
                        </>
                      ) : (
                        <>
                          <Plus size={8} className="mr-0.5" />
                          More
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  ref={scriptRef}
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  onMouseUp={handleTextSelection}
                  rows={6}
                  className="w-full p-4 bg-white/90 backdrop-blur-sm border border-slate-200 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 leading-relaxed transition-all duration-300 shadow hover:shadow-lg resize-none font-medium text-xs custom-scrollbar"
                  style={{ userSelect: "text" }}
                />
                <div className="flex items-center justify-between text-xs bg-gradient-to-r from-blue-50 to-indigo-50 p-1 rounded border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-0.5">
                      {assessmentLoading ? (
                        <div className="animate-spin rounded-full h-2 w-2 border border-indigo-500 border-t-transparent mr-0.5" />
                      ) : (
                        <Eye size={8} className="text-blue-600" />
                      )}
                      <span className="font-medium text-blue-700 text-xs">
                        {!assessmentLoading &&
                          `Quality: ${assessment?.total_score || 8}/10`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-0.5">
                      {assessmentLoading ? (
                        <div className="animate-spin rounded-full h-2 w-2 border border-indigo-500 border-t-transparent mr-0.5" />
                      ) : (
                        <Clock size={8} className="text-slate-600" />
                      )}
                      <span className="font-medium text-blue-700 text-xs">
                        {!assessmentLoading &&
                          `~${
                            assessment?.video_duration ||
                            Math.ceil(script.length / 150)
                          } min`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-0.5">
                      {assessmentLoading ? (
                        <div className="animate-spin rounded-full h-2 w-2 border border-indigo-500 border-t-transparent mr-0.5" />
                      ) : (
                        <Users size={8} className="text-indigo-600" />
                      )}
                      <span className="font-medium text-blue-700 text-xs">
                        {!assessmentLoading && ` ${script.length} chars`}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">✨ Ready</div>
                </div>
                {!assessmentLoading && assessment && assessment.length > 0 && (
                  <DetailedAnalytics
                    assessmentLoading={assessmentLoading}
                    assessment={assessment}
                  />
                )}
              </div>
            ) : script && script.length && loading ? (
              <ScriptEditorSkeleton />
            ) : null}

            {script && (
              <div className="space-y-2 border-t border-slate-200 pt-2">
                <div>
                  <h3 className="text-xs font-bold bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent mb-0.5">
                    Voiceover creation
                  </h3>
                  <p className="text-gray-600 font-medium text-xs">
                    Choose a method to create audio track
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setAudioMethod("ai")}
                    className={`p-4 rounded border-2 transition-all duration-300 ${
                      audioMethod === "ai"
                        ? "border-blue-500 bg-blue-50 shadow shadow-blue-500/30"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <Brain
                      size={16}
                      className={`mx-auto mb-3 ${
                        audioMethod === "ai" ? "text-blue-600" : "text-gray-400"
                      }`}
                    />
                    <h4
                      className={`font-semibold mb-0.5 text-xs ${
                        audioMethod === "ai" ? "text-blue-700" : "text-gray-600"
                      }`}
                    >
                      AI Voiceover
                    </h4>
                    <p className="text-xs text-gray-500">
                      Generate voice using AI
                    </p>
                  </button>
                  <button
                    onClick={() => !loading && setAudioMethod("record")}
                    className={`p-4 rounded border-2 transition-all duration-300 ${
                      audioMethod === "record"
                        ? "border-slate-500 bg-slate-50 shadow shadow-slate-500/30"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <Mic
                      size={16}
                      className={`mx-auto mb-3 ${
                        audioMethod === "record"
                          ? "text-slate-600"
                          : "text-gray-400"
                      }`}
                    />
                    <h4
                      className={`font-semibold mb-0.5 text-xs ${
                        audioMethod === "record"
                          ? "text-slate-700"
                          : "text-gray-600"
                      }`}
                    >
                      Record yourself
                    </h4>
                    <p className="text-xs text-gray-500">Use teleprompter</p>
                  </button>
                </div>

                {audioMethod === "ai" && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-3 text-xs">
                          Select voice
                        </label>
                        {voicesLoading ? (
                          <div className="w-full p-2 bg-gray-100 border border-slate-200 rounded text-center text-xs">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
                              <span className="text-gray-600">
                                Loading voices...
                              </span>
                            </div>
                          </div>
                        ) : voices.length > 0 ? (
                          <select
                            value={selectedVoiceId}
                            onChange={(e) => setSelectedVoiceId(e.target.value)}
                            className="w-full p-1 bg-white border border-slate-200 rounded text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow hover:shadow-lg font-medium text-xs"
                          >
                            {voices.map((voice) => (
                              <option
                                key={voice.voice_id}
                                value={voice.voice_id}
                              >
                                {voice.name} - {voice.description}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full p-2 bg-red-100 border border-red-200 rounded text-center text-xs text-red-600">
                            Failed to load voices. Please refresh the page.
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold mb-3 text-xs">
                          Speech speed
                        </label>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">Slow</span>
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            defaultValue="1"
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-500">Fast</span>
                        </div>
                      </div>

                      <button
                        onClick={() => generateAudio(selectedVoiceId)}
                        disabled={
                          !isAuthenticated ||
                          voicesLoading ||
                          loading ||
                          !script.trim()
                        }
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded transition-all duration-300 shadow hover:shadow-lg hover:scale-105 text-xs flex items-center justify-center space-x-2"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                            <span>Generating audio...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 size={14} />
                            <span>Generate AI voiceover</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Показываем аудио плеер если аудио сгенерировано */}
                    {generatedAudio && (
                      <AudioPlayer
                        generatedAudio={generatedAudio}
                        onClose={() => onGenerateAudio(null)}
                      />
                    )}
                  </div>
                )}
                {audioMethod === "record" && (
                  <div className="space-y-1">
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded border border-slate-200 shadow">
                      <div className="text-center">
                        {!recordedAudio && (
                          <>
                            <div className="w-6 h-6 bg-gradient-to-r from-slate-600 to-blue-600 rounded mx-auto mb-3 flex items-center justify-center shadow">
                              <Eye size={12} className="text-white" />
                            </div>
                            <h4 className="font-bold text-slate-800 mb-0.5 text-xs">
                              Professional recording
                            </h4>
                            <p className="text-xs text-slate-600 mb-2 font-medium">
                              Use a teleprompter for quality recording
                            </p>
                            <button
                              onClick={() => setShowTeleprompter(true)}
                              className="bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 text-white font-semibold py-1 px-2 rounded transition-all duration-300 shadow hover:shadow-lg hover:scale-105 flex items-center mx-auto text-xs"
                            >
                              <Eye className="mr-1" size={10} />
                              Open teleprompter
                            </button>
                          </>
                        )}
                        {recordedAudio && (
                          <>
                            <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded mx-auto mb-3 flex items-center justify-center shadow">
                              <Volume2 size={12} className="text-white" />
                            </div>
                            <h4 className="font-bold text-green-800 mb-0.5 text-xs">
                              Recording completed!
                            </h4>
                            <p className="text-xs text-green-600 mb-2 font-medium">
                              {recordedAudio.type === "video"
                                ? "Video"
                                : "Audio"}{" "}
                              successfully recorded
                            </p>
                            <div className="flex space-x-1 justify-center">
                              <button
                                onClick={() => setShowAudioEditor(true)}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-1 px-2 rounded transition-all duration-300 shadow text-xs"
                              >
                                <Edit3 className="mr-0.5 inline" size={8} />
                                Edit
                              </button>
                              <button
                                onClick={() => setShowTeleprompter(true)}
                                className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold py-1 px-2 rounded transition-all duration-300 shadow text-xs"
                              >
                                Record again
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {audioUrl && audioMethod === "ai" && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded border border-blue-200 shadow">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded flex items-center justify-center shadow">
                        <Volume2 size={10} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-blue-800 text-xs">
                          AI voiceover created!
                        </h4>
                        <p className="text-xs text-blue-600 font-medium">
                          Professional voiceover ready
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAudioEditor(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-0.5 px-1 rounded transition-all duration-300 shadow text-xs"
                      >
                        <Edit3 className="mr-0.5 inline" size={8} />
                        Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentStudio;
