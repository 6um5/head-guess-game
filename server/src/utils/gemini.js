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
    'جوز الهند', 'بلح', 'صبار', 'ليمون حامض',
  ],
  جماد: [
    'كرسي', 'طاولة', 'باب', 'نافذة', 'هاتف', 'قلم', 'كتاب', 'ساعة',
    'مفتاح', 'مرآة', 'سرير', 'خزانة', 'ثلاجة', 'تلفاز', 'مروحة', 'مصباح',
    'سجادة', 'وسادة', 'ملعقة', 'سكين', 'صحن', 'كوب', 'حقيبة', 'حذاء',
    'نظارة', 'مقص', 'فرشاة', 'مكنسة', 'غسالة', 'مكيف', 'سلم', 'مطرقة',
    'دفتر', 'ممحاة', 'مسطرة', 'محفظة', 'مظلة', 'صابون', 'شمعة', 'بطانية',
  ],
  'أكلات شعبية': [
    'منسف', 'كبسة', 'فلافل', 'حمص', 'مقلوبة', 'دولمة', 'تبولة',
    'شاورما', 'كباب', 'برياني', 'مسكوف', 'تشريب', 'باچة', 'كبة',
    'مندي', 'ملوخية', 'كشري', 'فتة', 'شيش طاووق', 'سمبوسة',
    'كنافة', 'بقلاوة', 'زلابية', 'قوزي', 'بامية', 'فتوش', 'برياني',
    'شوربة عدس', 'محشي', 'بيتزا', 'برغر', 'مكرونة', 'رز بحليب',
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
 * @returns {string}
 */
function makeSeed() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {string} category
 * @param {string[]} avoid
 * @param {string} seed
 * @returns {string}
 */
function buildPrompt(category, avoid, seed) {
  const recent = avoid.slice(-MAX_AVOID_IN_PROMPT);
  const avoidLine = recent.length
    ? `ممنوع تماماً استخدام أي من هذه الكلمات المستعملة سابقاً: ${recent.join('، ')}.\n`
    : '';

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
    `اختر كلمة عربية واحدة فقط من هذا التصنيف: ${category}.\n` +
    'اللعبة عائلية وسهلة، والهدف أن يحزرها أي شخص عادي بسرعة.\n' +
    'الشرط الأهم: كلمة مشهورة جداً ومتداولة يعرفها الجميع من حياتهم اليومية.\n' +
    'ممنوع تماماً: الكلمات النادرة أو القديمة أو التخصصية، والأسماء غير المشهورة.\n' +
    avoidLine +
    'التنويع مطلوب لكن من داخل المشهور فقط: انتقل بين أشياء شائعة مختلفة، ' +
    'ولا تختر كلمة صعبة أو غريبة لمجرد تجنّب التكرار.\n' +
    'للفواكه والجماد والأكل: كلمة مفردة واحدة قصيرة وشائعة.\n' +
    'للشخصيات: أشهر الأسماء التي يعرفها عامة الناس، بالاسم المتداول المختصر.\n' +
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
 * @param {string} category
 * @param {string[]} [avoid]
 * @returns {Promise<[string, string]>}
 */
export async function generateTwoDistinctWords(category, avoid = []) {
  const first = await generateWord(category, avoid);
  let second = await generateWord(category, [...avoid, first]);

  if (normalizeCompare(first) === normalizeCompare(second)) {
    second = getFallbackWord(category, [...avoid, first]);
  }

  if (normalizeCompare(first) === normalizeCompare(second)) {
    second =
      category === 'أرقام سهلة'
        ? String(Math.min(1000, Number(first) + 1 || 2))
        : `${first} ٢`;
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
  ايوش: {
    name: 'ايوش',
    fallbacks: [
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
    ],
    images: 'عيون، ضحكة، غياب، ليل بغداد، دجلة، بيت، سفر، وعد، صمت',
  },
  طوطه: {
    name: 'طوطه',
    fallbacks: [
      'طوطه… اسمج لوحده يكفي يخلي يومي يمشي عدل، وكل تعب اليوم ينسى.',
      'يا طوطه، انتِ الضحكة اللي تجي بلا موعد وتغيّر لون الغرفة كلها.',
      'طوطه، حبج هادي مثل صبح الجمعة: بسيط، دافي، وما يحتاج مناسبة.',
      'والله يا طوطه، لو الدنيا تعبتني، يكفي اتذكر صوتج حتى ارتاح.',
      'طوطه يا أحلى تفصيل بحياتي، انتِ مو صدفة… انتِ أحسن شي صار بيّه.',
      'يا طوطه، وجودج مثل شاي العصر: عادي عند الناس، وعندي طقس كامل.',
      'طوطه، اسمج يمشي بقلبي مثل أغنية قديمة ما تمل منها الأذن.',
      'احچي بصدق يا طوطه: انتِ الأمان اللي ما اكدر افسره بكلمتين.',
      'طوطه… لو الفرح صار إنسان، جان صار انتِ بالضبط، بلا زيادة ولا نقصان.',
      'يا طوطه، احبج بهدوء وبصدق، وبطريقة تخليج دائماً أول شي بالبال.',
    ],
    images: 'ضحكة، صباح، شاي، شارع مألوف، أغنية قديمة، مطر خفيف، أمان، انتظار حلو',
  },
  ميميالبزونه: {
    name: 'ميمي البزونة',
    mention: 'ميمي',
    aliases: ['ميمي', 'ميمي البزونة', 'ميمي البزونه', 'البزونه', 'البزونة'],
    context:
      'ميمي بزونة (قطة) محبوبة بشعر أحمر وعيون خضراء، ولها دلال وكبرياء ودفء خاص.',
    extra:
      '- لازم تغزلين بشعرها الأحمر وبعيونها الخضراء بلمسة خفيفة وذكية في كل نص، بدون تكرار نفس الوصف.',
    fallbacks: [
      'ميمي، شعرج الأحمر هذا مو لون… هذا نار هادية تدفّي البيت، وعيونج الخضر تطفيها بنظرة.',
      'يا ميمي، بزونة بس بعيونج الخضر كبرياء ملكة، وشعرج الأحمر يمشي قبلج بخطوتين.',
      'ميمي، من تمرين بالغرفة يصير الضوء أحمر شوية، وعيونج الخضر تخلي التعب ينسى.',
      'والله يا ميمي، دلعج مو طبيعي؛ شعرج الأحمر يحچي دلال قبل لا تموين.',
      'ميمي البزونة، عيونج خضر مثل حديقة بعد مطر، وشعرج الأحمر خريف ما يخلص.',
      'يا ميمي، لو شعرج الأحمر ينباع، جان الخريف كله اشتراه وما كفاه.',
      'ميمي، احبج بهدوء، مثل ما تحبين الزاوية الدافية عند الشباك وشمس الظهر.',
      'من عيونج الخضر يا ميمي، ومن شعرج النارنجي، تعلمت إن الجمال ما يحتاج يصيح.',
      'ميمي، تمشين مثل ما يمشي الغرور… بس أول ما تطالعين بعيونج الخضر، ننسى كل شي.',
      'يا ميمي، الأحمر ما كان لوني المفضل… صار لوني من شفت شعرج، والأخضر من شفت عيونج.',
    ],
    images:
      'شعر أحمر، عيون خضراء، شمس الظهر، زاوية دافية عند الشباك، مواء ناعم، دلع، نوم هادئ، خيط صوف، خطوة خفيفة',
  },
};

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
      ? 'اكتبي باللهجة العراقية المحكية الواقعية الدافئة.'
      : styleRoll === 1
        ? 'اخلطي بين فصحى رقيقة ولهجة عراقية خفيفة طبيعية.'
        : 'اكتبي بفصحى عربية عميقة شاعرية قريبة من القلب، مع لمسة عراقية إن ناسبت.';

  if (!apiKey) {
    return { name: profile.name, message: pickFallback() };
  }

  const prompt =
    `اكتبي نص غزل واحد فقط، عميق وواقعي ودافئ، موجه حصرياً لـ "${profile.name}".\n` +
    (profile.context ? `${profile.context}\n` : '') +
    `${styleHint}\n` +
    'المطلوب:\n' +
    `- مشاعر صادقة كأن شخص يحب ${mention} فعلاً (حنين، دفء، شوق، تقدير).\n` +
    '- ابتعدي عن المبالغة السينمائية الرخيصة والجمل الجاهزة المكررة.\n' +
    `- لازم يظهر اسم ${mention} مرة واحدة على الأقل.\n` +
    (profile.extra ? `${profile.extra}\n` : '') +
    '- جملة أو جملتين قصيرتين فقط (حوالي 18 إلى 40 كلمة).\n' +
    '- ممنوع الإيموجي، العناوين، الشرح، علامات الاقتباس، أو أي نص غير الغزل نفسه.\n' +
    `- نوّعي الصورة كل مرة: ${profile.images}...\n` +
    `رمز تنويع: ${seed}`;

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of MODEL_CANDIDATES.slice(0, 2)) {
    try {
      const raw = await runPrompt(genAI, modelName, prompt, 1.25);
      let line = cleanGeneratedWord(raw, seed);

      if (!line || line.length < 16 || line.length > 280) {
        throw new Error('Invalid tribute line');
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

/**
 * Kept for backward compatibility with the original secret handler.
 * @returns {Promise<string>}
 */
export async function generateEyushRomance() {
  const { message } = await generateSecretTribute('ايوش');
  return message;
}
