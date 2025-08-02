import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "../components/auth/AuthModal";
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


const TubehiLanging = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('register');
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
      gradient: "purple-pink",
      score: "9.2/10",
      metric: "Content Quality",
    },
    {
      icon: FileText,
      title: "High-Speed Teleprompter",
      description:
        "Speeds up to 12x for creators. Draggable window, focus line, customizable fonts.",
      gradient: "blue-cyan",
      score: "12x",
      metric: "Max Speed",
    },
    {
      icon: Mic,
      title: "HD Voice Recording",
      description:
        "Record while reading from teleprompter. Noise cancellation, auto-sync.",
      gradient: "red-orange",
      score: "44.1kHz",
      metric: "Recording Quality",
    },
  ];

  const beforeAfter = [
    {
      before: "2 hours to create a video",
      after: "20 minutes with Tubehi",
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

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/video-maker');
    } else {
      setAuthModalMode('register');
      setShowAuthModal(true);
    }
  };

  const handleWatchDemo = () => {
    alert('Demo video coming soon!');
  };

  return (
    <div className="landing-container">
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <Star size={16} className="hero-badge-icon" />
              <span className="hero-badge-text">
                Trusted by {stats.users.toLocaleString()}+ creators and influencers
              </span>
            </div>

            <div className="companies-grid">
              {companies.map((company, index) => (
                <div key={index} className="company-item">
                  <span className="company-logo">{company.logo}</span>
                  <span className="company-name">{company.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-main">
            <div className="hero-text">
              <h1 className="hero-title">
                Create videos like a
                <span className="hero-title-gradient">pro in minutes</span>
              </h1>

              <p className="hero-description">
                <strong>The first AI video editor with teleprompter for creators.</strong>{" "}
                Generate scripts, record voice while reading on screen, and get
                ready-to-publish videos with 9.2/10 quality score.
              </p>

              <div className="hero-buttons">
                <button onClick={handleGetStarted} className="btn btn-primary hero-btn-primary">
                  <Play size={20} />
                  <span>Create Your First Video</span>
                </button>

                <button onClick={handleWatchDemo} className="btn btn-secondary hero-btn-secondary">
                  <Eye size={20} />
                  <span>Watch Demo</span>
                </button>
              </div>

              <div className="hero-stats">
                <div className="stat-item">
                  <div className="stat-number blue-purple-gradient">
                    {stats.videos.toLocaleString()}+
                  </div>
                  <div className="stat-label">videos created</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number green-teal-gradient">
                    {stats.saved.toLocaleString()}+
                  </div>
                  <div className="stat-label">hours saved</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number orange-red-gradient">
                    9.2/10
                  </div>
                  <div className="stat-label">content quality</div>
                </div>
              </div>
            </div>

            <div className="hero-demo">
              <div className="demo-card">
                <div className="demo-header">
                  <h3 className="demo-title">🎬 Tubehi Studio</h3>
                  <div className="demo-recording">
                    <div className="recording-dot"></div>
                    <span className="recording-text">REC</span>
                  </div>
                </div>

                <div className="demo-score">
                  <div className="score-header">
                    <span className="score-label">Content Score</span>
                    <span className="score-value">92/100</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-progress" style={{ width: "92%" }}></div>
                  </div>
                </div>

                <div className="demo-teleprompter">
                  <div className="teleprompter-text">
                    Hey everyone! In today's video I'll show you...
                  </div>
                  <div className="teleprompter-line"></div>
                </div>

                <div className="demo-controls">
                  <div className="control-buttons">
                    <button className="control-btn speed">▶️ 8x</button>
                    <button className="control-btn record">🎙️ REC</button>
                  </div>
                  <span className="demo-time">00:45 / 02:30</span>
                </div>
              </div>

              <div className="demo-badge">🔥 New!</div>
            </div>
          </div>
        </div>
      </section>

      <section className="before-after-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Before and After Tubehi</h2>
            <p className="section-subtitle">Real results from our users</p>
          </div>

          <div className="before-after-grid">
            {beforeAfter.map((item, index) => (
              <div key={index} className="before-after-card">
                <div className="before-section">
                  <div className="before-icon">
                    <span>❌</span>
                  </div>
                  <h4 className="before-title">BEFORE</h4>
                  <p className="before-text">{item.before}</p>
                </div>

                <div className="arrow-container">
                  <ArrowRight size={24} className="arrow-icon" />
                </div>

                <div className="after-section">
                  <div className="after-icon">
                    <span>✅</span>
                  </div>
                  <h4 className="after-title">AFTER</h4>
                  <p className="after-text">{item.after}</p>
                  <div className="improvement-badge">
                    <span>{item.improvement}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Powerful toolkit in one place</h2>
            <p className="section-subtitle">
              Tubehi saves you time and resources without compromising on results
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="feature-card">
                  <div className={`feature-icon ${feature.gradient}`}>
                    <IconComponent size={28} />
                  </div>

                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>

                  <div className="feature-metric">
                    <div className="metric-container">
                      <span className="metric-label">{feature.metric}</span>
                      <span className="metric-score">{feature.score}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="auto-optimize-section">
            <div className="auto-optimize-content">
              <h3 className="auto-optimize-title">
                Auto-Optimize: Boost your Content Score to 9.2+ instantly
              </h3>
              <p className="auto-optimize-description">
                Our latest upgrade helps you achieve high scores faster than
                ever before without sacrificing readability or SEO. It checks
                for content gaps, inserts relevant terms and missing sections.
              </p>
              <button className="btn btn-secondary auto-optimize-btn">
                Try Auto-Optimize
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="testimonials-section">
        <div className="container">
          <div className="testimonials-main">
            <div className="testimonial-featured">
              <div className="testimonial-content">
                <div className="testimonial-author">
                  <div className="author-avatar">
                    {testimonials[currentTestimonial].logo}
                  </div>
                  <div className="author-info">
                    <div className="author-name">
                      {testimonials[currentTestimonial].name}
                    </div>
                    <div className="author-role">
                      {testimonials[currentTestimonial].role}
                    </div>
                    <div className="author-company">
                      {testimonials[currentTestimonial].company}
                    </div>
                  </div>
                </div>

                <blockquote className="testimonial-quote">
                  "{testimonials[currentTestimonial].text}"
                </blockquote>

                <div className="testimonial-result">
                  <TrendingUp size={16} />
                  <span>Result: {testimonials[currentTestimonial].results}</span>
                </div>
              </div>

              <div className="testimonial-dots">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`testimonial-dot ${
                      index === currentTestimonial ? "active" : ""
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="testimonials-list">
              <h3 className="testimonials-title">What content creators say</h3>

              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`testimonial-card ${
                    index === currentTestimonial ? "active" : ""
                  }`}
                >
                  <div className="testimonial-card-header">
                    <div className="testimonial-card-avatar">
                      {testimonial.logo}
                    </div>
                    <div className="testimonial-card-info">
                      <div className="testimonial-card-name">
                        {testimonial.name}
                      </div>
                      <div className="testimonial-card-company">
                        {testimonial.company}
                      </div>
                    </div>
                    <div className="testimonial-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className="star-icon" />
                      ))}
                    </div>
                  </div>
                  <p className="testimonial-card-text">{testimonial.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="pricing-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Choose a plan that fits your needs</h2>
            <p className="section-subtitle">
              7-day money-back guarantee. Choose a plan and try Tubehi. If
              you're not satisfied, we'll give you a refund!
            </p>
          </div>

          <div className="pricing-grid">
            {plans.map((plan, index) => (
              <div key={index} className={`pricing-card ${plan.popular ? "popular" : ""}`}>
                {plan.popular && (
                  <div className="popular-badge">🔥 POPULAR</div>
                )}
                
                <div className="pricing-card-content">
                  <div className="pricing-header">
                    <h3 className="plan-name">{plan.name}</h3>
                    <p className="plan-description">{plan.description}</p>

                    <div className="plan-price">
                      <div className="price-main">
                        {plan.price}
                        <span className="price-period">{plan.period}</span>
                      </div>
                      <div className="price-credits">{plan.credits}</div>
                    </div>
                  </div>

                  <ul className="plan-features">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="plan-feature">
                        <CheckCircle size={20} className="feature-check" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={handleGetStarted}
                    className={`btn plan-button ${
                      plan.popular ? "btn-primary" : "btn-secondary"
                    }`}
                  >
                    {plan.price === "Free" ? "Start Free" : "Choose Plan"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pricing-extras">
            <h3 className="extras-title">What else you get</h3>
            <div className="extras-grid">
              <div className="extra-item">
                <div className="extra-icon blue-purple">
                  <Users size={24} />
                </div>
                <h4 className="extra-title">Community</h4>
                <p className="extra-description">20k+ creators in our community</p>
              </div>
              <div className="extra-item">
                <div className="extra-icon green-teal">
                  <Brain size={24} />
                </div>
                <h4 className="extra-title">Training</h4>
                <p className="extra-description">Weekly webinars and tutorials</p>
              </div>
              <div className="extra-item">
                <div className="extra-icon orange-red">
                  <Zap size={24} />
                </div>
                <h4 className="extra-title">Integrations</h4>
                <p className="extra-description">YouTube, WordPress, ChatGPT</p>
              </div>
              <div className="extra-item">
                <div className="extra-icon purple-pink">
                  <Heart size={24} />
                </div>
                <h4 className="extra-title">Support</h4>
                <p className="extra-description">24/7 help and consultation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">7-day money-back guarantee</h2>

            <p className="cta-description">
              Choose a plan that fits your needs and try Tubehi. If you won't
              be satisfied, we'll give you a refund (yes, that's how sure we are
              you'll love it)!
            </p>

            <button onClick={handleGetStarted} className="btn btn-primary cta-button">
              <Sparkles size={24} />
              <span>Start Creating Videos</span>
            </button>

            <div className="cta-note">
              Free • No credit card required • 5 videos included
            </div>
          </div>
        </div>
      </section>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
    </div>
  );
};

export default TubehiLanging;