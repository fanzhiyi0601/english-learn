import { describe, it, expect, beforeEach } from 'vitest';
import { recordMistake, getMistakes, clearMistakes, STORAGE_KEY } from '../src/mistakes.js';

function makeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
}

describe('错题本记录(error-notebook)', () => {
  let storage;
  beforeEach(() => { storage = makeStorage(); });

  it('初始为空数组', () => {
    expect(getMistakes(storage)).toEqual([]);
  });

  it('答错写入一条记录', () => {
    recordMistake({ module: 'word', prompt: 'Which is the answer?', answer: 'Cat', userAnswer: 'Dog' }, storage, () => 1000);
    const list = getMistakes(storage);
    expect(list.length).toBe(1);
    expect(list[0].module).toBe('word');
    expect(list[0].answer).toBe('Cat');
    expect(list[0].userAnswer).toBe('Dog');
  });

  it('记录含题目、答案、用户作答与时间', () => {
    recordMistake({ module: 'alphabet', prompt: 'Type the letter', answer: 'A', userAnswer: 'B' }, storage, () => 12345);
    const r = getMistakes(storage)[0];
    expect(r.prompt).toBe('Type the letter');
    expect(r.answer).toBe('A');
    expect(r.userAnswer).toBe('B');
    expect(r.ts).toBe(12345);
  });

  it('可显式传入时间戳覆盖默认值', () => {
    recordMistake({ module: 'word', prompt: 'p', answer: 'a', userAnswer: 'b', ts: 777 }, storage, () => 999);
    expect(getMistakes(storage)[0].ts).toBe(777);
  });

  it('多条记录按写入顺序追加', () => {
    recordMistake({ module: 'word', prompt: 'p1', answer: 'a', userAnswer: 'b' }, storage, () => 1);
    recordMistake({ module: 'sentence', prompt: 'p2', answer: 'c', userAnswer: 'd' }, storage, () => 2);
    const list = getMistakes(storage);
    expect(list.map((x) => x.answer)).toEqual(['a', 'c']);
  });

  it('局部字段缺失时补空串,不抛错', () => {
    recordMistake({ module: 'word' }, storage, () => 5);
    const r = getMistakes(storage)[0];
    expect(r.prompt).toBe('');
    expect(r.answer).toBe('');
    expect(r.userAnswer).toBe('');
  });

  it('reflects 存储持久化:同一 storage 再次读取不丢失(模拟刷新)', () => {
    recordMistake({ module: 'word', prompt: 'p', answer: 'Cat', userAnswer: 'Dog' }, storage, () => 1);
    const reloaded = getMistakes(storage);
    expect(reloaded.length).toBe(1);
    expect(reloaded[0].answer).toBe('Cat');
  });

  it('损坏的 JSON 回退为空列表', () => {
    storage.setItem(STORAGE_KEY, '{not json');
    expect(getMistakes(storage)).toEqual([]);
  });

  it('非数组 JSON 回退为空列表', () => {
    storage.setItem(STORAGE_KEY, '{"a":1}');
    expect(getMistakes(storage)).toEqual([]);
  });

  it('clearMistakes 清空错题本', () => {
    recordMistake({ module: 'word', prompt: 'p', answer: 'a', userAnswer: 'b' }, storage, () => 1);
    clearMistakes(storage);
    expect(getMistakes(storage)).toEqual([]);
  });
});
