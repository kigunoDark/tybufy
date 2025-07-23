import { Link } from "react-router-dom";
import { Linkedin, MessageCircle, Twitter } from "lucide-react";
import { ROUTES } from "../constants/routes";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-8 px-6 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-2xl font-bold text-slate-300">Tubify</div>
              <div className="bg-gradient-to-r from-slate-500 to-blue-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                AI STUDIO
              </div>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Professional platform for creating video content. Turn ideas into
              quality videos with advanced AI technologies and teleprompter
              features.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">
                  AI services online
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Tools</h3>
            <ul className="space-y-2 text-gray-300">
              <li>AI Script Generator</li>
              <li>Smart Voice-over</li>
              <li>Auto-editing</li>
              <li>HD Export</li>
              <li>Teleprompter</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link
                  to={ROUTES.HELP_CENTER}
                  className="hover:text-slate-400 transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.ABOUT_US}
                  className="hover:text-slate-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/vacancies"
                  className="hover:text-slate-400 transition-colors"
                >
                  Careers
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>
                © {currentYear} Tubify. Профессиональные ИИ решения.
              </span>
              <Link
                to={ROUTES.TERMS_OF_USE}
                className="hover:text-slate-400 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to={ROUTES.PRIVACY_POLICY}
                className="hover:text-slate-400 transition-colors"
              >
                Privacy Policy
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">Follow us:</span>
              <div className="flex items-center space-x-3">
                <Link
                  to="https://www.linkedin.com/company/tubehi "
                  target="_blank"
                  rel="linkedinPage"
                  className="w-8 h-8 bg-gray-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <Linkedin size={16} className="text-white" />
                </Link>
                <Link
                  to="https://www.discord.com"
                  target="_blank"
                  rel="discord"
                  className="w-8 h-8 bg-gray-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <MessageCircle size={16} className="text-white" />
                </Link>
                <Link
                  to="https://x.com "
                  target="_blank"
                  rel="xPage"
                  className="w-8 h-8 bg-gray-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <Twitter size={16} className="text-white" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
