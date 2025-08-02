// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const helmet = require("helmet");
// const rateLimit = require("express-rate-limit");
// const morgan = require("morgan");
// const path = require("path");
// const fs = require("fs");
// require("dotenv").config();

// const app = express();

// const authRoutes = require("../routes/auth");
// const paymentsRoutes = require("../routes/payments");
// const scriptRoutes = require("../routes/script");
// const audioRoutes = require("../routes/audio");
// const thumbnailRoutes = require("../routes/thumbnails");
// const projectRoutes = require("../routes/projects");

// const corsOptions = {
//   origin: [
//     "http://localhost:3000",
//     "http://localhost:3001",
//     "https://tybify.vercel.app",
//     "https://tubehi.com",
//     "https://www.tubehi.com",
//     "https://app.tubehi.com",
//     "https://tubifyai.vercel.app",
//     "https://tubifyai-gqk6oa1l0-kigunodarks-projects.vercel.app",
//   ],
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: [
//     "Content-Type",
//     "Authorization",
//     "Accept",
//     "Origin",
//     "X-Requested-With",
//   ],
//   optionsSuccessStatus: 200,
//   preflightContinue: false,
// };

// app.set("trust proxy", 1);
// app.use(cors(corsOptions));

// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// app.use((req, res, next) => {
//   const allowedOrigins = [
//     "https://tybify.vercel.app",
//     "https://tubehi.com",
//     "https://www.tubehi.com",
//     "https://app.tubehi.com",
//     "http://localhost:3000",
//     "http://localhost:3001",
//   ];

//   const origin = req.headers.origin;
//   if (allowedOrigins.includes(origin)) {
//     res.header("Access-Control-Allow-Origin", origin);
//   }

//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   res.header("Access-Control-Allow-Credentials", "true");

//   if (req.method === "OPTIONS") {
//     res.sendStatus(200);
//   } else {
//     next();
//   }
// });

// if (process.env.NODE_ENV === "development" && !process.env.VERCEL) {
//   const dirs = ["uploads", "output"];
//   dirs.forEach((dir) => {
//     try {
//       if (!fs.existsSync(dir)) {
//         fs.mkdirSync(dir, { recursive: true });
//         console.log(`📁 Created directory: ${dir}`);
//       }
//     } catch (error) {
//       console.warn(`⚠️ Could not create directory ${dir}:`, error.message);
//     }
//   });
// }

// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         styleSrc: ["'self'", "'unsafe-inline'"],
//         scriptSrc: ["'self'"],
//         imgSrc: ["'self'", "data:", "https:"],
//       },
//     },
//     crossOriginEmbedderPolicy: false,
//   })
// );

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: {
//     success: false,
//     error: "Too many requests, please try again later.",
//   },
// });

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: {
//     success: false,
//     error: "Too many authentication attempts, please try again later.",
//   },
//   skipSuccessfulRequests: true,
// });

// const aiLimiter = rateLimit({
//   windowMs: 60 * 1000,
//   max: process.env.NODE_ENV === "development" ? 1000 : 20,
//   message: {
//     success: false,
//     error: "Too many AI requests, please slow down.",
//   },
// });

// app.use("/api/", limiter);
// app.use("/api/auth/login", authLimiter);
// app.use("/api/auth/register", authLimiter);
// app.use("/api/script/", aiLimiter);
// app.use("/api/audio/", aiLimiter);

// // Logging
// app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// // Static file serving for development
// if (process.env.NODE_ENV === "development" && !process.env.VERCEL) {
//   try {
//     app.use("/uploads", express.static(path.join(__dirname, "uploads")));
//     app.use("/output", express.static(path.join(__dirname, "output")));
//   } catch (error) {
//     console.warn("⚠️ Could not setup static file serving:", error.message);
//   }
// }

// // MongoDB connection
// mongoose.connect(
//   process.env.MONGODB_URI || "mongodb://localhost:27017/scriptify"
// );

// mongoose.connection.on("connected", () => {
//   console.log("✅ Connected to MongoDB");
// });

// mongoose.connection.on("error", (err) => {
//   console.error("❌ MongoDB connection error:", err.message);

//   if (err.message.includes("Atlas") || err.message.includes("SSL")) {
//     mongoose
//       .connect("mongodb://localhost:27017/scriptify")
//       .then(() => console.log("✅ Connected to local MongoDB"))
//       .catch(() => console.log("❌ Local MongoDB also failed"));
//   }
// });

// app.use("/api/auth", authRoutes);
// app.use("/api/payments", paymentsRoutes);
// app.use("/api/script", scriptRoutes);
// app.use("/api/audio", audioRoutes);
// app.use("/api/thumbnails", thumbnailRoutes);
// app.use("/api/projects", projectRoutes);

// app.get("/health", (req, res) => {
//   res.json({
//     success: true,
//     message: "Tubify API is running",
//     timestamp: new Date().toISOString(),
//     services: {
//       database:
//         mongoose.connection.readyState === 1 ? "connected" : "disconnected",
//       openai: !!process.env.OPENAI_API_KEY,
//       dalle: !!process.env.OPENAI_API_KEY,
//       stripe: !!process.env.STRIPE_SECRET_KEY,
//     },
//   });
// });

// // Global error handler
// app.use((error, req, res, next) => {
//   console.error("Global error:", error);

//   res.status(error.status || 500).json({
//     success: false,
//     error: error.message || "Internal server error",
//     ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
//   });
// });

// app.use(express.static(path.join(__dirname, "public")));

// app.get("*", (req, res) => {
//   if (req.path.startsWith("/api/")) {
//     return res.status(404).json({
//       success: false,
//       error: "API route not found",
//     });
//   }

//   res.json({
//     success: true,
//     message: "Tubify API is running",
//     timestamp: new Date().toISOString(),
//     frontend: "https://tybify.vercel.app",
//     documentation: "API endpoints available at /api/*",
//   });
// });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`🚀 Tubify API server running on port ${PORT}`);
//   console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
//   console.log(
//     `🌐 CORS enabled for: ${
//       process.env.FRONTEND_URL || "http://localhost:3000"
//     }`
//   );
//   console.log(
//     `🤖 AI Services: OpenAI=${!!process.env
//       .OPENAI_API_KEY}, ElevenLabs=${!!process.env.ELEVENLABS_API_KEY}`
//   );
// });

// module.exports = app;

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

const authRoutes = require("./routes/auth");
const paymentsRoutes = require("./routes/payments");
const scriptRoutes = require("./routes/script");
const audioRoutes = require("./routes/audio");
const thumbnailRoutes = require("./routes/thumbnails");
const projectRoutes = require("./routes/projects");

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://tybify.vercel.app",
    "https://tubehi.com",
    "https://www.tubehi.com",
    "https://app.tubehi.com",
    "https://tubifyai.vercel.app",
    "https://tubifyai-gqk6oa1l0-kigunodarks-projects.vercel.app",
    process.env.FRONTEND_URL,
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With",
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.set("trust proxy", 1);
app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((req, res, next) => {
  const allowedOrigins = [
    "https://tybify.vercel.app",
    "https://tubehi.com",
    "https://www.tubehi.com",
    "https://app.tubehi.com",
    "http://localhost:3000",
    "http://localhost:3001",
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  if (origin && origin.includes(".railway.app")) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

const dirs = ["uploads", "output", "temp"];
dirs.forEach((dir) => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  } catch (error) {
    console.warn(`⚠️ Could not create directory ${dir}:`, error.message);
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
  max: process.env.NODE_ENV === "production" ? 200 : 1000,
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: "Too many authentication attempts, please try again later.",
  },
  skipSuccessfulRequests: true,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 1000 : 50,
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

try {
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  app.use("/output", express.static(path.join(__dirname, "output")));
} catch (error) {
  console.warn("⚠️ Could not setup static file serving:", error.message);
}

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/scriptify",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      }
    );
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);

    if (
      process.env.NODE_ENV !== "production" &&
      !process.env.MONGODB_URI?.includes("localhost")
    ) {
      try {
        await mongoose.connect("mongodb://localhost:27017/scriptify");
        console.log("✅ Connected to local MongoDB");
      } catch (localError) {
        console.error("❌ Local MongoDB also failed:", localError.message);
      }
    }
  }
};

connectDB();

mongoose.connection.on("disconnected", () => {
  console.log("📡 MongoDB disconnected. Attempting to reconnect...");
  setTimeout(connectDB, 5000);
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB error:", err.message);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/script", scriptRoutes);
app.use("/api/audio", audioRoutes);
app.use("/api/thumbnails", thumbnailRoutes);
app.use("/api/projects", projectRoutes);

// Health check
app.get("/health", (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  res.json({
    success: true,
    message: "Tubihi API is running on Railway",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)} minutes`,
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
    },
    services: {
      database:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      openai: !!process.env.OPENAI_API_KEY,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      stripe: !!process.env.STRIPE_SECRET_KEY,
    },
    environment: process.env.NODE_ENV || "development",
    host: process.env.RAILWAY_STATIC_URL || "localhost",
  });
});

app.use((error, req, res, next) => {
  console.error("Global error:", error);

  if (process.env.NODE_ENV === "production") {
    console.error("Request details:", {
      method: req.method,
      url: req.url,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    });
  }

  res.status(error.status || 500).json({
    success: false,
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

app.use(express.static(path.join(__dirname, "public")));

// Catch-all handler
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      error: "API route not found",
    });
  }

  res.json({
    success: true,
    message: "Tubihi API is running on Railway",
    timestamp: new Date().toISOString(),
    frontend: process.env.FRONTEND_URL || "https://tybify.vercel.app",
    documentation: "API endpoints available at /api/*",
    host: process.env.RAILWAY_STATIC_URL || "localhost",
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Tubihi API server running on Railway port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`
  );
  console.log(
    `🤖 AI Services: OpenAI=${!!process.env
      .OPENAI_API_KEY}, ElevenLabs=${!!process.env.ELEVENLABS_API_KEY}`
  );
  console.log(
    `🚂 Railway Host: ${process.env.RAILWAY_STATIC_URL || "Not set"}`
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("💤 Process terminated");
    mongoose.connection.close();
  });
});

module.exports = app;
