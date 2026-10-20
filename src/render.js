// DOM 渲染与交互(浏览器环境)。纯逻辑在 data/quiz/coins/dictation/mistakes 中,由单元测试覆盖;
// 此处为副作用代码,由 jsdom 冒烟测试与手动走查覆盖(见 design)。
import { ALPHABET, WORD_CATEGORIES, SENTENCE_THEMES, ANIMATIONS } from './data.js';
import { speak } from './tts.js';
import { generateQuestion, isCorrect } from './quiz.js';
import { loadCoins, saveCoins, addCoins } from './coins.js';
import {
  pickQuizType,
  QUIZ_TYPE_CHOICE,
  QUIZ_TYPE_DICTATION,
  judgeAnswer,
  wordsOfAnswer,
} from './dictation.js';
import { recordMistake, getMistakes } from './mistakes.js';

const VIEWS = ['home', 'alphabet', 'word', 'sentence', 'animation', 'notebook', 'quiz'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

let currentPracticeModule = 'alphabet';

export function initApp(doc = document) {
  const coinCountEl = doc.getElementById('coin-count');
  let coins = loadCoins();
  coinCountEl.textContent = String(coins);

  const showView = (view) => {
    for (const v of VIEWS) {
      const el = doc.getElementById('view-' + v);
      if (el) el.classList.toggle('active', v === view);
    }
    const backBtn = doc.getElementById('back-btn');
    if (backBtn) backBtn.hidden = view === 'home';
    const nb = doc.getElementById('notebook-btn');
    if (nb) nb.classList.toggle('active', view === 'notebook');
  };

  const titleEl = doc.getElementById('app-title');
  const setTitle = (t) => { titleEl.textContent = t; };

  // ---- 卡片居中预览(task 1.1 / 1.2 / 9.2 重播发音) ----
  const overlay = doc.getElementById('preview-overlay');
  const previewCard = doc.getElementById('preview-card');

  const openPreview = (parts) => {
    if (!overlay || !previewCard) return;
    previewCard.innerHTML = '';
    if (parts.letter) {
      const el = doc.createElement('span');
      el.className = 'card-letter';
      el.textContent = parts.letter;
      previewCard.appendChild(el);
    }
    if (parts.emoji) {
      const el = doc.createElement('span');
      el.className = 'card-emoji' + (parts.bigEmoji ? ' big' : '');
      el.textContent = parts.emoji;
      previewCard.appendChild(el);
    }
    if (parts.word) {
      const el = doc.createElement('span');
      el.className = 'card-word';
      el.textContent = parts.word;
      previewCard.appendChild(el);
    }
    // 重播发音按钮
    if (parts.speakText) {
      const rep = doc.createElement('button');
      rep.className = 'preview-replay';
      rep.textContent = '🔊 再听一次';
      rep.addEventListener('click', () => speak(parts.speakText));
      previewCard.appendChild(rep);
    }
    overlay.hidden = false;
  };

  const closePreview = () => {
    if (!overlay) return;
    overlay.hidden = true;
    if (previewCard) previewCard.innerHTML = '';
  };

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePreview();
    });
  }

  // ---- 首页入口 ----
  const menuCards = doc.querySelectorAll('.menu-card');
  menuCards.forEach((card) => {
    card.addEventListener('click', () => {
      const go = card.getAttribute('data-go');
      if (!go) return;
      if (go === 'animation') renderAnimation();
      else if (go === 'notebook') renderNotebook();
      else refreshModule(go);
      showView(go);
    });
  });

  // ---- 返回按钮 ----
  const backBtn = doc.getElementById('back-btn');
  backBtn.addEventListener('click', () => {
    resetQuiz();
    showView('home');
    setTitle("Let's Learn English!");
  });

  // ---- 错题本入口(task 7.1) ----
  const notebookBtn = doc.getElementById('notebook-btn');
  if (notebookBtn) {
    notebookBtn.addEventListener('click', () => {
      renderNotebook();
      showView('notebook');
      setTitle('错题本');
    });
  }

  const refreshModule = (go) => {
    if (go === 'alphabet') { renderAlphabet(); setTitle('ABC'); }
    else if (go === 'word') { renderWords(); setTitle('Words'); }
    else if (go === 'sentence') { renderSentences(); setTitle('Sentences'); }
  };

  // ---- 字母模块 ----
  const renderAlphabet = () => {
    const grid = doc.getElementById('alphabet-grid');
    grid.innerHTML = '';
    for (const item of ALPHABET) {
      const card = doc.createElement('button');
      card.className = 'card alphabet-card';
      card.innerHTML = '<span class="card-letter">' + item.letter + '</span><span class="card-emoji">' + item.emoji + '</span><span class="card-word">' + item.word + '</span>';
      card.addEventListener('click', () => {
        speak(item.letter);
        openPreview({ letter: item.letter, emoji: item.emoji, word: item.word, speakText: item.letter });
      });
      grid.appendChild(card);
    }
  };

  // ---- 单词模块 ----
  let currentCat = WORD_CATEGORIES[0]?.id;
  const renderWordTabs = () => {
    const tabs = doc.getElementById('word-tabs');
    tabs.innerHTML = '';
    for (const cat of WORD_CATEGORIES) {
      const tab = doc.createElement('button');
      tab.className = 'tab' + (cat.id === currentCat ? ' active' : '');
      tab.textContent = cat.label;
      tab.addEventListener('click', () => {
        currentCat = cat.id;
        renderWordTabs();
        renderWordGrid();
      });
      tabs.appendChild(tab);
    }
  };
  const renderWordGrid = () => {
    const cat = WORD_CATEGORIES.find((c) => c.id === currentCat);
    const grid = doc.getElementById('word-grid');
    grid.innerHTML = '';
    if (!cat) return;
    for (const w of cat.words) {
      const card = doc.createElement('button');
      card.className = 'card';
      card.innerHTML = '<span class="card-emoji big">' + w.emoji + '</span><span class="card-word">' + w.en + '</span>';
      card.addEventListener('click', () => {
        speak(w.en);
        openPreview({ emoji: w.emoji, bigEmoji: true, word: w.en, speakText: w.en });
      });
      grid.appendChild(card);
    }
  };
  const renderWords = () => {
    renderWordTabs();
    renderWordGrid();
  };

  // ---- 句子模块 ----
  let currentTheme = SENTENCE_THEMES[0]?.id;
  const renderSentenceTabs = () => {
    const tabs = doc.getElementById('sentence-tabs');
    tabs.innerHTML = '';
    for (const theme of SENTENCE_THEMES) {
      const tab = doc.createElement('button');
      tab.className = 'tab' + (theme.id === currentTheme ? ' active' : '');
      tab.textContent = theme.label;
      tab.addEventListener('click', () => {
        currentTheme = theme.id;
        renderSentenceTabs();
        renderSentenceGrid();
      });
      tabs.appendChild(tab);
    }
  };
  const renderSentenceGrid = () => {
    const theme = SENTENCE_THEMES.find((t) => t.id === currentTheme);
    const grid = doc.getElementById('sentence-grid');
    grid.innerHTML = '';
    if (!theme) return;
    for (const s of theme.sentences) {
      const card = doc.createElement('button');
      card.className = 'card';
      card.innerHTML = '<span class="card-emoji big">' + s.emoji + '</span><span class="card-word">' + s.en + '</span>';
      card.addEventListener('click', () => {
        speak(s.en);
        openPreview({ emoji: s.emoji, bigEmoji: true, word: s.en, speakText: s.en });
      });
      grid.appendChild(card);
    }
  };
  const renderSentences = () => {
    renderSentenceTabs();
    renderSentenceGrid();
  };

  // ---- 动画模块(task 3) ----
  const renderAnimation = () => {
    const listEl = doc.getElementById('anime-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    if (!ANIMATIONS.length) {
      listEl.innerHTML = '<p class="anime-placeholder">🎬 暂无动画内容</p>';
      return;
    }
    for (const a of ANIMATIONS) {
      const btn = doc.createElement('button');
      btn.className = 'anime-item';
      btn.innerHTML = '<span class="anime-icon">🎬</span><span class="anime-label">' + a.title + '</span>';
      btn.addEventListener('click', () => playAnimation(a));
      listEl.appendChild(btn);
    }
    playAnimation(ANIMATIONS[0]);
  };

  const playAnimation = (cfg) => {
    const playerEl = doc.getElementById('anime-player');
    const videoEl = doc.getElementById('anime-video');
    const titleEl2 = doc.getElementById('anime-title');
    const phEl = doc.getElementById('anime-placeholder');
    if (!playerEl || !videoEl) return;
    playerEl.hidden = false;
    if (titleEl2) titleEl2.textContent = cfg.title || '';
    phEl.hidden = true;
    videoEl.hidden = false;
    videoEl.src = cfg.src;
    const fail = () => {
      videoEl.hidden = true;
      phEl.hidden = false;
    };
    videoEl.onerror = fail;
    const playPromise = typeof videoEl.play === 'function' ? videoEl.play() : null;
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {});
    }
  };

  // ---- 错题本渲染(task 6 / 7.2) ----
  const renderNotebook = () => {
    const listEl = doc.getElementById('note-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    const list = getMistakes();
    if (!list.length) {
      const p = doc.createElement('p');
      p.className = 'note-empty';
      p.textContent = '还没有错题，加油！🌟';
      listEl.appendChild(p);
      return;
    }
    for (const m of list.slice().reverse()) {
      const item = doc.createElement('div');
      item.className = 'note-item';
      const t = m.ts ? new Date(m.ts) : null;
      const timeStr = t ? (t.getMonth() + 1) + '/' + t.getDate() + ' ' + pad(t.getHours()) + ':' + pad(t.getMinutes()) : '';
      item.innerHTML =
        '<div class="note-prompt">题目：' + escapeHtml(m.prompt || '') + '</div>' +
        '<div>你的答案：<span class="note-wrong">' + escapeHtml(m.userAnswer || '(空)') + '</span></div>' +
        '<div>正确答案：<span class="note-answer">' + escapeHtml(m.answer || '') + '</span></div>' +
        '<div class="note-meta">' + escapeHtml(moduleLabel(m.module)) + ' · ' + timeStr + '</div>';
      listEl.appendChild(item);
    }
  };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function moduleLabel(module) {
    if (module === 'alphabet') return '字母';
    if (module === 'word') return '单词';
    if (module === 'sentence') return '句子';
    return '';
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---- 练习入口 ----
  const practiceBtns = doc.querySelectorAll('.practice-btn[data-practice]');
  practiceBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      currentPracticeModule = btn.getAttribute('data-practice');
      startQuiz();
      showView('quiz');
    });
  });

  // ---- 问答状态 ----
  let quizAnswer = '';
  let quizPool = [];
  let currentQuizType = QUIZ_TYPE_CHOICE;
  let currentReplay = ''; // 当前题可重播的发音文本

  function poolFor(module) {
    if (module === 'alphabet') return ALPHABET;
    if (module === 'word') {
      const cat = WORD_CATEGORIES.find((c) => c.id === currentCat);
      return cat ? cat.words : [];
    }
    const theme = SENTENCE_THEMES.find((t) => t.id === currentTheme);
    return theme ? theme.sentences : [];
  }
  function textFor(module, item) {
    if (module === 'alphabet') return item.letter;
    return item.en;
  }

  const resetQuiz = () => {
    const fb = doc.getElementById('quiz-feedback');
    const next = doc.getElementById('quiz-next');
    const retry = doc.getElementById('quiz-retry');
    if (fb) { fb.textContent = ''; fb.className = 'quiz-feedback'; }
    if (next) next.hidden = true;
    if (retry) retry.hidden = true;
    setTitle(gotoTitle(currentPracticeModule));
  };

  function gotoTitle(module) {
    if (module === 'alphabet') return 'Practice ABC';
    if (module === 'word') return 'Practice Words';
    return 'Practice Sentences';
  }

  const startQuiz = () => {
    quizPool = poolFor(currentPracticeModule);
    setTitle(gotoTitle(currentPracticeModule));
    newQuestion();
  };

  const handleWrong = (promptText, answer, userAnswer) => {
    recordMistake({
      module: currentPracticeModule,
      prompt: promptText,
      answer,
      userAnswer,
    });
  };

  const rewardCoins = (anchor) => {
    coins = addCoins(loadCoins());
    saveCoins(coins);
    coinCountEl.textContent = String(coins);
    spawnCoins(anchor || coinCountEl);
  };

  // 每道题都要绑定可重复播放的按钮(task 9.2)
  const bindReplay = (text) => {
    const rep = doc.getElementById('quiz-replay');
    if (!rep) return;
    currentReplay = text;
    const handler = () => speak(currentReplay);
    rep.onclick = handler;
  };

  // ---- 新题目:随机题型(task 4.1) ----
  const newQuestion = () => {
    const fb = doc.getElementById('quiz-feedback');
    const next = doc.getElementById('quiz-next');
    const retry = doc.getElementById('quiz-retry');
    const optionsEl = doc.getElementById('quiz-options');
    const dictBox = doc.getElementById('dict-box');
    if (fb) { fb.textContent = ''; fb.className = 'quiz-feedback'; }
    if (next) next.hidden = true;
    if (retry) retry.hidden = true;
    if (!quizPool.length) {
      fb.textContent = 'No items yet!';
      return;
    }
    currentQuizType = pickQuizType(0.5);
    if (currentQuizType === QUIZ_TYPE_DICTATION) {
      optionsEl.hidden = true;
      optionsEl.innerHTML = '';
      dictBox.hidden = false;
      buildDictation();
    } else {
      dictBox.hidden = true;
      optionsEl.hidden = false;
      buildChoice(optionsEl, next);
    }
  };

  // ---- 选择题构建 ----
  const buildChoice = (optionsEl, next) => {
    const q = generateQuestion(quizPool, 4, (item) => textFor(currentPracticeModule, item));
    const target = quizPool.find((item) => textFor(currentPracticeModule, item) === q.answerText);
    quizAnswer = q.answerText;
    const speakText = target ? textFor(currentPracticeModule, target) : '';
    bindReplay(speakText);
    if (speakText) speak(speakText);

    const prompt = doc.getElementById('quiz-prompt');
    prompt.textContent = 'Which is the answer?';

    optionsEl.innerHTML = '';
    for (const opt of q.options) {
      const btn = doc.createElement('button');
      btn.className = 'quiz-option';
      if (currentPracticeModule === 'alphabet') {
        btn.textContent = opt;
      } else {
        const item = quizPool.find((x) => textFor(currentPracticeModule, x) === opt);
        btn.innerHTML = item && item.emoji ? item.emoji + ' ' + opt : opt;
      }
      btn.addEventListener('click', () => onChoiceAnswer(opt, btn, optionsEl, next));
      optionsEl.appendChild(btn);
    }
  };

  const onChoiceAnswer = (chosen, btn, optionsEl, next) => {
    const fb = doc.getElementById('quiz-feedback');
    const retry = doc.getElementById('quiz-retry');
    const correct = isCorrect(chosen, quizAnswer);
    const btns = Array.from(optionsEl.querySelectorAll('.quiz-option'));
    if (correct) {
      fb.textContent = 'Great job! 🎉';
      fb.className = 'quiz-feedback good';
      btns.forEach((b) => { b.disabled = true; });
      retry.hidden = true;
      next.hidden = false;
      rewardCoins(btn);
    } else {
      fb.textContent = 'Try again! 😊';
      fb.className = 'quiz-feedback bad';
      // 答错:禁用选项,显示重试按钮(task 9.3)
      btns.forEach((b) => { b.disabled = true; });
      retry.hidden = false;
      handleWrong('Which is the answer?', quizAnswer, chosen);
    }
  };

  // 重试:清空当前选择题作答状态,恢复选项可点(task 9.3)
  const retryChoice = () => {
    const fb = doc.getElementById('quiz-feedback');
    const retry = doc.getElementById('quiz-retry');
    const optionsEl = doc.getElementById('quiz-options');
    if (fb) { fb.textContent = ''; fb.className = 'quiz-feedback'; }
    if (retry) retry.hidden = true;
    const btns = optionsEl.querySelectorAll('.quiz-option');
    btns.forEach((b) => { b.disabled = false; });
  };

  // ---- 听写题构建(每词一个词卡片,卡内按字母数显示下划线格,逐字母填入;答错显示正确答案) ----
  let dictAnswer = '';
  let dictWordAnswers = []; // 各单词的正确答案
  let dictTotalChars = 0;   // 总字母格数
  let dictActiveIndex = 0;  // 当前活跃字母格的全序索引

  const buildDictation = () => {
    const idx = Math.floor(Math.random() * quizPool.length);
    const item = quizPool[idx];
    const answer = textFor(currentPracticeModule, item);
    dictAnswer = answer;
    quizAnswer = answer;
    bindReplay(answer);
    if (answer) speak(answer);

    const prompt = doc.getElementById('quiz-prompt');
    prompt.textContent = currentPracticeModule === 'alphabet'
      ? 'Listen and type the letter'
      : 'Listen and type what you hear';

    // 字母题:1 个单词(字母);单词/句子:按空格分词(去除标点,孩子无需输入标点)
    const words = currentPracticeModule === 'alphabet'
      ? [answer]
      : wordsOfAnswer(answer);
    dictWordAnswers = words;

    const blanks = doc.getElementById('dict-blanks');
    if (blanks) blanks.textContent = words.map(() => '____').join('  ');

    const slotsEl = doc.getElementById('dict-slots');
    slotsEl.innerHTML = '';
    const allChars = [];
    words.forEach((word, wIndex) => {
      const wordEl = doc.createElement('div');
      wordEl.className = 'dict-word';
      const charsEl = doc.createElement('div');
      charsEl.className = 'dict-chars';
      for (let c = 0; c < word.length; c += 1) {
        const ch = doc.createElement('input');
        ch.className = 'dict-char';
        ch.type = 'text';
        ch.maxLength = 1;
        ch.autocomplete = 'off';
        ch.dataset.wordIdx = String(wIndex);
        ch.addEventListener('input', () => onCharInput());
        ch.addEventListener('keydown', onCharKeydown);
        ch.addEventListener('focus', () => { dictActiveIndex = Array.prototype.indexOf.call(allChars, ch); });
        charsEl.appendChild(ch);
        allChars.push(ch);
      }
      wordEl.appendChild(charsEl);
      // 单词答案提示行(默认隐藏,判定后用于展示正确答案)
      const ansLine = doc.createElement('div');
      ansLine.className = 'dict-word-answer';
      ansLine.textContent = '';
      wordEl.appendChild(ansLine);
      slotsEl.appendChild(wordEl);
    });
    dictTotalChars = allChars.length;
    dictActiveIndex = 0;
    if (allChars.length && typeof allChars[0].focus === 'function') allChars[0].focus();

    buildVirtualKeyboard();
    resetEyes();
    const submitBtn = doc.getElementById('dict-submit');
    if (submitBtn) submitBtn.onclick = submitDictation;
    updateDictSubmit();
  };

  // ---- 答案显隐切换(默认隐藏,task 11.4) ----
  let eyesShown = false;
  let eyesRevealed = new Set();
  const resetEyes = () => {
    eyesShown = false;
    eyesRevealed = new Set();
    const eye = doc.getElementById('dict-eyes');
    if (eye) { eye.textContent = '👁'; eye.classList.remove('on'); }
  };
  const toggleEyes = () => {
    const chars = allCharInputs();
    if (!chars.length) return;
    eyesShown = !eyesShown;
    const eye = doc.getElementById('dict-eyes');
    if (eye) { eye.textContent = eyesShown ? '🙈' : '👁'; eye.classList.toggle('on', eyesShown); }
    if (eyesShown) {
      // 显示答案:记录当前空位,只填充这些格子(不覆盖已填内容)
      eyesRevealed = new Set();
      chars.forEach((c, i) => {
        if (!c.value) {
          eyesRevealed.add(i);
          const wIdx = Number(c.dataset.wordIdx);
          const w = dictWordAnswers[wIdx] || '';
          const sameWord = allCharInputs().filter((x) => Number(x.dataset.wordIdx) === wIdx);
          const col = sameWord.indexOf(c);
          c.value = (w[col] || '').toLowerCase();
        }
      });
    } else {
      // 隐藏答案:仅清空这次由眼睛填充的格子,保留孩子已输入的字母
      eyesRevealed.forEach((i) => {
        if (chars[i]) chars[i].value = '';
      });
    }
    updateDictSubmit();
  };

  const allCharInputs = () => Array.from(doc.querySelectorAll('#dict-slots .dict-char'));
  const allWordEls = () => Array.from(doc.querySelectorAll('#dict-slots .dict-word'));

  // 物理键盘:字母 → 当前格;空格/Enter → 跳过完成词;退格 → 前格或上词末
  const onCharKeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitDictation();
      return;
    }
    if (e.key === 'Backspace') {
      const chars = allCharInputs();
      const cur = chars.indexOf(e.target);
      if (e.target.value) {
        e.target.value = '';
        e.preventDefault();
      } else if (cur > 0) {
        focusChar(cur - 1);
      }
      updateDictSubmit();
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      // 跳到下一未完成词的第一个空位
      jumpNextEmpty();
      updateDictSubmit();
      return;
    }
    // 普通字母:填入当前格(限 1 字符),自动跳下一格
    if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      e.target.value = e.key.toLowerCase();
      const chars = allCharInputs();
      const cur = chars.indexOf(e.target);
      if (cur + 1 < chars.length) focusChar(cur + 1);
      updateDictSubmit();
    }
  };

  const onCharInput = () => {
    updateDictSubmit();
  };

  const focusChar = (i) => {
    const chars = allCharInputs();
    if (i >= 0 && i < chars.length) {
      dictActiveIndex = i;
      if (typeof chars[i].focus === 'function') chars[i].focus();
    }
  };

  // 跳到下一个未填写的字母格
  const jumpNextEmpty = () => {
    const chars = allCharInputs();
    for (let i = 0; i < chars.length; i += 1) {
      if (!chars[i].value) { focusChar(i); return; }
    }
  };

  // 虚拟键盘:输出到当前活跃格(或首个空格);字母填当前格;空格跳下一个空;退格删除前格
  const dictInsert = (ch) => {
    const chars = allCharInputs();
    if (!chars.length) return;
    let idx = dictActiveIndex;
    for (let i = 0; i < chars.length; i += 1) {
      if (!chars[i].value) { idx = i; break; }
    }
    if (ch === '⌫') {
      chars[idx].value = '';
      if (idx > 0) focusChar(idx - 1); else focusChar(idx);
    } else if (ch === '␣') {
      jumpNextEmpty();
    } else {
      chars[idx].value = ch.toLowerCase();
      if (idx + 1 < chars.length) focusChar(idx + 1); else focusChar(idx);
    }
    updateDictSubmit();
  };

  const buildVirtualKeyboard = () => {
    const kb = doc.getElementById('dict-keyboard');
    if (!kb) return;
    kb.innerHTML = '';
    const keys = LETTERS.concat(['␣', '⌫']);
    for (const ch of keys) {
      const key = doc.createElement('button');
      key.className = 'key' + (ch === '␣' || ch === '⌫' ? ' wide' : '');
      key.textContent = ch === '␣' ? 'Space' : ch;
      key.addEventListener('click', () => dictInsert(ch));
      kb.appendChild(key);
    }
  };

  const updateDictSubmit = () => {
    const submit = doc.getElementById('dict-submit');
    if (!submit) return;
    const chars = allCharInputs();
    let filled = 0;
    for (const c of chars) { if (c.value) filled += 1; }
    submit.disabled = filled < chars.length;
  };

  const submitDictation = () => {
    const fb = doc.getElementById('quiz-feedback');
    const next = doc.getElementById('quiz-next');
    const retry = doc.getElementById('quiz-retry');
    if (!fb) return;
    const chars = allCharInputs();
    if (chars.length === 0) return;
    const wordEls = allWordEls();
    // 按词重组用户输入
    const userWords = [];
    let allFilled = true;
    let wordIndex = -1;
    for (let i = 0; i < chars.length; i += 1) {
      if (i === 0 || chars[i].dataset.wordIdx !== chars[i - 1].dataset.wordIdx) { wordIndex += 1; userWords.push(''); }
      const v = (chars[i].value || '').trim();
      if (!v) allFilled = false;
      userWords[wordIndex] += v;
    }
    const userInput = userWords.join(' ');
    const ok = allFilled && judgeAnswer(currentPracticeModule, userInput, dictAnswer);
    if (ok) {
      fb.textContent = 'Great job! 🎉';
      fb.className = 'quiz-feedback good';
      markSlots('ok');
      next.hidden = false;
      retry.hidden = false;      // 无论对错都同时显示 Try again 与 Next(task 11.5)
      rewardCoins(slotsElForCoins());
    } else {
      fb.textContent = 'Not quite! 正确答案是：' + dictAnswer;
      fb.className = 'quiz-feedback bad';
      markSlots('err');
      retry.hidden = false;
      next.hidden = false;       // 无论对错都同时显示 Try again 与 Next(task 11.5)
      handleWrong(currentPracticeModule === 'alphabet' ? 'Listen and type the letter' : 'Listen and type what you hear', dictAnswer, userInput);
    }
  };

  const slotsElForCoins = () => doc.getElementById('dict-slots') || doc.getElementById('quiz-feedback');

  const markSlots = (state) => {
    const chars = allCharInputs();
    const wordEls = allWordEls();
    // 逐字母着色
    for (let i = 0; i < chars.length; i += 1) {
      const c = chars[i];
      c.className = 'dict-char ' + state;
      c.readOnly = true;
    }
    // 在错误时展示每个单词的正确答案提示
    if (state === 'err') {
      wordEls.forEach((w, wi) => {
        const ansLine = w.querySelector('.dict-word-answer');
        if (ansLine && dictWordAnswers[wi]) ansLine.textContent = '→ ' + dictWordAnswers[wi];
      });
    }
  };

