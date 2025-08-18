const express = require('express');
const router = express.Router();
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const multer = require('multer');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB лимит
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|mp3|wav|m4a/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only media files are allowed'));
    }
  }
});

// Эндпоинт для загрузки файлов
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    console.log(`✅ File uploaded: ${req.file.filename}`);

    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      type: req.body.type
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Основной эндпоинт рендеринга

// Основной эндпоинт рендеринга
router.post('/', async (req, res) => {
  try {
    const { timeline } = req.body;
    console.log("📥 Received timeline:", timeline);
    
    if (!Array.isArray(timeline) || timeline.length === 0) {
      return res.status(400).json({ success: false, error: 'Timeline пуст' });
    }

    // ✅ УБИРАЕМ ПРОВЕРКУ BLOB URLs - фронтенд уже должен их загрузить
    console.log("✅ Processing timeline with server rendering");

    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const outputFile = path.join(outputDir, `render_${Date.now()}.mp4`);

    const mainVideo = timeline.find(t => t.type === 'videos');
    if (!mainVideo) {
      return res.status(400).json({ success: false, error: 'Нет видео дорожки' });
    }

    console.log("🎬 Creating FFmpeg command...");
    const command = ffmpeg();
    
    // ✅ ИСПРАВЛЯЕМ ПУТЬ К ФАЙЛУ
    let mainVideoPath;
    if (mainVideo.url.startsWith('/uploads/')) {
      // Локальный файл - строим абсолютный путь
      mainVideoPath = path.join(__dirname, '..', mainVideo.url);
      console.log(`📁 Local file path: ${mainVideoPath}`);
    } else {
      // HTTP URL - используем как есть
      mainVideoPath = mainVideo.url;
      console.log(`🌐 HTTP URL: ${mainVideoPath}`);
    }
    
    command.input(mainVideoPath);

    let filters = [];
    let filterIndex = 0;

    // Добавляем изображения
    timeline
      .filter(t => t.type === 'images')
      .forEach(img => {
        console.log(`📸 Adding image: ${img.url}`);
        
        let imagePath;
        if (img.url.startsWith('/uploads/')) {
          imagePath = path.join(__dirname, '..', img.url);
        } else {
          imagePath = img.url;
        }
        
        command.input(imagePath).inputOptions(['-loop 1', `-t ${img.duration}`]);
        filters.push({
          filter: 'overlay',
          options: {
            x: 0,
            y: 0,
            enable: `between(t,${img.startTime},${img.startTime + img.duration})`
          },
          inputs: filterIndex === 0 ? '0:v' : `overlayed${filterIndex - 1}`,
          outputs: `overlayed${filterIndex}`
        });
        filterIndex++;
      });

    // Добавляем аудио
    let audioInputs = [];
    timeline
      .filter(t => t.type === 'audios')
      .forEach(audio => {
        console.log(`🎵 Adding audio: ${audio.url}`);
        
        let audioPath;
        if (audio.url.startsWith('/uploads/')) {
          audioPath = path.join(__dirname, '..', audio.url);
        } else {
          audioPath = audio.url;
        }
        
        command.input(audioPath);
        audioInputs.push(`[${command._inputs.length - 1}:a]adelay=${Math.floor(audio.startTime * 1000)}|${Math.floor(audio.startTime * 1000)}[a${audioInputs.length}]`);
      });

    if (audioInputs.length > 0) {
      filters.push(audioInputs.join(';') + `;` + audioInputs.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${audioInputs.length}[mixed]`);
    }

    if (filters.length > 0) {
      command.complexFilter(filters, audioInputs.length > 0 ? ['finalVideo', 'mixed'] : ['finalVideo']);
    }

    command
      .outputOptions('-map', audioInputs.length > 0 ? '[finalVideo]' : '0:v')
      .outputOptions('-map', audioInputs.length > 0 ? '[mixed]' : '0:a?')
      .output(outputFile)
      .on('start', cmd => console.log('🎬 FFmpeg команда:', cmd))
      .on('progress', p => console.log(`⏳ Обработка: ${p.percent ? p.percent.toFixed(2) : '0'}%`))
      .on('end', () => {
        console.log('✅ Видео готово!');
        res.json({
          success: true,
          message: 'Видео собрано',
          url: `/output/${path.basename(outputFile)}`
        });
      })
      .on('error', err => {
        console.error('❌ Ошибка FFmpeg:', err);
        res.status(500).json({ success: false, error: err.message });
      })
      .run();

  } catch (error) {
    console.error('❌ Ошибка рендера:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;