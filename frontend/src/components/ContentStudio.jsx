import { useRef } from "react";

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
} from "lucide-react";

const ContentStudio = ({
  isLeftPanelCollapsed,
  setIsLeftPanelCollapsed,
  contentType,
  setContentType,
  topic,
  setTopic,
  keyPoints,
  setKeyPoints,
  duration,
  setDuration,
  script,
  setScript,
  isGeneratingKeyPoints,
  isGeneratingScript,
  isExtendingScript,
  isAuthenticated,
  audioMethod,
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
  const scriptRef = useRef(null);

  // Script loading skeleton component
  const ScriptEditorSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gray-200 rounded animate-pulse"
            style={{ width: `${85 + Math.random() * 15}%` }}
          ></div>
        ))}
      </div>
    </div>
  );

  // Detailed analytics component
  const DetailedAnalytics = ({ assessmentLoading, assessment }) => (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-4 rounded-xl">
      <div className="flex items-start space-x-3">
        <div className="text-xl">📊</div>
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Content Analysis</h4>
          {assessmentLoading ? (
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          ) : (
            <div className="text-sm text-gray-700 space-y-1">
              <p>
                📈 Engagement Score:{" "}
                <span className="font-medium text-indigo-600">
                  {assessment?.engagement_score || 8.5}/10
                </span>
              </p>
              <p>
                🎯 Target Audience:{" "}
                <span className="font-medium text-purple-600">
                  {assessment?.target_audience || "General"}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    // TODO - поработать над стилями
    <div
      className={`${
        isLeftPanelCollapsed ? "w-24" : "w-[450px]"
      } h-[142vh] overflow-hidden bg-white/90 backdrop-blur-xl border-r border-slate-200/50 transition-all duration-300 ease-in-out flex flex-col shadow-xl shadow-slate-500/10 flex-shrink-0`}
    >
      {/* Global styles for custom scrollbar */}
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
            margin: 8px 0;
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

      <div className="flex items-center justify-between p-6 border-b border-slate-200/50 from-slate-50 to-blue-50 flex-shrink-0">
        {!isLeftPanelCollapsed && (
          <div className="flex flex-col items-center space-y-4 h-full justify-start pt-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent">
              Content Studio
            </h2>
            <p className="text-sm text-gray-600 font-medium">
              Professional content creation tools
            </p>
          </div>
        )}
        <button
          onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
          className="p-3 hover:bg-slate-100 rounded-xl transition-all duration-300 group"
        >
          {isLeftPanelCollapsed ? (
            <ChevronRight
              size={20}
              className="text-gray-600 group-hover:text-slate-700"
            />
          ) : (
            <ChevronLeft
              size={20}
              className="text-gray-600 group-hover:text-slate-700"
            />
          )}
        </button>
      </div>

      {isLeftPanelCollapsed ? (
        <div className="p-4 space-y-4">
          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={() => setIsLeftPanelCollapsed(false)}
              className="p-4 bg-gradient-to-br from-slate-100 to-blue-100 hover:from-slate-200 hover:to-blue-200 rounded-xl transition-all duration-300 group hover:scale-110 shadow-lg"
              title="Create script"
            >
              <FileText
                size={20}
                className="text-slate-600 group-hover:text-blue-600"
              />
            </button>
            <button
              onClick={() => setIsLeftPanelCollapsed(false)}
              className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 rounded-xl transition-all duration-300 group hover:scale-110 shadow-lg"
              title="Upload video"
            >
              <Upload
                size={20}
                className="text-blue-600 group-hover:text-indigo-600"
              />
            </button>
            <button
              onClick={() => setIsLeftPanelCollapsed(false)}
              className="p-4 bg-gradient-to-br from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 rounded-xl transition-all duration-300 group hover:scale-110 shadow-lg"
              title="AI voiceover"
            >
              <Mic
                size={20}
                className="text-indigo-600 group-hover:text-purple-600"
              />
            </button>
            <button
              onClick={() => setIsLeftPanelCollapsed(false)}
              className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 rounded-xl transition-all duration-300 group hover:scale-110 shadow-lg"
              title="Editing"
            >
              <Scissors
                size={20}
                className="text-purple-600 group-hover:text-pink-600"
              />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-r from-slate-600 to-blue-600 text-white p-4 rounded-xl">
              <div className="flex items-center space-x-3 mb-2">
                <Brain size={20} />
                <span className="font-semibold text-lg">AI-Powered</span>
              </div>
              <p className="text-sm opacity-90">
                Create professional content using artificial intelligence
              </p>
            </div>

            {/* Content Type Selection */}
            <div className="space-y-4">
              <label className="block text-gray-700 font-semibold text-lg">
                Content type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {contentTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setContentType(type.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        contentType === type.id
                          ? type.color === "slate"
                            ? "border-slate-500 bg-slate-50 shadow-lg shadow-slate-500/30"
                            : type.color === "blue"
                            ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/30"
                            : "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-500/30"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <IconComponent
                        size={24}
                        className={`mx-auto mb-2 ${
                          contentType === type.id
                            ? type.color === "slate"
                              ? "text-slate-600"
                              : type.color === "blue"
                              ? "text-blue-600"
                              : "text-indigo-600"
                            : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`text-sm font-bold ${
                          contentType === type.id
                            ? type.color === "slate"
                              ? "text-slate-700"
                              : type.color === "blue"
                              ? "text-blue-700"
                              : "text-indigo-700"
                            : "text-gray-600"
                        }`}
                      >
                        {type.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topic Input */}
            <div className="space-y-3">
              <label className="block text-gray-700 font-semibold">
                What is the video about?
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Example: Review of S.T.A.L.K.E.R. 2 game"
                  className="w-full p-4 bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                />
                <div className="absolute right-4 top-4">
                  <Brain size={20} className="text-slate-400" />
                </div>
              </div>
            </div>

            {/* Key Points */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-gray-700 font-semibold text-lg">
                    Key points
                  </label>
                  <p className="text-sm text-gray-500 font-medium">
                    What will engage viewers?
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={generateKeyPoints}
                    disabled={
                      !topic.trim() ||
                      isGeneratingKeyPoints ||
                      isGeneratingScript ||
                      isExtendingScript ||
                      !isAuthenticated
                    }
                    className="flex items-center px-4 py-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
                  >
                    {isGeneratingKeyPoints ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain size={16} className="mr-2" />
                        AI generation
                      </>
                    )}
                  </button>
                  <button
                    onClick={addKeyPoint}
                    disabled={
                      keyPoints.length >= 10 ||
                      isGeneratingKeyPoints ||
                      isGeneratingScript ||
                      isExtendingScript
                    }
                    className="flex items-center px-4 py-2 text-sm bg-gradient-to-r from-slate-500 to-blue-500 hover:from-slate-600 hover:to-blue-600 text-white rounded-xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
                  >
                    <Plus size={16} className="mr-2" />
                    Add
                  </button>
                </div>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {keyPoints.map((point, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-blue-400 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => updateKeyPoint(index, e.target.value)}
                      placeholder="Enter key point..."
                      className="flex-1 p-3 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:shadow-md font-medium"
                    />
                    {keyPoints.length > 1 && (
                      <button
                        onClick={() => removeKeyPoint(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <label className="block text-gray-700 font-semibold">
                Video duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-4 bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
              >
                <option>~5 minutes (500 words)</option>
                <option>~10 minutes (1000 words)</option>
                <option>~15 minutes (1500 words)</option>
                <option>~20 minutes (2000 words)</option>
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateScript}
              disabled={
                !topic ||
                isGeneratingScript ||
                isGeneratingKeyPoints ||
                isExtendingScript ||
                !isAuthenticated
              }
              className="w-full bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center">
                {isGeneratingScript ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Generating script...
                  </>
                ) : isGeneratingKeyPoints ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Waiting for key points...
                  </>
                ) : isExtendingScript ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Expanding script...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-3" size={20} />
                    Generate Script
                  </>
                )}
              </span>
            </button>

            {/* Tips */}
            {!script && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-300 p-4 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <div className="text-xl">💡</div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Tip from Scriptify:
                      </h4>
                      <p className="text-sm text-gray-700">
                        Structure content logically: introduction, main section
                        with key points, conclusion. This will help viewers
                        better absorb information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Script Editor */}
            {script && !isGeneratingScript ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-gray-700 font-semibold text-lg">
                      Your script is ready ✨
                    </label>
                    <p className="text-sm text-gray-500">
                      Professional content for your video
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200">
                      <Edit3 size={12} className="mr-2" />
                      Select text for AI improvement
                    </div>
                    <button
                      onClick={extendScript}
                      disabled={
                        isExtendingScript ||
                        isGeneratingKeyPoints ||
                        !isAuthenticated
                      }
                      className="flex items-center px-4 py-2 text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
                      title="Add more content to script"
                    >
                      {isExtendingScript ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Expanding...
                        </>
                      ) : (
                        <>
                          <Plus size={16} className="mr-2" />
                          Write more
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
                  rows={12}
                  className="w-full p-4 bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 leading-relaxed transition-all duration-300 shadow-lg hover:shadow-xl resize-none font-medium custom-scrollbar"
                  style={{ userSelect: "text" }}
                />
                {/* Script Stats */}
                <div className="flex items-center justify-between text-sm bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      {assessmentLoading ? (
                        <div
                          className="animate-spin rounded-full h-5 w-5 border-b-2 mr-3"
                          style={{ borderColor: "rgba(59, 130, 246, 0.5)" }}
                        />
                      ) : (
                        <Eye size={20} className="text-blue-600" />
                      )}
                      <span className="font-medium text-blue-700">
                        {!assessmentLoading &&
                          `Quality: ${assessment?.total_score || 8}/10`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {assessmentLoading ? (
                        <div
                          className="animate-spin rounded-full h-5 w-5 border-b-2 mr-3"
                          style={{ borderColor: "rgba(59, 130, 246, 0.5)" }}
                        />
                      ) : (
                        <Clock size={20} className="text-slate-600" />
                      )}
                      <span className="font-medium text-blue-700">
                        {!assessmentLoading &&
                          `~${
                            assessment?.video_duration ||
                            Math.ceil(script.length / 150)
                          } min`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {assessmentLoading ? (
                        <div
                          className="animate-spin rounded-full h-5 w-5 border-b-2 mr-3"
                          style={{ borderColor: "rgba(59, 130, 246, 0.5)" }}
                        />
                      ) : (
                        <Users size={20} className="text-indigo-600" />
                      )}
                      <span className="font-medium text-blue-700">
                        {!assessmentLoading && ` ${script.length} characters`}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    ✨ Ready for recording
                  </div>
                </div>
                <DetailedAnalytics
                  assessmentLoading={assessmentLoading}
                  assessment={assessment}
                />
              </div>
            ) : script.length && isGeneratingScript ? (
              <ScriptEditorSkeleton />
            ) : null}

            {/* Audio Creation Section */}
            {script && (
              <div className="space-y-6 border-t border-slate-200 pt-8">
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent mb-2">
                    Voiceover creation
                  </h3>
                  <p className="text-gray-600 font-medium">
                    Choose a method to create audio track
                  </p>
                </div>

                {/* Audio Method Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setAudioMethod("ai")}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                      audioMethod === "ai"
                        ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/30"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <Brain
                      size={32}
                      className={`mx-auto mb-3 ${
                        audioMethod === "ai" ? "text-blue-600" : "text-gray-400"
                      }`}
                    />
                    <h4
                      className={`font-semibold mb-2 ${
                        audioMethod === "ai" ? "text-blue-700" : "text-gray-600"
                      }`}
                    >
                      AI Voiceover
                    </h4>
                    <p className="text-sm text-gray-500">
                      Generate voice using artificial intelligence
                    </p>
                  </button>
                  <button
                    onClick={() => setAudioMethod("record")}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                      audioMethod === "record"
                        ? "border-slate-500 bg-slate-50 shadow-lg shadow-slate-500/30"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <Mic
                      size={32}
                      className={`mx-auto mb-3 ${
                        audioMethod === "record"
                          ? "text-slate-600"
                          : "text-gray-400"
                      }`}
                    />
                    <h4
                      className={`font-semibold mb-2 ${
                        audioMethod === "record"
                          ? "text-slate-700"
                          : "text-gray-600"
                      }`}
                    >
                      Record yourself
                    </h4>
                    <p className="text-sm text-gray-500">
                      Use teleprompter for professional recording
                    </p>
                  </button>
                </div>

                {/* AI Voice Options */}
                {audioMethod === "ai" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-3">
                        Select voice
                      </label>
                      <select className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl font-medium">
                        <option>Alexei - Male, professional</option>
                        <option>Anya - Female, friendly</option>
                        <option>Dmitry - Young male, energetic</option>
                        <option>Elena - Female, strict</option>
                        <option>Maxim - Male, charismatic</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-3">
                        Speech speed
                      </label>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">Slow</span>
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.1"
                          defaultValue="1"
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-500">Fast</span>
                      </div>
                    </div>
                    <button
                      onClick={generateAudio}
                      disabled={!isAuthenticated}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      <Volume2 className="mr-3 inline" size={20} />
                      Generate AI voiceover
                    </button>
                  </div>
                )}

                {/* Recording Options */}
                {audioMethod === "record" && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl border-2 border-slate-200 shadow-lg">
                      <div className="text-center">
                        {!recordedAudio && (
                          <>
                            <div className="w-16 h-16 bg-gradient-to-r from-slate-600 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                              <Eye size={32} className="text-white" />
                            </div>
                            <h4 className="font-bold text-slate-800 mb-2 text-lg">
                              Professional recording
                            </h4>
                            <p className="text-sm text-slate-600 mb-6 font-medium">
                              Use a teleprompter for quality recording
                            </p>
                            <button
                              onClick={() => setShowTeleprompter(true)}
                              className="bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center mx-auto"
                            >
                              <Eye className="mr-3" size={20} />
                              Open teleprompter
                            </button>
                          </>
                        )}
                        {recordedAudio && (
                          <>
                            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                              <Volume2 size={32} className="text-white" />
                            </div>
                            <h4 className="font-bold text-green-800 mb-2 text-lg">
                              Recording completed!
                            </h4>
                            <p className="text-sm text-green-600 mb-6 font-medium">
                              {recordedAudio.type === "video"
                                ? "Video"
                                : "Audio"}{" "}
                              successfully recorded
                            </p>
                            <div className="flex space-x-3 justify-center">
                              <button
                                onClick={() => setShowAudioEditor(true)}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                              >
                                <Edit3 className="mr-2 inline" size={16} />
                                Edit
                              </button>
                              <button
                                onClick={() => setShowTeleprompter(true)}
                                className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
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

                {/* Generated Audio Preview */}
                {audioUrl && audioMethod === "ai" && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 shadow-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Volume2 size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-blue-800 text-lg">
                          AI voiceover created!
                        </h4>
                        <p className="text-sm text-blue-600 font-medium">
                          Professional voiceover ready
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAudioEditor(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <Edit3 className="mr-2 inline" size={14} />
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
