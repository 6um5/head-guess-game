import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_CANDIDATES = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-flash-latest',
];

/** Everyday, widely known words — variety without difficulty. */
const FALLBACK_WORDS = {
  'شخصيات عربية مشهورة': [
    'فيروز', 'عمرو دياب', 'محمد صلاح', 'عادل إمام', 'شيرين', 'أم كلثوم',
    'عبد الحليم', 'نانسي عجرم', 'تامر حسني', 'محمد عبده', 'راشد الماجد',
    'إليسا', 'وائل كفوري', 'نجوى كرم', 'أحمد حلمي', 'محمد هنيدي',
    'ياسمين عبد العزيز', 'دنيا سمير غانم', 'محمد رمضان', 'رياض محرز',
    'أشرف حكيمي', 'ياسين بونو', 'نوال الزغبي', 'راغب علامة', 'أحلام',
    'حسين الجسمي', 'عمر الشريف', 'محمد سعد', 'أصالة', 'كريم عبد العزيز',
  ],
  'شخصيات عراقية مشهورة': [
    'كاظم الساهر', 'سعدون جابر', 'نصير شمة', 'فؤاد سالم', 'ياس خضر',
    'حاتم العراقي', 'رحمة رياض', 'علي جاسم', 'محمد السالم', 'سيف نبيل',
    'نور الزين', 'حسام الرسام', 'ماجد المهندس', 'يونس محمود', 'علي عدنان',
    'أحمد راضي', 'مهند علي', 'أيمن حسين', 'إلهام المدفعي', 'الجواهري',
    'بدر شاكر السياب', 'مظفر النواب', 'سعدي الحلي', 'رياض أحمد', 'قصي حاتم',
  ],
  فواكه: [
    'تفاح', 'موز', 'برتقال', 'عنب', 'مانجو', 'رمان', 'توت', 'فراولة',
    'بطيخ', 'شمام', 'خوخ', 'مشمش', 'تين', 'كيوي', 'أناناس', 'جوافة',
    'ليمون', 'كرز', 'تمر', 'برقوق', 'يوسفي', 'كمثرى', 'أفوكادو',
    'جوز الهند', 'بلح', 'صبار', 'دراق', 'زيتون', 'قشطة', 'نارنج',
  ],
  جماد: [
    'كرسي', 'طاولة', 'باب', 'نافذة', 'هاتف', 'قلم', 'كتاب', 'ساعة',
    'مفتاح', 'مرآة', 'سرير', 'خزانة', 'ثلاجة', 'تلفاز', 'مروحة', 'مصباح',
    'سجادة', 'وسادة', 'ملعقة', 'سكين', 'صحن', 'كوب', 'حقيبة', 'حذاء',
    'نظارة', 'مقص', 'فرشاة', 'مكنسة', 'غسالة', 'مكيف', 'سلم', 'مطرقة',
    'دفتر', 'ممحاة', 'مسطرة', 'محفظة', 'مظلة', 'صابون', 'شمعة', 'بطانية',
    'مفرش', 'إبريق', 'طنجرة', 'سماعة', 'شاحن', 'كاميرا', 'دراجة', 'مقلاة',
    'ستارة', 'جرس', 'ميزان', 'قفل', 'علبة', 'منشفة', 'مكتب', 'مزهرية',
  ],
  'أكلات شعبية': [
    'منسف', 'كبسة', 'فلافل', 'حمص', 'مقلوبة', 'دولمة', 'تبولة',
    'شاورما', 'كباب', 'برياني', 'مسكوف', 'تشريب', 'باچة', 'كبة',
    'مندي', 'ملوخية', 'كشري', 'فتة', 'شيش طاووق', 'سمبوسة',
    'كنافة', 'بقلاوة', 'زلابية', 'قوزي', 'بامية', 'فتوش',
    'شوربة عدس', 'محشي', 'بيتزا', 'برغر', 'مكرونة', 'رز بحليب',
    'مسخن', 'شكشوكة', 'كفتة', 'صيادية', 'هريسة', 'معمول', 'لقيمات',
  ],
  'أرقام سهلة': [
    '3', '5', '7', '9', '11', '12', '13', '15', '17', '18', '20', '21',
    '24', '25', '27', '30', '33', '35', '40', '45', '50', '55', '60', '64',
    '70', '75', '77', '80', '88', '90', '99', '100', '111', '120', '150',
    '180', '200', '250', '300', '365', '400', '500', '600', '700', '750',
    '800', '900', '999', '1000',
  ],
};

