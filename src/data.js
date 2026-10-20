// 内容数据(纯数据,可测)。v1 直接硬编码;后续接后端时从此处替换为接口获取。

export const ALPHABET = [
  { letter: 'A', emoji: '🍎', word: 'Apple' },
  { letter: 'B', emoji: '🏀', word: 'Ball' },
  { letter: 'C', emoji: '🐱', word: 'Cat' },
  { letter: 'D', emoji: '🐶', word: 'Dog' },
  { letter: 'E', emoji: '🐘', word: 'Elephant' },
  { letter: 'F', emoji: '🐟', word: 'Fish' },
  { letter: 'G', emoji: '🍇', word: 'Grapes' },
  { letter: 'H', emoji: '🐴', word: 'Horse' },
  { letter: 'I', emoji: '🍦', word: 'Ice cream' },
  { letter: 'J', emoji: '🧃', word: 'Juice' },
  { letter: 'K', emoji: '🪁', word: 'Kite' },
  { letter: 'L', emoji: '🦁', word: 'Lion' },
  { letter: 'M', emoji: '🐭', word: 'Mouse' },
  { letter: 'N', emoji: '🐵', word: 'Nose' },
  { letter: 'O', emoji: '🐙', word: 'Orange' },
  { letter: 'P', emoji: '🍍', word: 'Pineapple' },
  { letter: 'Q', emoji: '❓', word: 'Queen' },
  { letter: 'R', emoji: '🐰', word: 'Rabbit' },
  { letter: 'S', emoji: '☀️', word: 'Sun' },
  { letter: 'T', emoji: '🌳', word: 'Tree' },
  { letter: 'U', emoji: '☂️', word: 'Umbrella' },
  { letter: 'V', emoji: '🚐', word: 'Van' },
  { letter: 'W', emoji: '⌚', word: 'Watch' },
  { letter: 'X', emoji: '❌', word: 'Xylophone' },
  { letter: 'Y', emoji: '🥎', word: 'Yoyo' },
  { letter: 'Z', emoji: '🦓', word: 'Zebra' },
];

// 单词分类:每类 8-10 个
export const WORD_CATEGORIES = [
  {
    id: 'animals',
    label: 'Animals',
    words: [
      { en: 'Cat', emoji: '🐱' },
      { en: 'Dog', emoji: '🐶' },
      { en: 'Rabbit', emoji: '🐰' },
      { en: 'Bird', emoji: '🐦' },
      { en: 'Fish', emoji: '🐟' },
      { en: 'Horse', emoji: '🐴' },
      { en: 'Lion', emoji: '🦁' },
      { en: 'Elephant', emoji: '🐘' },
      { en: 'Bear', emoji: '🐻' },
    ],
  },
  {
    id: 'fruit',
    label: 'Fruit',
    words: [
      { en: 'Apple', emoji: '🍎' },
      { en: 'Banana', emoji: '🍌' },
      { en: 'Orange', emoji: '🍊' },
      { en: 'Grapes', emoji: '🍇' },
      { en: 'Strawberry', emoji: '🍓' },
      { en: 'Watermelon', emoji: '🍉' },
      { en: 'Pineapple', emoji: '🍍' },
      { en: 'Cherry', emoji: '🍒' },
    ],
  },
  {
    id: 'colors',
    label: 'Colors',
    words: [
      { en: 'Red', emoji: '🔴' },
      { en: 'Blue', emoji: '🔵' },
      { en: 'Green', emoji: '🟢' },
      { en: 'Yellow', emoji: '🟡' },
      { en: 'Purple', emoji: '🟣' },
      { en: 'Orange', emoji: '🟠' },
      { en: 'Pink', emoji: '🌸' },
      { en: 'Brown', emoji: '🟤' },
    ],
  },
];

// 句子主题:每主题 8-10 句
export const SENTENCE_THEMES = [
  {
    id: 'greetings',
    label: 'Greetings',
    sentences: [
      { en: 'Hello!', emoji: '👋' },
      { en: 'Good morning!', emoji: '🌅' },
      { en: 'Good night!', emoji: '🌙' },
      { en: 'How are you?', emoji: '🙂' },
      { en: 'I am fine.', emoji: '😊' },
      { en: 'Thank you!', emoji: '🙏' },
      { en: 'You are welcome.', emoji: '🤗' },
      { en: 'Goodbye!', emoji: '👋' },
      { en: 'See you later!', emoji: '👋' },
    ],
  },
  {
    id: 'daily-life',
    label: 'Daily Life',
    sentences: [
      { en: 'I am happy.', emoji: '😄' },
      { en: 'I like apples.', emoji: '🍎' },
      { en: 'Let us play!', emoji: '🎈' },
      { en: 'I want water.', emoji: '💧' },
      { en: 'I am hungry.', emoji: '🍽️' },
      { en: 'It is sunny.', emoji: '☀️' },
      { en: 'I am a boy.', emoji: '👦' },
      { en: 'I am a girl.', emoji: '👧' },
      { en: 'I love my family.', emoji: '👨‍👩‍👧' },
    ],
  },
];

// 动画模块配置(配置驱动,可测)。
// v2 阶段内置一条短英文动画;后续接数据库时把该常量替换为接口返回的同构数组即可,
// 播放逻辑(src/render.js)不随之改动。
export const ANIMATIONS = [
  {
    id: 'hello-song',
    title: 'Hello Song',
    src: 'assets/english-demo.mp4',
    poster: '',
  },
];

/**
 * 取第一条可用动画配置,无配置时返回 null。
 * @param {Array} [list] 动画配置数组,默认 ANIMATIONS
 * @returns {object|null}
 */
export function defaultAnimation(list = ANIMATIONS) {
  return Array.isArray(list) && list.length ? list[0] : null;
}
