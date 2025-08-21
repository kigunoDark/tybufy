import { useState, useEffect, cloneElement, Fragment } from "react";
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
  Building,
  Crown,
} from "lucide-react";
import VideoBlock from "./DemoVideo";

const TubeHiLanding = () => {
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

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const testimonials = [
    {
      name: "Alex Johnson",
      role: "YouTube Creator",
      company: "850K subscribers",
      avatar: "👨‍💻",
      text: "The AI script generation changed my workflow! I create better content 3x faster now.",
      results: "3x faster",
      logo: "AJ",
    },
    {
      name: "Maria Smith",
      role: "Lifestyle Blogger",
      company: "450K subscribers",
      avatar: "👩‍🎨",
      text: "AI thumbnails get me more clicks than my designer! Views increased by 40% since using TubeHi.",
      results: "+40% views",
      logo: "MS",
    },
    {
      name: "David Chen",
      role: "Gaming Streamer",
      company: "1.2M subscribers",
      avatar: "🎮",
      text: "Voice generation is incredible! I can create content in multiple languages for my global audience.",
      results: "6x reach",
      logo: "DC",
    },
  ];

  const companies = [
    { name: "YouTube", logo: "🎬" },
    { name: "TikTok", logo: "🎵" },
    { name: "Instagram", logo: "📷" },
  ];

  const features = [
    {
      icon: Brain,
      title: "AI Script Generation",
      description:
        "Create professional scripts in seconds based on your topic and key points. Get engaging content that converts.",
      gradient: "from-purple-500 to-pink-500",
      score: "9.2/10",
      metric: "Content Quality",
    },
    {
      icon: FileText,
      title: "AI Thumbnail Creator",
      description:
        "Generate eye-catching thumbnails that get more clicks. Multiple styles and custom text options.",
      gradient: "from-blue-500 to-cyan-500",
      score: "5 designs",
      metric: "Per Generation",
    },
    {
      icon: Mic,
      title: "AI Voice Generation",
      description:
        "Convert your scripts to natural-sounding speech. Multiple voices and languages available.",
      gradient: "from-red-500 to-orange-500",
      score: "HD Quality",
      metric: "Audio Output",
    },
  ];

  const steps = [
    {
      number: "01",
      icon: "📜",
      title: "Script",
      description:
        "Generate or polish your video script with AI + get quality score.",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      number: "02",
      icon: "🎙️",
      title: "Voice",
      description:
        "Convert text into natural AI voices or use teleprompter to record yours.",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      number: "03",
      icon: "🎬",
      title: "Record & Edit",
      description:
        "Sync voice, trim clips, and add sounds with our lightweight editor.",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      number: "04",
      icon: "🖼️",
      title: "Thumbnail",
      description: "Generate eye-catching thumbnails that boost clicks.",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      number: "05",
      icon: "🚀",
      title: "Export",
      description:
        "Publish your video in HD directly to YouTube, TikTok, or Instagram.",
      color: "from-indigo-500 to-purple-500",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
    },
  ];

  const plans = [
    {
      name: "Free Plan",
      price: "Free",
      period: "/forever",
      description: "Best for testing TubeHi risk-free",
      features: [
        "3 scripts per month",
        "10k characters audio generation",
        "5 thumbnails per month",
        "Basic AI voices",
        "Community support",
      ],
      credits: "Forever free",
      popular: false,
      planId: "free",
    },
    {
      name: "Creator Plan",
      price: "$9.99",
      period: "/month",
      description: "Perfect for active content creators",
      features: [
        "25 scripts per month",
        "60k characters audio generation",
        "30 thumbnails per month",
        "All AI voices + HD export",
        "Priority support",
      ],
      credits: "🔥 Most Popular",
      popular: true,
      planId: "creator",
    },
    {
      name: "Pro Plan",
      price: "$24.99",
      period: "/month",
      description: "For professional creators and small teams",
      features: [
        "100 scripts per month",
        "200k characters audio generation",
        "100 thumbnails per month",
        "API access + analytics",
        "Priority support",
      ],
      credits: "Best for power users",
      popular: false,
      planId: "pro",
    },
  ];

  // ✅ Функция для получения иконки плана
  const getPlanIcon = (planId) => {
    switch (planId) {
      case "creator":
        return <Star className="w-6 h-6 text-blue-600" />;
      case "pro":
        return <Zap className="w-6 h-6 text-purple-600" />;
      case "agency":
        return <Building className="w-6 h-6 text-orange-600" />;
      default:
        return <Crown className="w-6 h-6 text-gray-600" />;
    }
  };

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
      {/* HERO SECTION */}
      <section className="pt-32 pb-12 px-6">
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
                Your all-in-one
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                  AI video studio
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                <strong>
                  The ultimate AI content creation studio for creators.
                </strong>{" "}
                Generate scripts, create thumbnails, and produce voiceovers with
                AI. Get ready-to-publish content with 9.2/10 quality score.
              </p>

              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
                <Link
                  to="/auth"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-lg font-bold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <Play size={20} />
                  <span>Start Creating for Free</span>
                </Link>

                <button
                  onClick={() => scrollToSection("features")}
                  className="border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-600 text-lg font-semibold px-8 py-4 rounded-xl transition-all duration-300 bg-white hover:bg-blue-50 flex items-center justify-center space-x-2"
                >
                  <Eye size={20} />
                  <span>See Features</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {stats.videos.toLocaleString()}+
                  </div>
                  <div className="text-gray-600 font-medium text-sm">
                    content pieces created
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
              <VideoBlock />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 rounded-full px-6 py-2 mb-6">
              <Sparkles size={16} className="text-blue-600 animate-pulse" />
              <span className="text-blue-800 font-semibold text-sm">
                AI-Powered Workflow
              </span>
            </div>

            <h2 className="text-5xl font-black text-gray-900 mb-6 leading-tight">
              From Idea to Published Video in{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                5 Simple Steps
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our streamlined AI workflow transforms your creative ideas into
              professional content in minutes, not hours
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 lg:gap-6 mb-16">
            {steps.map((step, index) => (
              <Fragment key={index}>
                <div
                  className={`group flex items-center gap-4 ${step.bgColor} ${step.borderColor} border-2 rounded-3xl px-6 py-4 hover:shadow-2xl transition-all duration-500 hover:scale-105 animate-fade-in-up relative`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
                  >
                    <span className="text-white font-black text-sm">
                      {step.number}
                    </span>
                  </div>

                  <div className="w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center group-hover:shadow-xl transition-shadow duration-300 group-hover:animate-bounce flex-shrink-0">
                    <span className="text-2xl filter drop-shadow-sm">
                      {step.icon}
                    </span>
                  </div>

                  <div className="text-left">
                    <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-xs leading-tight max-w-xs">
                      {step.description}
                    </p>
                  </div>

                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-300`}
                  ></div>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:flex items-center animate-pulse">
                    <ArrowRight size={20} className="text-gray-400" />
                  </div>
                )}
              </Fragment>
            ))}
          </div>

          <div className="text-center animate-fade-in-up animation-delay-800">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-12 shadow-2xl hover:shadow-3xl transition-shadow duration-300">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Zap size={32} className="text-yellow-300 animate-pulse" />
                  <h3 className="text-3xl font-black text-white">
                    Ready to Transform Your Content Creation?
                  </h3>
                  <Zap size={32} className="text-yellow-300 animate-pulse" />
                </div>

                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  Join thousands of creators who've revolutionized their
                  workflow. Start creating professional content in minutes, not
                  hours.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button className="group bg-white hover:bg-gray-100 text-blue-600 font-black px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-3">
                    <Sparkles size={20} className="group-hover:animate-spin" />
                    <span>Start Creating for Free</span>
                  </button>

                  <div className="text-blue-200 text-sm">
                    ✨ No credit card required • 3 free scripts included
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything you need to create amazing content
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              TubeHi provides all the AI tools you need to create engaging
              content that converts viewers into subscribers
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
                🚀 All-in-One AI Content Studio
              </h3>
              <p className="text-xl text-blue-100 mb-8">
                Stop juggling multiple tools. Create scripts, thumbnails, and
                voiceovers all in one place. Save time, reduce costs, and create
                better content that actually converts.
              </p>
              <Link
                to="/auth"
                className="bg-white text-blue-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
              >
                Start Creating Now
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
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              What content creators say about TubeHi
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of creators who've transformed their workflow
            </p>
          </div>

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
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Choose the perfect plan for your needs
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start free and upgrade as you grow. All plans include our core AI
            features with no setup fees or hidden costs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative ${plan.popular ? "scale-105 z-10" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    🔥 MOST POPULAR
                  </div>
                </div>
              )}

              <div
                className={`bg-white/80 backdrop-blur-sm rounded-3xl p-8 border-2 shadow-xl hover:shadow-2xl transition-all duration-300 h-full ${
                  plan.popular ? "border-blue-500" : "border-slate-200/50"
                }`}
              >
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gray-50 rounded-full">
                      {getPlanIcon(plan.planId)}
                    </div>
                  </div>
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
                  {plan.features.map((feature, fi) => (
                    <li key={fi} className="flex items-center space-x-3">
                      <CheckCircle size={20} className="text-green-500" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/auth"
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
            What else you get with every plan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: <Users size={24} />,
                title: "Community",
                desc: "Join 47k+ creators in our community",
                colors: "from-blue-500 to-purple-500",
              },
              {
                icon: <Brain size={24} />,
                title: "Training",
                desc: "Weekly webinars and tutorials",
                colors: "from-green-500 to-teal-500",
              },
              {
                icon: <Zap size={24} />,
                title: "Integrations",
                desc: "Export to YouTube, TikTok, Instagram",
                colors: "from-orange-500 to-red-500",
              },
              {
                icon: <Heart size={24} />,
                title: "Support",
                desc: "24/7 help when you need it",
                colors: "from-purple-500 to-pink-500",
              },
            ].map(({ icon, title, desc, colors }, i) => (
              <div key={i} className="text-center">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${colors} rounded-xl flex items-center justify-center mx-auto mb-4`}
                >
                  {cloneElement(icon, { className: "text-white" })}
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
            Start creating amazing content today
          </h2>

          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join thousands of creators who use TubeHi to generate scripts,
            thumbnails, and voiceovers with AI. Start free, no credit card
            required.
          </p>

          <Link
            to="/auth"
            className="bg-white hover:bg-gray-100 text-blue-600 text-xl font-bold px-12 py-5 rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 inline-flex items-center space-x-3"
          >
            <Sparkles size={24} />
            <span>Get Started Free</span>
          </Link>

          <div className="mt-6 text-blue-100 text-sm">
            Free forever plan • No credit card required • 3 scripts included
          </div>
        </div>
      </section>
    </div>
  );
};

export default TubeHiLanding;