const MAX_AVOID_IN_PROMPT = 40;

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeCompare(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ');
}

/**
 * @param {string[]} avoid
 * @returns {Set<string>}
 */
function toAvoidSet(avoid) {
  return new Set((Array.isArray(avoid) ? avoid : []).map(normalizeCompare));
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }

  return previous[b.length];
}

/**
 * Fixes near-miss spellings such as "أنناس" by snapping to the
 * canonical form when the word is clearly a known one.
 *
 * @param {string} word
 * @param {string} category
 * @returns {string}
 */
function snapToKnownWord(word, category) {
  const pool = FALLBACK_WORDS[category];
  if (!pool) return word;

  const target = normalizeCompare(word).replace(/\s+/g, '');
  if (target.length < 4) return word;

  for (const candidate of pool) {
    const normalized = normalizeCompare(candidate).replace(/\s+/g, '');
    if (normalized === target) return candidate;
    if (
      Math.abs(normalized.length - target.length) <= 1 &&
      editDistance(normalized, target) === 1
    ) {
      return candidate;
    }
  }

  return word;
}

/**
 * @returns {string}
 */
function makeSeed() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * The shared quality bar for every generated secret word.
 * @param {string} category
 * @returns {string}
 */
function qualityRules(category) {
  return (
    'معايير الاختيار:\n' +
    '- يعرفها أي شخص عادي فوراً بدون تفكير طويل.\n' +
    '- جميلة وممتعة بالحزر، وفيها شخصية — مو أول كلمة مملة تخطر بالبال.\n' +
    '- ممنوع: النادر، القديم، التخصصي، والأسماء التي ما يعرفها عامة الناس.\n' +
    '- تأكد أن الكلمة صحيحة إملائياً وموجودة فعلاً ضمن هذا التصنيف بالذات.\n' +
    (category === 'فواكه' || category === 'جماد' || category === 'أكلات شعبية'
      ? '- كلمة مفردة واحدة قصيرة وشائعة.\n'
      : '- الاسم المتداول المختصر الذي يعرفه الجميع.\n')
  );
}

/**
 * @param {string[]} avoid
 * @returns {string}
 */
function buildAvoidLine(avoid) {
  const recent = avoid.slice(-MAX_AVOID_IN_PROMPT);
  return recent.length
    ? `ممنوع منعاً باتاً تكرار أي كلمة من هذه (استُعملت سابقاً): ${recent.join('، ')}.\n`
    : '';
}

/**
 * One call that picks both secrets at once, so the pair is
 * deliberately different instead of two unrelated guesses.
 *
 * @param {string} category
 * @param {string[]} avoid
 * @param {string} seed
 * @returns {string}
 */
function buildPairPrompt(category, avoid, seed) {
  const avoidLine = buildAvoidLine(avoid);

  if (category === 'أرقام سهلة') {
    return (
      'أنت تدير لعبة حزر أرقام بين شخصين. أعطني رقمين مختلفين.\n' +
      'كل رقم صحيح بين 1 و 1000، مألوف وسهل التخمين.\n' +
      avoidLine +
      'الرقمان مختلفان تماماً، ومن نطاقين مختلفين (مثلاً واحد صغير وواحد أكبر).\n' +
      'اكتب الرقمين فقط مفصولين بعلامة | بدون أي شرح.\n' +
      'الشكل المطلوب: رقم | رقم\n' +
      `رمز تنويع: ${seed}`
    );
  }

  return (
    `أنت تدير لعبة حزر عربية عائلية. أعطني كلمتين من التصنيف: ${category}.\n` +
    'فكّر بعمق قبل الجواب: استعرض بصمت ثمانية خيارات مشهورة مختلفة، ' +
    'استبعد المكرر والمبتذل والنادر، ثم اختر أفضل اثنتين.\n' +
    qualityRules(category) +
    '- الكلمتان مختلفتان تماماً في المعنى والشكل، ومو من نفس العائلة الضيقة.\n' +
    avoidLine +
    'اكتب الكلمتين فقط مفصولتين بعلامة | بدون أي شرح أو ترقيم.\n' +
    'الشكل المطلوب: كلمة | كلمة\n' +
    `رمز تنويع: ${seed}`
  );
}

