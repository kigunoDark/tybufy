// backend/routes/script.js
const express = require("express");
const router = express.Router();
const {
  generateScript,
  generateKeyPoints,
  improveArticle,
  getScriptQuality ,
  extendScript,
} = require("../services/openai");

router.post("/generate", async (req, res) => {
  const { topic, duration, keyPoints, contentType } = req.body;
  if (!topic && !duration && !keyPoints && !contentType) {
    return res.status(400).json({ error: "Введите все необходимые данные" });
  }

  try {
    const script = await generateScript(
      topic,
      duration,
      keyPoints,
      contentType
    );

    res.json({ script });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/generateKeyPoints", async (req, res) => {
  const { topic, contentType } = req.body;
  if (!topic && !contentType) {
    return res.status(400).json({ error: "Введите все необходимые данные" });
  }

  try {
    const script = await generateKeyPoints(topic, contentType);
    res.json({ keyPoints: script });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/generateBetterArticle", async (req, res) => {
  const { selectedText, aiPrompt, script } = req.body;

  if (!selectedText && !aiPrompt && !script) {
    return res.status(400).json({ error: "Введите все необходимые данные" });
  }

  try {
    const newScript = await improveArticle(selectedText, aiPrompt, script);

    res.json(newScript);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/assessment", async (req, res) => {
  const { script } = req.body;

  if (!script) {
    return res.status(400).json({ error: "Введите все необходимые данные" });
  }

  try {
    const assessment = await getScriptQuality(script);

    res.json(assessment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/extend", async (req, res) => {
  const { script, topic, contentType } = req.body;

  if (!script && !topic && !contentType) {
    return res.status(400).json({ error: "Введите все необходимые данные" });
  }

  try {
    const newArticles = await extendScript(script, topic, contentType);

    res.json(newArticles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
