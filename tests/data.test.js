import { describe, it, expect } from 'vitest';
import { ALPHABET, WORD_CATEGORIES, SENTENCE_THEMES, ANIMATIONS, defaultAnimation } from '../src/data.js';

describe('字母数据', () => {
  it('包含全部 26 个字母 A-Z', () => {
    expect(ALPHABET.length).toBe(26);
    const letters = ALPHABET.map((a) => a.letter);
    expect(letters).toEqual('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
  });

  it('每个字母都有大小写形式、示例 emoji 和示例单词', () => {
    for (const a of ALPHABET) {
      expect(a.letter).toMatch(/^[A-Z]$/);
      expect(a.word).toBeTruthy();
      expect(a.emoji).toBeTruthy();
    }
  });

  it('无重复字母', () => {
    const set = new Set(ALPHABET.map((a) => a.letter));
    expect(set.size).toBe(26);
  });
});

describe('单词分类数据', () => {
  it('包含 2-3 个分类', () => {
    expect(WORD_CATEGORIES.length).toBeGreaterThanOrEqual(2);
    expect(WORD_CATEGORIES.length).toBeLessThanOrEqual(3);
  });

  it('每个分类有 8-10 个单词', () => {
    for (const cat of WORD_CATEGORIES) {
      expect(cat.words.length).toBeGreaterThanOrEqual(8);
      expect(cat.words.length).toBeLessThanOrEqual(10);
      expect(cat.label).toBeTruthy();
    }
  });

  it('每个单词都有英文与 emoji 且分类内无重复词', () => {
    for (const cat of WORD_CATEGORIES) {
      const set = new Set();
      for (const w of cat.words) {
        expect(w.en).toBeTruthy();
        expect(w.emoji).toBeTruthy();
        set.add(w.en);
      }
      expect(set.size).toBe(cat.words.length);
    }
  });
});

describe('句子主题数据', () => {
  it('包含 1-2 个主题', () => {
    expect(SENTENCE_THEMES.length).toBeGreaterThanOrEqual(1);
    expect(SENTENCE_THEMES.length).toBeLessThanOrEqual(2);
  });

  it('每个主题有 8-10 个句子', () => {
    for (const theme of SENTENCE_THEMES) {
      expect(theme.sentences.length).toBeGreaterThanOrEqual(8);
      expect(theme.sentences.length).toBeLessThanOrEqual(10);
      expect(theme.label).toBeTruthy();
    }
  });

  it('每个句子都有英文与 emoji 且主题内无重复句', () => {
    for (const theme of SENTENCE_THEMES) {
      const set = new Set();
      for (const s of theme.sentences) {
        expect(s.en).toBeTruthy();
        expect(s.emoji).toBeTruthy();
        set.add(s.en);
      }
      expect(set.size).toBe(theme.sentences.length);
    }
  });
});

describe('动画配置(animation-player: 配置驱动)', () => {
  it('ANIMATIONS 至少内置一条配置', () => {
    expect(Array.isArray(ANIMATIONS)).toBe(true);
    expect(ANIMATIONS.length).toBeGreaterThanOrEqual(1);
  });

  it('每条配置含 id/title/src', () => {
    for (const a of ANIMATIONS) {
      expect(typeof a.id).toBe('string');
      expect(a.id.length).toBeGreaterThan(0);
      expect(typeof a.title).toBe('string');
      expect(typeof a.src).toBe('string');
    }
  });

  it('内置配置的 src 指向 assets 目录下的视频', () => {
    expect(ANIMATIONS[0].src).toContain('assets/');
    expect(ANIMATIONS[0].src).toMatch(/\.(mp4|webm|ogg)$/);
  });

  it('defaultAnimation 返回首条配置', () => {
    expect(defaultAnimation()).toBe(ANIMATIONS[0]);
  });

  it('defaultAnimation 对空数组返回 null', () => {
    expect(defaultAnimation([])).toBeNull();
  });
});
