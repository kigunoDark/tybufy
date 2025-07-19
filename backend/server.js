const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const sharp = require("sharp");
const {
  generateThumbnails,
  createThumbnailPrompt,
  analyzeReferenceImage,
} = require("./services/dalle");

const app = express();

const {
  generateScript,
  generateKeyPoints,
  improveArticle,
  getScriptQuality,
  extendScript,
} = require("./services/openai");
const { generateAudio, getAvailableVoices } = require("./services/elevenlabs");

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
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 3,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

const thumbnailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 1000 : 50,
  message: {
    success: false,
    error: "Too many thumbnail generation requests, please wait a minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,

  skip: (req) => {
    return process.env.NODE_ENV === "development" && req.ip === "::1";
  },
});

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
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    console.log("🔄 CORS preflight request:", req.path);
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", (req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`);
  if (req.path.includes("/thumbnails/")) {
    console.log("📋 Content-Type:", req.get("Content-Type"));
    console.log("📦 Body present:", !!req.body);
    console.log("📦 Body keys:", req.body ? Object.keys(req.body) : "none");
  }
  next();
});

app.options("*", cors(corsOptions));

const trackThumbnailUsage = async (req, res, next) => {
  try {
    if (req.method === "OPTIONS") {
      console.log("🔄 Skipping OPTIONS request in trackThumbnailUsage");
      return next();
    }

    if (!req.body) {
      console.log("⚠️ req.body is undefined in trackThumbnailUsage");
      return next();
    }

    const user = await User.findById(req.user._id);

    const limits = {
      free: { thumbnailsGenerated: 100000000 },
      pro: { thumbnailsGenerated: 500000000 },
      premium: { thumbnailsGenerated: -1 },
    };

    
    const userLimits = limits[user.subscription];
    if (
      userLimits.thumbnailsGenerated !== -1 &&
      (user.usage.thumbnailsGenerated || 0) >= userLimits.thumbnailsGenerated
    ) {
      return res.status(429).json({
        success: false,
        error: `Monthly thumbnail generation limit reached. Upgrade your subscription for more.`,
        usage: user.usage,
        limits: userLimits,
      });
    }

    req.userLimits = userLimits;
    next();
  } catch (error) {
    console.error("trackThumbnailUsage error:", error);
    next(error);
  }
};

app.post(
  "/api/thumbnails/clear-rate-limit",
  authenticateToken,
  async (req, res) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({
        success: false,
        error: "Only available in development mode",
      });
    }

    res.json({
      success: true,
      message: "Rate limit cleared for development",
    });
  }
);

app.post(
  "/api/thumbnails/generate",
  authenticateToken,
  thumbnailLimiter,
  trackThumbnailUsage,
  async (req, res) => {
    try {
      if (!req.body) {
        console.error("❌ req.body is undefined");
        return res.status(400).json({
          success: false,
          error:
            "Request body is missing. Please ensure you're sending JSON data with proper Content-Type header.",
          debug: {
            method: req.method,
            contentType: req.get("Content-Type"),
            hasBody: !!req.body,
          },
        });
      }

      const {
        mode,
        style,
        text,
        description,
        objectCount,
        referenceImageAnalysis,
      } = req.body;

      console.log("🎨 Thumbnail generation request:", {
        mode,
        style,
        text,
        objectCount,
        hasDescription: !!description,
        hasReferenceAnalysis: !!referenceImageAnalysis,
      });

      if (!mode) {
        return res.status(400).json({
          success: false,
          error: "Mode is required (styles or custom)",
        });
      }

      if (mode === "styles" && !style) {
        return res.status(400).json({
          success: false,
          error: "Style is required for styles mode",
        });
      }

      if (mode === "custom" && !description && !referenceImageAnalysis) {
        return res.status(400).json({
          success: false,
          error:
            "Description or reference image analysis is required for custom mode",
        });
      }

      const settings = {
        style,
        text,
        description,
        objectImages: Array(objectCount || 0).fill(null),
      };

      if (referenceImageAnalysis && mode === "custom") {
        settings.description = `${
          description || ""
        } Style reference: ${referenceImageAnalysis}`.trim();
      }

      const prompt = createThumbnailPrompt(settings, mode);
      console.log("📝 Generated prompt:", prompt.substring(0, 150) + "...");

      const thumbnails = await generateThumbnails(prompt, 5);

      if (thumbnails.length === 0) {
        return res.status(500).json({
          success: false,
          error: "Failed to generate any thumbnails. Please try again.",
        });
      }

      await User.findByIdAndUpdate(req.user._id, {
        $inc: { "usage.thumbnailsGenerated": 1 },
      });

      console.log(`✅ Successfully generated ${thumbnails.length} thumbnails`);

      res.json({
        success: true,
        message: `Generated ${thumbnails.length} thumbnail variants`,
        data: {
          thumbnails,
          prompt: prompt.substring(0, 200) + "...",
          settings: {
            mode,
            style,
            text,
            objectCount,
          },
        },
      });
    } catch (error) {
      console.error("❌ Thumbnail generation error:", error);

      if (
        error.message.includes("Rate limit") ||
        error.message.includes("rate limit")
      ) {
        return res.status(429).json({
          success: false,
          error:
            "AI service is currently busy. Please try again in a few minutes.",
        });
      }

      if (error.message.includes("Invalid prompt")) {
        return res.status(400).json({
          success: false,
          error:
            "The description contains inappropriate content or invalid parameters. Please try a different description.",
        });
      }

      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate thumbnails",
        debug:
          process.env.NODE_ENV === "development"
            ? {
                stack: error.stack,
                body: req.body,
                headers: req.headers,
              }
            : undefined,
      });
    }
  }
);