/**
 * @param {string} category
 * @param {string[]} avoid
 * @param {string} seed
 * @returns {string}
 */
function buildPrompt(category, avoid, seed) {
  const avoidLine = buildAvoidLine(avoid);

  if (category === 'أرقام سهلة') {
    return (
      'اختر رقماً صحيحاً واحداً فقط للعب حزر الأرقام مع الأصدقاء.\n' +
      'الرقم بين 1 و 1000، وسهل ومألوف ويسهل تخمينه.\n' +
      avoidLine +
      'نوّع بين أرقام صغيرة ومتوسطة وكبيرة، ولا تكرر نفس النمط.\n' +
      'اكتب الرقم فقط بدون أي كلمات أو شرح.\n' +
      `رمز تنويع: ${seed}`
    );
  }

  return (
    `أنت تدير لعبة حزر عربية عائلية. اختر كلمة واحدة من التصنيف: ${category}.\n` +
    'فكّر بعمق: استعرض بصمت ستة خيارات مشهورة، ثم اختر أفضلها للّعب.\n' +
    qualityRules(category) +
    avoidLine +
    'التنويع من داخل المشهور فقط، ولا تختر كلمة غريبة لمجرد تجنّب التكرار.\n' +
    'اكتب الكلمة فقط بدون علامات ترقيم أو شرح.\n' +
    `رمز تنويع: ${seed}`
  );
}

/**
 * @param {string} raw
 * @param {string} [seed]
 * @returns {string}
 */
