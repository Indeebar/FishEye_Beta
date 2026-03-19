import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { BubbleModule } = NativeModules;

class BubbleManager {
  constructor() {
    this._emitter = BubbleModule ? new NativeEventEmitter(BubbleModule) : null;
  }

  showBubble() {
    if (BubbleModule) BubbleModule.showBubble();
  }

  hideBubble() {
    if (BubbleModule) BubbleModule.hideBubble();
  }

  // verdict: 'DANGEROUS' | 'SUSPICIOUS' | 'SAFE' | 'SCANNING'
  setBubbleVerdict(verdict, url = '', reason = '', reasonHindi = '') {
    if (BubbleModule) BubbleModule.setBubbleVerdict(verdict, url, reason, reasonHindi);
  }

  // callback receives url string
  onUrlCopied(callback) {
    if (!this._emitter) return { remove: () => {} };
    return this._emitter.addListener('UrlCopied', (event) => callback(event.url));
  }

  onBubbleTapped(callback) {
    if (!this._emitter) return { remove: () => {} };
    return this._emitter.addListener('BubbleTapped', callback);
  }
}

export default new BubbleManager();
