import { useState } from "react";
import {
  FileText,
  Sparkles,
  Brain,
  TrendingUp,
  Users,
  Eye,
  Heart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const DetailedAnalytics = ({ assessmentLoading, assessment }) => {
  const [showDetailedAnalytics, setShowDetailedAnalytics] = useState(false);

  return (
    <div>
      {!assessmentLoading && assessment.total_score && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowDetailedAnalytics(!showDetailedAnalytics)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors duration-200"
          >
            <div className="flex items-center space-x-2">
              <TrendingUp size={16} className="text-blue-600" />
              <h4 className="text-sm font-semibold text-gray-800">
                Detailed Analytics
              </h4>
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {Math.round(((assessment.total_score || 0) / 10) * 100)}%
                readiness
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {showDetailedAnalytics ? "Collapse" : "Learn more"}
              </span>
              {showDetailedAnalytics ? (
                <ChevronUp size={16} className="text-gray-500" />
              ) : (
                <ChevronDown size={16} className="text-gray-500" />
              )}
            </div>
          </button>

          <div
            className={`transition-all duration-300 ease-in-out ${
              showDetailedAnalytics
                ? "max-h-[1000px] opacity-100"
                : "max-h-0 opacity-0 overflow-hidden"
            }`}
          >
            <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
              <div className="pt-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    {
                      key: "clarity",
                      label: "Clarity",
                      value: assessment.clarity || 0,
                      color: "blue",
                      icon: Eye,
                    },
                    {
                      key: "engagement",
                      label: "Engagement",
                      value: assessment.engagement || 0,
                      color: "green",
                      icon: Heart,
                    },
                    {
                      key: "emotional_tone",
                      label: "Emotionality",
                      value: assessment.emotional_tone || 0,
                      color: "purple",
                      icon: Sparkles,
                    },
                    {
                      key: "readability",
                      label: "Readability",
                      value: assessment.readability || 0,
                      color: "indigo",
                      icon: FileText,
                    },
                    {
                      key: "structure",
                      label: "Structure",
                      value: assessment.structure || 0,
                      color: "slate",
                      icon: Users,
                    },
                    {
                      key: "seo_optimization",
                      label: "SEO Optimization",
                      value: assessment.seo_optimization || 0,
                      color: "emerald",
                      icon: TrendingUp,
                    },
                  ].map((metric) => {
                    const IconComponent = metric.icon;
                    const percentage = (metric.value / 10) * 100;
                    const getColorClasses = (color, value) => {
                      const intensity =
                        value >= 8
                          ? "600"
                          : value >= 6
                          ? "500"
                          : value >= 4
                          ? "400"
                          : "300";
                      return {
                        blue: `text-blue-${intensity} bg-blue-50 border-blue-200`,
                        green: `text-green-${intensity} bg-green-50 border-green-200`,
                        purple: `text-purple-${intensity} bg-purple-50 border-purple-200`,
                        indigo: `text-indigo-${intensity} bg-indigo-50 border-indigo-200`,
                        slate: `text-slate-${intensity} bg-slate-50 border-slate-200`,
                        emerald: `text-emerald-${intensity} bg-emerald-50 border-emerald-200`,
                      }[color];
                    };

                    return (
                      <div
                        key={metric.key}
                        className={`p-3 rounded-lg border ${getColorClasses(
                          metric.color,
                          metric.value
                        )}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <IconComponent size={14} />
                            <span className="text-xs font-medium">
                              {metric.label}
                            </span>
                          </div>
                          <span className="text-xs font-bold">
                            {metric.value}/10
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              metric.color === "blue"
                                ? "bg-blue-500"
                                : metric.color === "green"
                                ? "bg-green-500"
                                : metric.color === "purple"
                                ? "bg-purple-500"
                                : metric.color === "indigo"
                                ? "bg-indigo-500"
                                : metric.color === "slate"
                                ? "bg-slate-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {assessment.recommendations &&
                assessment.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <Brain size={16} className="mr-2 text-amber-600" />
                      Recommendations for improvement
                    </h4>
                    <div className="space-y-2">
                      {assessment.recommendations.map(
                        (recommendation, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                          >
                            <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-semibold text-amber-700">
                                {index + 1}
                              </span>
                            </div>
                            <p className="text-sm text-amber-800 leading-relaxed">
                              {recommendation}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              <div className="pt-3 border-t border-slate-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-blue-600">
                      {assessment.rhythm || 0}/10
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      Text Rhythm
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-green-600">
                      {assessment.repetition || 0}/10
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      No Repetitions
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-purple-600">
                      {Math.round(((assessment.total_score || 0) / 10) * 100)}%
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      Readiness
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedAnalytics;
