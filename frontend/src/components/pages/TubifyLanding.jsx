import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Play,
  Mic,
  Brain,
  Zap,
  Star,
  Users,
  CheckCircle,
  ArrowRight,
  FileText,
  Eye,
  Sparkles,
  TrendingUp,
  Heart,
} from "lucide-react";

const TubifyLanding = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [stats, setStats] = useState({
    users: 0,
    videos: 0,
    saved: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setStats((prev) => ({
        users: Math.min(prev.users + 89, 47283),
        videos: Math.min(prev.videos + 127, 128549),
        saved: Math.min(prev.saved + 234, 89547),
      }));
    }, 50);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const testimonials = [
    {
      name: "Alex Johnson",
      role: "YouTube Creator",
      company: "850K subscribers",
      avatar: "👨‍💻",
      text: "The teleprompter changed my life! I record videos 3x faster now. 8x speed is perfect for my speaking pace.",
      results: "3x faster",
      logo: "AJ",
    },
    {
      name: "Maria Smith",
      role: "Lifestyle Blogger",
      company: "450K subscribers",
      avatar: "👩‍🎨",
      text: "AI creates better scripts than I do! The analytics show what will hook my audience. Views increased by 40%.",
      results: "+40% views",
      logo: "MS",
    },
    {
      name: "David Chen",
      role: "Gaming Streamer",
      company: "1.2M subscribers",
      avatar: "🎮",
      text: "Game reviews in 20 minutes instead of 2 hours. The draggable teleprompter is a game-changer for streamers!",
      results: "6x time saved",
      logo: "DC",
    },
  ];

  const companies = [
    { name: "YouTube", logo: "🎬" },
    { name: "TikTok", logo: "🎵" },
    { name: "Twitch", logo: "🎮" },
    { name: "Instagram", logo: "📷" },
    { name: "LinkedIn", logo: "💼" },
  ];

  const features = [
    {
      icon: Brain,
      title: "AI Script Generation",
      description:
        "Create professional scripts in seconds based on your topic and key points.",
      gradient: "from-purple-500 to-pink-500",
      score: "9.2/10",
      metric: "Content Quality",
    },
    {
      icon: FileText,
      title: "High-Speed Teleprompter",
      description:
        "Speeds up to 12x for creators. Draggable window, focus line, customizable fonts.",
      gradient: "from-blue-500 to-cyan-500",
      score: "12x",
      metric: "Max Speed",
    },
    {
      icon: Mic,
      title: "HD Voice Recording",
      description:
        "Record while reading from teleprompter. Noise cancellation, auto-sync.",
      gradient: "from-red-500 to-orange-500",
      score: "44.1kHz",
      metric: "Recording Quality",
    },
  ];

  const beforeAfter = [
    {
      before: "2 hours to create a video",
      after: "20 minutes with Tubify",
      improvement: "6x faster",
    },
    {
      before: "Boring, generic scripts",
      after: "AI-optimized content",
      improvement: "+40% engagement",
    },
    {
      before: "Struggling with reading",
      after: "Smooth delivery with teleprompter",
      improvement: "0 mistakes",
    },
  ];

  const plans = [
    {
      name: "Starter",
      price: "Free",
      period: "forever",
      description: "For aspiring creators",
      features: [
        "5 videos per month",
        "Basic teleprompter up to 5x speed",
        "AI scripts up to 500 words",
        "HD export",
        "Community support",
      ],
      credits: "5 videos",
      popular: false,
    },
    {
      name: "Creator",
      price: "$29",
      period: "/month",
      description: "For active content creators",
      features: [
        "Unlimited videos",
        "Advanced teleprompter up to 12x",
        "AI scripts up to 2000 words",
        "4K export",
        "Content analytics 9.2/10",
        "Priority support",
        "30 Content Editors/month",
      ],
      credits: "Unlimited",
      popular: true,
    },
    {
      name: "Agency",
      price: "$99",
      period: "/month",
      description: "For agencies and teams",
      features: [
        "Everything in Creator",
        "Team collaboration",
        "White label",
        "API access",
        "100 Content Editors/month",
        "Dedicated account manager",
      ],
      credits: "100 editors",
      popular: false,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <section className="pt-16 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-green-100 border border-green-300 rounded-full px-6 py-2 mb-6">
              <Star size={16} className="text-green-600 fill-current" />
              <span className="text-green-800 font-semibold text-sm">
                Trusted by {stats.users.toLocaleString()}+ creators and
                influencers
              </span>
            </div>

            <div className="flex justify-center items-center space-x-8 mb-12 opacity-60">
              {companies.map((company, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-2xl">{company.logo}</span>
                  <span className="text-gray-600 font-medium">
                    {company.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Create videos like a
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                  pro in minutes
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                <strong>
                  The first AI video editor with teleprompter for creators.
                </strong>{" "}
                Generate scripts, record voice while reading on screen, and get
                ready-to-publish videos with 9.2/10 quality score.
              </p>

              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-lg font-bold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <Play size={20} />
                  <span>Create Your First Video</span>
                </Link>

                <button className="border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-600 text-lg font-semibold px-8 py-4 rounded-xl transition-all duration-300 bg-white hover:bg-blue-50 flex items-center justify-center space-x-2">
                  <Eye size={20} />
                  <span>Watch Demo</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {stats.videos.toLocaleString()}+
                  </div>
                  <div className="text-gray-600 font-medium text-sm">
                    videos created
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                    {stats.saved.toLocaleString()}+
                  </div>
                  <div className="text-gray-600 font-medium text-sm">
                    hours saved
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    9.2/10
                  </div>
                  <div className="text-gray-600 font-medium text-sm">
                    content quality
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-slate-200/50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">
                    🎬 Tubify Studio
                  </h3>
                  <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-700 font-semibold text-sm">
                      REC
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-700 font-semibold">
                      Content Score
                    </span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      92/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                      style={{ width: "92%" }}
                    ></div>
                  </div>
                </div>

                <div className="bg-black rounded-lg p-4 mb-4">
                  <div className="text-white text-center text-lg leading-relaxed">
                    Hey everyone! In today's video I'll show you...
                  </div>
                  <div className="h-0.5 bg-red-500 mt-2 rounded-full opacity-60"></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button className="bg-green-500 text-white px-3 py-1 rounded text-sm">
                      ▶️ 8x
                    </button>
                    <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
                      🎙️ REC
                    </button>
                  </div>
                  <span className="text-gray-500 text-sm">00:45 / 02:30</span>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                🔥 New!
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Before and After Tubify
            </h2>
            <p className="text-xl text-gray-600">Real results from our users</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {beforeAfter.map((item, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200/50"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">❌</span>
                  </div>
                  <h4 className="font-semibold text-gray-600 mb-2">BEFORE</h4>
                  <p className="text-gray-700">{item.before}</p>
                </div>

                <div className="flex justify-center mb-6">
                  <ArrowRight size={24} className="text-blue-500" />
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h4 className="font-semibold text-gray-600 mb-2">AFTER</h4>
                  <p className="text-gray-700 mb-4">{item.after}</p>
                  <div className="bg-gradient-to-r from-green-100 to-teal-100 rounded-full px-4 py-2 border border-green-300">
                    <span className="text-green-800 font-bold text-sm">
                      {item.improvement}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powerful toolkit in one place
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tubify saves you time and resources without compromising on
              results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200/50 hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6`}
                  >
                    <IconComponent size={28} className="text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 mb-6">{feature.description}</p>

                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {feature.metric}
                      </span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {feature.score}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold mb-6">
                Auto-Optimize: Boost your Content Score to 9.2+ instantly
              </h3>
              <p className="text-xl text-blue-100 mb-8">
                Our latest upgrade helps you achieve high scores faster than
                ever before without sacrificing readability or SEO. It checks
                for content gaps, inserts relevant terms and missing sections.
              </p>
              <Link
                to="/login"
                className="bg-white text-blue-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
              >
                Try Auto-Optimize
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        id="testimonials"
        className="py-20 px-6 bg-gradient-to-r from-slate-50 to-blue-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {testimonials[currentTestimonial].logo}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-lg">
                      {testimonials[currentTestimonial].name}
                    </div>
                    <div className="text-gray-600">
                      {testimonials[currentTestimonial].role}
                    </div>
                    <div className="text-blue-600 font-semibold">
                      {testimonials[currentTestimonial].company}
                    </div>
                  </div>
                </div>

                <blockquote className="text-2xl text-gray-800 font-semibold mb-6 leading-relaxed">
                  "{testimonials[currentTestimonial].text}"
                </blockquote>

                <div className="inline-flex items-center bg-green-100 px-4 py-2 rounded-full border border-green-300">
                  <TrendingUp size={16} className="text-green-600 mr-2" />
                  <span className="text-green-800 font-bold">
                    Result: {testimonials[currentTestimonial].results}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentTestimonial
                        ? "bg-blue-500 scale-125"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-gray-900 mb-8">
                What content creators say
              </h3>

              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200/50 transition-all duration-300 ${
                    index === currentTestimonial
                      ? "ring-2 ring-blue-500 shadow-xl"
                      : "hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.logo}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {testimonial.company}
                      </div>
                    </div>
                    <div className="ml-auto">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className="text-yellow-400 fill-current"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">{testimonial.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Choose a plan that fits your needs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              7-day money-back guarantee. Choose a plan and try Tubify. If
              you're not satisfied, we'll give you a refund!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative ${plan.popular ? "scale-105 z-10" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      🔥 POPULAR
                    </div>
                  </div>
                )}
                <div
                  className={`bg-white/80 backdrop-blur-sm rounded-3xl p-8 border-2 shadow-xl hover:shadow-2xl transition-all duration-300 h-full ${
                    plan.popular ? "border-blue-500" : "border-slate-200/50"
                  }`}
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 mb-6">{plan.description}</p>

                    <div className="mb-6">
                      <div className="text-4xl font-bold text-gray-800">
                        {plan.price}
                        <span className="text-lg text-gray-500 font-normal">
                          {plan.period}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        {plan.credits}
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center space-x-3"
                      >
                        <CheckCircle size={20} className="text-green-500" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/login"
                    className={`w-full py-4 px-4 rounded-2xl font-bold text-lg transition-all duration-300 block text-center ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                        : "border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-600 bg-white hover:bg-blue-50"
                    }`}
                  >
                    {plan.price === "Free" ? "Start Free" : "Choose Plan"}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50">
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-8">
              What else you get
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users size={24} className="text-white" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Community</h4>
                <p className="text-sm text-gray-600">
                  20k+ creators in our community
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Brain size={24} className="text-white" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Training</h4>
                <p className="text-sm text-gray-600">
                  Weekly webinars and tutorials
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap size={24} className="text-white" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  Integrations
                </h4>
                <p className="text-sm text-gray-600">
                  YouTube, WordPress, ChatGPT
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Heart size={24} className="text-white" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Support</h4>
                <p className="text-sm text-gray-600">
                  24/7 help and consultation
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
            7-day money-back guarantee
          </h2>

          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Choose a plan that fits your needs and try Tubify. If you won't
            be satisfied, we'll give you a refund (yes, that's how sure we are
            you'll love it)!
          </p>

          <Link
            to="/login"
            className="bg-white hover:bg-gray-100 text-blue-600 text-xl font-bold px-12 py-5 rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 inline-flex items-center space-x-3"
          >
            <Sparkles size={24} />
            <span>Start Creating Videos</span>
          </Link>

          <div className="mt-6 text-blue-100 text-sm">
            Free • No credit card required • 5 videos included
          </div>
        </div>
      </section>
    </div>
  );
};

export default TubifyLanding;
