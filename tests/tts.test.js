import { describe, it, expect, vi } from 'vitest';
import { isSpeechSupported, speak } from '../src/tts.js';

function makeEnv({ supported = true } = {}) {
  const speakFn = vi.fn();
  const cancelFn = vi.fn();
  class MockUtterance {
    constructor(text) {
      this.text = text;
      this.lang = '';
    }
  }
  const env = {};
  if (supported) {
    env.speechSynthesis = { speak: speakFn, cancel: cancelFn };
  }
  env.SpeechSynthesisUtterance = MockUtterance;
  return { env, speakFn, cancelFn };
}

describe('isSpeechSupported', () => {
  it('支持时返回 true', () => {
    const { env } = makeEnv();
    expect(isSpeechSupported(env)).toBe(true);
  });

  it('不支持时返回 false', () => {
    const { env } = makeEnv({ supported: false });
    expect(isSpeechSupported(env)).toBe(false);
  });

  it('环境为空时返回 false', () => {
    expect(isSpeechSupported({})).toBe(false);
  });
});

describe('speak', () => {
  it('支持时调用 speechSynthesis.speak 并返回 true', () => {
    const { env, speakFn, cancelFn } = makeEnv();
    const ok = speak('Apple', 'en-US', env);
    expect(ok).toBe(true);
    expect(speakFn).toHaveBeenCalledOnce();
    expect(cancelFn).toHaveBeenCalledOnce();
    expect(speakFn.mock.calls[0][0].lang).toBe('en-US');
    expect(speakFn.mock.calls[0][0].text).toBe('Apple');
  });

  it('默认语言为 en-US', () => {
    const { env, speakFn } = makeEnv();
    speak('Cat', undefined, env);
    expect(speakFn.mock.calls[0][0].lang).toBe('en-US');
  });

  it('不支持时静默返回 false,不抛错', () => {
    const { env } = makeEnv({ supported: false });
    expect(speak('Dog', 'en-US', env)).toBe(false);
  });

  it('抛出异常时安全返回 false', () => {
    const { env } = makeEnv();
    env.speechSynthesis.speak = () => {
      throw new Error('boom');
    };
    expect(speak('Fish', 'en-US', env)).toBe(false);
  });
});
