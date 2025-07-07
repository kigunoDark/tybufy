// backend/routes/audio.js
const express = require('express');
const router = express.Router();
const { generateAudio } = require('../services/elevenlabs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { spawn } = require('child_process');

const UPLOAD_DIR = path.join(__dirname, '../uploads');
const OUTPUT_DIR = path.join(__dirname, '../output');

router.post('/generate', async (req, res) => {
  const { text, voice } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Нет текста для озвучки' });
  }

  try {
    const filePath = await generateAudio(text, voice);
    res.json({
      audioPath: filePath,
      downloadUrl: '/api/audio/download'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload-and-clean', async (req, res) => {
  const form = new multiparty.Form();
  let originalPath = null;

  form.on('part', async (part) => {
    if (!part.filename) return;

    originalPath = path.join(UPLOAD_DIR, part.filename);

    const writeStream = fs.createWriteStream(originalPath);
    part.pipe(writeStream);
  });

  form.on('close', async () => {
    const cleanedPath = path.join(OUTPUT_DIR, 'cleaned.mp3');

    try {
      // Шаг 1: Удаляем тишину через Silero VAD
      const vadProcess = spawn('python', ['scripts/remove_silence.py', originalPath, cleanedPath]);

      vadProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });

      vadProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      vadProcess.on('close', (code) => {
        if (code === 0) {
          res.json({
            success: true,
            downloadUrl: 'http://localhost:5000/output/cleaned.mp3',
          });
        } else {
          res.status(500).json({ error: 'Ошибка при обработке аудио' });
        }
      });
    } catch (err) {
      console.error('❌ Ошибка:', err.message);
      res.status(500).json({ error: 'Не удалось обработать аудио' });
    }
  });

  req.pipe(form);
});

// Маршрут для скачивания файла
router.get('/download', async (req, res) => {
  const filePath = path.join(__dirname, '../output/audio.mp3'); 

  try {
    await require('fs').promises.access(filePath);
    res.download(filePath);
  } catch {
    res.status(404).json({ error: 'Файл не найден' });
  }
});

module.exports = router;