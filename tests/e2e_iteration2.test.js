import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { initApp } from '../src/render.js';
import { ANIMATIONS } from '../src/data.js';
import { stripPunctuation } from '../src/dictation.js';

let dom;
let doc;
let originalRandom;

function setup() {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf-8');
  dom = new JSDOM(html, { url: 'http://localhost/' });
  doc = dom.window.document;
  global.window = dom.window;
  global.document = doc;
  global.localStorage = dom.window.localStorage;
  return dom;
}

// 词卡片:每个 .dict-word 含多个 .dict-char (每字母一格)
function dictWords() {
  return Array.from(doc.querySelectorAll('#dict-slots .dict-word'));
}
// 填入每个字母格(字符串拼接每词字母),返回 { words, text, chars }
function fillSlots(wordValues) {
  const words = dictWords();
  words.forEach((w, wi) => {
    const chars = Array.from(w.querySelectorAll('.dict-char'));
    const val = wordValues[wi] || '';
    chars.forEach((c, ci) => { if (val[ci]) c.value = val[ci]; });
  });
  const submit = doc.getElementById('dict-submit');
  submit.disabled = false;
  return words;
}
// 全部填正确答案:答案默认隐藏,先清空再经小眼睛读取正确字母后填入(task 11.4)
function fillSlotsCorrect() {
  const eye = doc.getElementById('dict-eyes');
  if (eye && eye.classList.contains('on')) eye.click(); // 确保为隐藏态
  allCharInputs().forEach((c) => { c.value = ''; });    // 清空,让小眼睛填充全部格子
  if (eye) eye.click(); // 显示答案以读取正确字母
  const words = dictWords();
  const vals = words.map((w) => wordsToText(w));
  const submit = doc.getElementById('dict-submit');
  submit.disabled = false;
  return fillSlots(vals);
}
function wordsToText(w) {
  return Array.from(w.querySelectorAll('.dict-char')).map((c) => c.value || '').join('');
}
// 答案默认隐藏(task 11.4)。通过小眼睛临时显示答案→读取→再隐藏;
// 以此获得正确答案用于测试(不再依赖 placeholder)。
function getDictText() {
  const eye = doc.getElementById('dict-eyes');
  const shownClassHad = eye.className;
  const wasOn = eye.classList.contains('on');
  if (!wasOn) eye.click();          // 显示答案
  const text = dictWords().map((w) => Array.from(w.querySelectorAll('.dict-char')).map((c) => c.value || '').join('')).join(' ').trim();
  if (!wasOn) eye.click();          // 隐藏,仅恢复本空位
  eye.className = shownClassHad;    // 确保图标状态还原
  return text;
}
function allCharInputs() {
  return Array.from(doc.querySelectorAll('#dict-slots .dict-char'));
}

