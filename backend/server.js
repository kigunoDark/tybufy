const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

const {
  generateScript,
  generateKeyPoints,
  improveArticle,
  getScriptQuality,
  extendScript,
} = require("./services/openai");
const { generateAudio, getAvailableVoices } = require("./services/elevenlabs");

const app = express();
const dirs = ["uploads", "output"];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: "Too many authentication attempts, please try again later.",
  },
  skipSuccessfulRequests: true,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 1000 : 10,
  message: {
    success: false,
    error: "Too many AI requests, please slow down.",
  },
});

app.use("/api/", limiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/script/", aiLimiter);
app.use("/api/audio/", aiLimiter);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:3001",
    ];

    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/output", express.static(path.join(__dirname, "output")));

// MongoDB connection
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/scriptify",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

mongoose.connection.on("connected", () => {
  console.log("✅ Connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

// User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    subscription: {
      type: String,
      enum: ["free", "pro", "premium"],
      default: "free",
    },
    usage: {
      scriptsGenerated: { type: Number, default: 0 },
      audioGenerated: { type: Number, default: 0 },
      lastReset: { type: Date, default: Date.now },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
  const payload = {
    userId: this._id,
    email: this.email,
    name: this.name,
    subscription: this.subscription,
  };

  return jwt.sign(payload, process.env.JWT_SECRET || "fallback_secret_key", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const User = mongoose.model("User", userSchema);

// Project Schema
const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    contentType: {
      type: String,
      default: "Лайфстайл",
    },
    duration: {
      type: String,
      enum: ["short", "medium", "long", "extra_long"],
      default: "medium",
    },
    keyPoints: [String],
    script: {
      type: String,
      default: "",
    },
    audioFiles: [
      {
        filename: String,
        voiceId: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    quality: {
      score: Number,
      analysis: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["draft", "completed", "archived"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model("Project", projectSchema);

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access token required",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret_key"
    );
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "User not found or account deactivated",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired",
      });
    }

    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
};

// Usage tracking middleware
const trackUsage = (type) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);

      // Check usage limits based on subscription
      const limits = {
        free: { scriptsGenerated: 5, audioGenerated: 3 },
        pro: { scriptsGenerated: 50, audioGenerated: 30 },
        premium: { scriptsGenerated: -1, audioGenerated: -1 }, // unlimited
      };

      const userLimits = limits[user.subscription];

      // Reset usage if it's a new month
      const now = new Date();
      const lastReset = new Date(user.usage.lastReset);
      if (
        now.getMonth() !== lastReset.getMonth() ||
        now.getFullYear() !== lastReset.getFullYear()
      ) {
        user.usage = {
          scriptsGenerated: 0,
          audioGenerated: 0,
          lastReset: now,
        };
        await user.save();
      }

      // Check limits
      if (userLimits[type] !== -1 && user.usage[type] >= userLimits[type]) {
        return res.status(429).json({
          success: false,
          error: `Monthly ${type} limit reached. Upgrade your subscription for more.`,
          usage: user.usage,
          limits: userLimits,
        });
      }

      req.userLimits = userLimits;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Validation middleware
const validateRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

// Routes

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Tubify API is running",
    timestamp: new Date().toISOString(),
    services: {
      database:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      openai: !!process.env.OPENAI_API_KEY,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    },
  });
});

// Authentication Routes

// Register
app.post(
  "/api/auth/register",
  validateRegistration,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "An account with this email already exists",
        });
      }

      const user = new User({ name, email, password });
      await user.save();

      const token = user.generateAuthToken();

      res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            subscription: user.subscription,
            createdAt: user.createdAt,
          },
          token,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        error: "Server error during registration",
      });
    }
  }
);

// Login
app.post(
  "/api/auth/login",
  validateLogin,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password",
        });
      }

      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password",
        });
      }

      const token = user.generateAuthToken();

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            subscription: user.subscription,
            usage: user.usage,
          },
          token,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        error: "Server error during login",
      });
    }
  }
);

// Get current user
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          subscription: user.subscription,
          usage: user.usage,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching user data",
    });
  }
});

// Script Routes

// Generate key points
app.post("/api/script/key-points", authenticateToken, async (req, res) => {
  try {
    const { topic, contentType } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: "Topic is required",
      });
    }

    const result = await generateKeyPoints(topic, contentType || "Лайфстайл");

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Key points generation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate key points",
    });
  }
});

