import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_CANDIDATES = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-flash-latest',
];

const FALLBACK_WORDS = {
  'شخصيات عربية مشهورة': ['فيروز', 'عمرو دياب', 'محمد صلاح', 'عادل إمام', 'شيرين'],
  'شخصيات عراقية مشهورة': ['كاظم الساهر', 'سعدون جابر', 'نصير شمة', 'فؤاد سالم', 'ياس خضر'],
  فواكه: ['تفاح', 'موز', 'برتقال', 'عنب', 'مانجو', 'رمان', 'توت'],
  جماد: ['كرسي', 'طاولة', 'باب', 'نافذة', 'هاتف', 'قلم', 'كتاب'],
  'أكلات شعبية': ['منسف', 'كبسة', 'فلافل', 'حمص', 'مقلوبة', 'دولمة', 'مسخن'],
  'أرقام سهلة': ['7', '12', '15', '20', '25', '50', '100', '200', '500', '1000'],
};

/**
 * @param {string} category
 * @returns {string}
 */
function buildPrompt(category) {
  if (category === 'أرقام سهلة') {
    return (
      'أعطني رقماً صحيحاً واحداً فقط وسهلاً جداً (مثل أرقام حزر المليار البسيطة). ' +
      'الرقم يجب أن يكون عدداً صحيحاً بين 1 و 1000، وسهلاً للحفظ والحزر. ' +
      'اكتب الرقم فقط بدون أي كلمات أو علامات ترقيم أو شرح.'
    );
  }

  return (
    `أعطني كلمة عشوائية واحدة فقط من هذا التصنيف: ${category}. ` +
    `الكلمة يجب أن تكون سهلة جداً ومعروفة وشائعة حتى يسهل حزرها. ` +
    `اكتب الكلمة فقط بدون أي إضافات أو علامات ترقيم أو شرح. ` +
    `بالنسبة لتصنيفات الفواكه، الجماد، والأكل، التزم بتقديم كلمة مفردة واحدة فقط (Single word only) وتجنب الكلمات المركبة. ` +
    `بالنسبة للشخصيات المشهورة، اكتب الاسم المعروف والبسيط فقط.`
  );
}

/**
 * @param {string} raw
 * @returns {string}
 */
