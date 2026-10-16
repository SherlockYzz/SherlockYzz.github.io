/**
 * 🔊 AudioEngine - 堆叠高塔 (Stack Tower) 专用 Web Audio 合成器
 * 8 声道池化 + 连击音阶琶音 + 完美切片清脆拟真音效 + 零外部静态依赖
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

            // 连击升调音阶 (C大调五声音阶循环升阶 C4 ~ C6)
            this.COMBO_NOTES = [
                261.63, // C4
                293.66, // D4
                329.63, // E4
                392.00, // G4
                440.00, // A4
                523.25, // C5
                587.33, // D5
                659.25, // E5
                783.99, // G5
                880.00, // A5
                1046.50 // C6
            ];

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
         * 普通落盘音效 (温润木块敲击感)
         */
        playLand() {
            if (this.muted) return;
            const ctx = this._getOrCreateContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(360, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            gain.connect(ctx.destination);

            const voice = this._acquireVoice(osc);
            osc.start(now);
            osc.stop(now + 0.09);
            osc.onended = () => { voice.active = false; };
        }

        /**
         * 完美重合连击琶音 (晶莹磬音)
         */
        playPerfect(combo = 0) {
            if (this.muted) return;
            const ctx = this._getOrCreateContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const noteIdx = combo % this.COMBO_NOTES.length;
            const freq = this.COMBO_NOTES[noteIdx];

            // 主音
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            // 谐波增加晶莹感
            const harm = ctx.createOscillator();
            const harmGain = ctx.createGain();
            harm.type = 'sine';
            harm.frequency.setValueAtTime(freq * 2, now);
            harmGain.gain.setValueAtTime(0.08, now);
            harmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);

            harm.connect(harmGain);
            harmGain.connect(ctx.destination);

            const voice = this._acquireVoice(osc);
            osc.start(now);
            harm.start(now);
            osc.stop(now + 0.38);
            harm.stop(now + 0.22);
            osc.onended = () => { voice.active = false; };
        }

        /**
         * 边缘切片掉落音 (轻微破空声)
         */
        playSlice() {
            if (this.muted) return;
            const ctx = this._getOrCreateContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(480, now);
            osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

            osc.connect(gain);
            gain.connect(ctx.destination);

            const voice = this._acquireVoice(osc);
            osc.start(now);
            osc.stop(now + 0.07);
            osc.onended = () => { voice.active = false; };
        }

        /**
         * 游戏失败音效 (深沉下潜低音)
         */
        playGameOver() {
            if (this.muted) return;
            const ctx = this._getOrCreateContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.4);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

            osc.connect(gain);
            gain.connect(ctx.destination);

            const voice = this._acquireVoice(osc);
            osc.start(now);
            osc.stop(now + 0.46);
            osc.onended = () => { voice.active = false; };
        }
    }

    window.AudioEngine = AudioEngine;
})(window);