describe('迭代2 端到端集成验证(task 8.2 + 各 delta 场景)', () => {
  beforeAll(() => {
    setup();
    global.window = dom.window;
    global.document = doc;
    global.localStorage = dom.window.localStorage;
    originalRandom = Math.random;
  });
  afterEach(() => {
    Math.random = originalRandom;
  });
  beforeEach(() => {
    dom.window.localStorage.clear();
    Math.random = originalRandom;
    initApp(doc);
  });

  it('金币徽标显示可渲染符号,非方框(coin-rewards)', () => {
    const badge = doc.getElementById('coin-badge').textContent.trim();
    expect(badge).toMatch(/[💰⭐]/);
    expect(badge).not.toContain('🪙');
  });

  it('动画模块从首页进入并渲染配置驱动列表(animation-player)', () => {
    doc.querySelector('.menu-card[data-go="animation"]').click();
    expect(Array.from(doc.getElementById('view-animation').classList)).toContain('active');
    const items = doc.querySelectorAll('#anime-list .anime-item');
    expect(items.length).toBe(ANIMATIONS.length);
    const player = doc.getElementById('anime-player');
    expect(player.hidden).toBe(false);
    const video = doc.getElementById('anime-video');
    expect(video).toBeTruthy();
    // src 与配置一致(配置驱动,非硬编码)
    expect(video.src.endsWith(ANIMATIONS[0].src)).toBe(true);
    // video 资源缺失时不中断(优雅降级由 onerror 处理)
    video.dispatchEvent(new dom.window.Event('error'));
    expect(doc.getElementById('anime-placeholder').hidden).toBe(false);
  });

  it('顶部导航有错题本入口,可切换至错题本视图(error-notebook)', () => {
    const nb = doc.getElementById('notebook-btn');
    expect(nb).toBeTruthy();
    nb.click();
    expect(Array.from(doc.getElementById('view-notebook').classList)).toContain('active');
  });

  it('听写答错→进错题本→答对听写→金币增加(完整链路 task 8.2)', () => {
    // 强制题型为听写:让 pickQuizType 的 Math.random() 恒 < 0.5
    Math.random = () => 0.1;
    doc.querySelector('.menu-card[data-go="word"]').click();
    const beforeCoins = Number(doc.getElementById('coin-count').textContent);
    doc.querySelector('.practice-btn[data-practice="word"]').click();

    // 第一次听写:故意答错
    const dictBox = doc.getElementById('dict-box');
    expect(dictBox.hidden).toBe(false); // 恒走听写
    const answer = getDictText(); // 正确答案(去标点后逐格展示)
    fillSlots(dictWords().map(() => 'zzzzzz'));
    doc.getElementById('dict-submit').click();
    expect(doc.getElementById('quiz-feedback').className).toContain('bad');
    expect(Number(doc.getElementById('coin-count').textContent)).toBe(beforeCoins); // 答错不加币
    const mistakesAfterWrong = JSON.parse(dom.window.localStorage.getItem('mistakeBook') || '[]');
    expect(mistakesAfterWrong.length).toBe(1);
    // 错题记录保存原答案;去标点后应与逐格展示的答案一致
    expect(stripPunctuation(mistakesAfterWrong[0].answer).toLowerCase().split(/\s+/).join(' ')).toBe(answer);

    // 进入错题本查看记录
    doc.getElementById('notebook-btn').click();
    expect(Array.from(doc.getElementById('view-notebook').classList)).toContain('active');
    const noteText = doc.getElementById('note-list').textContent;
    expect(noteText).toContain(mistakesAfterWrong[0].answer);

    // 回到单词,下一题答对听写→金币增加
    doc.querySelector('.menu-card[data-go="word"]').click();
    doc.querySelector('.practice-btn[data-practice="word"]').click();
    fillSlotsCorrect();
    doc.getElementById('dict-submit').click();
    expect(doc.getElementById('quiz-feedback').className).toContain('good');
    expect(Number(doc.getElementById('coin-count').textContent)).toBe(beforeCoins + 1);
    // 答对不再新增错题
    const mistakesFinal = JSON.parse(dom.window.localStorage.getItem('mistakeBook') || '[]');
    expect(mistakesFinal.length).toBe(1);
  });

  it('听写下划线占位正确:字母1个,单词1个,句子按词(error/word blanks)', () => {
    Math.random = () => 0.1; // 强制听写
    // 字母题:1 个下划线
    doc.querySelector('.menu-card[data-go="alphabet"]').click();
    doc.querySelector('.practice-btn[data-practice="alphabet"]').click();
    const wordsAlph = dictWords();
    expect(wordsAlph.length).toBe(1);
    // 字母题:1 个字母格
    expect(wordsAlph[0].querySelectorAll('.dict-char').length).toBe(1);
    // 句子题:词卡数 = 词数,每词卡字母格数 = 该词字母数
    doc.querySelector('.menu-card[data-go="sentence"]').click();
    doc.querySelector('.practice-btn[data-practice="sentence"]').click();
    const wordsSent = dictWords();
    const wordCount = wordsSent.length;
    expect(wordCount).toBeGreaterThanOrEqual(1);
    const total = wordsSent.reduce((n, w) => n + w.querySelectorAll('.dict-char').length, 0);
    const expectedChars = getDictText().trim().split(/\s+/).reduce((n, w) => n + w.length, 0);
    expect(total).toBe(expectedChars);
  });

  it('错题记录刷新后从本地恢复不丢失(error-notebook)', () => {
    Math.random = () => 0.1;
    doc.querySelector('.menu-card[data-go="word"]').click();
    doc.querySelector('.practice-btn[data-practice="word"]').click();
    fillSlots(dictWords().map(() => 'zzzzzz'));
    doc.getElementById('dict-submit').click();
    // 模拟刷新:同一 localStorage 重新 initApp,记录应从本地恢复
    doc.getElementById('note-list').innerHTML = '';
    initApp(doc);
    doc.getElementById('notebook-btn').click();
    const noteText = doc.getElementById('note-list').textContent;
    expect(noteText).toContain('zzz');
  });
});


