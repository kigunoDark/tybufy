const axios = require("axios");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function generateScript(
  topic,
  duration = "medium",
  keyPoints = [],
  contentType = "Лайфстайл",
  language = "eng"
) {
  let wordCount = 800;
  let detailLevel = "подробный";
  let durationInMinutes = 5;

  switch (duration) {
    case "short":
      wordCount = 500;
      detailLevel = "краткий";
      durationInMinutes = 5;
      break;
    case "medium":
      wordCount = 1000;
      detailLevel = "хорошо структурированный";
      durationInMinutes = 10;
      break;
    case "long":
      wordCount = 1800;
      detailLevel = "подробный и развернутый";
      durationInMinutes = 15;
      break;
    case "extra_long":
      wordCount = 3300;
      detailLevel = "очень подробный и детализированный";
      durationInMinutes = 20;
      break;
    default:
      break;
  }

  const prompt = `
  Создайте профессиональный видеосценарий на тему: "${topic}"
  Создайте сценарий длиной **не менее ${wordCount} слов**. Не завершайте текст, пока не будет достигнуто это количество слов. При необходимости — добавьте примеры, советы, дополнительные детали.
  Стиль текста ${detailLevel}
  Тип контента: ${contentType}
  Целевая аудитория: молодежь, новички, интересующиеся темой
  Ориентировочная длительность видео: ~${durationInMinutes} минут

  ### Структура сценария:
  1. **Вступление** – зацепите зрителя вопросом, фактом или интригой
  2. Ответ должен быть чистым текстом без markdown разметки (без **жирного шрифта**, # хэштегов, списков 1., 2.)
  3. **Основные пункты** – ${keyPoints.length} ключевых моментов:
     ${keyPoints.map((point, i) => `${i + 1}. ${point}`).join("\n     ")}
  4. **Практические советы / Интересные детали**
  5. **Заключение** – призыв к действию 
  6. Сделай его живым, интересным и информативным
  7. Добавь эмоциональные интонации и драматизм, подходящие для обзора такой масштабной игры

  ### Требования:
  - Тон: Профессиональный, но доступный
  - Добавьте эмоциональную окраску, чтобы удержать внимание
  - Используйте простые слова, избегайте жаргона

  Ответьте на выбранном языке: ${language}
`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: Math.round(wordCount * 1.5),
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Ошибка при генерации сценария:", error.message);
    throw new Error("Не удалось сгенерировать сценарий");
  }
}
async function generateKeyPoints(topic, contentType, language = "eng") {
  const prompt = `
    Сгенерируй список из 10 ключевых пунктов по теме: "${topic}"
    Тип контента: ${contentType}

    Формат:
    - Массив строк
    - Каждый пункт должен быть коротким и информативным
    - Без лишнего текста
      Ответьте на выбранном языке: ${language}
  `;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let rawText = response.data.choices[0].message.content.trim();
    let points = [];

    try {
      points = JSON.parse(rawText);
    } catch {
      points = rawText
        .split("\n")
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
        .filter((line) => line.length > 0);
    }

    return { points };
  } catch (error) {
    console.error("Ошибка при генерации сценария:", error.message);
    throw new Error("Не удалось сгенерировать сценарий");
  }
}

async function improveArticle(
  selectedText,
  improvementCommand,
  script,
  language = "eng"
) {
  const prompt = `
  Вы — профессиональный редактор YouTube-сценариев. Получите полный текст сценария и выделенный фрагмент, который нужно улучшить.

  ### Полный текст сценария:
  ${script}

  ### Выделенный фрагмент:
  ${selectedText}

  ### Команда улучшения:
  ${improvementCommand}

  ### Задача:
  - Улучшите **только выделенный фрагмент**, сохраняя **контекст и логическую связь** с окружающим текстом.
  - Сохраняйте естественный устный стиль, характерный для YouTube-обзоров.
  - Не используйте разметку (без заголовков, списков, выделений).
  - Следуйте тону оригинала: информативный, но живой и захватывающий.
  - Добавьте детали, если команда требует этого (например, "Сделать более подробным").
  - Упростите формулировки, если требуется ("Упростить объяснение").
  - Используйте эмоциональные слова, если нужно сделать текст ярче ("Сделать более эмоциональным").
  - Добавьте конкретику, если выбрано "Добавить примеры".
  - Если выбрано "Добавить статистику" — добавь реалистичные данные, соответствующие теме.
  - При "Улучшить структуру" — переформулируй так, чтобы он логично вписался в сценарий.

  Верните **только улучшенную версию выделенного фрагмента**, без пояснений и лишних слов.
  Ответьте на выбранном языке: ${language}
  `;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Ошибка при генерации сценария:", error.message);
    throw new Error("Не удалось сгенерировать сценарий");
  }
}

