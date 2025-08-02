const {
  generateScript,
  generateKeyPoints,
  improveArticle,
  getScriptQuality,
  extendScript,
} = require("../services/openai");
const User = require("../models/User");

const getKeyPoints = async (req, res) => {
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
};

const generateScriptHandler = async (req, res) => {
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

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "usage.scriptsGenerated": 1 },
    });

    res.json({
      success: true,
      data: { script },
      usage: {
        used: req.user.usage.scriptsGenerated + 1,
        limit: req.user.getLimits().scriptsGenerated,
      },
    });
  } catch (error) {
    console.error("Script generation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate script",
    });
  }
};

const improveScript = async (req, res) => {
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
};

const getQuality = async (req, res) => {
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
};

const extendScriptHandler = async (req, res) => {
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
};

module.exports = {
  getKeyPoints,
  generateScriptHandler,
  improveScript,
  getQuality,
  extendScriptHandler,
};