function cleanGeneratedWord(raw, seed) {
  let text = String(raw ?? '')
    .replace(/^["'`«»]+|["'`«»]+$/g, '')
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (seed) {
    text = text.split(seed).join(' ');
  }

  // Models sometimes echo the variation seed; Arabic answers never end in latin.
  if (/[\u0600-\u06FF]/.test(text)) {
    text = text.replace(/(?:\s|^)(?:رمز\s*تنويع\s*:?)?\s*[A-Za-z0-9]{5,}\s*$/u, '');
  }

  return text
    .replace(/[.!?،,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Picks a fallback word that has not been used recently.
 * @param {string} category
 * @param {string[]} [avoid]
 * @returns {string}
 */
function getFallbackWord(category, avoid = []) {
  const pool = FALLBACK_WORDS[category] ?? FALLBACK_WORDS['فواكه'];
  const avoidSet = toAvoidSet(avoid);
  const fresh = pool.filter((word) => !avoidSet.has(normalizeCompare(word)));
  const source = fresh.length > 0 ? fresh : pool;
  return source[Math.floor(Math.random() * source.length)];
}

const REQUEST_TIMEOUT_MS = 7000;

/**
 * Keeps a slow or hanging model from freezing the round.
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms = REQUEST_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_resolve, reject) =>
      setTimeout(() => reject(new Error('Gemini request timed out')), ms),
    ),
  ]);
}

/**
 * @param {GoogleGenerativeAI} genAI
 * @param {string} modelName
 * @param {string} prompt
 * @param {number} temperature
 */
async function runPrompt(genAI, modelName, prompt, temperature) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature,
      topP: 0.95,
      maxOutputTokens: 120,
    },
  });
  const result = await withTimeout(model.generateContent(prompt));
  return result.response.text();
}

/**
 * @param {string} category
 * @param {string[]} [avoid] Words that must not be produced again.
 * @returns {Promise<string>}
 */
export async function generateWord(category, avoid = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  const selectedCategory = typeof category === 'string' ? category.trim() : '';

  if (!selectedCategory) {
    throw new Error('A valid category is required.');
  }

  if (!apiKey) {
    return getFallbackWord(selectedCategory, avoid);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const avoidSet = toAvoidSet(avoid);
  const attempts = [
    { model: MODEL_CANDIDATES[0], temperature: 1.0 },
    { model: MODEL_CANDIDATES[0], temperature: 1.2 },
    { model: MODEL_CANDIDATES[1], temperature: 1.05 },
  ];

  for (const attempt of attempts) {
    try {
      const seed = makeSeed();
      const prompt = buildPrompt(selectedCategory, avoid, seed);
      const raw = await runPrompt(genAI, attempt.model, prompt, attempt.temperature);
      let word = cleanGeneratedWord(raw, seed);

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

      word = snapToKnownWord(word, selectedCategory);

      if (avoidSet.has(normalizeCompare(word))) {
        throw new Error('Gemini repeated a used word.');
      }

      return word;
    } catch (error) {
      console.warn(
        `[Gemini] Word via ${attempt.model} failed:`,
        error?.message ?? error,
      );
    }
  }

  console.warn('[Gemini] Falling back to a local word.');
  return getFallbackWord(selectedCategory, avoid);
}

/**
 * Two secrets are "too close" when one is basically the other,
 * which would make the round feel repetitive.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function tooSimilar(a, b) {
  const first = normalizeCompare(a).replace(/\s+/g, '');
  const second = normalizeCompare(b).replace(/\s+/g, '');

  if (!first || !second) return true;
  if (first === second) return true;
  if (first.includes(second) || second.includes(first)) return true;

  return false;
}

/**
 * @param {string} word
 * @param {string} category
 * @returns {string | null}
 */
function validateWord(word, category) {
  const cleaned = cleanGeneratedWord(word);

  if (category === 'أرقام سهلة') {
    const digits = cleaned.replace(/[^\d]/g, '');
    const num = Number(digits);
    if (!Number.isInteger(num) || num < 1 || num > 1000) return null;
    return String(num);
  }

  if (!cleaned || cleaned.length > 64) return null;
  return snapToKnownWord(cleaned, category);
}

/**
 * Asks for both secrets in a single call so the model can
 * deliberately pick two different, well-known answers.
 *
 * @param {string} category
 * @param {string[]} avoid
 * @returns {Promise<[string, string] | null>}
 */
async function generateWordPair(category, avoid) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const avoidSet = toAvoidSet(avoid);
  const attempts = [
    { model: MODEL_CANDIDATES[0], temperature: 1.0 },
    { model: MODEL_CANDIDATES[0], temperature: 1.2 },
  ];

  for (const attempt of attempts) {
    try {
      const seed = makeSeed();
      const prompt = buildPairPrompt(category, avoid, seed);
      const raw = await runPrompt(genAI, attempt.model, prompt, attempt.temperature);
      const parts = cleanGeneratedWord(raw, seed)
        .split(/[|\n،,]/)
        .map((part) => validateWord(part, category))
        .filter((part) => Boolean(part));

      if (parts.length < 2) {
        throw new Error('Pair response did not contain two words');
      }

      const [first, second] = parts;

      if (avoidSet.has(normalizeCompare(first)) || avoidSet.has(normalizeCompare(second))) {
        throw new Error('Pair repeated a used word');
      }

      if (tooSimilar(first, second)) {
        throw new Error('Pair words are too close to each other');
      }

      return [first, second];
    } catch (error) {
      console.warn(
        `[Gemini] Pair via ${attempt.model} failed:`,
        error?.message ?? error,
      );
    }
  }

  return null;
}

/**
 * @param {string} category
 * @param {string[]} [avoid]
 * @returns {Promise<[string, string]>}
 */
export async function generateTwoDistinctWords(category, avoid = []) {
  const pair = await generateWordPair(category, avoid);

  if (pair) {
    return pair;
  }

  const first = await generateWord(category, avoid);
  let second = await generateWord(category, [...avoid, first]);

  if (tooSimilar(first, second)) {
    second = getFallbackWord(category, [...avoid, first]);
  }

  if (tooSimilar(first, second)) {
    second =
      category === 'أرقام سهلة'
        ? String(Math.max(1, Math.min(1000, (Number(first) || 1) + 7)))
        : getFallbackWord(category === 'فواكه' ? 'جماد' : 'فواكه', avoid);
  }

  return [first, second];
}

/**
 * Offline hint ladder used when the AI is unavailable or rate limited.
 * Each level reveals a little more, so a round never stalls.
 *
 * @param {string} secret
 * @param {string | null} category
 * @param {number} level 1..5
 * @returns {string}
 */
function buildLocalHint(secret, category, level) {
  const clean = String(secret ?? '').trim();

  if (!clean) {
    return 'شيء مشهور جداً — فكّر في أول ما يخطر ببالك';
  }

  if (/^\d+$/.test(clean)) {
    const digits = clean.length;
    const value = Number(clean);

    if (digits === 1) {
      switch (level) {
        case 1:
          return 'رقم من خانة واحدة';
        case 2:
          return value % 2 === 0 ? 'رقم زوجي' : 'رقم فردي';
        case 3:
          return value > 5 ? 'أكبر من 5' : 'أصغر من أو يساوي 5';
        default:
          return `بين ${Math.max(1, value - 1)} و ${Math.min(9, value + 1)}`;
      }
    }

    const step = value >= 500 ? 100 : value >= 100 ? 50 : 10;

    switch (level) {
      case 1:
        return digits === 2 ? 'رقم من خانتين' : `رقم مكوّن من ${digits} خانات`;
      case 2:
        return value % 2 === 0 ? 'رقم زوجي' : 'رقم فردي';
      case 3:
        return `يبدأ بالرقم ${clean[0]}`;
      default:
        return `بين ${Math.floor(value / step) * step} و ${Math.ceil(value / step) * step + (value % step === 0 ? step : 0)}`;
    }
  }

  const words = clean.split(/\s+/).filter(Boolean);
  const letters = clean.replace(/\s+/g, '');
  const first = letters[0];
  const last = letters[letters.length - 1];

  switch (level) {
    case 1:
      return category
        ? `من أشهر ما يخطر بالبال في: ${category}`
        : 'شيء مشهور جداً ومتداول';
    case 2:
      return words.length > 1
        ? `يتكوّن من ${words.length} كلمات، وعدد حروفه ${letters.length}`
        : `كلمة واحدة من ${letters.length} حروف`;
    case 3:
      return `يبدأ بحرف «${first}»`;
    case 4:
      return `يبدأ بـ «${first}» وينتهي بـ «${last}»`;
    default:
      return `يبدأ بـ «${letters.slice(0, 2)}» وينتهي بـ «${last}»`;
  }
}

/**
 * Difficulty-tuned AI hint, with a useful offline ladder as backup.
 * @param {string} secret
 * @param {string | null} category
 * @param {number} level 1..5
 * @returns {Promise<string>}
 */
export async function generateHint(secret, category, level = 1) {
  const apiKey = process.env.GEMINI_API_KEY;
  const safeLevel = Math.min(5, Math.max(1, Number(level) || 1));
  const localHint = buildLocalHint(secret, category, safeLevel);

  if (!apiKey) {
    return localHint;
  }

  const hintSeed = makeSeed();
  const difficulty =
    safeLevel <= 2
      ? 'اجعل التلميح عاماً وبسيطاً لكن مفيداً — يضيّق دائرة التخمين فعلاً.'
      : safeLevel === 3
        ? 'اجعل التلميح أوضح: اذكر استخداماً أو موقفاً يومياً مرتبطاً به.'
        : 'اجعل التلميح واضحاً وقريباً جداً من الجواب دون ذكره حرفياً.';

  const prompt =
    'اكتب تلميحاً واحداً بالعربية عن كلمة سرية في لعبة حزر عائلية سهلة.\n' +
    `الكلمة السرية (ممنوع ذكرها أو ذكر جزء منها): ${secret}\n` +
    `التصنيف: ${category || 'عام'}\n` +
    `${difficulty}\n` +
    'قواعد:\n' +
    '- التلميح يجب أن يساعد فعلاً، لا أن يكون لغزاً غامضاً.\n' +
    '- ممنوع ذكر الكلمة أو جذرها أو مرادف مباشر لها.\n' +
    '- ممنوع ذكر أول حرف أو عدد الحروف.\n' +
    '- استخدم وصفاً بسيطاً أو موقفاً يومياً يفهمه أي شخص.\n' +
    '- جملة واحدة قصيرة فقط (من 4 إلى 14 كلمة) بدون ترقيم أو شرح.\n' +
    `رمز تنويع: ${hintSeed}`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const secretNormalized = normalizeCompare(secret);

  for (const modelName of MODEL_CANDIDATES.slice(0, 2)) {
    try {
      const raw = await runPrompt(genAI, modelName, prompt, 1.05);
      const hint = cleanGeneratedWord(raw, hintSeed);

      if (!hint || hint.length > 140) {
        throw new Error('Invalid hint');
      }

      if (normalizeCompare(hint).includes(secretNormalized)) {
        throw new Error('Hint leaked secret');
      }

      return hint;
    } catch (error) {
      console.warn(`[Gemini] Hint model ${modelName} failed:`, error?.message ?? error);
    }
  }

  return localHint;
}

const TRIBUTE_PROFILES = {
  ميسمالبرونزيه: {
    name: 'ميسم البرونزية',
    mention: 'ميسم',
    aliases: ['ميسم', 'ميسم البرونزية', 'ميسم البرونزيه', 'البرونزية', 'البرونزيه'],
    context: 'ميسم بنت سمرتها برونزية، هادية وواثقة.',
    extra: '- لازم تذكر سمرتها البرونزية بكلمة عراقية بسيطة، بدون مبالغة.',
    fallbacks: [
      'ميسم، لك هاللون منين جبتيه؟ شمس الصيف كلها تحسدج عليه.',
      'يا ميسم، آني ما أحب الذهب… بس من أشوف سمرتج أعرف ليش الناس تحبه.',
      'تدرين يا ميسم؟ سمرتج تخلي ضوء الغرفة يمشي عدل.',
      'ميسم، بهالسمرة، شكد صعب واحد يشوفج ويگدر ينساج.',
      'لك يا ميسم، سمرتج مو لون… سمرتج دفو ما يخلص بالشتاء.',
      'ميسم، من تمرين يطوّل النهار شوية حتى يشوفج أكثر.',
      'يا ميسم، گلبي من يشوف سمرتج ينسى كل شي حفظه.',
      'ميسم، أحبج بهدوء، مثل ما أحب چاي العصر ولون الغروب.',
      'لك ميسم، شكد حلوة سمرتج؟ حتى الصور ما تنطيها حقها.',
      'يا ميسم، انتِ مو حلوة بس… انتِ راحة تجي بلا موعد.',
    ],
    images: 'سمرة، غروب، چاي العصر، شمس الصيف، ذهب، ظل، شارع بغداد',
  },
  طوطه: {
    name: 'طوطه',
    fallbacks: [
      'طوطه، اسمج بس يمر ببالي، يمشي يومي عدل.',
      'يا طوطه، ضحكتج تجي بلا موعد وتگلب الدنيا كلها.',
      'طوطه، حبج هادي مثل صبح الجمعة… بسيط وما يريد مناسبة.',
      'والله يا طوطه، لو تعبتني الدنيا، يكفي أتذكر صوتج حتى أرتاح.',
      'طوطه، انتِ مو صدفة… انتِ أحسن شي صار بيّه.',
      'يا طوطه، وجودج مثل چاي العصر: عادي عند الناس، وعندي طقس كامل.',
      'طوطه، اسمج يمشي بگلبي مثل أغنية قديمة ما تمل منها الأذن.',
      'أحچي بصدق يا طوطه: انتِ الأمان اللي ما أگدر أفسره بكلمتين.',
      'لك طوطه، لو الفرح صار إنسان، چان صار انتِ بالضبط.',
      'يا طوطه، أحبج بهدوء، وبطريقة تخليج أول شي بالبال.',
    ],
    images: 'ضحكة، صبح الجمعة، چاي، شارع مألوف، أغنية قديمة، مطر خفيف، انتظار',
  },
  ميميالبزونه: {
    name: 'ميمي البزونة',
    mention: 'ميمي',
    aliases: ['ميمي', 'ميمي البزونة', 'ميمي البزونه', 'البزونه', 'البزونة'],
    context: 'ميمي بزونة (قطة) بشعر أحمر وعيون خضر، عدها دلع وكبرياء.',
    extra:
      '- لازم تذكر شعرها الأحمر وعيونها الخضر بكلمة عراقية بسيطة، بدون مبالغة.',
    fallbacks: [
      'ميمي، شعرج الأحمر يدفّي البيت، وعيونج الخضر تطفّيه بنظرة.',
      'يا ميمي، بزونة بس بعيونج الخضر كبرياء ملكة.',
      'ميمي، من تمرين بالغرفة، يحمرّ الضوء شوية وينسى التعب.',
      'والله يا ميمي، دلعج مو طبيعي؛ شعرج الأحمر يحچي قبلج.',
      'ميمي، عيونج خضر مثل حديقة بعد مطر، وشعرج خريف ما يخلص.',
      'يا ميمي، لو شعرج الأحمر ينباع، چان الخريف كله اشتراه وما كفاه.',
      'ميمي، أحبج بهدوء، مثل ما تحبين زاوية الشباك وشمس الظهر.',
      'من عيونج الخضر يا ميمي، عرفت إن الحلو ما يحتاج يصيح.',
      'ميمي، تمشين بغرور… بس أول نظرة من عيونج الخضر تنسينا كلشي.',
      'يا ميمي، الأحمر ما كان لوني… صار لوني من شفت شعرج.',
    ],
    images: 'شعر أحمر، عيون خضر، شمس الظهر، الشباك، مواء، دلع، خيط صوف',
  },
};

/** Flowery phrases that make a line read like generated filler. */
const AI_TELLS =
  /كأن|يشبه|طمأنين|سكين[ةه]|ملامح|عبق|شذى|أدرك|تتمايل|حضورك|وكأنما|تنساب|يعانق|أصيل[ةه]?\s|بهدوء النخيل/;

/** At least one of these keeps the line in spoken Iraqi. */
const IRAQI_MARKERS =
  /[گچ]|شكد|هواي|تدرين|تدري|وياج|وياك|گلب|شلون|أگدر|اگدر|شنو|هاي\s|هال|احچي|أحچي|چان|لك\s|يمعود|بيّه|عليّه|منين/;

/** Short, spoken examples anchor the model to real Iraqi غزل. */
const IRAQI_TRIBUTE_EXAMPLES = [
  'لك شنو هالحلو؟ گلبي من يشوفج يوگف، وآني أدري ما راح يرجع.',
  'ما أريد الدنيا كلها… أريد دگيقة أگعد بيها وياج وأسكت.',
  'من تضحكين، أنسى شكد كان يومي ثگيل.',
  'والله ما أعرف شلون صرت أول شي أفكر بيه من أصحى.',
  'گلبي من زمان ما دگ هيچي… بس من شفتج رجع يشتغل.',
  'خذيني وين ما تروحين، بس لا تخلّيني أعد الأيام حتى أشوفج.',
  'أنا ما أطلب هواي… بس خليني أگعد يمّج شوية.',
];

/**
 * @param {number} count
 * @returns {string[]}
 */
function pickTributeExamples(count = 3) {
  return [...IRAQI_TRIBUTE_EXAMPLES]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
}

export const SECRET_TRIBUTE_KEYS = Object.keys(TRIBUTE_PROFILES);

/**
 * @param {string} rawName
 * @returns {string}
 */
function normalizeTributeKey(rawName) {
  return String(rawName ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة$/, 'ه');
}

/** Short nicknames resolve to the same tribute profile. */
const TRIBUTE_ALIASES = new Map();

for (const [key, profile] of Object.entries(TRIBUTE_PROFILES)) {
  TRIBUTE_ALIASES.set(key, key);
  for (const alias of profile.aliases ?? []) {
    TRIBUTE_ALIASES.set(normalizeTributeKey(alias), key);
  }
}

/**
 * @param {string} rawName
 * @returns {(typeof TRIBUTE_PROFILES)[keyof typeof TRIBUTE_PROFILES] | null}
 */
function resolveTributeProfile(rawName) {
  const key = TRIBUTE_ALIASES.get(normalizeTributeKey(rawName));
  return key ? TRIBUTE_PROFILES[key] : null;
}

/**
 * @param {string} rawName
 * @returns {boolean}
 */
export function isSecretTributeName(rawName) {
  return Boolean(resolveTributeProfile(rawName));
}

/**
 * Generates a fresh romantic Arabic/Iraqi line dedicated to one secret name.
 * @param {string} rawName
 * @returns {Promise<{ name: string, message: string }>}
 */
export async function generateSecretTribute(rawName) {
  const profile = resolveTributeProfile(rawName);

  if (!profile) {
    throw new Error('Unknown tribute name');
  }

  const mention = profile.mention ?? profile.name;

  const pickFallback = () =>
    profile.fallbacks[Math.floor(Math.random() * profile.fallbacks.length)];

  const apiKey = process.env.GEMINI_API_KEY;
  const seed = makeSeed();
  const styleRoll = Math.floor(Math.random() * 3);
  const styleHint =
    styleRoll === 0
      ? 'على طريقة الدارمي العراقي: سطرين قصار، كلام مباشر من الگلب.'
      : styleRoll === 1
        ? 'على طريقة كلمات الأغاني العراقية (كاظم الساهر، سعدون جابر، كريم العراقي).'
        : 'حچي عادي بين اثنين يحبون بعض، بلهجة بغدادية بسيطة.';

  if (!apiKey) {
    return { name: profile.name, message: pickFallback() };
  }

  const prompt =
    `اكتب غزل عراقي واحد لـ "${profile.name}".\n` +
    (profile.context ? `${profile.context}\n` : '') +
    `${styleHint}\n` +
    'الأسلوب المطلوب:\n' +
    '- لهجة عراقية محكية أصيلة، مثل ما يحچي عراقي لحبيبته، مو فصحى.\n' +
    '- استعمل مفردات عراقية طبيعية: گلبي، عيوني، شكد، هواي، تدرين، أشوفج، وياج، چان، لك.\n' +
    '- كلام بسيط وصادق، من دون تفلسف ولا وصف طويل.\n' +
    '- غيّر بداية الجملة كل مرة، ولا تبدأ دائماً بـ «تدرين».\n' +
    `- اذكر اسم ${mention} مرة وحدة.\n` +
    (profile.extra ? `${profile.extra}\n` : '') +
    '- قصير جداً: سطر أو سطرين، من 10 إلى 26 كلمة.\n' +
    'ممنوع منعاً باتاً:\n' +
    '- الفصحى الشاعرية والوصف المنمّق والتشبيهات المتراكمة.\n' +
    '- كلمات مثل: كأنك، يشبه، طمأنينة، سكينة، ملامحك، عبق، شذى، أدركت أن، تتمايل، حضورك.\n' +
    '- الإيموجي، العناوين، علامات الاقتباس، أو أي شرح.\n' +
    'أمثلة على الروح المطلوبة (لا تنسخها، بس امشِ على طريقتها):\n' +
    pickTributeExamples().map((line) => `• ${line}`).join('\n') +
    '\n' +
    `- نوّع الصورة كل مرة من: ${profile.images}\n` +
    `رمز تنويع: ${seed}`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const attempts = [
    MODEL_CANDIDATES[0],
    MODEL_CANDIDATES[0],
    MODEL_CANDIDATES[1],
  ];

  for (const modelName of attempts) {
    try {
      const raw = await runPrompt(genAI, modelName, prompt, 1.25);
      let line = cleanGeneratedWord(raw, seed);

      if (!line || line.length < 16 || line.length > 220) {
        throw new Error('Invalid tribute line');
      }

      if (AI_TELLS.test(line)) {
        throw new Error('Line reads like polished فصحى filler');
      }

      if (!IRAQI_MARKERS.test(line)) {
        throw new Error('Line is not in spoken Iraqi');
      }

      if (!line.includes(mention)) {
        line = `${profile.name}، ${line}`;
      }

      return { name: profile.name, message: line };
    } catch (error) {
      console.warn(
        `[Gemini] Tribute ${profile.name} via ${modelName} failed:`,
        error?.message ?? error,
      );
    }
  }

  return { name: profile.name, message: pickFallback() };
}
