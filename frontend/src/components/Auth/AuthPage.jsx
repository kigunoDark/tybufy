import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Brain,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/app";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(
          formData.name,
          formData.email,
          formData.password
        );
      }

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setFormData({ name: "", email: "", password: "" });
  };

  const benefits = [
    { icon: Brain, text: "AI-powered script generation" },
    { icon: Sparkles, text: "Professional teleprompter" },
    { icon: CheckCircle, text: "HD voice recording" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Benefits */}
        <div className="hidden lg:block">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Brain className="text-white" size={32} />
              </div>
              <div>
                <div className="text-3xl font-black bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent">
                  Tubify
                </div>
                <div className="text-sm font-bold text-slate-600">
                  CONTENT CREATION STUDIO
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Create videos like a
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                pro in minutes
              </span>
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              Join thousands of creators who use Tubify to make professional
              videos faster than ever.
            </p>
          </div>

          <div className="space-y-6">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <IconComponent size={24} className="text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">
                    {benefit.text}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
                47,283+
              </div>
              <div className="text-gray-600">creators trust Tubify</div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-200/50">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isLogin ? "Welcome back!" : "Get started free"}
              </h2>
              <p className="text-gray-600">
                {isLogin
                  ? "Sign in to your account to continue creating"
                  : "Create your account and start making professional videos"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    name="name"
                    placeholder="Full name"
                    value={formData.name}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-white/80 backdrop-blur-sm"
                  />
                </div>
              )}

              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-white/80 backdrop-blur-sm"
                />
              </div>

              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-white/80 backdrop-blur-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle size={20} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>
                      {isLogin ? "Signing in..." : "Creating account..."}
                    </span>
                  </>
                ) : (
                  <span>{isLogin ? "Sign In" : "Create Account"}</span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}
                <button
                  onClick={toggleMode}
                  className="ml-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>

            {!isLogin && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  By creating an account, you agree to our Terms of Service and
                  Privacy Policy
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