async function getScriptQuality(script, language = "eng") {
  const prompt = `
Ты — эксперт по YouTube-сценариям. Проанализируй следующий текст и верни результат в формате JSON.

### Сценарий:
${script}

### Задача:
Оцени каждый из этих критериев по шкале от 1 до 10:
- structure: логичность вступления, основной части, завершения
- engagement: наличие вопросов, эмоциональных слов, CTA
- video_duration: примерная продолжительность видео в минутах
- readability: уровень сложности, длина предложений
- emotional_tone: яркость, эмоциональная окраска
- clarity: точность формулировок, отсутствие воды
- seo_optimization: наличие ключевых слов, SEO-структура
- rhythm: подходит ли текст для произнесения вслух
- repetition: насколько часто встречаются повторяющиеся фразы или абзацы

ВАЖНО: если в сценарии есть **повторяющиеся фразы, идеи или целые абзацы**, как будто они скопированы или вставлены несколько раз подряд:
- автоматически снижай показатель "clarity"
- резко снижай "total_score"
- обязательно добавь рекомендацию об удалении/переписывании повторов

Примеры проблемного текста:
- "Дополнительный контент по теме... Развиваем идеи дальше..." (повторилось 5+ раз)
- Одинаковые предложения или абзацы подряд
- Постоянное повторение одной и той же мысли без развития

После этого:
- total_score: общая оценка от 1 до 10
- recommendations: массив из 3 рекомендаций по улучшению

 Ответьте на выбранном языке: ${language}
### Формат вывода:
{
  "structure": 9,
  "video_duration": 20,
  "engagement": 8,
  "readability": 7,
  "emotional_tone": 9,
  "clarity": 8,
  "seo_optimization": 8,
  "rhythm": 9,
  "repetition": 9,
  "total_score": 8.5,
  "recommendations": [
    "Добавьте больше восклицательных знаков в начало видео",
    "Упростите одно сложное предложение в середине сценария",
    "Включите ещё один CTA в заключение"
  ]
}
`;
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.choices[0].message.content;
}

async function extendScript(
  script,
  topic,
  contentType = "Лайфстайл",
  language = "eng"
) {
  const prompt = `
Вы — профессиональный видеоредактор YouTube-каналов. Ваша задача — естественно продолжить сценарий видео, дополнив его **тремя новыми логичными абзацами**, которые плавно вытекают из уже написанной части.

### Контекст:
Тема видео: ${topic}
Тип контента: ${contentType}
Существующий сценарий:
${script}

### Задача:
1. Определите стиль и структуру текущего сценария.
2. Продолжите текст **на три абзаца**, сохраняя тон, ритм и формат оригинала.
3. Добавьте новые идеи, примеры или углубление темы (но не повторяйте то, что уже есть).
4. Если это обучающий контент — добавьте советы/шаги/примеры.
   Если это обзор — добавьте детали/сравнение/персональное мнение.
5. Сохраняйте естественную устную речь, характерную для YouTube.
6. Не используйте заголовки, списки или разметку.
7. Убедитесь, что продолжение логично вписывается в общий контекст.

Верните только **продолжение сценария**, без объяснений и лишних слов.
  Ответьте на выбранном языке: ${language}
`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Ошибка при расширении скрипта:", error.message);
    throw new Error("Не удалось расширить сценарий");
  }
}

module.exports = {
  generateScript,
  generateKeyPoints,
  improveArticle,
  getScriptQuality,
  extendScript,
};
