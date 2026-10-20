// 听写题型:题型分发与答案判定(纯逻辑,可测)。

/**
 * 题型常量。
 */
export const QUIZ_TYPE_CHOICE = 'choice';
export const QUIZ_TYPE_DICTATION = 'dictation';

/**
 * 按概率随机挑选题型。
 * @param {number} [dictationRatio] 听写题出现概率(0-1),默认 0.5
 * @param {Function} [rng] 随机函数,默认 Math.random,便于测试注入
 * @returns {string} QUIZ_TYPE_CHOICE | QUIZ_TYPE_DICTATION
 */
export function pickQuizType(dictationRatio = 0.5, rng = Math.random) {
  const ratio = Number.isFinite(dictationRatio)
    ? Math.min(1, Math.max(0, dictationRatio))
    : 0.5;
  return rng() < ratio ? QUIZ_TYPE_DICTATION : QUIZ_TYPE_CHOICE;
}

/**
 * 规范化文本:去首尾空格、压缩连续空白。
 * @param {string} text
 * @returns {string}
 */
export function normalizeText(text) {
  if (typeof text !== 'string') return '';
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * 比较两个文本(忽略大小写与多余空白)。
 * @param {string} input 用户输入
 * @param {string} answer 正确答案
 * @returns {boolean}
 */
export function compareText(input, answer) {
  return normalizeText(input).toLowerCase() === normalizeText(answer).toLowerCase();
}

/**
 * 判定字母听写:仅接受 1 个字母,忽略大小写。
 * @param {string} input
 * @param {string} answer 单个字母
 * @returns {boolean}
 */
export function judgeLetter(input, answer) {
  const a = normalizeText(input);
  const b = normalizeText(answer);
  if (a.length !== 1 || b.length !== 1) return false;
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * 标点字符集:听写判定时忽略这些符号(孩子无需输入标点)。
 */
const PUNCT = /[!?.,;:'"()\[\]{}<>-]/g;

/**
 * 去除文本中的标点符号。
 * @param {string} text
 * @returns {string}
 */
export function stripPunctuation(text) {
  return String(text).replace(PUNCT, '');
}

/**
 * 从答案中提取每个单词(去掉标点后按空白拆分)。
 * @param {string} answer
 * @returns {string[]} 纯字母单词数组
 */
export function wordsOfAnswer(answer) {
  return normalizeText(stripPunctuation(answer)).split(' ').filter(Boolean);
}

/**
 * 判定单词/句子听写:按词比较,忽略大小写、标点与首尾/多余空格,全部一致才判对。
 * @param {string} input
 * @param {string} answer
 * @returns {boolean}
 */
export function judgeWords(input, answer) {
  const inWords = normalizeText(stripPunctuation(input)).toLowerCase().split(' ').filter(Boolean);
  const ansWords = normalizeText(stripPunctuation(answer)).toLowerCase().split(' ').filter(Boolean);
  if (!ansWords.length) return false;
  if (inWords.length !== ansWords.length) return false;
  return ansWords.every((w, i) => w === inWords[i]);
}

/**
 * 统一判定入口:按模块类型选择判定规则。
 *   - alphabet: 单字母判定
 *   - word / sentence: 按词判定
 * @param {string} module 'alphabet' | 'word' | 'sentence'
 * @param {string} input
 * @param {string} answer
 * @returns {boolean}
 */
export function judgeAnswer(module, input, answer) {
  if (module === 'alphabet') return judgeLetter(input, answer);
  return judgeWords(input, answer);
}

/**
 * 计算听写输入区需要的下划线占位数量。
 *   - alphabet: 固定 1 个
 *   - word / sentence: 按答案单词数,每个单词 1 个下划线
 * @param {string} module
 * @param {string} answer
 * @returns {number}
 */
export function blankCount(module, answer) {
  if (module === 'alphabet') return 1;
  const words = normalizeText(answer).split(' ').filter(Boolean);
  return Math.max(1, words.length);
}
