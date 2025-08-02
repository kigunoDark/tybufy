import { Link } from "react-router-dom";
import { User, LogOut, Settings, Crown, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ROUTES } from "../constants/routes";

const ProfileMenu = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isPaidPlan = user?.subscription && user.subscription !== "free";
  const isCanceled =
    user?.subscriptionStatus === "canceled" && user?.subscription === "free";

  const getUsageDisplay = () => {
    if (!user?.usage || !user?.limits) return null;

    const usage = user.usage;
    const limits = user.limits;

    return {
      scripts: {
        used: usage.scriptsGenerated || 0,
        limit: limits.scriptsGenerated === -1 ? "∞" : limits.scriptsGenerated,
        remaining:
          limits.scriptsGenerated === -1
            ? "∞"
            : Math.max(
                0,
                limits.scriptsGenerated - (usage.scriptsGenerated || 0)
              ),
      },
      audio: {
        used: Math.floor((usage.audioGenerated || 0) / 1000),
        limit:
          limits.audioGenerated === -1
            ? "∞"
            : Math.floor(limits.audioGenerated / 1000),
        remaining:
          limits.audioGenerated === -1
            ? "∞"
            : Math.max(
                0,
                Math.floor(
                  (limits.audioGenerated - (usage.audioGenerated || 0)) / 1000
                )
              ),
      },
      thumbnails: {
        used: usage.thumbnailsGenerated || 0,
        limit:
          limits.thumbnailsGenerated === -1 ? "∞" : limits.thumbnailsGenerated,
        remaining:
          limits.thumbnailsGenerated === -1
            ? "∞"
            : Math.max(
                0,
                limits.thumbnailsGenerated - (usage.thumbnailsGenerated || 0)
              ),
      },
    };
  };

  const usageData = getUsageDisplay();

  return (
    <div className="relative z-[999998]" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-slate-700 px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-blue-600 rounded-full flex items-center justify-center">
          <User size={16} className="text-white" />
        </div>
        <span className="hidden sm:block">{user?.name || "Profile"}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-2xl py-2 z-[999999]">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-slate-200/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-blue-600 rounded-full flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-800">
                  {user?.name || "User"}
                </div>
                <div className="text-sm text-slate-600">
                  {user?.email || "user@example.com"}
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-slate-200/50 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                Current Plan
              </span>
              <div className="flex items-center space-x-1">
                <Crown
                  size={14}
                  className={isPaidPlan ? "text-yellow-500" : "text-slate-400"}
                />
                <span
                  className={`text-sm font-semibold capitalize ${
                    isPaidPlan ? "text-blue-600" : "text-slate-600"
                  }`}
                >
                  {user?.subscription || "free"}
                </span>
              </div>
            </div>

            {isCanceled && (
              <div className="mb-2">
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                  Using remaining credits
                </span>
              </div>
            )}

            {usageData && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Scripts:</span>
                  <span className="font-medium">
                    {usageData.scripts.used}/{usageData.scripts.limit}
                    {isCanceled && (
                      <span className="text-green-600 ml-1">✓</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Audio:</span>
                  <span className="font-medium">
                    {usageData.audio.used}k/{usageData.audio.limit}k chars
                    {isCanceled && (
                      <span className="text-green-600 ml-1">✓</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Thumbnails:</span>
                  <span className="font-medium">
                    {usageData.thumbnails.used}/{usageData.thumbnails.limit}
                    {isCanceled && (
                      <span className="text-green-600 ml-1">✓</span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="py-1">
            <Link
              to={ROUTES.PROFILE}
              className="flex items-center space-x-3 px-4 py-2 text-slate-700 hover:bg-slate-100/50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User size={16} />
              <span>Profile</span>
            </Link>

            <Link
              to={ROUTES.SETTINGS}
              className="flex items-center space-x-3 px-4 py-2 text-slate-700 hover:bg-slate-100/50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings size={16} />
              <span>Settings</span>
            </Link>

            <Link
              to={ROUTES.PRICING}
              className={`flex items-center space-x-3 px-4 py-2 transition-colors ${
                isPaidPlan
                  ? "text-amber-600 hover:bg-amber-50/50"
                  : "text-blue-600 hover:bg-blue-50/50"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Crown
                size={16}
                className={isPaidPlan ? "text-yellow-500" : "text-blue-500"}
              />
              <span>{isPaidPlan ? "Manage Subscription" : "Upgrade Plan"}</span>
            </Link>
          </div>

          <div className="border-t border-slate-200/50 my-1"></div>

          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50/50 transition-colors w-full text-left"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
