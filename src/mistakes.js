// 错题本:记录与读取(纯逻辑,可测)。storage 以参数注入,缺省用 localStorage。

const STORAGE_KEY = 'mistakeBook';

function resolveStorage(storage) {
  if (storage && typeof storage === 'object') return storage;
  if (typeof localStorage !== 'undefined') return localStorage;
  return null;
}

/**
 * 读取全部错题记录。无记录或不可用时返回空数组。
 * @param {object} [storage]
 * @returns {Array<{module:string,prompt:string,answer:string,userAnswer:string,ts:number}>}
 */
export function getMistakes(storage) {
  const s = resolveStorage(storage);
  if (!s) return [];
  try {
    const raw = s.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * 追加一条错题记录并持久化,返回最新列表。
 * @param {{module:string,prompt:string,answer:string,userAnswer:string,ts?:number}} entry
 * @param {object} [storage]
 * @param {Function} [now] 时间来源,默认 Date.now,便于测试注入
 * @returns {Array}
 */
export function recordMistake(entry, storage, now = Date.now) {
  const s = resolveStorage(storage);
  const list = getMistakes(s);
  const record = {
    module: entry && entry.module ? String(entry.module) : '',
    prompt: entry && entry.prompt ? String(entry.prompt) : '',
    answer: entry && entry.answer != null ? String(entry.answer) : '',
    userAnswer: entry && entry.userAnswer != null ? String(entry.userAnswer) : '',
    ts: entry && Number.isFinite(entry.ts) ? entry.ts : now(),
  };
  const next = list.concat([record]);
  if (s) {
    try {
      s.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // 存储失败时仍返回内存中的列表,保证本次会话可用
    }
  }
  return next;
}

/**
 * 清空错题本。
 * @param {object} [storage]
 */
export function clearMistakes(storage) {
  const s = resolveStorage(storage);
  if (!s) return;
  try {
    s.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch {
    // 忽略
  }
}

export { STORAGE_KEY };