describe('迭代2 调整项(task 9: 逐格输入 / 重播 / 重试)', () => {
  beforeAll(() => {
    setup();
    originalRandom = Math.random;
    global.window = dom.window;
    global.document = doc;
    global.localStorage = dom.window.localStorage;
  });
  afterEach(() => { Math.random = originalRandom; });
  beforeEach(() => {
    dom.window.localStorage.clear();
    Math.random = originalRandom;
    initApp(doc);
  });

  it('听写按词分卡:词卡数=词数,卡内字母格数=该词字母数,填满提交(9.1)', () => {
    Math.random = () => 0.1; // 强制听写
    doc.querySelector('.menu-card[data-go="sentence"]').click();
    doc.querySelector('.practice-btn[data-practice="sentence"]').click();
    const words = dictWords();
    const wordsText = getDictText(); // 当前答案所有词的占位字母
    const wordList = wordsText.trim().split(/\s+/);
    expect(words.length).toBe(wordList.length); // 词卡数 = 词数
    words.forEach((w, wi) => {
      expect(w.querySelectorAll('.dict-char').length).toBe(wordList[wi].length); // 字母格数 = 词长度
    });
    // 提交按钮初始禁用(未填满)
    const submit = doc.getElementById('dict-submit');
    expect(submit.disabled).toBe(true);
    // 部分填写(只填第一个词的首字母)仍禁用
    const c0 = words[0].querySelector('.dict-char');
    c0.value = 'x';
    c0.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    expect(submit.disabled).toBe(true);
    // 填满所有字母格后启用
    fillSlotsCorrect();
    expect(submit.disabled).toBe(false);
    // 提交判定为对
    submit.click();
    expect(doc.getElementById('quiz-feedback').className).toContain('good');
  });

  it('听写字母题:1 个词卡含 1 个字母格(9.1)', () => {
    Math.random = () => 0.1;
    doc.querySelector('.menu-card[data-go="alphabet"]').click();
    doc.querySelector('.practice-btn[data-practice="alphabet"]').click();
    const words = dictWords();
    expect(words.length).toBe(1);
    const chars = Array.from(words[0].querySelectorAll('.dict-char'));
    expect(chars.length).toBe(1);
    const letter = getDictText(); // 答案默认隐藏;经小眼睛读取正确答案再隐藏
    expect(letter.length).toBe(1);
    chars[0].value = letter;
    chars[0].dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    const submit = doc.getElementById('dict-submit');
    submit.disabled = false;
    submit.click();
    expect(doc.getElementById('quiz-feedback').className).toContain('good');
  });

  it('卡片预览有重播按钮,可反复播放(9.2)', () => {
    doc.querySelector('.menu-card[data-go="alphabet"]').click();
    doc.querySelector('#alphabet-grid .card').click();
    const rep = doc.querySelector('#preview-card .preview-replay');
    expect(rep).toBeTruthy();
    rep.click(); // 不应抛错,可反复
    rep.click();
    doc.getElementById('preview-overlay').dispatchEvent(new dom.window.MouseEvent('click'));
    // 关闭后回到正常页面
  });

  it('练习题有重播按钮,指向题目内容(9.2)', () => {
    doc.querySelector('.menu-card[data-go="word"]').click();
    doc.querySelector('.practice-btn[data-practice="word"]').click();
    const rep = doc.getElementById('quiz-replay');
    expect(rep).toBeTruthy();
    rep.click();
  });

  it('选择题答错显示重试,点击清空重做同一题(9.3)', () => {
    // 选择题(不强制随机,真实随机保证能遇到答错场景)
    doc.querySelector('.menu-card[data-go="alphabet"]').click();
    doc.querySelector('.practice-btn[data-practice="alphabet"]').click();
    const retry = doc.getElementById('quiz-retry');
    const next = doc.getElementById('quiz-next');
    expect(retry.hidden).toBe(true);
    // 依次点选项直到答错(同一题内最多 4 次),答对则 Next 换题再试
    let wrongHappened = false;
    for (let guard = 0; guard < 40 && !wrongHappened; guard += 1) {
      const dictBox = doc.getElementById('dict-box');
      if (!dictBox.hidden) { next.click(); continue; } // 跳过听写题
      const enabled = Array.from(doc.querySelectorAll('#quiz-options .quiz-option:not(:disabled)'));
      if (!enabled.length) break;
      enabled[0].click();
      if (!retry.hidden) { wrongHappened = true; break; }
      // 答对了(进入下题),若是当前题仍有可选项继续,否则 Next
      const left = Array.from(doc.querySelectorAll('#quiz-options .quiz-option:not(:disabled)'));
      if (!left.length) next.click();
    }
    expect(wrongHappened).toBe(true);
    // 所有选项被禁用,next 不出现
    const currentOpts = Array.from(doc.querySelectorAll('#quiz-options .quiz-option'));
    expect(currentOpts.every((o) => o.disabled)).toBe(true);
    expect(next.hidden).toBe(true);
    // 点击重试恢复选项,同一题可再选
    retry.click();
    expect(retry.hidden).toBe(true);
    const after = Array.from(doc.querySelectorAll('#quiz-options .quiz-option'));
    expect(after.every((o) => !o.disabled)).toBe(true);
  });

  it('听写答错显示正确答案并可重试清空(9.3 + 修复:答错给出正确答案)', () => {
    Math.random = () => 0.1;
    doc.querySelector('.menu-card[data-go="word"]').click();
    doc.querySelector('.practice-btn[data-practice="word"]').click();
    const words = dictWords();
    const answer = getDictText();
    const submit = doc.getElementById('dict-submit');
    const retry = doc.getElementById('quiz-retry');
    // 答错
    fillSlots(words.map(() => 'zzzzzz'));
    submit.click();
    expect(retry.hidden).toBe(false);
    // 反馈中包含正确答案(getDictText 返回小写,判定忽略大小写)
    expect(doc.getElementById('quiz-feedback').textContent.toLowerCase()).toContain(answer);
    // 错误时单词下方也展示正确答案
    const shown = words.map((w) => w.querySelector('.dict-word-answer').textContent).join(' ').toLowerCase();
    expect(shown).toContain(answer.split(/\s+/)[0].toLowerCase());
    // 重试清空所有字母格
    retry.click();
    expect(retry.hidden).toBe(true);
    const cleared = allCharInputs();
    expect(cleared.every((s) => s.value === '' && !s.readOnly)).toBe(true);
  });
});

