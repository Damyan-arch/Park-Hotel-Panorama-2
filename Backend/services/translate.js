const deepl = require("deepl-node");

// The site's supported languages
const LANGUAGES = ["en", "bg", "de", "es", "ro"];

// DeepL
const DEEPL_TARGET_CODE = { en: "en-US", bg: "bg", de: "de", es: "es", ro: "ro" };

function emptyLocalized() {
  return { en: "", bg: "", de: "", es: "", ro: "" };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// DeepL 
async function callWithRetry(fn, retries = 4, delayMs = 1500) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimited = /too many requests|429/i.test(err.message || "");
      if (!isRateLimited || attempt >= retries) throw err;
      await sleep(delayMs * (attempt + 1));
    }
  }
}

let translator = null;
let warnedMissingKey = false;

function getTranslator() {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    if (!warnedMissingKey) {
      console.warn(
        "DEEPL_API_KEY is not set — room/event/amenity text will show the same text in every language until a key is added to Backend/.env."
      );
      warnedMissingKey = true;
    }
    return null;
  }
  if (!translator) translator = new deepl.DeepLClient(apiKey);
  return translator;
}

function isConfigured() {
  return !!process.env.DEEPL_API_KEY;
}

// Translates a single string into every site language
async function translateToAllLanguages(sourceText) {
  const trimmed = (sourceText || "").trim();
  const result = emptyLocalized();
  if (!trimmed) return result;

  const client = getTranslator();
  if (!client) {
    LANGUAGES.forEach((lang) => (result[lang] = trimmed));
    return result;
  }

  try {
    const probe = await callWithRetry(() => client.translateText(trimmed, null, DEEPL_TARGET_CODE.en));
    const detected = (probe.detectedSourceLang || "en").toLowerCase();
    const sourceLang = LANGUAGES.includes(detected) ? detected : "en";
    result[sourceLang] = trimmed;
    result.en = sourceLang === "en" ? trimmed : probe.text;

    for (const lang of LANGUAGES.filter((l) => !result[l])) {
      try {
        const translated = await callWithRetry(() => client.translateText(trimmed, null, DEEPL_TARGET_CODE[lang]));
        result[lang] = translated.text;
      } catch (err) {
        console.warn(`DeepL translation to "${lang}" failed, using original text instead.`, err.message);
        result[lang] = trimmed;
      }
    }
  } catch (err) {
    console.warn("DeepL translation failed, using original text for every language.", err.message);
    LANGUAGES.forEach((lang) => (result[lang] = result[lang] || trimmed));
  }

  return result;
}

// Re-translates `newText` into all languages
async function translateIfChanged(newText, existingLocalized) {
  if (newText == null) return undefined;
  if (existingLocalized && typeof existingLocalized === "object" && newText === existingLocalized.en) {
    return existingLocalized;
  }
  return translateToAllLanguages(newText);
}

module.exports = { LANGUAGES, emptyLocalized, isConfigured, translateToAllLanguages, translateIfChanged };
