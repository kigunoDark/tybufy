import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Brain,
  VideoIcon,
  FileText,
  Mic,
  Play,
  TrendingUp,
  Clock,
  Star,
  Crown,
  AlertCircle,
  ArrowRight,
  Plus,
  Lock,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      title: "Create New Video",
      description: "Start with AI script generation",
      icon: VideoIcon,
      link: "/app/video-maker",
      gradient: "from-blue-500 to-purple-500",
      primary: true,
      disabled: false,
    },
    {
      title: "Generate Script",
      description: "AI-powered content creation",
      icon: Brain,
      link: "/app/script-generator",
      gradient: "from-green-500 to-teal-500",
      disabled: true,
    },
    {
      title: "Thumbnail Generator",
      description: "Generate creative Thumbnail",
      icon: Mic,
      link: "/app/thumbnail",
      gradient: "from-orange-500 to-red-500",
      disabled: true,
    },
    {
      title: "My Videos",
      description: "View and manage your content",
      icon: Play,
      link: "/app/my-videos",
      gradient: "from-purple-500 to-pink-500",
      disabled: true,
    },
  ];

  const stats = [
    {
      label: "Videos Created",
      value: user?.videosCreated || 0,
      icon: VideoIcon,
      color: "text-blue-600",
      disabled: false,
    },
    {
      label: "Scripts Generated",
      value: "12",
      icon: FileText,
      color: "text-green-600",
      disabled: true,
    },
    {
      label: "Hours Saved",
      value: "48",
      icon: Clock,
      color: "text-purple-600",
      disabled: true,
    },
    {
      label: "Content Score",
      value: "9.2/10",
      icon: Star,
      color: "text-orange-600",
      disabled: true,
    },
  ];

  const getPlanInfo = () => {
    if (user?.plan === "free") {
      const videosLeft = Math.max(0, 5 - (user.videosCreated || 0));
      return {
        name: "Free Plan",
        videosLeft,
        showUpgrade: videosLeft <= 1,
      };
    }
    return {
      name: user?.plan === "creator" ? "Creator Plan" : "Agency Plan",
      videosLeft: null,
      showUpgrade: false,
    };
  };

  const planInfo = getPlanInfo();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Ready to create amazing videos? Let's get started.
            </p>

            <div className="flex items-center space-x-4">
              <div
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  user?.plan === "free"
                    ? "bg-gray-100 text-gray-700"
                    : "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                }`}
              >
                {user?.plan !== "free" && <Crown size={14} />}
                <span className="capitalize">{planInfo.name}</span>
              </div>

              {planInfo.videosLeft !== null && (
                <span className="text-sm text-gray-500">
                  {planInfo.videosLeft} videos left this month
                </span>
              )}
            </div>
          </div>

          <div className="hidden lg:block text-right">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
              {user?.videosCreated || 0}
            </div>
            <div className="text-gray-600 text-sm">Videos Created</div>
          </div>
        </div>
      </div>

      {planInfo.showUpgrade && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <AlertCircle className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-800 mb-1">
                  {planInfo.videosLeft === 0
                    ? "You've reached your free plan limit!"
                    : `Only ${planInfo.videosLeft} video left!`}
                </h3>
                <p className="text-amber-700">
                  Upgrade to Creator plan for unlimited videos and advanced
                  features.
                </p>
              </div>
            </div>
            <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2">
              <Crown size={20} />
              <span>Upgrade Now</span>
            </button>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          <Link
            to="/app/my-videos"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
          >
            <span>View all projects</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            const isPlanDisabled = planInfo.videosLeft === 0 && action.primary;
            const isFeatureDisabled = action.disabled;
            const isDisabled = isPlanDisabled || isFeatureDisabled;

            return (
              <div
                key={index}
                className={`group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border shadow-xl transition-all duration-300 ${
                  isDisabled
                    ? "border-gray-200/70 opacity-75"
                    : "border-slate-200/50 hover:shadow-2xl hover:scale-105 cursor-pointer"
                } ${isFeatureDisabled ? "bg-gradient-to-br from-gray-50/80 to-gray-100/80" : ""}`}
              >
                {!isDisabled ? (
                  <Link to={action.link} className="block">
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <IconComponent size={28} className="text-white" />
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4">
                      {action.description}
                    </p>

                    <div className="flex items-center text-blue-600 font-medium text-sm">
                      <span>Get started</span>
                      <ArrowRight
                        size={14}
                        className="ml-1 group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </Link>
                ) : (
                  <div>
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 relative ${
                        isFeatureDisabled 
                          ? "bg-gray-200" 
                          : `bg-gradient-to-br ${action.gradient}`
                      }`}
                    >
                      <IconComponent 
                        size={28} 
                        className={isFeatureDisabled ? "text-gray-400" : "text-white"} 
                      />
                    </div>

                    <h3 className="text-lg font-bold text-gray-600 mb-2">
                      {action.title}
                    </h3>

                    <p className="text-gray-500 text-sm mb-4">
                      {isFeatureDisabled ? "Coming in next update" : action.description}
                    </p>

                    <div className="flex items-center text-gray-400 font-medium text-sm">
                      <span>
                        {isPlanDisabled ? "Upgrade required" : "Coming soon"}
                      </span>
                      {isFeatureDisabled && <Lock size={12} className="ml-1" />}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Your Performance
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center`}
                  >
                    <IconComponent size={24} className={stat.color} />
                  </div>
                  <TrendingUp size={20} className="text-green-500" />
                </div>

                <div className="text-2xl font-bold text-gray-800 mb-1">
                  {stat.value}
                </div>

                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Recent Activity
        </h2>

        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus size={32} className="text-gray-400" />
          </div>

          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No recent activity
          </h3>

          <p className="text-gray-500 mb-6">
            Start creating your first video to see your activity here.
          </p>

          <Link
            to="/app/video-maker"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create First Video</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;