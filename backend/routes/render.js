const express = require('express');
const router = express.Router();
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

router.post('/', async (req, res) => {
  try {
    const { timeline } = req.body;
    if (!Array.isArray(timeline) || timeline.length === 0) {
      return res.status(400).json({ success: false, error: 'Timeline пуст' });
    }

    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const outputFile = path.join(outputDir, `render_${Date.now()}.mp4`);

    const mainVideo = timeline.find(t => t.type === 'videos');
    if (!mainVideo) {
      return res.status(400).json({ success: false, error: 'Нет видео дорожки' });
    }

    const command = ffmpeg();
    command.input(mainVideo.url);

    let filters = [];
    let filterIndex = 0;

    timeline
      .filter(t => t.type === 'images')
      .forEach(img => {
        command.input(img.url).inputOptions(['-loop 1', `-t ${img.duration}`]);
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

    let audioInputs = [];
    timeline
      .filter(t => t.type === 'audios')
      .forEach(audio => {
        command.input(audio.url);
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
      .on('start', cmd => console.log('FFmpeg команда:', cmd))
      .on('progress', p => console.log(`Обработка: ${p.percent.toFixed(2)}%`))
      .on('end', () => {
        res.json({
          success: true,
          message: 'Видео собрано',
          url: `/output/${path.basename(outputFile)}`
        });
      })
      .on('error', err => {
        console.error('Ошибка FFmpeg:', err);
        res.status(500).json({ success: false, error: err.message });
      })
      .run();

  } catch (error) {
    console.error('Ошибка рендера:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
