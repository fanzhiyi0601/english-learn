// 金币计数与本地持久化(纯逻辑,可测)。storage 以参数注入,缺省用 localStorage。

const STORAGE_KEY = 'coinCount';

function resolveStorage(storage) {
  if (storage && typeof storage === 'object') return storage;
  if (typeof localStorage !== 'undefined') return localStorage;
  return null;
}

/**
 * 读取累计金币数。无记录或不可用时返回 0。
 * @param {object} [storage] 注入的 storage(localStorage 兼容对象)
 * @returns {number}
 */
export function loadCoins(storage) {
  const s = resolveStorage(storage);
  if (!s) return 0;
  try {
    const raw = s.getItem(STORAGE_KEY);
    if (raw === null || raw === undefined) return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

/**
 * 保存累计金币数。
 * @param {number} count
 * @param {object} [storage]
 */
export function saveCoins(count, storage) {
  const s = resolveStorage(storage);
  if (!s) return false;
  try {
    s.setItem(STORAGE_KEY, String(count));
    return true;
  } catch {
    return false;
  }
}

/**
 * 答对时累加金币数(每次 +1),并返回新值。
 * @param {number} current
 * @param {number} [amount] 增量,默认 1
 * @returns {number}
 */
export function addCoins(current, amount = 1) {
  const base = Number.isFinite(current) && current >= 0 ? Math.floor(current) : 0;
  const inc = Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0;
  return base + inc;
}

export { STORAGE_KEY };
