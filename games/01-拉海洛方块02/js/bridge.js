/**
 * 🌉 UniversalBridge - 大一统工业级统一宿主接入桥接器与安全沙盒存储
 * 解决全套 10 款小游戏通信协议并轨、指令别名容错、多源消息防御、可见性自动暂停与分数大一统
 */
(function(window) {
    'use strict';

    // 1. 安全沙盒存储代理 (解决 Safari 隐私模式 / 跨域 Iframe 下 localStorage 抛错死机)
    const SafeStorage = {
        _mem: {},
        get(key, fallback = null) {
            try {
                const val = localStorage.getItem(key);
                return val !== null ? JSON.parse(val) : fallback;
            } catch (e) {
                return this._mem[key] !== undefined ? this._mem[key] : fallback;
            }
        },
        set(key, val) {
            try {
                localStorage.setItem(key, JSON.stringify(val));
            } catch (e) {
                this._mem[key] = val;
            }
        },
        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                delete this._mem[key];
            }
        }
    };

    // 2. 指令别名映射表
    const CMD = {
        PAUSE: 'pause', pause: 'pause',
        RESUME: 'resume', resume: 'resume',
        RESTART: 'restart', restart: 'restart',
        SET_MUTE: 'mute', SET_MUTED: 'mute', setMuted: 'mute',
        PING: 'ping', ping: 'ping'
    };

    // 受信任域名白名单 (file:// 的 origin 为 'null')
    const TRUSTED_ORIGINS = new Set([
        'null',
        location.origin,
        'https://sherlockyzz.github.io'
    ]);

    // 3. 统一宿主事件与数据通信总线
    class UniversalBridge {
        constructor(gameId = 'mini-game') {
            this.gameId = gameId;
            this.callbacks = {};
            this.gameInstance = null;

            this._initMessageListener();
            this._initVisibilityListener();
        }

        bindGame(instance) {
            this.gameInstance = instance;
        }

        /**
         * 监听宿主 (Electron 桌宠 / 3D 个人空间 / 博客) 下发的控制指令
         * 兼容 data.action / data.event / data.cmd 与多字段传参
         */
        _initMessageListener() {
            window.addEventListener('message', (event) => {
                // 如果处于嵌入状态，只信任来自父窗口的消息
                if (window.parent && window.parent !== window) {
                    if (event.source !== window.parent) return;
                }
                // Origin 安全校验
                if (event.origin && !TRUSTED_ORIGINS.has(event.origin)) {
                    // 若 origin 与当前页面 origin 一致也放行
                    if (event.origin !== location.origin) return;
                }

                const data = event.data;
                if (!data || typeof data !== 'object') return;

                // 目标游戏校验
                if (data.target && data.target !== this.gameId && data.target !== 'all') return;

                const cmd = CMD[data.action || data.event || data.cmd];
                const g = this.gameInstance;

                if (cmd === 'mute') {
                    const isMuted = !!(data.payload?.muted ?? data.value);
                    (g?.audio || g?.synth)?.setMuted?.(isMuted);
                } else if (cmd === 'ping') {
                    this.emit('PONG', { gameId: this.gameId });
                } else if (cmd && g && typeof g[cmd] === 'function') {
                    g[cmd]();
                }
            });
        }

        /**
         * 监听页面可见性切换：切出或切标签页时自动暂停并挂起音频，切回时恢复音频上下文
         */
        _initVisibilityListener() {
            document.addEventListener('visibilitychange', () => {
                const g = this.gameInstance;
                if (!g) return;
                if (document.hidden) {
                    if (typeof g.pause === 'function') {
                        g.pause();
                    }
                    const audioCtx = (g.audio?.ctx || g.synth?.ctx);
                    if (audioCtx && typeof audioCtx.suspend === 'function') {
                        audioCtx.suspend().catch(() => {});
                    }
                } else {
                    const audioCtx = (g.audio?.ctx || g.synth?.ctx);
                    if (audioCtx && typeof audioCtx.resume === 'function') {
                        audioCtx.resume().catch(() => {});
                    }
                }
            });
        }

        /**
         * 广播核心游戏事件到宿主
         * 同时带齐 type: 'GAME_EVENT', source: 'mini-game-engine', event 与 action 双字段
         */
        emit(name, payload = {}) {
            const message = {
                type: 'GAME_EVENT',
                source: 'mini-game-engine',
                gameId: this.gameId,
                event: name,
                action: name,
                payload: payload,
                timestamp: Date.now()
            };

            // 1. 发送给父级 Iframe
            if (window.parent && window.parent !== window) {
                let targetOrigin = '*';
                try {
                    if (document.referrer) {
                        targetOrigin = new URL(document.referrer).origin;
                    }
                } catch (e) {}

                try {
                    window.parent.postMessage(message, targetOrigin);
                } catch (e) {
                    try {
                        window.parent.postMessage(message, '*');
                    } catch (err) {}
                }
            }

            // 2. 本地订阅者回调 (DOM 原生挂载)
            if (this.callbacks[name]) {
                this.callbacks[name].forEach(cb => {
                    try { cb(payload); } catch(err) { console.error(err); }
                });
            }
        }

        on(eventName, callback) {
            if (!this.callbacks[eventName]) {
                this.callbacks[eventName] = [];
            }
            this.callbacks[eventName].push(callback);
        }

        off(eventName, callback) {
            if (!this.callbacks[eventName]) return;
            if (!callback) {
                delete this.callbacks[eventName];
            } else {
                this.callbacks[eventName] = this.callbacks[eventName].filter(cb => cb !== callback);
            }
        }

        /**
         * 统一分数广播与持久化
         * Payload 汇聚所有历史字段（current, best, score, highScore, currentScore）
         */
        recordScore(score) {
            const prevHigh = this.getHighScore();
            const isNewHigh = score > prevHigh;
            if (isNewHigh) {
                SafeStorage.set(`${this.gameId}_high_score`, score);
            }
            const best = Math.max(score, prevHigh);
            const p = {
                current: score,
                best: best,
                score: score,
                highScore: best,
                currentScore: score
            };
            this.emit('SCORE_UPDATE', p);
            this.emit('ON_SCORE_UPDATE', p);
            if (isNewHigh) {
                this.emit('ON_NEW_HIGH_SCORE', p);
            }
            return best;
        }

        getHighScore() {
            return SafeStorage.get(`${this.gameId}_high_score`, 0);
        }

        saveProgress(data) {
            SafeStorage.set(`${this.gameId}_progress`, data);
            this.emit('PROGRESS_SAVED', data);
            this.emit('ON_PROGRESS_SAVED', data);
        }

        loadProgress(fallback = {}) {
            return SafeStorage.get(`${this.gameId}_progress`, fallback);
        }

        /**
         * 触觉微震动反馈 (Haptic Vibration API)
         */
        vibrate(pattern = 15) {
            try {
                if ('vibrate' in navigator) {
                    navigator.vibrate(pattern);
                }
            } catch (e) {}
        }
    }

    window.SafeStorage = SafeStorage;
    window.UniversalBridge = UniversalBridge;
})(window);
