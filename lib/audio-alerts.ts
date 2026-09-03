// Web Audio API Synthesizer for Institutional Day Trading Alerts

class AudioAlertService {
  private ctx: AudioContext | null = null;
  private isEnabled = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  // Chime for new 15-min Auto Signal / 1m High-Confidence Setup
  public playSignalAlert(isBuy: boolean) {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    if (isBuy) {
      // Ascending chord (C5 -> E5 -> G5)
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.25);

      osc2.frequency.setValueAtTime(261.63, now);
      osc2.frequency.exponentialRampToValueAtTime(392.0, now + 0.25);
    } else {
      // Descending chord (G5 -> Eb5 -> C5)
      osc1.frequency.setValueAtTime(783.99, now);
      osc1.frequency.exponentialRampToValueAtTime(622.25, now + 0.1);
      osc1.frequency.exponentialRampToValueAtTime(523.25, now + 0.25);

      osc2.frequency.setValueAtTime(392.0, now);
      osc2.frequency.exponentialRampToValueAtTime(261.63, now + 0.25);
    }

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.46);
    osc2.stop(now + 0.46);
  }

  // Whale order / Absorption Alert
  public playAbsorptionAlert() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.21);
  }

  // Liquidity Sweep Alert
  public playSweepAlert() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }
}

export const audioAlerts = new AudioAlertService();
