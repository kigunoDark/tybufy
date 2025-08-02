import { Loader2, Brain } from "lucide-react";

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <Brain className="text-white" size={40} />
        </div>

        <div className="flex items-center justify-center space-x-3 mb-4">
          <Loader2 size={24} className="animate-spin text-blue-600" />
          <span className="text-xl font-semibold text-gray-700">
            Loading Tubehi...
          </span>
        </div>

        <p className="text-gray-500">Preparing your workspace</p>

        <div className="w-64 mx-auto mt-6">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
