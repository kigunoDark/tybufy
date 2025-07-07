import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  HelpCircle,
  Book,
  MessageCircle,
  Video,
  Settings,
  Mic,
  FileText,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
  Phone,
  Clock,
  Star,
  ArrowRight,
  Play,
  Users,
  Zap,
} from "lucide-react";

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedFaq, setExpandedFaq] = useState(null);

  const categories = [
    { id: "all", name: "All Topics", icon: HelpCircle, count: 45 },
    { id: "getting-started", name: "Getting Started", icon: Play, count: 12 },
    {
      id: "script-generation",
      name: "Script Generation",
      icon: FileText,
      count: 8,
    },
    { id: "teleprompter", name: "Teleprompter", icon: Video, count: 10 },
    { id: "voice-recording", name: "Voice Recording", icon: Mic, count: 7 },
    { id: "billing", name: "Billing & Plans", icon: CreditCard, count: 5 },
    { id: "account", name: "Account Settings", icon: Settings, count: 3 },
  ];

  const faqs = [
    {
      id: 1,
      category: "getting-started",
      question: "How do I create my first video with Tubify?",
      answer:
        "Creating your first video is simple! After signing up, click 'Create New Video' and follow these steps: 1) Enter your topic and select content type, 2) Generate AI script or write your own, 3) Use the teleprompter to record, 4) Export your finished video. The whole process takes just a few minutes!",
      popular: true,
    },
    {
      id: 2,
      category: "script-generation",
      question: "How accurate is the AI script generation?",
      answer:
        "Our AI generates scripts with a 9.2/10 quality score on average. It analyzes your topic, target audience, and content type to create engaging, SEO-optimized scripts. You can always edit and customize the generated content to match your style perfectly.",
      popular: true,
    },
    {
      id: 3,
      category: "teleprompter",
      question: "What's the maximum speed for the teleprompter?",
      answer:
        "The teleprompter supports speeds up to 12x for professional creators. You can adjust speed in real-time while recording, and it includes features like focus lines, customizable fonts, and a draggable window for optimal positioning.",
      popular: false,
    },
    {
      id: 4,
      category: "voice-recording",
      question: "What audio quality does Tubify support?",
      answer:
        "Tubify records in HD quality up to 44.1kHz with noise cancellation and auto-sync features. Your recordings are automatically synchronized with the teleprompter timing for perfect audio-visual alignment.",
      popular: false,
    },
    {
      id: 5,
      category: "billing",
      question: "Can I change my plan anytime?",
      answer:
        "Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades will apply at your next billing cycle. We also offer a 7-day money-back guarantee on all paid plans.",
      popular: true,
    },
    {
      id: 6,
      category: "billing",
      question: "Do you offer refunds?",
      answer:
        "We offer a 7-day money-back guarantee on all paid plans. If you're not satisfied with Tubify for any reason, contact our support team within 7 days of purchase for a full refund.",
      popular: false,
    },
    {
      id: 7,
      category: "account",
      question: "How do I reset my password?",
      answer:
        "Click 'Forgot Password' on the login page, enter your email address, and we'll send you a reset link. If you don't receive the email within 5 minutes, check your spam folder or contact support.",
      popular: false,
    },
    {
      id: 8,
      category: "teleprompter",
      question: "Can I use the teleprompter on multiple devices?",
      answer:
        "Yes! The teleprompter works on desktop, tablet, and mobile devices. Your scripts and settings sync across all devices, so you can start recording on one device and continue on another.",
      popular: false,
    },
  ];

  const quickActions = [
    {
      title: "Watch Getting Started Video",
      description: "5-minute tutorial covering the basics",
      icon: Play,
      action: "Watch Now",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Contact Support",
      description: "Get help from our expert team",
      icon: MessageCircle,
      action: "Start Chat",
      gradient: "from-green-500 to-teal-500",
    },
    {
      title: "Join Community",
      description: "Connect with 20k+ creators",
      icon: Users,
      action: "Join Now",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: "Feature Requests",
      description: "Suggest new features",
      icon: Zap,
      action: "Submit Idea",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  const supportOptions = [
    {
      title: "Live Chat",
      description: "Get instant help from our support team",
      availability: "Mon-Fri, 9 AM - 6 PM EST",
      icon: MessageCircle,
      action: "Start Chat",
      popular: true,
    },
    {
      title: "Email Support",
      description: "Send us a detailed message",
      availability: "Response within 4 hours",
      icon: Mail,
      action: "Send Email",
      popular: false,
    },
    {
      title: "Phone Support",
      description: "Talk to our experts directly",
      availability: "Premium plans only",
      icon: Phone,
      action: "Call Now",
      popular: false,
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory =
      activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularFaqs = faqs.filter((faq) => faq.popular);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <section className="pt-16 pb-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-100 border border-blue-300 rounded-full px-6 py-2 mb-6">
            <HelpCircle size={16} className="text-blue-600" />
            <span className="text-blue-800 font-semibold text-sm">
              Help Center
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            How can we
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
              help you today?
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Find answers to your questions, learn how to use Tubify
            effectively, and get the support you need to create amazing videos.
          </p>


          <div className="relative max-w-2xl mx-auto mb-8">
            <Search
              size={24}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none bg-white/80 backdrop-blur-sm"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                45
              </div>
              <div className="text-gray-600 font-medium text-sm">
                Help Articles
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                4h
              </div>
              <div className="text-gray-600 font-medium text-sm">
                Avg Response
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                97%
              </div>
              <div className="text-gray-600 font-medium text-sm">
                Satisfaction
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                24/7
              </div>
              <div className="text-gray-600 font-medium text-sm">Support</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-6 bg-white/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <p className="text-lg text-gray-600">
              Get started quickly with these popular resources
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50 hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mb-4`}
                  >
                    <IconComponent size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {action.description}
                  </p>
                  <button className="text-blue-600 font-semibold text-sm hover:text-blue-700 flex items-center space-x-1">
                    <span>{action.action}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                Categories
              </h3>
              <div className="space-y-2">
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
                        activeCategory === category.id
                          ? "bg-blue-500 text-white shadow-lg"
                          : "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-blue-50 border border-slate-200/50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent size={20} />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          activeCategory === category.id
                            ? "bg-blue-400"
                            : "bg-gray-200"
                        }`}
                      >
                        {category.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-800">
                  {activeCategory === "all"
                    ? "All Questions"
                    : categories.find((c) => c.id === activeCategory)?.name}
                </h3>
                <span className="text-gray-500">
                  {filteredFaqs.length} article
                  {filteredFaqs.length !== 1 ? "s" : ""}
                </span>
              </div>

              {searchQuery === "" && activeCategory === "all" && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                    <Star size={20} className="text-yellow-500 fill-current" />
                    <span>Popular Questions</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {popularFaqs.map((faq) => (
                      <div
                        key={faq.id}
                        onClick={() =>
                          setExpandedFaq(expandedFaq === faq.id ? null : faq.id)
                        }
                        className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
                      >
                        <h5 className="font-semibold text-gray-800 text-sm mb-2">
                          {faq.question}
                        </h5>
                        <p className="text-gray-600 text-xs">
                          {faq.answer.substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {filteredFaqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 overflow-hidden shadow-lg"
                  >
                    <button
                      onClick={() =>
                        setExpandedFaq(expandedFaq === faq.id ? null : faq.id)
                      }
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {faq.popular && (
                          <Star
                            size={16}
                            className="text-yellow-500 fill-current"
                          />
                        )}
                        <h4 className="font-semibold text-gray-800">
                          {faq.question}
                        </h4>
                      </div>
                      {expandedFaq === faq.id ? (
                        <ChevronUp size={20} className="text-gray-500" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-500" />
                      )}
                    </button>

                    {expandedFaq === faq.id && (
                      <div className="px-6 pb-4 border-t border-gray-100">
                        <p className="text-gray-700 pt-4 leading-relaxed">
                          {faq.answer}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <span className="text-sm text-gray-500">
                            Was this helpful?
                          </span>
                          <div className="flex space-x-2">
                            <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                              👍 Yes
                            </button>
                            <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                              👎 No
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredFaqs.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={32} className="text-gray-400" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">
                    No results found
                  </h4>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search terms or browse different
                    categories.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("all");
                    }}
                    className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Still Need Help?
            </h2>
            <p className="text-lg text-gray-600">
              Our support team is here to help you succeed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {supportOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <div
                  key={index}
                  className={`bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 shadow-xl hover:shadow-2xl transition-all duration-300 ${
                    option.popular
                      ? "border-blue-500 scale-105"
                      : "border-slate-200/50"
                  }`}
                >
                  {option.popular && (
                    <div className="flex justify-center mb-4">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        POPULAR
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <IconComponent size={28} className="text-white" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-3">
                      {option.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{option.description}</p>

                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-6">
                      <Clock size={16} />
                      <span>{option.availability}</span>
                    </div>

                    <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                      {option.action}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold mb-6">
                Join Our Creator Community
              </h3>
              <p className="text-xl text-blue-100 mb-8">
                Connect with 20,000+ content creators, share tips, get inspired,
                and stay updated on the latest Tubify features and best
                practices.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
                <button className="bg-white text-blue-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors shadow-lg flex items-center space-x-2">
                  <Users size={20} />
                  <span>Join Discord</span>
                  <ExternalLink size={16} />
                </button>
                <button className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white hover:text-blue-600 transition-colors flex items-center space-x-2">
                  <Book size={20} />
                  <span>View Documentation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 px-6 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Create Amazing Videos?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Start your journey with Tubify today and join thousands of
            successful creators.
          </p>
          <Link
            to="/login"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-lg font-bold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
          >
            <Play size={20} />
            <span>Get Started Free</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HelpCenter;
