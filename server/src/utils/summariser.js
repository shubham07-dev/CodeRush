// ─────────────────────────────────────────────────────────
// Text Summariser – simple extractive summary (no external AI)
// ─────────────────────────────────────────────────────────

/**
 * Generate an extractive summary from a body of text.
 * Picks the top-scoring sentences based on keyword frequency.
 *
 * @param {string} text - The full text to summarise
 * @param {number} maxSentences - Number of sentences in summary (default 2)
 * @returns {string} Summary text
 */
export function summariseText(text, maxSentences = 2) {
  if (!text || text.length <= 200) {
    return text || '';
  }

  // Split into sentences
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  if (sentences.length <= maxSentences) {
    return sentences.join(' ');
  }

  // Build word frequency map (skip stop words)
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either',
    'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than',
    'too', 'very', 'just', 'because', 'if', 'when', 'where', 'how',
    'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
    'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i', 'me', 'my'
  ]);

  const wordFreq = {};
  const allWords = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);

  for (const word of allWords) {
    if (word.length > 2 && !stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }

  // Score each sentence
  const scored = sentences.map((sentence, index) => {
    const words = sentence.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    let score = 0;

    for (const word of words) {
      score += wordFreq[word] || 0;
    }

    // Normalise by sentence length to avoid bias toward longer sentences
    score = words.length > 0 ? score / words.length : 0;

    // Slight boost for early sentences (often contain the gist)
    if (index === 0) score *= 1.3;
    if (index === 1) score *= 1.1;

    return { sentence, score, index };
  });

  // Pick top sentences, preserving original order
  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index);

  return top.map((t) => t.sentence).join(' ');
}
