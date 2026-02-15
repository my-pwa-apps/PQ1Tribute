/* ── Badge of Honor — Procedural Audio Engine ──
 * SN76496-inspired PSG + FM synthesis for police/crime game
 * All sounds generated procedurally — zero audio files
 */

'use strict';

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            this.enabled = false;
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /** Square wave tone (SN76496 style) */
    squareWave(freq, duration, volume = 0.15) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    /** LFSR noise channel (SN76496 noise) */
    noise(duration, volume = 0.08) {
        if (!this.enabled || !this.ctx) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lfsr = 0x7FFF;
        for (let i = 0; i < bufferSize; i++) {
            const bit = ((lfsr >> 0) ^ (lfsr >> 1)) & 1;
            lfsr = (lfsr >> 1) | (bit << 14);
            data[i] = (lfsr & 1) ? 1.0 : -1.0;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        source.connect(gain);
        gain.connect(this.masterGain);
        source.start(this.ctx.currentTime);
    }

    // ── Game sound effects ──

    footstep() {
        this.squareWave(80 + Math.random() * 40, 0.05, 0.06);
        this.noise(0.03, 0.04);
    }

    doorOpen() {
        this.squareWave(200, 0.1, 0.1);
        setTimeout(() => this.squareWave(280, 0.15, 0.08), 60);
        this.noise(0.2, 0.05);
    }

    doorClose() {
        this.squareWave(180, 0.08, 0.1);
        this.noise(0.15, 0.06);
    }

    itemPickup() {
        this.squareWave(440, 0.08, 0.1);
        setTimeout(() => this.squareWave(660, 0.08, 0.1), 80);
        setTimeout(() => this.squareWave(880, 0.12, 0.08), 160);
    }

    error() {
        this.squareWave(200, 0.15, 0.12);
        setTimeout(() => this.squareWave(150, 0.2, 0.1), 100);
    }

    radioStatic() {
        this.noise(0.3, 0.12);
        this.squareWave(800 + Math.random() * 200, 0.05, 0.04);
    }

    radioBeep() {
        this.squareWave(1200, 0.06, 0.1);
        setTimeout(() => this.squareWave(1000, 0.06, 0.1), 80);
    }

    siren(duration = 1.5) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(900, this.ctx.currentTime + duration * 0.5);
        osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime + duration * 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    gunshot() {
        this.noise(0.25, 0.25);
        this.squareWave(100, 0.08, 0.2);
        this.squareWave(60, 0.15, 0.15);
    }

    handcuffs() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.squareWave(2000 + Math.random() * 500, 0.03, 0.06);
                this.noise(0.02, 0.03);
            }, i * 80);
        }
    }

    typewriter() {
        this.squareWave(800 + Math.random() * 400, 0.02, 0.04);
        this.noise(0.01, 0.03);
    }

    phoneRing() {
        this.squareWave(440, 0.15, 0.1);
        setTimeout(() => this.squareWave(480, 0.15, 0.1), 200);
    }

    carStart() {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(40, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 1.2);
        this.noise(0.4, 0.04);
    }

    scorePoint() {
        this.squareWave(523, 0.1, 0.1);
        setTimeout(() => this.squareWave(659, 0.1, 0.1), 100);
        setTimeout(() => this.squareWave(784, 0.15, 0.08), 200);
    }

    death() {
        const notes = [392, 349, 330, 262, 196];
        notes.forEach((freq, i) => {
            setTimeout(() => this.squareWave(freq, 0.3, 0.12), i * 250);
        });
    }

    victory() {
        const notes = [523, 659, 784, 1047, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.squareWave(freq, 0.2, 0.1), i * 150);
        });
    }

    roomTransition() {
        this.squareWave(300, 0.05, 0.05);
        setTimeout(() => this.squareWave(400, 0.05, 0.05), 50);
    }

    /** Ambient police station hum */
    ambientStation() {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 60;
        gain.gain.value = 0.015;
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 2);
    }
}

// Global instance
const audio = new AudioEngine();
