import { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Image,
  ArrowRight,
  Upload,
  Type,
  Palette,
  Wand2,
  Plus,
  Trash2,
} from "lucide-react";

const ThumbnailCreator = ({ isOpen, onClose, exportSettings }) => {
  const [activeTab, setActiveTab] = useState("styles");
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [customData, setCustomData] = useState({
    text: "",
    description: "",
    referenceImage: null,
    objectImages: [],
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedThumbnails, setGeneratedThumbnails] = useState([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [stylePreviewImages, setStylePreviewImages] = useState({});
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loadingThumbnails, setLoadingThumbnails] = useState([]);
  const [currentStep, setCurrentStep] = useState("");

  // Готовые стили обложек с превью
  const thumbnailStyles = [
    {
      id: "youtube-gaming",
      name: "Gaming YouTube",
      colors: ["#FF0080", "#7928CA", "#FF4081"],
      prompt:
        "Epic gaming thumbnail with vibrant neon colors, explosive effects, dramatic lighting, and gaming elements",
    },
    {
      id: "youtube-tech",
      name: "Tech Review",
      colors: ["#00D4FF", "#5B73DE", "#9D50BB"],
      prompt:
        "Clean tech review thumbnail with modern gadgets, blue and white color scheme, minimalist design",
    },
    {
      id: "youtube-tutorial",
      name: "Tutorial",
      colors: ["#FF6B35", "#F7931E", "#FFD23F"],
      prompt:
        "Educational tutorial thumbnail with clear text, arrows, step-by-step layout, and professional design",
    },
    {
      id: "youtube-vlog",
      name: "Vlog Style",
      colors: ["#FF9A9E", "#FECFEF", "#FECFEF"],
      prompt:
        "Personal vlog thumbnail with warm pastel colors, friendly atmosphere, and lifestyle vibes",
    },
    {
      id: "youtube-music",
      name: "Music Video",
      colors: ["#A8EDEA", "#FED6E3", "#D299C2"],
      prompt:
        "Music video thumbnail with vibrant artistic colors, musical elements, and creative design",
    },
    {
      id: "youtube-fitness",
      name: "Fitness",
      colors: ["#FF416C", "#FF4B2B", "#FF8E53"],
      prompt:
        "Fitness thumbnail with energetic red-orange colors, dynamic poses, and motivational design",
    },
    {
      id: "youtube-food",
      name: "Food & Cooking",
      colors: ["#FDBB2D", "#22C1C3", "#FF9472"],
      prompt:
        "Food thumbnail with appetizing warm colors, delicious presentation, and cozy kitchen vibes",
    },
    {
      id: "youtube-business",
      name: "Business",
      colors: ["#667eea", "#764ba2", "#f093fb"],
      prompt:
        "Professional business thumbnail with sophisticated colors, charts, corporate style, and success vibes",
    },
  ];

  // Закрытие других модалок при открытии этой
  useEffect(() => {
    if (isOpen) {
      // Закрываем все другие модальные окна
      const otherModals = document.querySelectorAll(
        '[data-modal]:not([data-modal="thumbnail-creator"])'
      );
      otherModals.forEach((modal) => {
        if (modal.style.display !== "none") {
          modal.style.display = "none";
        }
      });
    }
  }, [isOpen]);

  // Создание превью изображений для стилей
  useEffect(() => {
    const createStylePreviews = async () => {
      const previews = {};

      for (const style of thumbnailStyles) {
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext("2d");

        // Создаем градиент для стиля
        const gradient = ctx.createLinearGradient(0, 0, 320, 180);
        gradient.addColorStop(0, style.colors[0]);
        gradient.addColorStop(0.5, style.colors[1]);
        gradient.addColorStop(1, style.colors[2]);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 320, 180);

        // Добавляем текстуру/паттерн в зависимости от стиля
        if (style.id.includes("gaming")) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
          for (let i = 0; i < 15; i++) {
            const x = Math.random() * 320;
            const y = Math.random() * 180;
            const size = Math.random() * 8 + 3;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (style.id.includes("tech")) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 2;
          for (let i = 0; i < 5; i++) {
            const x = Math.random() * 280 + 20;
            const y = Math.random() * 140 + 20;
            const size = Math.random() * 30 + 20;
            ctx.strokeRect(x, y, size, size);
          }
        } else if (style.id.includes("food")) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
          for (let i = 0; i < 8; i++) {
            const x = Math.random() * 320;
            const y = Math.random() * 180;
            const size = Math.random() * 25 + 15;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Добавляем название стиля
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText(style.name, 160, 90);
        ctx.fillText(style.name, 160, 90);

        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/png")
        );
        previews[style.id] = URL.createObjectURL(blob);
      }

      setStylePreviewImages(previews);
    };

    if (isOpen) {
      createStylePreviews();
    }
  }, [isOpen]);

  const createPlaceholderThumbnails = () => {
    const placeholders = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      isPlaceholder: true,
      url: `data:image/svg+xml,${encodeURIComponent(`
        <svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="shimmer${i}" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#f6f7f8;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#edeef1;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#f6f7f8;stop-opacity:1" />
            </linearGradient>
            <animateTransform attributeName="gradientTransform" attributeType="XML" type="translate" values="-100 0;100 0;-100 0" dur="2s" repeatCount="indefinite"/>
          </defs>
          <rect width="320" height="180" fill="url(#shimmer${i})"/>
          <rect x="20" y="20" width="60" height="20" rx="10" fill="#e2e8f0" opacity="0.7"/>
          <rect x="20" y="50" width="280" height="30" rx="15" fill="#e2e8f0" opacity="0.5"/>
          <rect x="20" y="90" width="200" height="20" rx="10" fill="#e2e8f0" opacity="0.7"/>
          <circle cx="280" cy="40" r="20" fill="#e2e8f0" opacity="0.8"/>
          <text x="280" y="45" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">${
            i + 1
          }</text>
          <rect x="0" y="160" width="320" height="20" fill="#f1f5f9"/>
          <rect x="0" y="160" width="${
            (i + 1) * 64
          }" height="20" fill="#8b5cf6">
            <animate attributeName="width" values="0;${
              (i + 1) * 64
            };0" dur="3s" repeatCount="indefinite"/>
          </rect>
        </svg>
      `)}`,
    }));
    return placeholders;
  };

  const generateWithDALLE = async () => {
    if (isGenerating) {
      return;
    }


    setIsGenerating(true);
    setGeneratedThumbnails([]);
    setSelectedThumbnail(null);
    setError(null);
    setProgress(0);
    setCurrentStep("Initializing...");

    const placeholders = createPlaceholderThumbnails();
    setLoadingThumbnails(placeholders);

    const maxRetries = 3;
    let currentRetry = 0;

    const attemptGeneration = async () => {
      try {
        setProgress(10);
        setCurrentStep(
          currentRetry > 0
            ? `Retry attempt ${currentRetry}/${maxRetries}...`
            : "Preparing request data..."
        );

        const requestData = {
          mode: activeTab,
          style: selectedStyle,
          text: customData.text,
          description: customData.description,
          objectCount: customData.objectImages.length,
          objectDescriptions: customData.objectImages.map((obj, index) => ({
            position: index + 1,
            description: `object ${index + 1}: ${obj.name || "uploaded image"}`,
          })),
        };

        if (activeTab === "custom" && customData.referenceImage) {
          setProgress(25);
          setCurrentStep("Analyzing reference image...");

          try {
            const base64Response = await fetch(customData.referenceImage);
            const blob = await base64Response.blob();
            const formData = new FormData();
            formData.append("image", blob, "reference.jpg");

            const analysisResponse = await fetch(
              "http://localhost:5000/api/thumbnails/analyze-image",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: formData,
              }
            );

            if (analysisResponse.ok) {
              const analysisData = await analysisResponse.json();
              requestData.referenceImageAnalysis = analysisData.data.analysis;
            }
          } catch (analysisError) {
            console.warn(
              "Image analysis failed, continuing without it:",
              analysisError
            );
          }
        }

        setProgress(40);
        setCurrentStep("Connecting to AI service...");

        console.log("🎨 Sending generation request:", requestData);

        const response = await fetch(
          "http://localhost:5000/api/thumbnails/generate",
          {
            method: "POST",
            mode: "cors",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              Accept: "application/json",
            },
            body: JSON.stringify(requestData),
          }
        );

        setProgress(60);
        setCurrentStep("Processing AI response...");

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error("RATE_LIMIT"); 
          } else if (response.status === 401) {
            throw new Error("Authentication failed. Please log in again.");
          } else if (response.status === 500) {
            throw new Error("Server error. Please try again later.");
          } else {
            throw new Error(
              data.error || `HTTP ${response.status}: ${response.statusText}`
            );
          }
        }

        if (!data.success) {
          throw new Error(data.error || "Generation failed");
        }

   
        const { thumbnails } = data.data.thumbnails || data.data?.thumbnails;


        if (!thumbnails || !Array.isArray(thumbnails)) {
          throw new Error("Invalid response format: thumbnails not found");
        }

        if (thumbnails.length === 0) {
          throw new Error("No thumbnails were generated");
        }

        const mockImages = thumbnails.filter((thumb) => thumb.isMock === true);
        if (mockImages.length > 0) {
          console.error(`❌ Received ${mockImages.length} mock thumbnails!`);
          throw new Error(
            "Server returned demo thumbnails. Please check OpenAI API configuration."
          );
        }

        const invalidImages = thumbnails.filter(
          (thumb) => !thumb.url || !thumb.url.startsWith("http")
        );

        if (invalidImages.length > 0) {
          console.error(
            `❌ Received ${invalidImages.length} invalid image URLs!`
          );
          throw new Error("Some generated thumbnails have invalid URLs.");
        }

        setProgress(80);
        setCurrentStep("Loading generated thumbnails...");

        for (let i = 0; i < thumbnails.length; i++) {
          setProgress(80 + (i + 1) * 4);
          setCurrentStep(`Loading thumbnail ${i + 1}/${thumbnails.length}...`);

          await new Promise((resolve) => setTimeout(resolve, 300));

          setLoadingThumbnails((prev) => {
            const newThumbnails = [...prev];
            newThumbnails[i] = thumbnails[i];
            return newThumbnails;
          });
        }

        setProgress(100);
        setCurrentStep("Complete!");
        setGeneratedThumbnails(thumbnails);

        return;
      } catch (error) {
        console.error(`❌ Attempt ${currentRetry + 1} failed:`, error.message);

        if (error.message === "RATE_LIMIT" && currentRetry < maxRetries) {
          currentRetry++;
          const waitTime = Math.pow(2, currentRetry) * 30;
          setCurrentStep(
            `Rate limit reached. Waiting ${waitTime} seconds before retry ${currentRetry}/${maxRetries}...`
          );

          for (let i = waitTime; i > 0; i--) {
            setCurrentStep(
              `Rate limit reached. Retrying in ${i} seconds... (${currentRetry}/${maxRetries})`
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

          return attemptGeneration();
        }

        throw error;
      }
    };

    try {
      await attemptGeneration();
    } catch (error) {
      console.error("❌ Thumbnail generation failed after all retries:", error);

      // Детализированные сообщения об ошибках
      let errorMessage = "Failed to generate thumbnails. ";

      if (error.message === "RATE_LIMIT") {
        errorMessage = `Rate limit exceeded after ${maxRetries} attempts. Please wait 5-10 minutes before trying again.`;
      } else if (
        error.message.includes("429") ||
        error.message.includes("Too Many Requests")
      ) {
        errorMessage =
          "Server is very busy. Please wait 5-10 minutes before trying again.";
      } else if (
        error.message.includes("401") ||
        error.message.includes("Authentication")
      ) {
        errorMessage =
          "Authentication failed. Please refresh the page and log in again.";
      } else if (
        error.message.includes("API key") ||
        error.message.includes("OPENAI_API_KEY")
      ) {
        errorMessage =
          "OpenAI API key is not configured. Please contact support.";
      } else if (
        error.message.includes("quota") ||
        error.message.includes("billing")
      ) {
        errorMessage =
          "OpenAI API quota exceeded. Please check your billing settings.";
      } else if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        errorMessage =
          "Cannot connect to server. Please check your internet connection and ensure the backend is running.";
      } else if (
        error.message.includes("demo thumbnails") ||
        error.message.includes("mock")
      ) {
        errorMessage =
          "Server configuration error. OpenAI API is not properly set up.";
      } else if (error.message.includes("invalid URLs")) {
        errorMessage =
          "Generated thumbnails have invalid URLs. Please try again.";
      } else if (error.message.includes("No thumbnails were generated")) {
        errorMessage =
          "No thumbnails were generated. Please check your inputs and try again.";
      } else {
        errorMessage += error.message;
      }

      setError(errorMessage);
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setLoadingThumbnails([]);
        setProgress(0);
        setCurrentStep("");
      }, 1000);
    }
  };


  const addObjectImage = (event) => {
    const file = event.target.files[0];
    if (file && customData.objectImages.length < 3) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomData((prev) => ({
          ...prev,
          objectImages: [
            ...prev.objectImages,
            {
              id: Date.now(),
              url: e.target.result,
              name: file.name,
            },
          ],
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeObjectImage = (id) => {
    setCustomData((prev) => ({
      ...prev,
      objectImages: prev.objectImages.filter((img) => img.id !== id),
    }));
  };

  // Функция загрузки референсного изображения
  const handleReferenceUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomData((prev) => ({ ...prev, referenceImage: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Функция скачивания выбранного thumbnail
  const downloadThumbnail = () => {
    if (selectedThumbnail) {
      const a = document.createElement("a");
      a.href = selectedThumbnail.url;
      a.download = `${exportSettings?.filename || "video"}_thumbnail_v${
        selectedThumbnail.id
      }.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const navigateToApp = () => {
    window.location.href = "http://localhost:3000/app";
  };

  const canGenerate =
    (activeTab === "styles" && selectedStyle) ||
    (activeTab === "custom" &&
      (customData.description || customData.referenceImage));

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }} // Максимальный z-index для перекрытия других модалок
      data-modal="thumbnail-creator"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Wand2 size={24} className="mr-3 text-purple-600" />
            AI Thumbnail Generator
          </h2>
          <button
            onClick={() => {
              onClose();
              navigateToApp();
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(95vh-140px)] overflow-y-auto">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-600 font-medium">⚠️ Error</div>
              </div>
              <div className="text-red-700 text-sm mt-1">{error}</div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 text-sm underline mt-2 hover:text-red-800"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("styles")}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === "styles"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Palette size={18} className="mr-2" />
              Style Gallery
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === "custom"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Sparkles size={18} className="mr-2" />
              Custom Design
            </button>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel - Controls */}
            <div className="space-y-6">
              {activeTab === "styles" ? (
                <>
                  {/* Style Selection */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Choose Your Style
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {thumbnailStyles.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style.id)}
                          className={`relative rounded-lg overflow-hidden border-3 transition-all ${
                            selectedStyle === style.id
                              ? "border-purple-500 ring-2 ring-purple-200"
                              : "border-gray-200 hover:border-purple-300"
                          }`}
                        >
                          {stylePreviewImages[style.id] ? (
                            <img
                              src={stylePreviewImages[style.id]}
                              alt={style.name}
                              className="w-full h-24 object-cover"
                            />
                          ) : (
                            <div className="w-full h-24 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                              <div className="text-gray-500">Loading...</div>
                            </div>
                          )}

                          {selectedStyle === style.id && (
                            <div className="absolute inset-0 bg-purple-500 bg-opacity-20 flex items-center justify-center">
                              <div className="bg-white rounded-full p-2">
                                <ArrowRight
                                  size={16}
                                  className="text-purple-600"
                                />
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Input for Style Gallery */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Type size={20} className="mr-2 text-blue-600" />
                      Thumbnail Text
                    </h4>
                    <input
                      type="text"
                      value={customData.text}
                      onChange={(e) =>
                        setCustomData((prev) => ({
                          ...prev,
                          text: e.target.value,
                        }))
                      }
                      placeholder="Enter eye-catching text for your thumbnail..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Objects Section - Always Visible in Style Gallery */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Image size={20} className="mr-2 text-blue-600" />
                      Add Objects (up to 3)
                    </h4>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {[...Array(3)].map((_, index) => {
                        const existingObject = customData.objectImages[index];
                        return (
                          <div key={index} className="relative">
                            {existingObject ? (
                              <div className="relative group">
                                <img
                                  src={existingObject.url}
                                  alt={`Object ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg border-2 border-purple-200"
                                />
                                <button
                                  onClick={() =>
                                    removeObjectImage(existingObject.id)
                                  }
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={14} />
                                </button>
                                <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                  Object {index + 1}
                                </div>
                              </div>
                            ) : (
                              <label className="cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 hover:border-purple-400 hover:from-purple-50 hover:to-blue-50 rounded-lg h-24 flex flex-col items-center justify-center transition-all duration-300">
                                <Plus
                                  size={24}
                                  className="text-gray-400 mb-1"
                                />
                                <span className="text-xs text-gray-500">
                                  Add Object {index + 1}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={addObjectImage}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800 font-medium mb-1">
                        💡 Object Ideas:
                      </p>
                      <p className="text-xs text-blue-700">
                        Products • Faces/People • Logos • Food Items • Gadgets •
                        Before/After Images • Arrows • Icons
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Custom Thumbnail Design
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Type size={16} className="inline mr-1" />
                        Thumbnail Text
                      </label>
                      <input
                        type="text"
                        value={customData.text}
                        onChange={(e) =>
                          setCustomData((prev) => ({
                            ...prev,
                            text: e.target.value,
                          }))
                        }
                        placeholder="Enter text for your thumbnail..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Sparkles size={16} className="inline mr-1" />
                        Describe Your Thumbnail
                      </label>
                      <textarea
                        value={customData.description}
                        onChange={(e) =>
                          setCustomData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Describe the style, colors, mood, and elements you want (e.g., 'bright cartoon style with explosion effects')"
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Image size={16} className="inline mr-1" />
                        Reference Style Image
                      </label>
                      <label className="cursor-pointer bg-white border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-lg p-4 flex items-center justify-center transition-colors">
                        <Upload size={20} className="mr-2 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Upload style reference
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReferenceUpload}
                          className="hidden"
                        />
                      </label>
                      {customData.referenceImage && (
                        <div className="mt-2">
                          <img
                            src={customData.referenceImage}
                            alt="Reference"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>

                    {/* Objects Section for Custom */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Image size={16} className="inline mr-1" />
                        Add Objects (up to 3)
                      </label>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {[...Array(3)].map((_, index) => {
                          const existingObject = customData.objectImages[index];
                          return (
                            <div key={index} className="relative">
                              {existingObject ? (
                                <div className="relative">
                                  <img
                                    src={existingObject.url}
                                    alt={`Object ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-lg border-2 border-purple-200"
                                  />
                                  <button
                                    onClick={() =>
                                      removeObjectImage(existingObject.id)
                                    }
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <label className="cursor-pointer bg-gray-50 border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-lg h-20 flex items-center justify-center transition-colors">
                                  <Plus size={20} className="text-gray-400" />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={addObjectImage}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-xs text-gray-500">
                        Add specific objects you want in your thumbnail
                        (products, people, items, etc.)
                      </p>

                      {/* Preview for custom mode */}
                      {(customData.text ||
                        customData.description ||
                        customData.objectImages.length > 0 ||
                        customData.referenceImage) && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-700 mb-2 font-medium">
                            ✨ Your custom thumbnail will include:
                          </div>

                          {customData.text && (
                            <div className="text-sm text-blue-800 mb-1 flex items-center">
                              <Type size={12} className="mr-2" />
                              Text: "{customData.text}"
                            </div>
                          )}

                          {customData.description && (
                            <div className="text-sm text-blue-800 mb-1 flex items-center">
                              <Sparkles size={12} className="mr-2" />
                              Style: {customData.description.substring(0, 40)}
                              {customData.description.length > 40 ? "..." : ""}
                            </div>
                          )}

                          {customData.referenceImage && (
                            <div className="text-sm text-blue-800 mb-1 flex items-center">
                              <Image size={12} className="mr-2" />
                              Reference image uploaded
                            </div>
                          )}

                          {customData.objectImages.length > 0 && (
                            <div className="text-sm text-blue-800">
                              <div className="flex items-center mb-1">
                                <Image size={12} className="mr-2" />
                                Objects ({customData.objectImages.length}):
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {customData.objectImages.map((obj, index) => (
                                  <span
                                    key={obj.id}
                                    className="bg-blue-200 rounded px-2 py-1 text-xs text-blue-800"
                                  >
                                    {index + 1}. {obj.name.substring(0, 8)}
                                    {obj.name.length > 8 ? "..." : ""}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={generateWithDALLE}
                disabled={isGenerating || !canGenerate}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden"
              >
                {isGenerating ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 animate-pulse"></div>
                    <div className="relative flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      <div className="flex flex-col items-start">
                        <span>Generating with AI...</span>
                        {currentStep && (
                          <span className="text-xs opacity-90 mt-1">
                            {currentStep}
                          </span>
                        )}
                      </div>
                      {progress > 0 && (
                        <div className="ml-3 bg-white/20 rounded-full px-2 py-1">
                          <span className="text-xs font-bold">{progress}%</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Wand2 size={20} className="mr-3" />
                    Generate 5 AI Thumbnails
                  </>
                )}
              </button>
            </div>

            {/* Right Panel - Preview/Results */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Image size={20} className="mr-2 text-blue-600" />
                    Generated Thumbnails
                  </h3>
                  {isGenerating && (
                    <div className="flex items-center text-sm text-purple-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 mr-2"></div>
                      Generating...
                    </div>
                  )}
                </div>

                {/* Progress Bar during generation */}
                {isGenerating && (
                  <div className="mb-6">
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

                {/* Loading Thumbnails (Placeholders) */}
                {isGenerating && loadingThumbnails.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {loadingThumbnails.map((thumbnail, index) => (
                      <div
                        key={`loading-${thumbnail.id}`}
                        className={`relative rounded-lg overflow-hidden border-3 border-gray-200 transition-all duration-500 ${
                          thumbnail.isPlaceholder
                            ? "animate-pulse"
                            : "animate-fade-in"
                        }`}
                        style={{
                          animationDelay: `${index * 100}ms`,
                          transform: thumbnail.isPlaceholder
                            ? "scale(0.98)"
                            : "scale(1)",
                        }}
                      >
                        <img
                          src={thumbnail.url}
                          alt={
                            thumbnail.isPlaceholder
                              ? `Loading thumbnail ${thumbnail.id}`
                              : `Thumbnail ${thumbnail.id}`
                          }
                          className="w-full h-32 object-cover"
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
                        ) : (
                          <>
                            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center">
                              <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                              Ready!
                            </div>
                            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                              Вариант {thumbnail.id}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : generatedThumbnails.length === 0 ? (
                  <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                    <div className="text-4xl mb-4">🎨</div>
                    <div className="text-lg text-gray-600 mb-2">
                      Ready to create amazing thumbnails
                    </div>
                    <div className="text-sm text-gray-400">
                      {activeTab === "styles"
                        ? "Choose a style, add text and objects, then generate!"
                        : "Describe your vision, upload images, then generate 5 AI variants!"}
                    </div>

                    {/* Preview of current settings */}
                    {(customData.text ||
                      customData.objectImages.length > 0 ||
                      selectedStyle) && (
                      <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-xs text-purple-700 mb-3 font-medium">
                          ✨ Your thumbnail will include:
                        </div>

                        {selectedStyle && (
                          <div className="text-sm text-purple-800 font-medium mb-2 flex items-center">
                            <Palette size={14} className="mr-2" />
                            Style: "
                            {thumbnailStyles.find((s) => s.id === selectedStyle)
                              ?.name || selectedStyle}
                            "
                          </div>
                        )}

                        {customData.text && (
                          <div className="text-sm text-purple-800 font-medium mb-2 flex items-center">
                            <Type size={14} className="mr-2" />
                            Text: "{customData.text}"
                          </div>
                        )}

                        {customData.objectImages.length > 0 && (
                          <div className="text-sm text-purple-800 mb-2">
                            <div className="flex items-center mb-2">
                              <Image size={14} className="mr-2" />
                              Objects ({customData.objectImages.length}):
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {customData.objectImages.map((obj, index) => (
                                <div
                                  key={obj.id}
                                  className="flex items-center bg-white rounded-lg p-2 border border-purple-200"
                                >
                                  <img
                                    src={obj.url}
                                    alt={obj.name}
                                    className="w-6 h-6 object-cover rounded mr-2"
                                  />
                                  <span className="text-xs text-purple-700">
                                    {index + 1}. {obj.name.substring(0, 10)}
                                    {obj.name.length > 10 ? "..." : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {generatedThumbnails.map((thumbnail) => (
                      <div
                        key={thumbnail.id}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-3 transition-all ${
                          selectedThumbnail?.id === thumbnail.id
                            ? "border-purple-500 ring-2 ring-purple-200"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                        onClick={() => setSelectedThumbnail(thumbnail)}
                      >
                        <img
                          src={thumbnail.url}
                          alt={`Thumbnail ${thumbnail.id}`}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          Вариант {thumbnail.id}
                        </div>
                        {selectedThumbnail?.id === thumbnail.id && (
                          <div className="absolute inset-0 bg-purple-500 bg-opacity-20 flex items-center justify-center">
                            <div className="bg-white rounded-full p-2">
                              <ArrowRight
                                size={16}
                                className="text-purple-600"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                  <Sparkles size={18} className="mr-2" />
                  Pro Tips
                </h4>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li>
                    • <strong>Text:</strong> Use action words like "AMAZING",
                    "SHOCKING", "MUST SEE"
                  </li>
                  <li>
                    • <strong>Objects:</strong> Add faces, products, or key
                    items from your video
                  </li>
                  <li>
                    • <strong>Style:</strong> Gaming = bright/neon, Tech =
                    clean/minimal, Food = warm colors
                  </li>
                  <li>
                    • <strong>Emotions:</strong> Include "excited", "surprised",
                    or "pointing" for engagement
                  </li>
                  <li>
                    • <strong>Composition:</strong> Think about where text and
                    objects will be placed
                  </li>
                </ul>

                {(customData.text ||
                  customData.objectImages.length > 0 ||
                  selectedStyle) && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-green-800 text-sm font-medium mb-1">
                      🤖 AI will generate thumbnails with:
                    </div>
                    <div className="text-xs text-green-700 space-y-1">
                      {selectedStyle && (
                        <div>
                          ✓{" "}
                          {
                            thumbnailStyles.find((s) => s.id === selectedStyle)
                              ?.name
                          }{" "}
                          style with matching colors
                        </div>
                      )}
                      {customData.text && (
                        <div>
                          ✓ Bold "{customData.text}" text prominently displayed
                        </div>
                      )}
                      {customData.objectImages.length > 0 && (
                        <div>
                          ✓ {customData.objectImages.length} custom objects
                          integrated naturally
                        </div>
                      )}
                      <div>
                        ✓ Professional YouTube optimization for maximum
                        click-through rate
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {selectedThumbnail
              ? `Thumbnail #${selectedThumbnail.id} selected and ready to download`
              : generatedThumbnails.length > 0
              ? "Choose a thumbnail to download"
              : "Select style and customize to generate thumbnails"}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                onClose();
                navigateToApp();
              }}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Skip & Continue
            </button>
            {selectedThumbnail && (
              <button
                onClick={() => {
                  downloadThumbnail();
                  onClose();
                  navigateToApp();
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center"
              >
                Download & Continue
                <ArrowRight size={16} className="ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
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

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        @keyframes progress-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .progress-shimmer {
          position: relative;
          overflow: hidden;
        }

        .progress-shimmer::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          animation: progress-bar 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default ThumbnailCreator;