// 统一重试入口(task 9.3):选择题恢复选项,听写题清空输入格
  const retryCurrent = () => {
    if (currentQuizType === QUIZ_TYPE_DICTATION) {
      retryDictation();
    } else {
      retryChoice();
    }
  };

  // 听写重试:清空所有字母格并解锁,清除答案提示,聚焦第一格
  const retryDictation = () => {
    const fb = doc.getElementById('quiz-feedback');
    const retry = doc.getElementById('quiz-retry');
    const next = doc.getElementById('quiz-next');
    if (fb) { fb.textContent = ''; fb.className = 'quiz-feedback'; }
    if (retry) retry.hidden = true;
    if (next) next.hidden = true;
    const chars = allCharInputs();
    chars.forEach((c) => {
      c.value = '';
      c.className = 'dict-char';
      c.readOnly = false;
    });
    allWordEls().forEach((w) => {
      w.className = 'dict-word';
      const ans = w.querySelector('.dict-word-answer');
      if (ans) ans.textContent = '';
    });
    if (chars.length) focusChar(0);
    resetEyes();
    updateDictSubmit();
  };

  // 练习入口之外:绑定共用控件
  const nextBtn = doc.getElementById('quiz-next');
  if (nextBtn) nextBtn.addEventListener('click', newQuestion);
  const retryBtn = doc.getElementById('quiz-retry');
  if (retryBtn) retryBtn.addEventListener('click', retryCurrent);
  const eyesBtn = doc.getElementById('dict-eyes');
  if (eyesBtn) eyesBtn.addEventListener('click', () => toggleEyes());

  // ---- 金币动画 ----
  const spawnCoins = (anchor) => {
    const layer = doc.getElementById('fx-layer');
    if (!layer) return;
    const rect = anchor.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 8; i += 1) {
      const coin = doc.createElement('div');
      coin.className = 'fx-coin';
      coin.textContent = '💰';
      coin.style.left = cx + 'px';
      coin.style.top = cy + 'px';
      const dx = (Math.random() * 160 - 80);
      const dy = (Math.random() * -120 - 40);
      coin.style.setProperty('--dx', dx + 'px');
      coin.style.setProperty('--dy', dy + 'px');
      layer.appendChild(coin);
      coin.addEventListener('animationend', () => coin.remove());
    }
  };

  // 初始渲染
  renderAlphabet();
  renderWords();
  renderSentences();
  renderNotebook();
}
