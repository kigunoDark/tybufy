const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');

// Настройка multer для загрузки видео
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Папка для хранения видео
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage }).single('video');

router.post('/upload', async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const videoPath = req.file.path;
    const videoUrl = `http://localhost:5000/uploads/${req.file.filename}`; // URL для скачивания

    try {
      await fs.access(videoPath); // Проверяем, что файл существует
      res.json({ success: true, videoUrl });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Ошибка при доступе к файлу' });
    }
  });
});


module.exports = router;