app.post(
  "/api/thumbnails/analyze-image",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No image file provided",
        });
      }

      const base64Image = req.file.buffer.toString("base64");
      const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

      const analysis = await analyzeReferenceImage(imageUrl);

      res.json({
        success: true,
        data: {
          analysis,
          imageInfo: {
            filename: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype,
          },
        },
      });
    } catch (error) {
      console.error("Image analysis error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to analyze image",
      });
    }
  }
);

app.get("/api/thumbnails/stats", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("usage subscription");

    const limits = {
      free: { thumbnailsGenerated: 10 },
      pro: { thumbnailsGenerated: 100 },
      premium: { thumbnailsGenerated: -1 },
    };

    const userLimits = limits[user.subscription];
    const used = user.usage.thumbnailsGenerated || 0;

    res.json({
      success: true,
      data: {
        subscription: user.subscription,
        used: used,
        limit: userLimits.thumbnailsGenerated,
        remaining:
          userLimits.thumbnailsGenerated === -1
            ? -1
            : Math.max(0, userLimits.thumbnailsGenerated - used),
        unlimited: userLimits.thumbnailsGenerated === -1,
      },
    });
  } catch (error) {
    console.error("Get thumbnail stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get thumbnail statistics",
    });
  }
});

app.post(
  "/api/thumbnails/process-objects",
  authenticateToken,
  upload.array("objects", 3),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No object images provided",
        });
      }

      console.log(`📷 Processing ${req.files.length} object images...`);

      const processedObjects = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];

        try {
          const optimizedBuffer = await sharp(file.buffer)
            .resize(512, 512, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();

          const base64 = optimizedBuffer.toString("base64");
          const dataUrl = `data:image/jpeg;base64,${base64}`;

          processedObjects.push({
            id: Date.now() + i,
            originalName: file.originalname,
            size: optimizedBuffer.length,
            dataUrl: dataUrl,
            optimized: true,
          });
        } catch (error) {
          console.error(`Error processing object ${i + 1}:`, error);
          continue;
        }
      }

      res.json({
        success: true,
        data: {
          objects: processedObjects,
          processed: processedObjects.length,
          total: req.files.length,
        },
      });
    } catch (error) {
      console.error("Object processing error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to process object images",
      });
    }
  }
);

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

app.get("/api/thumbnails/status", authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Thumbnail API is working",
      timestamp: new Date().toISOString(),
      user: {
        id: req.user._id,
        email: req.user.email,
        subscription: req.user.subscription,
      },
      services: {
        dalle: !!process.env.OPENAI_API_KEY,
        mongodb: mongoose.connection.readyState === 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

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
      dalle: !!process.env.OPENAI_API_KEY,
    },
    middleware: {
      bodyParser: "configured",
      cors: "enabled",
      helmet: "enabled",
    },
  });
});

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

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/output", express.static(path.join(__dirname, "output")));

// MongoDB connection
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/scriptify"
);

mongoose.connection.on("connected", () => {
  console.log("✅ Connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err.message);

  // Fallback to local MongoDB if Atlas fails
  if (err.message.includes("Atlas") || err.message.includes("SSL")) {
    console.log("🔄 Trying fallback to local MongoDB...");
    mongoose
      .connect("mongodb://localhost:27017/scriptify")
      .then(() => console.log("✅ Connected to local MongoDB"))
      .catch(() => console.log("❌ Local MongoDB also failed"));
  }
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
      thumbnailsGenerated: { type: Number, default: 0 }, // НОВОЕ ПОЛЕ
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

// Usage tracking middleware
const trackUsage = (type) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);

      const limits = {
        free: {
          scriptsGenerated: 5,
          audioGenerated: 3,
          thumbnailsGenerated: 10, // НОВЫЙ ЛИМИТ
        },
        pro: {
          scriptsGenerated: 50,
          audioGenerated: 30,
          thumbnailsGenerated: 100, // НОВЫЙ ЛИМИТ
        },
        premium: {
          scriptsGenerated: -1,
          audioGenerated: -1,
          thumbnailsGenerated: -1, // НОВЫЙ ЛИМИТ (unlimited)
        },
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
      dalle: !!process.env.OPENAI_API_KEY, // НОВЫЙ СЕРВИС
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
    const { topic, contentType, language } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: "Topic is required",
      });
    }

    const result = await generateKeyPoints(
      topic,
      contentType || "Lifestyle",
      language
    );

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
app.post("/api/script/generate", authenticateToken, async (req, res) => {
  try {
    const { topic, duration, keyPoints, contentType, language } = req.body;

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
      contentType || "Лайфстайл",
      language
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
});

// Improve script
app.post("/api/script/improve", authenticateToken, async (req, res) => {
  try {
    const { selectedText, improvementCommand, script, language } = req.body;

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
      script,
      language
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
    const { script, language } = req.body;

    if (!script) {
      return res.status(400).json({
        success: false,
        error: "Script is required",
      });
    }

    const quality = await getScriptQuality(script, language);

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
    const { script, topic, contentType, language } = req.body;

    if (!script || !topic) {
      return res.status(400).json({
        success: false,
        error: "Script and topic are required",
      });
    }

    const extension = await extendScript(
      script,
      topic,
      contentType || "Лайфстайл",
      language
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
