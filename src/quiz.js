// 选择题生成与正误判断(纯逻辑,可测)。

/**
 * 从数据池中随机挑选若干不同的项作为选项。
 * @param {Array} pool 数据池
 * @param {number} count 要抽取的选项数
 * @param {*} [fixContent] 必须包含的项内容(通常为正确答案),用于保证选项含正确答案
 * @returns {Array} 选项数组(打乱顺序)
 */
export function pickOptions(pool, count, correctItem) {
  const others = pool.filter((item) => item !== correctItem);
  // 打乱候选
  const shuffled = shuffle(others);
  // 取 correctItem(若有) + 其余随机项,凑满 count
  let selected = [];
  if (correctItem !== undefined && correctItem !== null) {
    selected.push(correctItem);
  }
  let i = 0;
  while (selected.length < count && i < shuffled.length) {
    selected.push(shuffled[i]);
    i += 1;
  }
  return shuffle(selected);
}

/**
 * 依据内容抽取一个选择题(选项为内容文本)。
 * @param {Array} pool 数据池
 * @param {number} optionCount 选项数(3-4)
 * @param {Function} toText 从数据项取用于展示/判定的文本
 * @returns {{promptText: string, options: string[], answerText: string}}
 */
export function generateQuestion(pool, optionCount = 4, toText = (item) => item) {
  const idx = Math.floor(Math.random() * pool.length);
  const correctItem = pool[idx];
  const answerText = toText(correctItem);
  const options = pickOptions(pool, Math.max(3, Math.min(optionCount, pool.length)), correctItem).map(toText);
  return { options, answerText };
}

/**
 * 判断所选选项是否为正确答案。
 * @param {string} chosen 所选文本
 * @param {string} answer 答案文本
 * @returns {boolean}
 */
export function isCorrect(chosen, answer) {
  return chosen === answer;
}

/**
 * 洗牌函数(Fisher-Yates)。
 * @param {Array} arr
 * @returns {Array} 新数组(不修改原数组)
 */
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
