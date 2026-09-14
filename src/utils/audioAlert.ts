// High-performance FinTech Web Audio Chime & Haptic Alert Engine
class SoundAlertManager {
  private audioCtx: AudioContext | null = null;
  private hasRequestedPermission = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  // Request browser notification permission once
  public requestNotificationPermission() {
    if (typeof window === 'undefined' || this.hasRequestedPermission) return;
    this.hasRequestedPermission = true;
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } catch {}
  }

  // Play crisp, loud, multi-tone FinTech order chime with vibration
  public playOrderChime(title?: string, body?: string) {
    // 1. Play Synthesized Chime via Web Audio API
    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        const now = ctx.currentTime;

        // Tone 1: Energetic Ping (1046Hz -> 1318Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1046.5, now);
        osc1.frequency.exponentialRampToValueAtTime(1318.5, now + 0.1);
        gain1.gain.setValueAtTime(0.4, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.46);

        // Tone 2: Rich Chime Harmonic (1568Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1568, now + 0.12);
        gain2.gain.setValueAtTime(0.5, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.86);

        // Tone 3: Success Bell Resonance (2093Hz)
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(2093, now + 0.25);
        gain3.gain.setValueAtTime(0.6, now + 0.25);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.start(now + 0.25);
        osc3.stop(now + 1.35);
      }
    } catch (err) {
      console.warn('Web Audio playback error:', err);
    }

    // 3. Trigger Web Push / Desktop Notification if app is in background
    try {
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted' &&
        document.visibilityState !== 'visible'
      ) {
        new Notification(title || '🚨 New Customer Request Arrived!', {
          body: body || 'A customer has submitted a deposit or withdrawal order for clearance.',
          icon: '/logo.png',
          tag: 'incoming-agent-request'
        });
      }
    } catch {}
  }
}

export const soundAlert = new SoundAlertManager();
