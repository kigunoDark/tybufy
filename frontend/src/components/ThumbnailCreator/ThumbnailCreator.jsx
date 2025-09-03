import { useState } from "react";
import { Wand2, X, Image as ImageIcon, ArrowRight, Send } from "lucide-react";
import { generateThumbnailWithGemini } from "../hooks/useGenerateThumbnails";

const ThumbnailCreator = ({ isOpen, onClose, apiKey = "AIzaSyCfG1aFkkGqL-m9KGH1uDm5_Q5HX5c0nZs" }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedThumbnails, setGeneratedThumbnails] = useState([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [promptText, setPromptText] = useState("");

  const createPlaceholderThumbnails = () => {
    return Array.from({ length: 3 }, (_, i) => ({
      id: i + 1,
      isPlaceholder: true,
      url: `data:image/svg+xml,${encodeURIComponent(`
        <svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="shimmer${i}" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#f6f7f8;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#edeef1;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#f6f7f8;stop-opacity:1" />
              <animateTransform attributeName="gradientTransform" attributeType="XML" type="translate" values="-100 0;100 0;-100 0" dur="2s" repeatCount="indefinite"/>
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#shimmer${i})"/>
          <circle cx="160" cy="90" r="30" fill="#8b5cf6" opacity="0.8">
            <animate attributeName="r" values="25;35;25" dur="2s" repeatCount="indefinite"/>
          </circle>
          <text x="160" y="95" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle">
            ${i + 1}
          </text>
          <rect x="0" y="160" width="320" height="20" fill="#f1f5f9"/>
          <rect x="0" y="160" width="${(i + 1) * 107}" height="20" fill="#8b5cf6">
            <animate attributeName="width" values="0;${(i + 1) * 107};0" dur="3s" repeatCount="indefinite"/>
          </rect>
        </svg>
      `)}`,
    }));
  };

  const generateThumbnails = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setGeneratedThumbnails([]);
    setSelectedThumbnail(null);
    setProgress(0);
    setCurrentStep("Initializing...");

    const placeholders = createPlaceholderThumbnails();
    setGeneratedThumbnails(placeholders);

    try {
      setProgress(20);
      setCurrentStep("Connecting to Gemini AI...");

      const result = await generateThumbnailWithGemini({
        apiKey: apiKey,
        style: "youtube-vlog",
        text: promptText || "AMAZING CONTENT",
        description: promptText || "Epic YouTube thumbnail with vibrant colors and engaging design",
        count: 3
      });

      setProgress(60);
      setCurrentStep("Processing AI response...");

      if (!result.success) {
        throw new Error(result.error || "Generation failed");
      }

      if (!result.thumbnails || result.thumbnails.length === 0) {
        throw new Error("No thumbnails were generated");
      }

      setProgress(80);
      setCurrentStep("Loading generated thumbnails...");

      // Постепенно заменяем заглушки на реальные изображения
      for (let i = 0; i < result.thumbnails.length; i++) {
        setProgress(80 + (i + 1) * 7);
        setCurrentStep(`Loading thumbnail ${i + 1}/${result.thumbnails.length}...`);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setGeneratedThumbnails(prev => {
          const newThumbnails = [...prev];
          newThumbnails[i] = result.thumbnails[i];
          return newThumbnails;
        });
      }

      setProgress(100);
      setCurrentStep("Complete!");

    } catch (error) {
      console.error("Generation failed:", error);
      
      let errorMessage = error.message;
      
      // Обработка специфичных ошибок Gemini API
      if (errorMessage.includes("SERVICE_DISABLED") || errorMessage.includes("PERMISSION_DENIED")) {
        errorMessage = "Gemini API is not enabled. Please enable the Generative Language API in Google Cloud Console.";
      } else if (errorMessage.includes("API_KEY_INVALID")) {
        errorMessage = "Invalid API key. Please check your Gemini API key.";
      } else if (errorMessage.includes("QUOTA_EXCEEDED")) {
        errorMessage = "API quota exceeded. Please check your billing settings.";
      }
      
      setCurrentStep(`Error: ${errorMessage}`);
      
      // В случае ошибки показываем заглушки с сообщением об ошибке
      setGeneratedThumbnails(prev => prev.map(thumb => ({
        ...thumb,
        error: true,
        errorMessage: errorMessage
      })));
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
        setCurrentStep("");
      }, 1000);
    }
  };

  // Функция скачивания
  const downloadThumbnail = () => {
    if (selectedThumbnail && !selectedThumbnail.isPlaceholder && !selectedThumbnail.error) {
      const a = document.createElement("a");
      a.href = selectedThumbnail.url;
      a.download = `thumbnail_${selectedThumbnail.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
      <div className="bg-white rounded-2xl shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Wand2 size={24} className="mr-3 text-purple-600" />
            AI Thumbnail Generator
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(95vh-140px)] overflow-y-auto">
          
          {/* Main Chat Area */}
          <div className="space-y-4">
            
            {/* Thumbnail Results */}
            {generatedThumbnails.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <ImageIcon size={20} className="mr-2 text-blue-600" />
                  Generated Thumbnails
                  {isGenerating && (
                    <div className="ml-3 flex items-center text-sm text-purple-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 mr-2"></div>
                      Generating...
                    </div>
                  )}
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  {generatedThumbnails.map((thumbnail, index) => (
                    <div
                      key={`thumbnail-${thumbnail.id}`}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-3 transition-all duration-500 ${
                        selectedThumbnail?.id === thumbnail.id
                          ? "border-purple-500 ring-2 ring-purple-200"
                          : "border-gray-200 hover:border-purple-300"
                      } ${thumbnail.isPlaceholder ? "animate-pulse" : ""}`}
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => !thumbnail.isPlaceholder && !thumbnail.error && setSelectedThumbnail(thumbnail)}
                    >
                      <img
                        src={thumbnail.url}
                        alt={thumbnail.isPlaceholder ? `Loading thumbnail ${thumbnail.id}` : `Thumbnail ${thumbnail.id}`}
                        className="w-full h-43 object-cover"
                      />
                      
                      {thumbnail.isPlaceholder ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-2"></div>
                            <span className="text-xs text-purple-600 font-medium">
                              Generating...
                            </span>
                          </div>
                        </div>
                      ) : thumbnail.error ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                          <div className="flex flex-col items-center text-center p-2">
                            <span className="text-red-500 text-2xl mb-2">⚠️</span>
                            <span className="text-xs text-red-600 font-medium">
                              Generation Failed
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center">
                            <span className="w-2 h-2 bg-white rounded-full mr-1"></span>
                            Ready!
                          </div>
                          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                            #{thumbnail.id}
                          </div>
                        </>
                      )}
                      
                      {selectedThumbnail?.id === thumbnail.id && !thumbnail.isPlaceholder && !thumbnail.error && (
                        <div className="absolute inset-0 bg-purple-500 bg-opacity-20 flex items-center justify-center">
                          <div className="bg-white rounded-full p-2">
                            <ArrowRight size={16} className="text-purple-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Progress Bar */}
                {isGenerating && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-700">
                        {currentStep}
                      </span>
                      <span className="text-sm text-purple-600">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500 ease-out relative"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Download Button */}
                {selectedThumbnail && !selectedThumbnail.isPlaceholder && !selectedThumbnail.error && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={downloadThumbnail}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center mx-auto"
                    >
                      Download Selected
                      <ArrowRight size={16} className="ml-2" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {generatedThumbnails.length === 0 && (
              <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-300 mb-6">
                <div className="text-4xl mb-4">🎨</div>
                <div className="text-lg text-gray-600 mb-2">
                  Ready to create amazing thumbnails
                </div>
                <div className="text-sm text-gray-400">
                  Describe your thumbnail idea in the chat below and press send!
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Area */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Describe your thumbnail idea... (e.g., 'Epic gaming thumbnail with neon colors and explosion effects')"
                  className="w-full p-3 border-0 resize-none focus:outline-none text-gray-800 placeholder-gray-500"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      generateThumbnails();
                    }
                  }}
                />
              </div>
              <button
                onClick={generateThumbnails}
                disabled={isGenerating || !promptText.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white p-3 rounded-full transition-colors disabled:cursor-not-allowed flex items-center justify-center"
                title="Generate thumbnails"
              >
                {isGenerating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
            
            {/* Quick Examples */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 mr-2">Quick examples:</span>
              {[
                "Epic gaming thumbnail with neon colors",
                "Food review with delicious close-up",
                "Tech unboxing with gadgets",
                "Fitness workout motivation"
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPromptText(example)}
                  className="text-xs bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-600 px-2 py-1 rounded-full transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {selectedThumbnail && !selectedThumbnail.error
              ? `Thumbnail #${selectedThumbnail.id} selected`
              : generatedThumbnails.length > 0 && !generatedThumbnails.every(t => t.isPlaceholder || t.error)
              ? "Choose a thumbnail above to download"
              : "Describe your idea in the chat to generate thumbnails"}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ThumbnailCreator;