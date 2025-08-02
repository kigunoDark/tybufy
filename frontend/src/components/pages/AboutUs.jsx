import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Users,
  Target,
  Globe,
  Lightbulb,
  Rocket,
  Star,
  TrendingUp,
  Play,
  Brain,
  Zap,
  Shield,
  Video,
  ArrowRight,
  MapPin,
  Coffee,
  Sparkles,
} from "lucide-react";

const AboutUs = () => {
  const [stats, setStats] = useState({
    users: 0,
    videos: 0,
    countries: 0,
    satisfaction: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setStats((prev) => ({
        users: Math.min(prev.users + 234, 47283),
        videos: Math.min(prev.videos + 412, 128549),
        countries: Math.min(prev.countries + 1, 89),
        satisfaction: Math.min(prev.satisfaction + 0.1, 97.2),
      }));
    }, 50);

    return () => clearInterval(timer);
  }, []);

  const team = [
    {
      name: "Alex Rodriguez",
      role: "CEO & Co-Founder",
      bio: "Former YouTube creator with 2M+ subscribers. Built Tubehi to solve his own content creation challenges.",
      avatar: "👨‍💼",
      social: { twitter: "@alexr", linkedin: "alexrodriguez" },
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      name: "Sarah Chen",
      role: "CTO & Co-Founder",
      bio: "AI/ML expert from Google. Led development of GPT-4 integration and our advanced script generation algorithms.",
      avatar: "👩‍💻",
      social: { twitter: "@sarahc", linkedin: "sarahchen" },
      gradient: "from-purple-500 to-pink-500",
    },
    {
      name: "Marcus Johnson",
      role: "Head of Product",
      bio: "Product designer at Figma. Obsessed with creating intuitive experiences for content creators.",
      avatar: "👨‍🎨",
      social: { twitter: "@marcusj", linkedin: "marcusjohnson" },
      gradient: "from-green-500 to-teal-500",
    },
    {
      name: "Emma Thompson",
      role: "Head of Growth",
      bio: "Growth hacker who scaled 3 startups to $10M ARR. Helps creators discover and love Tubehi.",
      avatar: "👩‍🚀",
      social: { twitter: "@emmat", linkedin: "emmathompson" },
      gradient: "from-orange-500 to-red-500",
    },
  ];

  const values = [
    {
      icon: Heart,
      title: "Creator-First",
      description:
        "Every decision we make starts with 'How does this help creators succeed?'",
      gradient: "from-red-500 to-pink-500",
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description:
        "We push the boundaries of what's possible with AI and video technology.",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      icon: Shield,
      title: "Trust & Privacy",
      description:
        "Your content is yours. We protect your data like it's our own.",
      gradient: "from-blue-500 to-purple-500",
    },
    {
      icon: Users,
      title: "Community",
      description:
        "Building tools that bring creators together and help them learn from each other.",
      gradient: "from-green-500 to-teal-500",
    },
  ];

  const milestones = [
    {
      year: "2022",
      title: "The Idea",
      description:
        "Alex struggles with video creation as a YouTube creator, decides to build a solution.",
      icon: Lightbulb,
    },
    {
      year: "2023",
      title: "First Version",
      description:
        "MVP launched with basic teleprompter. 1,000+ creators sign up in first month.",
      icon: Rocket,
    },
    {
      year: "2023",
      title: "AI Integration",
      description:
        "Sarah joins as CTO, integrates GPT-4 for script generation. Quality scores hit 9.2/10.",
      icon: Brain,
    },
    {
      year: "2024",
      title: "Global Expansion",
      description:
        "Tubehi reaches 89 countries. Voice recording and analytics features launched.",
      icon: Globe,
    },
    {
      year: "2024",
      title: "Community Growth",
      description:
        "47,000+ active creators, 128,000+ videos created. $2M funding round completed.",
      icon: TrendingUp,
    },
    {
      year: "2025",
      title: "What's Next",
      description:
        "AI director mode, live streaming integration, and mobile app coming soon.",
      icon: Sparkles,
    },
  ];

  const achievements = [
    { metric: "47,283+", label: "Active Creators", icon: Users },
    { metric: "128,549+", label: "Videos Created", icon: Video },
    { metric: "89", label: "Countries", icon: Globe },
    { metric: "97.2%", label: "Satisfaction Rate", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <section className="pt-16 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-purple-100 border border-purple-300 rounded-full px-6 py-2 mb-6">
              <Heart size={16} className="text-purple-600" />
              <span className="text-purple-800 font-semibold text-sm">
                Made with ❤️ for creators
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              We're building the
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                future of video creation
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Tubehi started as a simple idea: what if creating professional
              videos was as easy as having a conversation? Today, we're
              empowering creators worldwide to tell their stories with
              confidence and clarity.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {achievements.map((achievement, index) => {
                const IconComponent = achievement.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <IconComponent size={24} className="text-white" />
                    </div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {achievement.metric}
                    </div>
                    <div className="text-gray-600 font-medium text-sm">
                      {achievement.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
                  <Target size={28} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Our Mission
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  To democratize professional video creation by making it
                  accessible, efficient, and enjoyable for creators of all skill
                  levels. We believe everyone has a story worth telling, and
                  we're here to help them tell it beautifully.
                </p>
              </div>
            </div>

            <div>
              <div className="mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6">
                  <Rocket size={28} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Our Vision
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  A world where creating professional-quality videos is as
                  simple as having an idea. Where technology amplifies
                  creativity rather than complicating it, and where every
                  creator can focus on what they do best: storytelling.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From a creator's frustration to a global platform trusted by
              thousands
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 rounded-full hidden md:block"></div>

            <div className="space-y-12">
              {milestones.map((milestone, index) => {
                const IconComponent = milestone.icon;
                const isEven = index % 2 === 0;

                return (
                  <div
                    key={index}
                    className={`flex items-center ${
                      isEven ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                  >
                    <div className={`flex-1 ${isEven ? "md:pr-8" : "md:pl-8"}`}>
                      <div
                        className={`bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200/50 ${
                          isEven ? "md:text-right" : "md:text-left"
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <IconComponent size={20} className="text-white" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              {milestone.year}
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">
                              {milestone.title}
                            </h3>
                          </div>
                        </div>
                        <p className="text-gray-700">{milestone.description}</p>
                      </div>
                    </div>

                    <div className="hidden md:flex w-6 h-6 bg-white border-4 border-blue-500 rounded-full relative z-10"></div>

                    <div className="flex-1"></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-white/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Passionate creators, engineers, and dreamers working to empower
              the next generation of storytellers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200/50 hover:shadow-2xl transition-all duration-300 hover:scale-105 text-center"
              >
                <div
                  className={`w-20 h-20 bg-gradient-to-br ${member.gradient} rounded-full flex items-center justify-center mx-auto mb-6 text-3xl`}
                >
                  {member.avatar}
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {member.name}
                </h3>
                <p className="text-blue-600 font-semibold mb-4">
                  {member.role}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {member.bio}
                </p>

                <div className="flex justify-center space-x-4">
                  <button className="text-blue-500 hover:text-blue-600 transition-colors">
                    Twitter
                  </button>
                  <button className="text-blue-500 hover:text-blue-600 transition-colors">
                    LinkedIn
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200/50 hover:shadow-2xl transition-all duration-300"
                >
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${value.gradient} rounded-2xl flex items-center justify-center mb-6`}
                  >
                    <IconComponent size={28} className="text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-white/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Life at Tubehi
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're building more than a product – we're building a culture of
              creativity, innovation, and fun
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPin size={24} className="text-white" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Remote-First</h4>
              <p className="text-gray-600 text-sm">
                Work from anywhere in the world
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Coffee size={24} className="text-white" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Unlimited PTO</h4>
              <p className="text-gray-600 text-sm">
                Rest and recharge when you need it
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap size={24} className="text-white" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Learning Budget</h4>
              <p className="text-gray-600 text-sm">
                $2,000/year for courses and conferences
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/careers"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-lg font-bold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
            >
              <Users size={20} />
              <span>Join Our Team</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold mb-6">
                Let's Create Something Amazing Together
              </h3>
              <p className="text-xl text-blue-100 mb-8">
                Whether you're a creator looking to streamline your workflow, an
                investor interested in our mission, or a talented individual who
                wants to join our team – we'd love to hear from you.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
                <Link
                  to="/contact"
                  className="bg-white text-blue-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors shadow-lg flex items-center space-x-2"
                >
                  <Heart size={20} />
                  <span>Get in Touch</span>
                </Link>
                <Link
                  to="/login"
                  className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white hover:text-blue-600 transition-colors flex items-center space-x-2"
                >
                  <Play size={20} />
                  <span>Try Tubehi Free</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-6 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Join the Content Creation Revolution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {stats.users.toLocaleString()}+
              </div>
              <div className="text-gray-600 font-medium text-sm">
                Happy Creators
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                {stats.videos.toLocaleString()}+
              </div>
              <div className="text-gray-600 font-medium text-sm">
                Videos Created
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {stats.countries}
              </div>
              <div className="text-gray-600 font-medium text-sm">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {stats.satisfaction.toFixed(1)}%
              </div>
              <div className="text-gray-600 font-medium text-sm">
                Satisfaction
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
