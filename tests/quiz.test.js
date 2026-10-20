import { describe, it, expect, vi } from 'vitest';
import { generateQuestion, pickOptions, isCorrect, shuffle } from '../src/quiz.js';

// 固定随机,便于断言
function seedRandom(value) {
  vi.spyOn(Math, 'random').mockReturnValue(value);
}

const POOL = ['A', 'B', 'C', 'D', 'E'];

describe('pickOptions', () => {
  it('能取出指定数量且包含正确答案', () => {
    const opts = pickOptions(POOL, 4, 'A');
    expect(opts.length).toBe(4);
    expect(opts).toContain('A');
    // 无重复
    expect(new Set(opts).size).toBe(4);
  });

  it('选项全部来自数据池', () => {
    const opts = pickOptions(POOL, 4, 'C');
    for (const o of opts) expect(POOL).toContain(o);
  });
});

describe('generateQuestion', () => {
  it('在无 toText 时用项本身作为文本', () => {
    seedRandom(0);
    const q = generateQuestion(POOL, 4);
    expect(q.answerText).toBe('A');
    expect(q.options.length).toBe(4);
    expect(q.options).toContain('A');
    vi.restoreAllMocks();
  });

  it('选项数在 3-4 之间且不超过池大小', () => {
    const q = generateQuestion(POOL, 4);
    expect(q.options.length).toBeGreaterThanOrEqual(3);
    expect(q.options.length).toBeLessThanOrEqual(4);
    expect(q.options.length).toBeLessThanOrEqual(POOL.length);
  });

  it('支持自定义 toText 提取展示文本', () => {
    seedRandom(0);
    const items = [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }, { id: 'z', label: 'Z' }];
    const q = generateQuestion(items, 3, (it) => it.label);
    expect(q.answerText).toBe('X');
    expect(q.options).toContain('X');
    vi.restoreAllMocks();
  });
});

describe('isCorrect', () => {
  it('匹配时返回 true', () => {
    expect(isCorrect('Apple', 'Apple')).toBe(true);
  });
  it('不匹配时返回 false', () => {
    expect(isCorrect('Banana', 'Apple')).toBe(false);
  });
});

describe('shuffle', () => {
  it('返回新数组且不修改原数组', () => {
    const src = [1, 2, 3, 4];
    const out = shuffle(src);
    expect(out).not.toBe(src);
    expect(src).toEqual([1, 2, 3, 4]);
    expect([...out].sort()).toEqual([1, 2, 3, 4]);
  });
});
