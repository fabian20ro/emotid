const forbiddenPatterns = Object.freeze({
  en: Object.freeze([
    /\byou (are experiencing|need)\b/i,
    /\byour (body|mind|system) (is asking|reacts|tells|signals)\b/i,
    /\b(my|your|the) body (is )?(telling|tells)\b/i,
    /\b(is|are) (an? )?(alarm |physical )?signal that\b/i,
    /\b(is|are) the (response|point|energy) that\b/i,
    /\brequires? (human|professional|a safe)\b/i,
    /\bnatural and healthy\b/i,
    /\b(every emotion has|no emotion is good or bad)\b/i,
  ]),
  ro: Object.freeze([
    /\b(ai|aveți) nevoie\b/i,
    /\bcorpul (tău|vostru) (îți|vă) (cere|spune|semnalează)\b/i,
    /\b(îmi|îți|vă) transmite corpul\b/i,
    /\b(este|sunt) (un )?semnal(ul)? că\b/i,
    /\b(este|sunt) răspunsul\b/i,
    /\bnecesită (conexiune|sprijin|un spațiu)\b/i,
    /\bnaturală și sănătoasă\b/i,
    /\b(fiecare emoție are|nicio emoție nu este bună sau rea)\b/i,
  ]),
})

const candidateWordLimits = Object.freeze({
  needs: 12,
  description: 45,
})

const descriptionForbiddenPatterns = Object.freeze({
  en: Object.freeze([
    /\b(may|might|can|could) help\b/i,
    /\bworth considering\b/i,
    /\bnotice whether\b/i,
    /\btry\b/i,
    /\bseek(?:ing)? (?:help|support)\b/i,
    /\b(?:you|your)\b/i,
  ]),
  ro: Object.freeze([
    /\b(?:poate|pot|ar putea) ajuta\b/i,
    /\bmerită luat(?:ă)? în considerare\b/i,
    /\bobservați dacă\b/i,
    /\bîncercați\b/i,
    /\bcăutați (?:ajutor|sprijin)\b/i,
    /(?:^|\s)(?:voi|vouă|vă|vi|v-ar|vostru|voastră)(?:\s|[,.!?])/iu,
  ]),
})

function findForbiddenPatterns(text, language) {
  return forbiddenPatterns[language]
    .filter((pattern) => pattern.test(text))
    .map((pattern) => pattern.toString())
}

function findDescriptionForbiddenPatterns(text, language) {
  return [...forbiddenPatterns[language], ...descriptionForbiddenPatterns[language]]
    .filter((pattern) => pattern.test(text))
    .map((pattern) => pattern.toString())
}

function countWords(text) {
  return text.trim().split(/\s+/u).filter(Boolean).length
}

module.exports = {
  candidateWordLimits,
  countWords,
  descriptionForbiddenPatterns,
  findDescriptionForbiddenPatterns,
  findForbiddenPatterns,
  forbiddenPatterns,
}
