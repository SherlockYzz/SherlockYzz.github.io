/**
 * 🔊 AudioEngine - 镜光引路 (Laser Optics) 专用 Web Audio 合成器
 * 8 声道池化 + 机械转镜齿轮音 + 晶核高能共振和弦 + 零外部静态依赖
 */
(function(window) {
    'use strict';

    class AudioEngine {
        constructor() {
            this.ctx = null;
            this.isUnlocked = false;
            this.muted = false;
            this.maxVoices = 8;
            this.activeVoices = [];
            this._bindUnlock();
        }

        _getOrCreateContext() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) this.ctx = new AudioCtx();
            }
            if (this.ctx && this.ctx.state === 'suspended' && !this.muted) {
                this.ctx.resume().catch(() => {});
            }
            return this.ctx;
        }

        /**
         * 终极手势解锁 (覆盖捕获阶段 + 播放极短静音缓冲，突破移动端 iOS / Android Web Audio 策略限制)
         */
        unlock() {
            if (this.muted) return;
            const ctx = this._getOrCreateContext();
            if (!ctx) return;

            try {
                const buffer = ctx.createBuffer(1, 1, 22050);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start(0);
            } catch(e) {}

            if (ctx.state === 'suspended') {
                ctx.resume().then(() => {
                    this.isUnlocked = true;
                }).catch(() => {});
            } else {
                this.isUnlocked = true;
            }
        }

        _bindUnlock() {
            const unlockHandler = () => {
                this.unlock();
            };
            // 关键：在 capture 阶段监听，确保在任何内部 stopPropagation 阻断前捕获首次触摸与按键
            const events = ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'keydown'];
            events.forEach(evt => {
                window.addEventListener(evt, unlockHandler, { capture: true, passive: true });
                document.addEventListener(evt, unlockHandler, { capture: true, passive: true });
            });
        }

        /**
         * 8 音道并发管理 (Voice-Stealing)
         */
        _acquireVoice(node) {
            this.activeVoices = this.activeVoices.filter(v => v.active);
            if (this.activeVoices.length >= this.maxVoices) {
                const oldest = this.activeVoices.shift();
                if (oldest && oldest.stop) {
                    try { oldest.stop(); } catch(e) {}
                }
            }
            const voice = { active: true, stop: () => {
                try { node.stop(); } catch(e) {}
                voice.active = false;
            }};
            this.activeVoices.push(voice);
            return voice;
        }

        setMuted(muted) {
            this.muted = !!muted;
            if (this.ctx && this.muted) {
                try { this.ctx.suspend(); } catch(e) {}
            } else if (this.ctx && !this.muted) {
                this.unlock();
            }
        }

        toggleMute() {
            this.setMuted(!this.muted);
            return this.muted;
        }

        /**
         * 机械反光镜旋转齿轮咔哒音
         */
        playRotate() {
            if (this.muted) return;
            const ctx = this._getOrCreateContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(680, now);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.05);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            osc.connect(gain);
            gain.connect(ctx.destination);

            const voice = this._acquireVoice(osc);
            osc.start(now);
            osc.stop(now + 0.06);
            osc.onended = () => { voice.active = false; };
        }

        /**
         * 晶核被激光贯通充能音
         */
        playTargetHit(index = 0) {
            if (this.muted) return;
            const ctx = this._getOrCreateContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const freqs = [659.25, 783.99, 880.00, 1046.50]; // E5, G5, A5, C6
            const freq = freqs[index % freqs.length];

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.15);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);

            const voice = this._acquireVoice(osc);
            osc.start(now);
            osc.stop(now + 0.28);
            osc.onended = () => { voice.active = false; };
        }

        /**
         * 全域共鸣通关和大三和弦
         */
        playVictory() {
            if (this.muted) return;
            const ctx = this._getOrCreateContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
            chord.forEach((freq, idx) => {
                const t = now + idx * 0.09;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(0.16, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

                osc.connect(gain);
                gain.connect(ctx.destination);

                const voice = this._acquireVoice(osc);
                osc.start(t);
                osc.stop(t + 0.55);
                osc.onended = () => { voice.active = false; };
            });
        }
    }

    window.AudioEngine = AudioEngine;
})(window);
