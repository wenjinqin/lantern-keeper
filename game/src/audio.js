// Tiny synthesized sound effects with WebAudio — no audio files needed.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type, gain, slideTo) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  shoot() { this.tone(880, 0.08, 'square', 0.05, 320); }
  pop() { this.tone(520, 0.12, 'sine', 0.12, 940); }
  hurt() { this.tone(160, 0.22, 'sawtooth', 0.14, 60); }
  flare() { this.tone(240, 0.4, 'triangle', 0.16, 1200); }
  shard() { this.tone(1320, 0.09, 'sine', 0.07, 1760); }
  wave() { this.tone(392, 0.3, 'triangle', 0.1, 523); }
  over() { this.tone(330, 0.9, 'triangle', 0.12, 82); }
}
