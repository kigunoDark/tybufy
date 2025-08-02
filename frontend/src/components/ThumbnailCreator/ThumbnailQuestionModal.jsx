import { Check, Sparkles } from "lucide-react";

const ThumbnailQuestionModal = ({ isOpen, onResponse }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Check size={32} className="text-white" />
          </div>

          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Video Export Completed! 🎉
          </h3>

          <p className="text-gray-600 mb-8 text-lg">
            Do you want to create a thumbnail for your video?
          </p>

          <div className="flex space-x-4">
            <button
              onClick={() => onResponse(false)}
              className="flex-1 px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              No, thanks
            </button>
            <button
              disabled={true}
              onClick={() => onResponse(true)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium transition-all shadow-lg flex items-center justify-center"
            >
              <Sparkles size={18} className="mr-2" />
              Create Thumbnail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailQuestionModal;
