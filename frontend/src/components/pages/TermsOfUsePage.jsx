import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Bell,
  Shield,
  CheckCircle,
  Mail,
  Users,
  Scale,
  Eye,
  Heart,
  Sparkles,
  Star,
  Coffee,
  Zap,
} from "lucide-react";

const TermsComingSoon = () => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [countdown, setCountdown] = useState({
    days: 7,
    hours: 12,
    minutes: 34,
    seconds: 26,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { days, hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else if (days > 0) {
          days--;
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        
        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  const features = [
    {
      icon: Shield,
      title: "Privacy First",
      description: "Clear guidelines on how we protect your personal data and content",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Scale,
      title: "Fair Terms",
      description: "Balanced agreements that protect both creators and Tubehi",
      gradient: "from-green-500 to-teal-500",
    },
    {
      icon: Eye,
      title: "Transparent",
      description: "Plain English explanations with no hidden clauses or surprises",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Users,
      title: "Creator Rights",
      description: "Your content belongs to you - we're just here to help you create it",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  const timeline = [
    {
      phase: "Research & Analysis",
      status: "completed",
      description: "Studying industry best practices and creator needs",
    },
    {
      phase: "Legal Review",
      status: "in-progress",
      description: "Working with legal experts to ensure comprehensive coverage",
    },
    {
      phase: "Community Input",
      status: "upcoming",
      description: "Gathering feedback from our creator community",
    },
    {
      phase: "Final Draft",
      status: "upcoming",
      description: "Finalizing terms based on all feedback and reviews",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <section className="pt-16 pb-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-orange-100 border border-orange-300 rounded-full px-6 py-2 mb-6">
            <Clock size={16} className="text-orange-600" />
            <span className="text-orange-800 font-semibold text-sm">
              Coming Soon
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Terms of Use
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
              In Development
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            We're crafting comprehensive, creator-friendly terms that protect your rights 
            while ensuring a safe and fair platform for everyone. Our legal team is working 
            hard to make them clear, transparent, and easy to understand.
          </p>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-slate-200/50 max-w-2xl mx-auto mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-center space-x-2">
              <Sparkles size={24} className="text-purple-600" />
              <span>Expected Launch</span>
            </h3>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {countdown.days.toString().padStart(2, '0')}
                </div>
                <div className="text-gray-600 font-medium text-sm">Days</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {countdown.hours.toString().padStart(2, '0')}
                </div>
                <div className="text-gray-600 font-medium text-sm">Hours</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {countdown.minutes.toString().padStart(2, '0')}
                </div>
                <div className="text-gray-600 font-medium text-sm">Minutes</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {countdown.seconds.toString().padStart(2, '0')}
                </div>
                <div className="text-gray-600 font-medium text-sm">Seconds</div>
              </div>
            </div>
          </div>

          <div className="max-w-lg mx-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Get notified when it's ready
            </h3>
            
            {!isSubscribed ? (
              <form onSubmit={handleSubscribe} className="flex space-x-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white/80 backdrop-blur-sm"
                  required
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <Bell size={20} />
                  <span>Notify Me</span>
                </button>
              </form>
            ) : (
              <div className="bg-green-100 border border-green-300 rounded-xl p-4 flex items-center justify-center space-x-2">
                <CheckCircle size={20} className="text-green-600" />
                <span className="text-green-800 font-semibold">
                  Thanks! We'll notify you when it's ready.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What to Expect
            </h2>
            <p className="text-xl text-gray-600">
              We're building terms that put creators first
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50 hover:shadow-2xl transition-all duration-300 hover:scale-105 text-center"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                    <IconComponent size={28} className="text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Development Progress</h2>
            <p className="text-xl text-gray-600">
              We're taking our time to get this right
            </p>
          </div>

          <div className="space-y-8">
            {timeline.map((item, index) => (
              <div key={index} className="flex items-center space-x-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  item.status === 'completed' 
                    ? 'bg-green-500' 
                    : item.status === 'in-progress' 
                    ? 'bg-blue-500' 
                    : 'bg-gray-300'
                }`}>
                  {item.status === 'completed' ? (
                    <CheckCircle size={24} className="text-white" />
                  ) : item.status === 'in-progress' ? (
                    <Coffee size={24} className="text-white" />
                  ) : (
                    <Clock size={24} className="text-white" />
                  )}
                </div>

                <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200/50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{item.phase}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : item.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Current Status */}
      <section className="py-16 px-6 bg-white/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-slate-200/50">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <Zap size={32} className="text-white" />
            </div>
            
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              Meanwhile, you can still create amazing videos
            </h3>
            
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              While we finalize our terms, Tubehi is fully functional and ready to help 
              you create professional videos. Our current usage is governed by our 
              preliminary guidelines and industry-standard practices.
            </p>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
              <Link 
                to="/login" 
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-lg font-bold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <Sparkles size={20} />
                <span>Start Creating</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold mb-6">
                Have Questions About Our Terms?
              </h3>
              <p className="text-xl text-blue-100 mb-8">
                Our legal and support teams are available to address any concerns 
                or questions you might have about our upcoming terms of use.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
                <Link 
                  to="/help-center" 
                  className="bg-white text-blue-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors shadow-lg flex items-center space-x-2"
                >
                  <Mail size={20} />
                  <span>Contact Legal Team</span>
                </Link>
                <Link 
                  to="/help-center" 
                  className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white hover:text-blue-600 transition-colors flex items-center space-x-2"
                >
                  <Heart size={20} />
                  <span>Get Support</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-6 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Star size={20} className="text-yellow-500 fill-current" />
            <span className="text-gray-600 font-medium">
              Trusted by 47,000+ creators worldwide
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            We appreciate your patience as we work to provide the best possible terms for our community.
          </p>
        </div>
      </section>
    </div>
  );
};

export default TermsComingSoon;