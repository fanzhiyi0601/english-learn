import { describe, it, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { initApp } from '../src/render.js';

let dom;
let doc;

function setup() {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf-8');
  dom = new JSDOM(html, { url: 'http://localhost/' });
  doc = dom.window.document;
  global.window = dom.window;
  global.document = doc;
  global.localStorage = dom.window.localStorage;
  return dom;
}

describe('浏览器冒烟测试(spec 场景与端到端)', () => {
  beforeAll(() => {
    setup();
    dom.window.localStorage.clear();
    initApp(doc);
  });

  it('首页展示三个模块入口 + 动画入口(content-navigation, animation-player)', () => {
    const menu = doc.querySelectorAll('.menu-card');
    expect(menu.length).toBe(4);
    expect(menu[0].getAttribute('data-go')).toBe('alphabet');
    expect(menu[1].getAttribute('data-go')).toBe('word');
    expect(menu[2].getAttribute('data-go')).toBe('sentence');
    expect(menu[3].getAttribute('data-go')).toBe('animation');
  });

  it('点击字母入口进入字母模块并渲染 26 卡片(alphabet-learning)', () => {
    doc.querySelector('.menu-card[data-go="alphabet"]').click();
    expect(doc.getElementById('view-alphabet').classList.contains('active')).toBe(true);
    expect(doc.querySelectorAll('#alphabet-grid .card').length).toBe(26);
  });

  it('单词模块有分类页签并可切换(word-learning)', () => {
    doc.querySelector('.menu-card[data-go="word"]').click();
    expect(doc.getElementById('view-word').classList.contains('active')).toBe(true);
    expect(doc.querySelectorAll('#word-tabs .tab').length).toBeGreaterThanOrEqual(2);
    const firstGrid = doc.querySelector('#word-grid .card-word').textContent;
    const tabs = doc.querySelectorAll('#word-tabs .tab');
    tabs[1].click();
    const secondGrid = doc.querySelector('#word-grid .card-word').textContent;
    expect(secondGrid).not.toBe(firstGrid);
  });

  it('句子模块有主题页签且可选(sentence-learning)', () => {
    doc.querySelector('.menu-card[data-go="sentence"]').click();
    expect(doc.getElementById('view-sentence').classList.contains('active')).toBe(true);
    expect(doc.querySelectorAll('#sentence-tabs .tab').length).toBeGreaterThanOrEqual(1);
    expect(doc.querySelectorAll('#sentence-grid .card').length).toBeGreaterThanOrEqual(8);
  });

  it('各模块均有"练习"入口(practice-quiz)', () => {
    const go = ['alphabet', 'word', 'sentence'];
    for (const m of go) {
      const btn = doc.querySelector('.practice-btn[data-practice="' + m + '"]');
      expect(btn).toBeTruthy();
    }
  });

  it('卡片点击弹出居中预览,点击外部关闭(card-preview)', () => {
    doc.querySelector('.menu-card[data-go="alphabet"]').click();
    const overlay = doc.getElementById('preview-overlay');
    expect(overlay.hidden).toBe(true);
    doc.querySelector('#alphabet-grid .card').click();
    expect(overlay.hidden).toBe(false);
    expect(doc.querySelector('#preview-card .card-letter')).toBeTruthy();
    // 点击卡片本身不关闭(事件冒泡到遮罩,但 target 为卡片)
    doc.getElementById('preview-card').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    expect(overlay.hidden).toBe(false);
    // 点击遮罩(卡片外)关闭
    overlay.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    expect(overlay.hidden).toBe(true);
  });

  it('练习问答:选择题或听写题,答对反馈出现且金币处理正确(coin-rewards, practice-quiz)', () => {
    doc.querySelector('.menu-card[data-go="alphabet"]').click();
    const before = Number(doc.getElementById('coin-count').textContent);
    doc.querySelector('.practice-btn[data-practice="alphabet"]').click();
    expect(doc.getElementById('view-quiz').classList.contains('active')).toBe(true);
    const nextBtn = doc.getElementById('quiz-next');
    let coinsAdded = false;
    for (let round = 0; round < 60 && !coinsAdded; round += 1) {
      const optionsEl = doc.getElementById('quiz-options');
      const dictBox = doc.getElementById('dict-box');
      // 选择题:点第一个选项
      if (!optionsEl.hidden) {
        const opts = Array.from(doc.querySelectorAll('#quiz-options .quiz-option:not(:disabled)'));
        if (opts.length) opts[0].click();
      }
      // 听写题:按每格正确答案填入并提交
      if (!dictBox.hidden) {
        const words = Array.from(doc.querySelectorAll('#dict-slots .dict-word'));
        words.forEach((w) => {
          const chars = Array.from(w.querySelectorAll('.dict-char'));
          chars.forEach((c) => { c.value = c.placeholder; });
        });
        const submit = doc.getElementById('dict-submit');
        submit.disabled = false;
        submit.click();
      }
      if (Number(doc.getElementById('coin-count').textContent) === before + 1) {
        coinsAdded = true;
        break;
      }
      nextBtn.click();
    }
    expect(coinsAdded).toBe(true);
    expect(doc.getElementById('quiz-feedback').textContent.length).toBeGreaterThan(0);
  });

  it('答对金币持久化到 localStorage(coin-rewards)', () => {
    const stored = dom.window.localStorage.getItem('coinCount');
    expect(stored).not.toBeNull();
    expect(Number(stored)).toBeGreaterThan(0);
  });

  it('返回按钮回到首页(content-navigation)', () => {
    doc.getElementById('back-btn').click();
    expect(doc.getElementById('view-home').classList.contains('active')).toBe(true);
  });
});
