/**
 * Chiikawa 生日森林绘本 · 纯 Web Audio 合成音频与麦克风吹气引擎
 * 零外部音频依赖，兼容 iOS Safari / 微信浏览器用户手势解锁。
 */
(function (global) {
  'use strict';

  const NOTE_FREQ = {
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
    C6: 1046.50, D6: 1174.66, E6: 1318.51
  };

  /**
   * 乐曲数据（每步 = 1/8 拍或 1/4 拍，共 32 步循环）
   */
  const SONGS = {
    birthday: {
      name: '生日快乐八音盒',
      stepMs: 250,
      melody: [
        'G4', 'G4', 'A4', null, 'G4', null, 'C5', null,
        'B4', null, null, null, 'G4', 'G4', 'A4', null,
        'G4', null, 'D5', null, 'C5', null, null, null,
        'G4', 'G4', 'G5', null, 'E5', null, 'C5', 'B4',
        'A4', null, 'F5', 'F5', 'E5', null, 'C5', null,
        'D5', null, 'C5', null, null, null, null, null
      ],
      chords: [
        ['C4', 'E4'], null, null, null, ['C4', 'E4'], null, ['C4', 'G4'], null,
        ['G3', 'B3', 'D4'], null, null, null, ['G3', 'D4'], null, null, null,
        ['G3', 'B3', 'D4'], null, ['G3', 'B3', 'F4'], null, ['C4', 'E4', 'G4'], null, null, null,
        ['C4', 'E4'], null, ['C4', 'E4', 'G4'], null, ['A3', 'C4', 'E4'], null, ['F3', 'A3', 'C4'], null,
        ['F3', 'A3', 'C4'], null, ['F3', 'A3', 'C4'], null, ['C4', 'E4', 'G4'], null, ['A3', 'C4', 'E4'], null,
        ['G3', 'B3', 'D4'], null, ['C4', 'E4', 'G4'], null, null, null, null, null
      ],
      bass: [
        'C3', null, null, null, 'G3', null, 'C3', null,
        'G3', null, null, null, 'D3', null, null, null,
        'G3', null, null, null, 'C3', null, 'G3', null,
        'C3', null, 'E3', null, 'A3', null, 'F3', null,
        'F3', null, 'F3', null, 'C3', null, 'A3', null,
        'G3', null, 'C3', null, null, null, null, null
      ],
      perc: [
        1, 0, 2, 0, 1, 0, 2, 0,
        1, 0, 2, 2, 1, 0, 2, 0,
        1, 0, 2, 0, 1, 0, 2, 2,
        1, 0, 2, 0, 1, 0, 2, 0,
        1, 0, 2, 0, 1, 0, 2, 0,
        1, 0, 1, 2, 0, 0, 2, 0
      ]
    },
    meadow: {
      name: '高三解压治愈小调',
      stepMs: 240,
      melody: [
        'E5', null, 'G5', 'A5', 'G5', null, 'E5', 'D5',
        'C5', null, 'D5', 'E5', 'D5', null, null, null,
        'E5', null, 'G5', 'A5', 'C6', null, 'A5', 'G5',
        'A5', null, 'G5', 'E5', 'D5', null, 'C5', null
      ],
      chords: [
        ['C4', 'E4', 'G4'], null, null, null, ['C4', 'E4', 'G4'], null, null, null,
        ['A3', 'C4', 'E4'], null, null, null, ['G3', 'B3', 'D4'], null, null, null,
        ['F3', 'A3', 'C4'], null, null, null, ['C4', 'E4', 'G4'], null, null, null,
        ['F3', 'A3', 'C4'], null, ['G3', 'B3', 'D4'], null, ['C4', 'E4', 'G4'], null, null, null
      ],
      bass: [
        'C3', null, null, null, 'G3', null, null, null,
        'A3', null, null, null, 'G3', null, null, null,
        'F3', null, null, null, 'C3', null, null, null,
        'F3', null, 'G3', null, 'C3', null, 'G3', null
      ],
      perc: [
        1, 0, 2, 0, 0, 2, 1, 0,
        1, 0, 2, 0, 2, 0, 1, 0,
        1, 0, 2, 0, 0, 2, 1, 0,
        1, 0, 2, 0, 1, 2, 0, 0
      ]
    }
  };

  class ChiikawaAudioEngine {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.playing = false;
      this.currentSong = 'birthday';
      this.stepIndex = 0;
      this.timer = null;
      this.tracks = {
        melody: true,
        chords: true,
        perc: true,
        bass: true
      };
      this.micStream = null;
      this.micRaf = null;
    }

    ensureContext() {
      if (!this.ctx) {
        const AudioCtx = global.AudioContext || global.webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    setMuted(muted) {
      this.muted = muted;
      if (muted && this.playing) {
        this.stopSequencer();
      }
    }

    /** 柔和八音盒单音 */
    playMusicBox(freq, duration = 0.52, volume = 0.14, delay = 0) {
      if (this.muted) return;
      const ctx = this.ensureContext();
      if (!ctx) return;

      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      const gain = ctx.createGain();
      const overGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(freq * 2, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

      overGain.gain.setValueAtTime(0.0001, now);
      overGain.gain.linearRampToValueAtTime(volume * 0.22, now + 0.01);
      overGain.gain.exponentialRampToValueAtTime(0.0005, now + duration * 0.45);

      osc.connect(gain);
      overtone.connect(overGain);
      overGain.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      overtone.start(now);
      osc.stop(now + duration + 0.04);
      overtone.stop(now + duration + 0.04);
    }

    /** 温暖木吉他和弦 */
    playGuitarChord(notes, volume = 0.06) {
      if (this.muted || !notes) return;
      notes.forEach((n, idx) => {
        const f = NOTE_FREQ[n];
        if (!f) return;
        const ctx = this.ensureContext();
        if (!ctx) return;
        const now = ctx.currentTime + idx * 0.025;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0006, now + 0.55);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.58);
      });
    }

    /** 轻柔低音风铃 */
    playBass(noteName) {
      const f = NOTE_FREQ[noteName];
      if (!f) return;
      this.playMusicBox(f, 0.65, 0.1);
    }

    /** 俏皮铃鼓/木鱼轻拍 */
    playPerc(type) {
      if (this.muted || !type) return;
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 1) {
        // 温暖小木鱼
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else {
        // 沙锤轻响
        const bufferSize = Math.floor(ctx.sampleRate * 0.05);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(4200, now);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.055, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      }
    }

    /** 木琴按键音 */
    playXylo(noteName) {
      const f = NOTE_FREQ[noteName];
      if (!f) return;
      this.playMusicBox(f, 0.58, 0.17);
    }

    /** 播放一句生日快乐示范旋律 */
    playBirthdayRiff() {
      const seq = [
        ['G4', 0], ['G4', 0.2], ['A4', 0.42], ['G4', 0.72], ['C5', 1.02], ['B4', 1.34]
      ];
      seq.forEach(([n, t]) => this.playMusicBox(NOTE_FREQ[n], 0.45, 0.15, t));
    }

    /** 角色可爱拟声特效 */
    playCharacterSound(charId) {
      if (this.muted) return;
      const ctx = this.ensureContext();
      if (!ctx) return;

      if (charId === 'usagi') {
        // 呀哈！上扬双音
        this.playMusicBox(620, 0.14, 0.14, 0);
        this.playMusicBox(930, 0.24, 0.15, 0.11);
      } else if (charId === 'hachiware') {
        // 吉他温柔扫弦
        this.playGuitarChord(['C4', 'E4', 'G4', 'C5'], 0.08);
      } else if (charId === 'chiikawa') {
        // 软萌上升泡泡音
        this.playMusicBox(587.33, 0.16, 0.13, 0);
        this.playMusicBox(783.99, 0.22, 0.13, 0.1);
      } else if (charId === 'momonga') {
        // 俏皮三连滑音
        this.playMusicBox(740, 0.12, 0.11, 0);
        this.playMusicBox(880, 0.12, 0.11, 0.09);
        this.playMusicBox(1046.5, 0.22, 0.12, 0.18);
      } else {
        // 海獭 / 通用叮咚
        this.playMusicBox(523.25, 0.2, 0.13, 0);
        this.playMusicBox(659.25, 0.26, 0.13, 0.11);
      }
    }

    /** 机械旋钮咔哒声 */
    playGachaCrank() {
      if (this.muted) return;
      [0, 0.12, 0.24, 0.36, 0.48].forEach((d, idx) => {
        this.playMusicBox(260 + idx * 55, 0.08, 0.1, d);
      });
    }

    /** 中奖闪亮和弦 */
    playFanfare() {
      if (this.muted) return;
      const notes = [
        ['C5', 0], ['E5', 0.09], ['G5', 0.18], ['C6', 0.28]
      ];
      notes.forEach(([n, d]) => this.playMusicBox(NOTE_FREQ[n], 0.55, 0.16, d));
    }

    /** 拔草波普音 */
    playPop() {
      if (this.muted) return;
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(760, now + 0.09);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    }

    /** 开启/切换混音音序器 */
    startSequencer(songKey, onStateChange) {
      if (songKey) this.currentSong = songKey;
      this.stopSequencer();
      if (this.muted) return;
      this.ensureContext();

      const song = SONGS[this.currentSong] || SONGS.birthday;
      this.playing = true;
      this.stepIndex = 0;
      if (onStateChange) onStateChange(true);

      const tick = () => {
        if (!this.playing || this.muted) return;
        const idx = this.stepIndex % song.melody.length;

        if (this.tracks.melody && song.melody[idx]) {
          this.playMusicBox(NOTE_FREQ[song.melody[idx]], 0.46, 0.14);
        }
        if (this.tracks.chords && song.chords[idx]) {
          this.playGuitarChord(song.chords[idx], 0.055);
        }
        if (this.tracks.bass && song.bass[idx]) {
          this.playBass(song.bass[idx]);
        }
        if (this.tracks.perc && song.perc[idx]) {
          this.playPerc(song.perc[idx]);
        }

        this.stepIndex += 1;
      };

      tick();
      this.timer = global.setInterval(tick, song.stepMs);
    }

    stopSequencer(onStateChange) {
      this.playing = false;
      if (this.timer) {
        global.clearInterval(this.timer);
        this.timer = null;
      }
      if (onStateChange) onStateChange(false);
    }

    toggleTrack(trackName) {
      if (trackName in this.tracks) {
        this.tracks[trackName] = !this.tracks[trackName];
      }
      return this.tracks[trackName];
    }

    /** 开启麦克风吹气检测 */
    async startMicBlowDetector(onLevel, onError) {
      this.stopMicBlowDetector();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (onError) onError('当前浏览器不支持麦克风，请直接使用“长按吹灭蜡烛”按钮哦~');
        return false;
      }
      try {
        const ctx = this.ensureContext();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.micStream = stream;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const loop = () => {
          if (!this.micStream) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          if (onLevel) onLevel(avg);
          this.micRaf = global.requestAnimationFrame(loop);
        };
        loop();
        return true;
      } catch (err) {
        if (onError) onError('未开启麦克风权限，可以直接用旁边的“长按吹灭蜡烛”哦~');
        return false;
      }
    }

    stopMicBlowDetector() {
      if (this.micRaf) {
        global.cancelAnimationFrame(this.micRaf);
        this.micRaf = null;
      }
      if (this.micStream) {
        this.micStream.getTracks().forEach((t) => t.stop());
        this.micStream = null;
      }
    }
  }

  global.ChiikawaAudio = new ChiikawaAudioEngine();
})(window);
