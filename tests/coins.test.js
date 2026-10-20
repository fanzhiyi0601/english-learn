import { describe, it, expect } from 'vitest';
import { loadCoins, saveCoins, addCoins, STORAGE_KEY } from '../src/coins.js';

// 最小 localStorage 兼容桩
function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    _map: map,
  };
}

describe('addCoins', () => {
  it('每次答对 +1', () => {
    expect(addCoins(0)).toBe(1);
    expect(addCoins(5)).toBe(6);
  });
  it('保持原值不变(纯函数)', () => {
    const cur = 3;
    expect(addCoins(cur)).toBe(4);
    expect(cur).toBe(3);
  });
  it('非法基数回退为 0 后再累加', () => {
    expect(addCoins(-5)).toBe(1);
    expect(addCoins(NaN)).toBe(1);
  });
  it('非法增量按 0 处理', () => {
    expect(addCoins(3, -2)).toBe(3);
    expect(addCoins(3, NaN)).toBe(3);
  });
});

describe('loadCoins / saveCoins', () => {
  it('首次使用(无记录)返回 0', () => {
    const s = fakeStorage();
    expect(loadCoins(s)).toBe(0);
  });

  it('保存后可读取', () => {
    const s = fakeStorage();
    saveCoins(7, s);
    expect(loadCoins(s)).toBe(7);
    expect(s._map.get(STORAGE_KEY)).toBe('7');
  });

  it('持久化到本地存储,可跨实例恢复', () => {
    const s = fakeStorage();
    saveCoins(12, s);
    // 模拟刷新:新的读取实例,同一底层存储
    const s2 = fakeStorage(Object.fromEntries(s._map));
    expect(loadCoins(s2)).toBe(12);
  });

  it('存储不可用时安全回退为 0', () => {
    expect(loadCoins(null)).toBe(0);
    expect(saveCoins(1, null)).toBe(false);
  });
});
