import { useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const Toast = ({
  message,
  type = "success",
  isVisible,
  onClose,
  duration = 4000,
  position = "bottom-right",
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle,
      iconColor: "text-green-500",
    },
    error: {
      icon: XCircle,
      iconColor: "text-red-500",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-yellow-500",
    },
    info: {
      icon: Info,
      iconColor: "text-blue-500",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  };

  return (
    <div
      className={`
        fixed ${positionClasses[position]} z-50 
        transform transition-all duration-300 ease-out
        ${
          isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }
      `}
    >
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg min-w-[320px] max-w-md">
        <div className="flex items-center space-x-3 p-4">
          <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0`} />

          <p className="text-gray-800 font-medium flex-1">{message}</p>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