//   trackUsage("scriptsGenerated"),
// Generate script
app.post(
  "/api/script/generate",
  authenticateToken,
  async (req, res) => {
    try {
      const { topic, duration, keyPoints, contentType } = req.body;

      if (!topic) {
        return res.status(400).json({
          success: false,
          error: "Topic is required",
        });
      }

      const script = await generateScript(
        topic,
        duration,
        keyPoints || [],
        contentType || "Лайфстайл"
      );

      // Update user usage
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { "usage.scriptsGenerated": 1 },
      });

      res.json({
        success: true,
        data: { script },
      });
    } catch (error) {
      console.error("Script generation error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate script",
      });
    }
  }
);

// Improve script
app.post("/api/script/improve", authenticateToken, async (req, res) => {
  try {
    const { selectedText, improvementCommand, script } = req.body;

    if (!selectedText || !improvementCommand || !script) {
      return res.status(400).json({
        success: false,
        error:
          "Selected text, improvement command, and full script are required",
      });
    }

    const improvedText = await improveArticle(
      selectedText,
      improvementCommand,
      script
    );

    res.json({
      success: true,
      data: { improvedText },
    });
  } catch (error) {
    console.error("Script improvement error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to improve script",
    });
  }
});

// Analyze script quality
app.post("/api/script/quality", authenticateToken, async (req, res) => {
  try {
    const { script } = req.body;

    if (!script) {
      return res.status(400).json({
        success: false,
        error: "Script is required",
      });
    }

    const quality = await getScriptQuality(script);

    res.json({
      success: true,
      data: { quality },
    });
  } catch (error) {
    console.error("Script quality analysis error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze script quality",
    });
  }
});

// Extend script
app.post("/api/script/extend", authenticateToken, async (req, res) => {
  try {
    const { script, topic, contentType } = req.body;

    if (!script || !topic) {
      return res.status(400).json({
        success: false,
        error: "Script and topic are required",
      });
    }

    const extension = await extendScript(
      script,
      topic,
      contentType || "Лайфстайл"
    );

    res.json({
      success: true,
      data: { extension },
    });
  } catch (error) {
    console.error("Script extension error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to extend script",
    });
  }
});

// Audio Routes

// Get available voices
app.get("/api/audio/voices", authenticateToken, async (req, res) => {
  try {
    const voices = await getAvailableVoices();

    res.json({
      success: true,
      data: { voices },
    });
  } catch (error) {
    console.error("Get voices error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get available voices",
    });
  }
});

// Generate audio
app.post(
  "/api/audio/generate",
  authenticateToken,
  trackUsage("audioGenerated"),
  async (req, res) => {
    try {
      const { text, voiceId } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          error: "Text is required",
        });
      }

      const audioResult = await generateAudio(text, voiceId);

      // Update user usage
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { "usage.audioGenerated": 1 },
      });

      res.json({
        success: true,
        data: audioResult,
      });
    } catch (error) {
      console.error("Audio generation error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate audio",
      });
    }
  }
);

// Project Routes

// Create project
app.post("/api/projects", authenticateToken, async (req, res) => {
  try {
    const { title, topic, contentType, duration, keyPoints } = req.body;

    if (!title || !topic) {
      return res.status(400).json({
        success: false,
        error: "Title and topic are required",
      });
    }

    const project = new Project({
      userId: req.user._id,
      title,
      topic,
      contentType,
      duration,
      keyPoints,
    });

    await project.save();

    res.status(201).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create project",
    });
  }
});

// Get user projects
app.get("/api/projects", authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user._id }).sort({
      updatedAt: -1,
    });

    res.json({
      success: true,
      data: { projects },
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get projects",
    });
  }
});

// Update project
app.put("/api/projects/:id", authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    res.json({
      success: true,
      data: { project },
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update project",
    });
  }
});

// Delete project
app.delete("/api/projects/:id", authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete project",
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error:", error);

  res.status(error.status || 500).json({
    success: false,
    error: error.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Tubify API server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🌐 CORS enabled for: ${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }`
  );
  console.log(
    `🤖 AI Services: OpenAI=${!!process.env
      .OPENAI_API_KEY}, ElevenLabs=${!!process.env.ELEVENLABS_API_KEY}`
  );
});

module.exports = app;
