import { Link, useLocation } from "react-router-dom";
import {
  Zap,
  Brain,
  User,
  LogOut,
  Settings,
  Crown,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
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
        <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-2xl py-2 z-[999999]">
          <div className="px-4 py-3 border-b border-slate-200/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-blue-600 rounded-full flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">
                  {user?.name || "User"}
                </div>
                <div className="text-sm text-slate-600">
                  {user?.email || "user@example.com"}
                </div>
              </div>
            </div>
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
              to={ROUTES.UPGRADE}
              className="flex items-center space-x-3 px-4 py-2 text-amber-600 hover:bg-amber-50/50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Crown size={16} />
              <span>Upgrade to Pro</span>
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

const Header = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="bg-white/90 backdrop-blur-xl border-b border-slate-400/50 px-6 py-4 shadow-xl relative z-[999997]">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-500/30">
              <Link
                to={!isLandingPage ? ROUTES.APP : ROUTES.HOME}
                className="hover:text-slate-400 transition-colors"
              >
                <Brain className="text-white" size={24} />
              </Link>
            </div>
            <div>
              <div className="text-2xl font-black bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent">
                Tubify
              </div>
              <div className="text-sm font-bold text-slate-600">
                CONTENT CREATION STUDIO
              </div>
            </div>
          </div>
        </div>

        {isLandingPage ? (
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              Pricing
            </a>
            <a
              href="#testimonials"
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              Reviews
            </a>
            {isAuthenticated ? (
              <ProfileMenu user={user} onLogout={logout} />
            ) : (
              <>
                <Link to={ROUTES.AUTH} className="text-gray-700 hover:text-blue-600 font-semibold transition-colors px-4 py-2">
                  Login
                </Link>
                <Link
                  to="/auth"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Try Free
                </Link>
              </>
            )}
          </nav>
        ) : (
          <>
            {isAuthenticated ? (
              <ProfileMenu user={user} onLogout={logout} />
            ) : (
              <Link
                to={ROUTES.AUTH}
                className="group relative bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 text-white px-5 py-2 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center space-x-3">
                  <Zap size={15} />
                  <span>Upgrade Pro</span>
                </span>
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Header;