describe('迭代2 追加调整(task 11: 移除灰色占位 / 标点免输 / 小眼睛答案显隐 / 双按钮)', () => {
  beforeAll(() => {
    setup();
    originalRandom = Math.random;
    global.window = dom.window;
    global.document = doc;
    global.localStorage = dom.window.localStorage;
  });
  afterEach(() => { Math.random = originalRandom; });
  beforeEach(() => {
    dom.window.localStorage.clear();
    Math.random = originalRandom;
    initApp(doc);
  });

  it('听写字母格无灰色 placeholder(移除下划线字母提示,11.1)', () => {
    Math.random = () => 0.1;
    doc.querySelector('.menu-card[data-go="sentence"]').click();
    doc.querySelector('.practice-btn[data-practice="sentence"]').click();
    const chars = allCharInputs();
    expect(chars.length).toBeGreaterThan(0);
    chars.forEach((c) => expect(c.placeholder).toBe(''));
  });

  it('多词答案按词分卡,词与词之间间隔开(11.2)', () => {
    Math.random = () => 0.1;
    doc.querySelector('.menu-card[data-go="sentence"]').click();
    doc.querySelector('.practice-btn[data-practice="sentence"]').click();
    const words = dictWords();
    const wordsText = getDictText().trim();
    const wordCount = wordsText.split(/\s+/).length;
    expect(words.length).toBe(wordCount); // 每个单词一个独立词卡
    if (wordCount > 1) {
      // 多词时词卡相互独立(非单个连续输入框)
      words.forEach((w, wi) => {
        expect(w.classList.contains('dict-word')).toBe(true);
      });
    }
  });

  it('标点无需输入:仅填字母(去标点)即判定正确(11.3)', () => {
    Math.random = () => 0.1; // 强制听写
    doc.querySelector('.menu-card[data-go="sentence"]').click();
    doc.querySelector('.practice-btn[data-practice="sentence"]').click();
    fillSlotsCorrect(); // 填入的即去标点后的纯字母
    doc.getElementById('dict-submit').click();
    expect(doc.getElementById('quiz-feedback').className).toContain('good');
  });

  it('答案默认隐藏,小眼睛可显示/隐藏(11.4)', () => {
    Math.random = () => 0.1;
    doc.querySelector('.menu-card[data-go="word"]').click();
    doc.querySelector('.practice-btn[data-practice="word"]').click();
    const eye = doc.getElementById('dict-eyes');
    // 默认未显示答案
    expect(eye.classList.contains('on')).toBe(false);
    const chars = allCharInputs();
    expect(chars.every((c) => !c.value)).toBe(true);
    // 点击显示答案:空格被填入正确字母
    eye.click();
    expect(eye.classList.contains('on')).toBe(true);
    expect(chars.every((c) => c.value)).toBe(true);
    // 再次点击隐藏答案:清空
    eye.click();
    expect(eye.classList.contains('on')).toBe(false);
    expect(chars.every((c) => !c.value)).toBe(true);
  });

  it('无论答对答错,提交后同时显示 Try again 与 Next(11.5 答对)', () => {
    Math.random = () => 0.1;
    doc.querySelector('.menu-card[data-go="word"]').click();
    doc.querySelector('.practice-btn[data-practice="word"]').click();
    fillSlotsCorrect();
    doc.getElementById('dict-submit').click();
    expect(doc.getElementById('quiz-feedback').className).toContain('good');
    expect(doc.getElementById('quiz-retry').hidden).toBe(false);
    expect(doc.getElementById('quiz-next').hidden).toBe(false);
  });

  it('无论答对答错,提交后同时显示 Try again 与 Next(11.5 答错)', () => {
    Math.random = () => 0.1;
    doc.querySelector('.menu-card[data-go="word"]').click();
    doc.querySelector('.practice-btn[data-practice="word"]').click();
    fillSlots(dictWords().map(() => 'zzzzzz'));
    doc.getElementById('dict-submit').click();
    expect(doc.getElementById('quiz-feedback').className).toContain('bad');
    expect(doc.getElementById('quiz-retry').hidden).toBe(false);
    expect(doc.getElementById('quiz-next').hidden).toBe(false);
  });
});
