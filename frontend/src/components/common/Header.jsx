import { Link, useLocation } from "react-router-dom";
import { Zap, Brain } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { ROUTES } from "../constants/routes";
import ProfileMenu from "../common/ProfileMenu";

const Header = () => {
  const location = useLocation();
  const isNotAuth = location.pathname === "/";
  const { isAuthenticated, user, logout } = useAuth();

  // Функция для плавной прокрутки к элементу
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className={`bg-white/90 backdrop-blur-xl border-b border-slate-400/50 px-6 py-4 shadow-xl relative z-[999997] ${
      isNotAuth ? 'sticky top-0' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-500/30">
              <Link
                to={!isNotAuth || location.pathname !== '/auth' ? ROUTES.APP : ROUTES.HOME}
                className="hover:text-slate-400 transition-colors"
              >
                <Brain className="text-white" size={24} />
              </Link>
            </div>
            <div>
              <div className="text-2xl font-black bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent">
                Tubehi
              </div>
              <div className="text-sm font-bold text-slate-600">
                CONTENT CREATION STUDIO
              </div>
            </div>
          </div>
        </div>

        {isNotAuth ? (
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium cursor-pointer"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('testimonials')}
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium cursor-pointer"
            >
              Reviews
            </button>
            {isAuthenticated ? (
              <ProfileMenu user={user} onLogout={logout} />
            ) : (
              <>
                <Link
                  to={ROUTES.AUTH}
                  className="text-gray-700 hover:text-blue-600 font-semibold transition-colors px-4 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/auth"
                  className="relative bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden animate-pulse-glow"
                >
                  {/* Анимированный overlay для мигания */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-purple-300 opacity-0 animate-ping-slow rounded-xl"></div>
                  <span className="relative z-10">Try Free</span>
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
                to={ROUTES.PRICING}
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

      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(147, 51, 234, 0.6);
          }
        }

        @keyframes ping-slow {
          0% {
            opacity: 0;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.05);
          }
          100% {
            opacity: 0;
            transform: scale(1.1);
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 3s infinite;
        }
      `}</style>
    </div>
  );
};

export default Header;