import { describe, it, expect } from 'vitest';
import {
  pickQuizType,
  QUIZ_TYPE_CHOICE,
  QUIZ_TYPE_DICTATION,
  normalizeText,
  compareText,
  judgeLetter,
  judgeWords,
  judgeAnswer,
  blankCount,
} from '../src/dictation.js';

describe('题型分发(practice-quiz: 听写与选择并列随机)', () => {
  it('随机函数落在听写阈值内时返回听写题型', () => {
    expect(pickQuizType(0.5, () => 0.1)).toBe(QUIZ_TYPE_DICTATION);
  });

  it('随机函数落在阈值外时返回选择题型', () => {
    expect(pickQuizType(0.5, () => 0.9)).toBe(QUIZ_TYPE_CHOICE);
  });

  it('两种题型均可能被生成', () => {
    const seq = [0.1, 0.9, 0.2, 0.8, 0.3, 0.7];
    let i = 0;
    const rng = () => seq[(i += 1) % seq.length];
    const types = new Set();
    for (let n = 0; n < 12; n += 1) types.add(pickQuizType(0.5, rng));
    expect(types.has(QUIZ_TYPE_DICTATION)).toBe(true);
    expect(types.has(QUIZ_TYPE_CHOICE)).toBe(true);
  });

  it('比例为 1 时总是听写,比例为 0 时总是选择', () => {
    expect(pickQuizType(1, () => 0.99)).toBe(QUIZ_TYPE_DICTATION);
    expect(pickQuizType(0, () => 0.0)).toBe(QUIZ_TYPE_CHOICE);
  });

  it('非法比例回退为默认 0.5', () => {
    expect(pickQuizType('abc', () => 0.49)).toBe(QUIZ_TYPE_DICTATION);
    expect(pickQuizType(undefined, () => 0.51)).toBe(QUIZ_TYPE_CHOICE);
  });
});

describe('规范化和比较', () => {
  it('去首尾空格并压缩多余空白', () => {
    expect(normalizeText('  Good   morning!  ')).toBe('Good morning!');
  });

  it('非字符串返回空串', () => {
    expect(normalizeText(null)).toBe('');
    expect(normalizeText(123)).toBe('');
  });

  it('compareText 忽略大小写与多余空白', () => {
    expect(compareText('  HELLO  ', 'hello')).toBe(true);
    expect(compareText('cat', 'dog')).toBe(false);
  });
});

describe('字母听写判定(单下划线、1 字母、忽略大小写)', () => {
  it('大小写不同也判对', () => {
    expect(judgeLetter('a', 'A')).toBe(true);
    expect(judgeLetter('Z', 'z')).toBe(true);
  });

  it('完全一致判对', () => {
    expect(judgeLetter('B', 'B')).toBe(true);
  });

  it('错误字母判错', () => {
    expect(judgeLetter('c', 'B')).toBe(false);
  });

  it('空输入或多字母判错', () => {
    expect(judgeLetter('', 'A')).toBe(false);
    expect(judgeLetter('ab', 'A')).toBe(false);
  });
});

describe('单词/句子听写判定(按词比较)', () => {
  it('单词忽略大小写判对', () => {
    expect(judgeWords('cat', 'Cat')).toBe(true);
  });

  it('整句全对判对', () => {
    expect(judgeWords('good morning', 'Good morning!'.replace('!', ''))).toBe(true);
  });

  it('首尾空格与多余空格不影响判定', () => {
    expect(judgeWords('  how   are you  ', 'How are you')).toBe(true);
  });

  it('单处错误判错', () => {
    expect(judgeWords('how is you', 'How are you')).toBe(false);
  });

  it('词数不一致判错', () => {
    expect(judgeWords('hello', 'Good morning')).toBe(false);
    expect(judgeWords('good morning everyone', 'Good morning')).toBe(false);
  });

  it('空答案判错', () => {
    expect(judgeWords('anything', '')).toBe(false);
  });
});

describe('判定入口 judgeAnswer', () => {
  it('alphabet 走单字母判定', () => {
    expect(judgeAnswer('alphabet', 'd', 'D')).toBe(true);
    expect(judgeAnswer('alphabet', 'dog', 'D')).toBe(false);
  });

  it('word 与 sentence 走按词判定', () => {
    expect(judgeAnswer('word', 'apple', 'Apple')).toBe(true);
    expect(judgeAnswer('sentence', 'i am fine', 'I am fine')).toBe(true);
    expect(judgeAnswer('sentence', 'i am tired', 'I am fine')).toBe(false);
  });
});

describe('下划线占位数量', () => {
  it('字母题固定 1 个下划线', () => {
    expect(blankCount('alphabet', 'A')).toBe(1);
    expect(blankCount('alphabet', 'A very long word')).toBe(1);
  });

  it('单词按 1 个词 1 个下划线', () => {
    expect(blankCount('word', 'Apple')).toBe(1);
  });

  it('句子按单词数给出下划线', () => {
    expect(blankCount('sentence', 'Good morning')).toBe(2);
    expect(blankCount('sentence', 'How are you')).toBe(3);
    expect(blankCount('sentence', 'I love my family')).toBe(4);
  });
});
