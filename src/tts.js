// 语音合成封装(纯逻辑可测)。依赖以参数注入,方便单元测试。

/**
 * 检测语音合成是否可用。
 * @param {object} [env] 注入的环境(window 或自定义),便于测试
 * @returns {boolean}
 */
export function isSpeechSupported(env) {
  const w = env && typeof env === 'object' ? env : (typeof window !== 'undefined' ? window : null);
  return !!(w && w.speechSynthesis && typeof w.speechSynthesis.speak === 'function');
}

/**
 * 用浏览器 TTS 朗读文本。
 * @param {string} text 要朗读的文本
 * @param {string} [lang] 语言,默认 en-US
 * @param {object} [env] 注入的环境,便于测试;缺省时用全局 window
 */
export function speak(text, lang = 'en-US', env) {
  const w = env && typeof env === 'object' ? env : (typeof window !== 'undefined' ? window : null);
  if (!isSpeechSupported(w)) {
    // 不支持时静默降级,不抛错(见 spec: 浏览器不支持时不打断使用)
    return false;
  }
  try {
    const utterance = new w.SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    w.speechSynthesis.cancel();
    w.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