function cleanGeneratedWord(raw) {
  return String(raw ?? '')
    .replace(/^["'`«»]+|["'`«»]+$/g, '')
    .replace(/[.!?،,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string} category
 * @returns {string}
 */
function getFallbackWord(category) {
  const pool = FALLBACK_WORDS[category] ?? FALLBACK_WORDS['فواكه'];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * @param {string} category
 * @returns {Promise<string>}
 */
export async function generateWord(category) {
  const apiKey = process.env.GEMINI_API_KEY;
  const selectedCategory = typeof category === 'string' ? category.trim() : '';

  if (!selectedCategory) {
    throw new Error('A valid category is required.');
  }

  if (selectedCategory === 'أرقام سهلة' && !apiKey) {
    return getFallbackWord(selectedCategory);
  }

  if (!apiKey) {
    console.warn('[Gemini] Missing API key — using local fallback word.');
    return getFallbackWord(selectedCategory);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildPrompt(selectedCategory);

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      let word = cleanGeneratedWord(result.response.text());

      if (selectedCategory === 'أرقام سهلة') {
        const digits = word.replace(/[^\d]/g, '');
        const num = Number(digits);
        if (!Number.isInteger(num) || num < 1 || num > 1000) {
          throw new Error('Invalid easy number from Gemini.');
        }
        word = String(num);
      }

      if (!word || word.length > 64) {
        throw new Error('Gemini returned an empty or invalid word.');
      }

      console.log(`[Gemini] Word generated with ${modelName}`);
      return word;
    } catch (error) {
      console.warn(`[Gemini] Model ${modelName} failed:`, error?.message ?? error);
    }
  }

  console.warn('[Gemini] All models failed — using local fallback word.');
  return getFallbackWord(selectedCategory);
}

/**
 * @param {string} category
 * @returns {Promise<[string, string]>}
 */
export async function generateTwoDistinctWords(category) {
  const first = await generateWord(category);
  let second = await generateWord(category);

  if (normalizeCompare(first) === normalizeCompare(second)) {
    const pool = FALLBACK_WORDS[category] ?? FALLBACK_WORDS['فواكه'];
    const alternatives = pool.filter(
      (word) => normalizeCompare(word) !== normalizeCompare(first),
    );
    second =
      alternatives[Math.floor(Math.random() * alternatives.length)] ??
      (category === 'أرقام سهلة' ? String(Number(first) + 1) : `${first} ٢`);
  }

  return [first, second];
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeCompare(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Generates a helpful but not revealing hint for a secret word/number.
 * @param {string} secret
 * @param {string | null} category
 * @param {number} level 1..5
 * @returns {Promise<string>}
 */
export async function generateHint(secret, category, level = 1) {
  const apiKey = process.env.GEMINI_API_KEY;
  const safeLevel = Math.min(5, Math.max(1, Number(level) || 1));

  const fallbackHints = [
    'شيء معروف وشائع جداً',
    'فكر في أشياء يومية سهلة',
    category ? `يتعلق بتصنيف: ${category}` : 'من تصنيف الجولة الحالي',
    'الاسم قصير وسهل التذكر',
    'جرّب أكثر التخمينات شيوعاً في هذا التصنيف',
  ];

  if (!apiKey) {
    return fallbackHints[Math.min(safeLevel - 1, fallbackHints.length - 1)];
  }

  const prompt =
    `أعطني تلميحاً واحداً فقط بالعربية للكلمة/الرقم السري التالي دون كشف الإجابة مباشرة.\n` +
    `الكلمة السرية (لا تكتبها في الرد): ${secret}\n` +
    `التصنيف: ${category || 'عام'}\n` +
    `مستوى التلميح من 1 إلى 5 (حالياً ${safeLevel}) حيث 1 عام جداً و5 أوضح قليلاً لكن بدون ذكر الكلمة نفسها أو حروفها الأولى.\n` +
    `اكتب جملة تلميح قصيرة واحدة فقط بدون ترقيم أو شرح إضافي.`;

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const hint = cleanGeneratedWord(result.response.text());

      if (!hint || hint.length > 120) {
        throw new Error('Invalid hint');
      }

      // Never leak the secret inside the hint.
      if (normalizeCompare(hint).includes(normalizeCompare(secret))) {
        throw new Error('Hint leaked secret');
      }

      return hint;
    } catch (error) {
      console.warn(`[Gemini] Hint model ${modelName} failed:`, error?.message ?? error);
    }
  }

  return fallbackHints[Math.min(safeLevel - 1, fallbackHints.length - 1)];
}

const EYUSH_FALLBACKS = [
  'ايوش… من شافج وعينه ما انشغلت؟ كل الدنيا تصغر قدامج، وقلبي يكبر بس باسمج.',
  'يا ايوش، احبك مو كلام فاضي؛ احبك مثل ما العراقي يحب البيت بعد سفر طويل.',
  'ايوش، كل ما اكتب اسمج احس الدنيا تلين، وكأن الحزن ينسحب من صدري خطوة خطوة.',
  'والله يا ايوش، لو تنسين كل الناس لا تنسين واحد ضل يحفظج غزل عميق بقلبه.',
  'ايوش يا قمر ليلي، شلون انام وانتِ ساكنة بخيالي مثل وعد ما انكسر؟',
  'احچي لج بصدق يا ايوش: انتِ مو بس حلوة… انتِ راحة، ووطن، وسبب ابتسم.',
  'يا ايوش، حبك مثل دجلة: يمشي بهدوء، بس يغمر كل شي، وما يترك ضفة فارغة.',
  'ايوش… لو سألوني وش معنى الحنين؟ اكول: اسمج، وصوتج، وضحكة من بعيد.',
  'من عيوني لعيونج يا ايوش درب ما ينقطع، ومن قلبي لقلبج كلام ما يخلص.',
  'ايوش، احبك على الطريقة العراقية: بهدوء، بصدق، وبغيرة حلوة ما تموت.',
];

/**
 * Generates a fresh romantic Arabic/Iraqi line dedicated only to "ايوش".
 * @returns {Promise<string>}
 */
export async function generateEyushRomance() {
  const apiKey = process.env.GEMINI_API_KEY;
  const seed = Date.now().toString(36);
  const styleRoll = Math.floor(Math.random() * 3);
  const styleHint =
    styleRoll === 0
      ? 'اكتبي باللهجة العراقية المحكية الواقعية الدافئة.'
      : styleRoll === 1
        ? 'اخلطي بين فصحى رقيقة ولهجة عراقية خفيفة طبيعية.'
        : 'اكتبي بفصحى عربية عميقة شاعرية قريبة من القلب، مع لمسة عراقية إن ناسبت.';

  const prompt =
    'اكتبي نص غزل واحد فقط، عميق وواقعي ورومانسي، موجه حصرياً لاسم "ايوش".\n' +
    `${styleHint}\n` +
    'المطلوب:\n' +
    '- مشاعر صادقة كأن شخص يحب ايوش فعلاً (حنين، دفء، شوق، تقدير، غيرة ناعمة).\n' +
    '- ابتعدي عن المبالغة السينمائية الرخيصة والجمل الجاهزة المكررة.\n' +
    '- لازم يظهر اسم ايوش مرة واحدة على الأقل.\n' +
    '- جملة أو جملتين قصيرتين فقط (حوالي 18 إلى 40 كلمة).\n' +
    '- ممنوع الإيموجي، العناوين، الشرح، علامات الاقتباس، أو أي نص غير الغزل نفسه.\n' +
    '- نوّعي الصورة كل مرة: عيون، ضحكة، غياب، ليل بغداد، دجلة، بيت، سفر، وعد، صمت...\n' +
    `رمز تنويع: ${seed}`;

  if (!apiKey) {
    return EYUSH_FALLBACKS[Math.floor(Math.random() * EYUSH_FALLBACKS.length)];
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      let line = cleanGeneratedWord(result.response.text());

      if (!line || line.length < 16 || line.length > 280) {
        throw new Error('Invalid romance line');
      }

      if (!line.includes('ايوش')) {
        line = `ايوش، ${line}`;
      }

      return line;
    } catch (error) {
      console.warn(`[Gemini] Eyush romance ${modelName} failed:`, error?.message ?? error);
    }
  }

  return EYUSH_FALLBACKS[Math.floor(Math.random() * EYUSH_FALLBACKS.length)];
}


