/**
 * Chiikawa 生日立体绘本 & 高考祈愿扭蛋机 · 主交互控制模块
 * 风格定位：大方得体、清雅克制、真诚祝愿「宗义轩同学的妹妹」生日快乐、2027 高考顺利。
 */
(function (global) {
  'use strict';

  /* ==========================================================================
     1. 集中定制配置区（支持 URL 参数 ?name=xxx&from=xxx 覆盖）
     ========================================================================== */
  const GIFT_CONFIG = {
    recipientName: '宗义轩同学的妹妹',
    dateText: '2026.11.28',
    senderSign: '—— 哥哥的舍友 敬祝',
    letterParagraphs: [
      '祝你生日快乐！知道你喜欢吉伊卡哇，特意为你做了这本小小的互动绘本，里面放了一间八音盒音乐屋和一台生日扭蛋机，希望能给高三紧张的复习生活添一点轻松和好心情。',
      '高三文科需要大量的阅读、背诵与思考，偶尔感到疲惫是再正常不过的事。希望这几只总是认真面对日常的小家伙，能在你课余休息时带去一点会心的笑意——就像小八常说的那样，“总会有办法的”。',
      '愿你新的一岁平安顺遂，休息好、吃饭香；更祝你明年六月执笔从容、文思清朗、发挥出最好的水平，顺利考入心仪的大学。再次祝你生日快乐，高考顺利！'
    ]
  };

  const urlParams = new URLSearchParams(global.location.search);
  if (urlParams.get('name')) {
    GIFT_CONFIG.recipientName = urlParams.get('name').trim().slice(0, 20) || GIFT_CONFIG.recipientName;
  }
  if (urlParams.get('from')) {
    GIFT_CONFIG.senderSign = `—— ${urlParams.get('from').trim().slice(0, 24)}`;
  }

  /* ==========================================================================
     2. 原味克制的角色对话、文科祈愿签与 5 款限定纪念赏品
     ========================================================================== */
  const MEADOW_LINES = {
    chiikawa: [
      '……！（吉伊开心地挥了挥手，把一份安静而真挚的生日祝福送给你。）',
      '慢慢来也没关系，认真走过的每一步都会算数。祝你新岁顺遂，高考顺利！',
      '吉伊把好运悄悄分给你一半，愿你平时复习顺利，考场稳稳发挥。'
    ],
    hachiware: [
      '高三复习偶尔会觉得辛苦吧——但总会有办法的！今天先好好庆祝生日。',
      '文科的积累就像一点点攒下星光，到了明年六月一定会派上用场的！',
      '今天是特别的日子，先放下手头的题册，吃一块喜欢的蛋糕休息一下吧。'
    ],
    usagi: [
      '乌拉！呀哈——（乌萨奇干脆利落地举起双臂，祝你生日快乐！）',
      '保持好节奏，心态放松，进了考场一定能从容应对。呀哈！',
      '噗噜噜——今晚好好休息，把电量充满再继续出发！'
    ],
    rakko: [
      '平日踏实积累，考时沉着冷静。祝你生日快乐，明年六月如愿以偿。',
      '复习之余也别忘了适当放松，吃一份喜欢的甜点犒劳努力的自己。'
    ],
    momonga: [
      '哼哼，既然今天是你生日，就破例祝你历史脉络清晰、作文落笔生花吧。',
      '高三已经很努力了，今天理直气壮地收下所有生日祝福就好！'
    ]
  };

  const WEED_BONUSES = [
    { subject: '语文', msg: '已收集「语文 · 笔底春风」书签：愿阅读通透，作文立意清朗、下笔从容。' },
    { subject: '历史', msg: '已收集「历史 · 史脉清晰」书签：愿中外时序分明，材料分析条理清晰。' },
    { subject: '政治', msg: '已收集「政治 · 切中肯綮」书签：愿逻辑严谨，答卷要点精准到位。' },
    { subject: '地理', msg: '已收集「地理 · 经纬洞明」书签：愿图表一眼明了，山川气候皆在掌握。' }
  ];

  const OMIKUJI_LIST = [
    { level: '大吉 · 文思清朗签', text: '作文思路清晰自然，平日积累的素材恰逢其时，落笔成章。', tip: '今日小建议：晚间复习后适当眺望远处，让眼睛休息片刻。' },
    { level: '上吉 · 史脉通明签', text: '古今脉络在脑海中次第展开，综合大题条理分明、从容落笔。', tip: '今日小建议：生日这天给自己准备一杯喜欢的热饮或点心。' },
    { level: '中吉 · 稳步前行签', text: '不慌不忙、按部就班，每一天踏实的积累都在默默化作底气。', tip: '今日小建议：今晚尽量早睡半小时，保持好精力。' },
    { level: '大吉 · 经纬洞见签', text: '读图析理得心应手，区域特征与自然规律清晰明了。', tip: '今日小建议：听一曲森林木屋的八音盒小调舒缓一下。' },
    { level: '吉 · 心态从容签', text: '大考小考皆能平心静气，发挥出平日最好的水平。', tip: '今日小建议：不必与旁人比快慢，按自己的节奏稳稳向前。' },
    { level: '大吉 · 如愿以偿签', text: '“总会有办法的。”愿所有耐心与坚持，终在明年盛夏开花结果。', tip: '今日小建议：祝你生日快乐，今天只管开开心心！' }
  ];

  const PRIZES = [
    {
      id: 'sp-cert',
      rank: '特赏',
      title: '除草检定 · 2027 高考祈愿纪念证',
      char: 'chiikawa',
      pose: 'happy',
      desc: '和纸活版印刷风格的专属纪念证，印有吉伊、小八、乌萨奇原画合影及高三文科四科祝福，可导出高清图片留存。',
      actionType: 'cert'
    },
    {
      id: 'a-omikuji',
      rank: '一赏',
      title: '高三文科 · 祈愿御守签',
      char: 'hachiware',
      pose: 'wave',
      desc: '为高三文科备考准备的日系御守签文，可反复轻摇抽取不同的学业与日常祝福。',
      actionType: 'omikuji'
    },
    {
      id: 'b-polaroid',
      rank: '二赏',
      title: '森野生日拍立得纪念卡',
      char: 'usagi',
      pose: 'happy',
      desc: '水彩晴空草坪与原画伙伴的复古拍立得纪念相纸，支持一键生成高清图片保存至手机相册。',
      actionType: 'polaroid'
    },
    {
      id: 'c-charm',
      rank: '三赏',
      title: '小八的鼓励纸质书签',
      char: 'hachiware',
      pose: 'cheer',
      desc: '写着小八经典名言「なんとかなれーッ（总会有办法的）」的极简纸艺书签，备考累了时可以翻开看看。',
      actionType: 'charm'
    },
    {
      id: 'd-award',
      rank: '四赏',
      title: '栗子馒头与狮萨的课间小憩券',
      char: 'kurimanju',
      pose: 'idle',
      desc: '高三学习固然重要，劳逸结合同样关键。凭此电子小券，提醒自己按时吃饭、喝水并保证充足睡眠。',
      actionType: 'rest'
    }
  ];

  /* ==========================================================================
     3. 状态管理与本地存储
     ========================================================================== */
  const STORAGE_KEY = 'chiikawa_bday_v2_state';
  const state = {
    scene: 0,
    unlockedPrizes: [],
    pulledWeeds: [],
    soundMuted: false,
    motionPaused: false,
    isSpinning: false,
    candlesOut: false,
    micActive: false,
    holdTimer: null,
    blowProgress: 0,
    ensemblePoseTimer: null
  };

  function loadState() {
    try {
      const saved = JSON.parse(global.localStorage.getItem(STORAGE_KEY) || '{}');
      if (Array.isArray(saved.unlockedPrizes)) state.unlockedPrizes = saved.unlockedPrizes;
      if (Array.isArray(saved.pulledWeeds)) state.pulledWeeds = saved.pulledWeeds;
    } catch (_) {}
  }

  function saveState() {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        unlockedPrizes: state.unlockedPrizes,
        pulledWeeds: state.pulledWeeds
      }));
    } catch (_) {}
  }

  /* ==========================================================================
     4. 原生 <dialog> Top-Layer 动画退场兼容（modern-web-guidance）
     ========================================================================== */
  let supportsDisplayTransition;
  function canTransitionDisplay() {
    if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
    if (!global.CSS || !global.CSS.supports || !global.CSS.supports('transition-behavior', 'allow-discrete') || !document.body) {
      return false;
    }
    const probe = document.createElement('div');
    probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
    document.body.appendChild(probe);
    global.getComputedStyle(probe).display;
    probe.style.display = 'none';
    supportsDisplayTransition = global.getComputedStyle(probe).display === 'block';
    probe.remove();
    return supportsDisplayTransition;
  }

  function supportsTopLayerExit() {
    return Boolean(global.CSS && global.CSS.supports && global.CSS.supports('overlay', 'auto') && canTransitionDisplay());
  }

  async function closeTopLayer(dialog) {
    if (!dialog || !dialog.open) return;
    if (!supportsTopLayerExit()) {
      dialog.setAttribute('data-closing', '');
      const animations = dialog.getAnimations ? dialog.getAnimations({ subtree: true }) : [];
      if (animations.length > 0) {
        await Promise.race([
          Promise.allSettled(animations.map((a) => a.finished)),
          new Promise((r) => global.setTimeout(r, 420))
        ]);
      }
      if (!dialog.hasAttribute('data-closing')) return;
      dialog.removeAttribute('data-closing');
    }
    dialog.close();
  }

  function setupDialogs() {
    const dialogs = document.querySelectorAll('dialog.chiikawa-dialog');
    const needsLightDismissFallback = !('closedBy' in HTMLDialogElement.prototype);

    dialogs.forEach((dialog) => {
      dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeTopLayer(dialog);
      });

      dialog.addEventListener('close', () => {
        dialog.returnValue = '';
      });

      if (needsLightDismissFallback && dialog.getAttribute('closedby') === 'any') {
        const outside = (e) => {
          const r = dialog.getBoundingClientRect();
          return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        };
        let pressedOutside = false;
        dialog.addEventListener('pointerdown', (e) => { pressedOutside = outside(e); });
        dialog.addEventListener('pointerup', (e) => {
          if (pressedOutside && outside(e)) closeTopLayer(dialog);
        });
      }
    });

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-close-dialog]');
      if (!btn) return;
      const target = document.getElementById(btn.dataset.closeDialog);
      if (target) closeTopLayer(target);
    });
  }

  /* ==========================================================================
     5. 轻雅和纸纸花粒子特效
     ========================================================================== */
  const fxCanvas = document.getElementById('fx-canvas');
  const fxCtx = fxCanvas ? fxCanvas.getContext('2d') : null;
  let particles = [];
  let fxRaf = null;

  function resizeFx() {
    if (!fxCanvas) return;
    fxCanvas.width = global.innerWidth;
    fxCanvas.height = global.innerHeight;
  }

  function spawnConfetti(x, y, count = 26) {
    if (!fxCtx || state.motionPaused) return;
    if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const palette = ['#e2a8b4', '#d7b674', '#9ec2d6', '#aec4a6', '#e6d3b3'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2.0 + Math.random() * 4.4;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.2,
        size: 4 + Math.random() * 4.5,
        color: palette[i % palette.length],
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.2,
        life: 1,
        circle: i % 3 === 0
      });
    }
    if (!fxRaf) tickFx();
  }

  function tickFx() {
    if (!fxCtx) return;
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    particles = particles.filter((p) => p.life > 0.02);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.11;
      p.rot += p.vrot;
      p.life -= 0.016;

      fxCtx.save();
      fxCtx.globalAlpha = Math.max(0, p.life);
      fxCtx.translate(p.x, p.y);
      fxCtx.rotate(p.rot);
      fxCtx.fillStyle = p.color;
      if (p.circle) {
        fxCtx.beginPath();
        fxCtx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
        fxCtx.fill();
      } else {
        fxCtx.fillRect(-p.size * 0.5, -p.size * 0.3, p.size, p.size * 0.6);
      }
      fxCtx.restore();
    });

    if (particles.length > 0) {
      fxRaf = global.requestAnimationFrame(tickFx);
    } else {
      fxRaf = null;
    }
  }

  function showToast(message) {
    const old = document.querySelector('.float-toast');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'float-toast';
    el.textContent = message;
    document.body.appendChild(el);
    global.setTimeout(() => el.remove(), 2200);
  }

  /* ==========================================================================
     6. 文本绑定与章节导航
     ========================================================================== */
  function bindConfigText() {
    document.querySelectorAll('[data-bind="recipientName"]').forEach((el) => {
      el.textContent = GIFT_CONFIG.recipientName;
    });
    document.querySelectorAll('[data-bind="senderSign"]').forEach((el) => {
      el.textContent = GIFT_CONFIG.senderSign;
    });
    const letterBody = document.getElementById('letter-body');
    if (letterBody) {
      letterBody.innerHTML = '';
      GIFT_CONFIG.letterParagraphs.forEach((txt) => {
        const p = document.createElement('p');
        p.textContent = txt;
        letterBody.appendChild(p);
      });
    }
  }

  function goToScene(index) {
    const clamped = Math.max(0, Math.min(4, index));
    state.scene = clamped;

    document.querySelectorAll('.scene').forEach((sec) => {
      sec.classList.toggle('is-active', Number(sec.dataset.scene) === clamped);
    });

    document.querySelectorAll('.pill-btn').forEach((btn) => {
      const active = Number(btn.dataset.goto) === clamped;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    });

    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    const indicator = document.getElementById('page-indicator');

    if (prevBtn) prevBtn.disabled = clamped === 0;
    if (nextBtn) {
      nextBtn.disabled = clamped === 4;
      nextBtn.textContent = clamped === 4 ? '终章' : '下一页';
    }
    if (indicator) indicator.textContent = `0${clamped + 1} / 05`;

    if (clamped !== 4 && state.micActive) {
      stopMicListening();
    }
  }

  function setupNavigation() {
    document.querySelectorAll('.pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        global.ChiikawaAudio.ensureContext();
        global.ChiikawaAudio.playPop();
        goToScene(Number(btn.dataset.goto));
      });
    });

    document.getElementById('btn-prev').addEventListener('click', () => {
      global.ChiikawaAudio.playPop();
      goToScene(state.scene - 1);
    });

    document.getElementById('btn-next').addEventListener('click', () => {
      global.ChiikawaAudio.playPop();
      goToScene(state.scene + 1);
    });

    document.getElementById('btn-open-book').addEventListener('click', () => {
      global.ChiikawaAudio.ensureContext();
      global.ChiikawaAudio.playBirthdayRiff();
      spawnConfetti(global.innerWidth * 0.5, global.innerHeight * 0.45, 28);
      goToScene(1);
    });

    // 手机左右滑动翻页
    let touchStartX = 0;
    let touchStartY = 0;
    const stage = document.getElementById('book-stage');
    stage.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      if (e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0 && state.scene < 4) goToScene(state.scene + 1);
        if (dx > 0 && state.scene > 0) goToScene(state.scene - 1);
      }
    }, { passive: true });

    // 声音开关
    const btnSound = document.getElementById('btn-sound');
    btnSound.addEventListener('click', () => {
      state.soundMuted = !state.soundMuted;
      global.ChiikawaAudio.setMuted(state.soundMuted);
      btnSound.classList.toggle('is-muted', state.soundMuted);
      btnSound.setAttribute('aria-label', state.soundMuted ? '取消静音' : '静音');
      if (state.soundMuted) updateMusicUI(false);
      showToast(state.soundMuted ? '已关闭声音' : '已开启声音');
    });

    // 动效暂停开关（满足 WCAG 2.2.2）
    const btnMotion = document.getElementById('btn-motion');
    const motionSvg = document.getElementById('motion-svg');
    btnMotion.addEventListener('click', () => {
      state.motionPaused = !state.motionPaused;
      document.body.classList.toggle('motion-paused', state.motionPaused);
      btnMotion.classList.toggle('is-muted', state.motionPaused);
      btnMotion.setAttribute('aria-label', state.motionPaused ? '恢复动画' : '暂停动画');
      if (motionSvg) {
        motionSvg.innerHTML = state.motionPaused
          ? '<polygon points="7 5 19 12 7 19 7 5"/>'
          : '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>';
      }
      showToast(state.motionPaused ? '已暂停持续动效' : '已恢复动效');
    });
  }

  /* ==========================================================================
     7. 第 1 幕封面 & 第 2 幕水彩草坪互动
     ========================================================================== */
  function setupCoverAndMeadow() {
    const coverSpeech = document.getElementById('cover-speech');
    const coverReplies = {
      chiikawa: '吉伊点了点头，把一份安静而真挚的生日祝福递到你面前。',
      hachiware: '小八：“翻开下一页吧，草坪、森林音乐屋和生日扭蛋都在里面。”',
      usagi: '乌萨奇：“乌拉！祝你生日快乐，明年六月顺利如愿！”'
    };

    document.querySelectorAll('[data-poke]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.poke;
        const img = btn.querySelector('img.char-img');
        global.ChiikawaAudio.playCharacterSound(id);
        global.ChiikawaArt.flashPose(img, id, 'cheer', 850);
        btn.classList.add('is-boing');
        global.setTimeout(() => btn.classList.remove('is-boing'), 260);
        if (coverSpeech) coverSpeech.textContent = coverReplies[id];
        const r = btn.getBoundingClientRect();
        spawnConfetti(r.left + r.width / 2, r.top + 18, 12);
      });
    });

    // 连续轻触封面标题 3 次可微调称呼
    let tapCount = 0;
    let tapTimer = null;
    document.getElementById('cover-title-trigger').addEventListener('click', () => {
      tapCount += 1;
      global.clearTimeout(tapTimer);
      tapTimer = global.setTimeout(() => { tapCount = 0; }, 900);
      if (tapCount >= 3) {
        tapCount = 0;
        openCustomDialog();
      }
    });

    // 草坪：晴空 / 晚霞光影切换
    const meadowPage = document.getElementById('meadow-page');
    const skyModeText = document.getElementById('sky-mode-text');
    document.getElementById('btn-sun').addEventListener('click', () => {
      global.ChiikawaAudio.playPop();
      const sunset = meadowPage.classList.toggle('is-sunset');
      if (skyModeText) skyModeText.textContent = sunset ? '切回晴空午后' : '切换晚霞光影';
      setMeadowBubble('光影', sunset ? '已切为柔和的傍晚霞光，像高三放学后吹过的微风。' : '回到明朗的午后晴空，草地清风徐来。');
    });

    // 草坪：5 位原画角色互动 + 真实动作帧切换
    const lineCursors = {};
    const speakerNames = {
      chiikawa: '吉伊',
      hachiware: '小八',
      usagi: '乌萨奇',
      rakko: '海獭师傅',
      momonga: '飞鼠'
    };

    document.querySelectorAll('[data-meadow-char]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.meadowChar;
        const img = btn.querySelector('img.char-img');
        const pool = MEADOW_LINES[id] || ['祝你生日快乐！'];
        const idx = (lineCursors[id] || 0) % pool.length;
        lineCursors[id] = idx + 1;

        global.ChiikawaAudio.playCharacterSound(id);
        global.ChiikawaArt.flashPose(img, id, idx % 2 === 0 ? 'happy' : 'cheer', 900);
        btn.classList.add('is-boing');
        global.setTimeout(() => btn.classList.remove('is-boing'), 260);

        setMeadowBubble(speakerNames[id], pool[idx]);
      });
    });

    // 草坪：文科四科祈愿书签
    const updateWeedsUI = () => {
      const counter = document.getElementById('weed-counter');
      if (counter) counter.innerHTML = `文科书签 <strong>${state.pulledWeeds.length}</strong> / 4`;
      document.querySelectorAll('.leaf-card').forEach((card) => {
        const idx = Number(card.dataset.weed);
        card.classList.toggle('is-pulled', state.pulledWeeds.includes(idx));
      });
    };

    document.querySelectorAll('.leaf-card').forEach((card) => {
      card.addEventListener('click', () => {
        const idx = Number(card.dataset.weed);
        const bonus = WEED_BONUSES[idx];
        global.ChiikawaAudio.playPop();
        if (!state.pulledWeeds.includes(idx)) {
          state.pulledWeeds.push(idx);
          saveState();
          updateWeedsUI();
          const r = card.getBoundingClientRect();
          spawnConfetti(r.left + r.width / 2, r.top, 16);
          if (state.pulledWeeds.length === 4) {
            global.ChiikawaAudio.playFanfare();
            setMeadowBubble('书签集齐', '语、史、政、地四枚文科书签已全部收录。愿你明年六月笔下生风，发挥出色！');
            return;
          }
        }
        setMeadowBubble(bonus.subject, bonus.msg);
      });
    });

    updateWeedsUI();
  }

  function setMeadowBubble(speaker, text) {
    const sp = document.getElementById('bubble-speaker');
    const tx = document.getElementById('bubble-text');
    if (sp) sp.textContent = speaker;
    if (tx) tx.textContent = text;
  }

  /* ==========================================================================
     8. 第 3 幕：森林原木八音盒音乐屋（合奏时原画动作帧跟随节拍律动）
     ========================================================================== */
  function startEnsembleFrameLoop() {
    stopEnsembleFrameLoop();
    let toggle = false;
    state.ensemblePoseTimer = global.setInterval(() => {
      if (state.motionPaused) return;
      toggle = !toggle;
      document.querySelectorAll('.ensemble-member').forEach((btn) => {
        const img = btn.querySelector('img.char-img');
        const id = btn.dataset.char;
        if (!img || !id) return;
        const active = btn.classList.contains('is-on');
        img.src = global.ChiikawaArt.getSpriteSrc(id, active && toggle ? 'happy' : 'idle');
      });
    }, 500);
  }

  function stopEnsembleFrameLoop() {
    if (state.ensemblePoseTimer) {
      global.clearInterval(state.ensemblePoseTimer);
      state.ensemblePoseTimer = null;
    }
    document.querySelectorAll('.ensemble-member').forEach((btn) => {
      const img = btn.querySelector('img.char-img');
      const id = btn.dataset.char;
      if (img && id) img.src = global.ChiikawaArt.getSpriteSrc(id, 'idle');
    });
  }

  function updateMusicUI(isPlaying) {
    const stage = document.getElementById('pajama-stage');
    const btn = document.getElementById('btn-music-play');
    const label = document.getElementById('music-play-label');
    const ico = document.getElementById('play-state-ico');
    if (stage) stage.classList.toggle('is-playing', isPlaying);
    if (btn) btn.classList.toggle('is-playing', isPlaying);
    if (label) label.textContent = isPlaying ? '暂停八音盒合奏' : '开始八音盒合奏';
    if (ico) {
      ico.innerHTML = isPlaying
        ? '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>'
        : '<polygon points="7 5 19 12 7 19 7 5"/>';
    }
    if (isPlaying) {
      startEnsembleFrameLoop();
    } else {
      stopEnsembleFrameLoop();
    }
  }

  function setupMusicRoom() {
    document.getElementById('btn-music-play').addEventListener('click', () => {
      if (state.soundMuted) {
        showToast('当前处于静音状态，请先开启右上角声音开关');
        return;
      }
      if (global.ChiikawaAudio.playing) {
        global.ChiikawaAudio.stopSequencer(updateMusicUI);
      } else {
        global.ChiikawaAudio.startSequencer(global.ChiikawaAudio.currentSong, updateMusicUI);
      }
    });

    document.querySelectorAll('.seg-btn').forEach((tab) => {
      tab.addEventListener('click', () => {
        const song = tab.dataset.song;
        document.querySelectorAll('.seg-btn').forEach((t) => t.classList.toggle('is-active', t === tab));
        global.ChiikawaAudio.currentSong = song;
        if (global.ChiikawaAudio.playing) {
          global.ChiikawaAudio.startSequencer(song, updateMusicUI);
        } else {
          global.ChiikawaAudio.playPop();
        }
      });
    });

    document.querySelectorAll('.ensemble-member').forEach((member) => {
      member.addEventListener('click', () => {
        const track = member.dataset.track;
        const enabled = global.ChiikawaAudio.toggleTrack(track);
        member.classList.toggle('is-on', enabled);
        member.setAttribute('aria-pressed', String(enabled));
        global.ChiikawaAudio.playPop();
      });
    });

    document.querySelectorAll('.xylo-key').forEach((key) => {
      key.addEventListener('click', () => {
        global.ChiikawaAudio.playXylo(key.dataset.note);
        key.classList.add('is-hit');
        global.setTimeout(() => key.classList.remove('is-hit'), 150);
      });
    });

    document.getElementById('btn-demo-riff').addEventListener('click', () => {
      global.ChiikawaAudio.playBirthdayRiff();
    });
  }

  /* ==========================================================================
     9. 第 4 幕：生日限定祈愿扭蛋机 & 高清纪念卡生成
     ========================================================================== */
  function updateGachaProgressUI() {
    const count = state.unlockedPrizes.length;
    const bagCount = document.getElementById('bag-count');
    const led = document.getElementById('gacha-progress-text');
    if (bagCount) bagCount.textContent = `${count}/5`;
    if (led) led.textContent = `${count} / 5`;

    document.querySelectorAll('.shelf-slot').forEach((slot) => {
      slot.classList.toggle('is-unlocked', state.unlockedPrizes.includes(slot.dataset.prizeId));
    });
  }

  function pickNextPrize() {
    const remaining = PRIZES.filter((p) => !state.unlockedPrizes.includes(p.id));
    if (remaining.length > 0) {
      if (state.unlockedPrizes.length === 2 && remaining.some((p) => p.id === 'sp-cert')) {
        return remaining.find((p) => p.id === 'sp-cert');
      }
      return remaining[Math.floor(Math.random() * remaining.length)];
    }
    return PRIZES[Math.floor(Math.random() * PRIZES.length)];
  }

  function openPrizeDialog(prize, isNew) {
    const dialog = document.getElementById('prize-dialog');
    const rankPill = document.getElementById('prize-rank-pill');
    const titleEl = document.getElementById('prize-dialog-title');
    const visualEl = document.getElementById('prize-visual');
    const descEl = document.getElementById('prize-desc');
    const extraEl = document.getElementById('prize-extra');
    const actionsEl = document.getElementById('prize-dialog-actions');

    rankPill.textContent = isNew ? `新获纪念 · ${prize.rank}` : `已收录 · ${prize.rank}`;
    titleEl.textContent = prize.title;
    descEl.textContent = prize.desc;

    visualEl.innerHTML = '';
    const img = document.createElement('img');
    img.className = 'char-img';
    img.src = global.ChiikawaArt.getSpriteSrc(prize.char, prize.pose);
    img.alt = prize.title;
    visualEl.appendChild(img);

    extraEl.innerHTML = '';
    actionsEl.innerHTML = '';

    if (prize.actionType === 'cert') {
      extraEl.innerHTML = `<strong>纪念编号：NO. 2027-CHIIKAWA-0607</strong><br/>定制收礼人：${GIFT_CONFIG.recipientName}`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-editorial sm';
      btn.textContent = '生成高清祈愿纪念证';
      btn.addEventListener('click', async () => {
        await closeTopLayer(dialog);
        openGeneratedCard('cert');
      });
      actionsEl.appendChild(btn);
    } else if (prize.actionType === 'polaroid') {
      extraEl.textContent = '采用水彩晴空草坪与原画伙伴合影排版的复古相纸，支持直接保存至手机相册。';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-editorial sm';
      btn.textContent = '生成高清拍立得相卡';
      btn.addEventListener('click', async () => {
        await closeTopLayer(dialog);
        openGeneratedCard('polaroid');
      });
      actionsEl.appendChild(btn);
    } else if (prize.actionType === 'omikuji') {
      const renderSign = () => {
        const pick = OMIKUJI_LIST[Math.floor(Math.random() * OMIKUJI_LIST.length)];
        extraEl.innerHTML = `<div style="font-family:var(--font-serif);color:var(--rose-deep);font-weight:700;font-size:0.96rem;margin-bottom:4px;">${pick.level}</div><div>${pick.text}</div><div style="margin-top:6px;color:var(--ink-mid);font-size:0.76rem;">${pick.tip}</div>`;
      };
      renderSign();
      const redrawBtn = document.createElement('button');
      redrawBtn.type = 'button';
      redrawBtn.className = 'btn-editorial sm';
      redrawBtn.textContent = '重新摇签';
      redrawBtn.addEventListener('click', () => {
        global.ChiikawaAudio.playPop();
        renderSign();
      });
      actionsEl.appendChild(redrawBtn);
    } else if (prize.actionType === 'charm') {
      extraEl.innerHTML = `<div style="font-family:var(--font-serif);font-size:0.96rem;font-weight:700;margin-bottom:4px;">「なんとかなれーッ」</div><div>总会有办法的。遇到难题时深呼吸，一步步来就很好。</div>`;
    } else if (prize.actionType === 'rest') {
      extraEl.innerHTML = `<div style="font-family:var(--font-serif);font-weight:700;margin-bottom:4px;">课间小憩凭据 · 长期有效</div><div>致 ${GIFT_CONFIG.recipientName}：备考虽忙，也请记得按时吃饭、多喝温水、保证睡眠。</div>`;
    }

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-ghost sm';
    closeBtn.textContent = '收好返回';
    closeBtn.setAttribute('autofocus', '');
    closeBtn.addEventListener('click', () => closeTopLayer(dialog));
    actionsEl.appendChild(closeBtn);

    dialog.showModal();
  }

  async function openGeneratedCard(kind) {
    const dialog = document.getElementById('card-dialog');
    const titleEl = document.getElementById('card-dialog-title');
    const imgEl = document.getElementById('generated-card-img');
    const dlBtn = document.getElementById('btn-download-card');

    const payload = {
      recipientName: GIFT_CONFIG.recipientName,
      dateText: GIFT_CONFIG.dateText,
      senderSign: GIFT_CONFIG.senderSign
    };

    const dataUrl = kind === 'polaroid'
      ? await global.ChiikawaArt.generatePolaroidCard(payload)
      : await global.ChiikawaArt.generateGaokaoCertificate(payload);

    titleEl.textContent = kind === 'polaroid' ? '森野生日拍立得相卡' : '2027 高考祈愿纪念证';
    imgEl.src = dataUrl;
    dlBtn.href = dataUrl;
    dlBtn.download = kind === 'polaroid' ? 'chiikawa-polaroid-2027.png' : 'chiikawa-gaokao-2027.png';

    global.ChiikawaAudio.playFanfare();
    dialog.showModal();
  }

  function openBagDialog() {
    const dialog = document.getElementById('bag-dialog');
    const grid = document.getElementById('bag-grid');
    grid.innerHTML = '';

    PRIZES.forEach((prize) => {
      const unlocked = state.unlockedPrizes.includes(prize.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `bag-item ${unlocked ? '' : 'is-locked'}`;
      btn.innerHTML = `
        <span class="bag-item-rank">${prize.rank}</span>
        <span class="bag-item-title">${unlocked ? prize.title : '待抽取'}</span>
        <span class="bag-item-sub">${unlocked ? '点击查看或保存' : '前往扭蛋机抽取'}</span>
      `;
      btn.addEventListener('click', async () => {
        await closeTopLayer(dialog);
        if (unlocked) {
          openPrizeDialog(prize, false);
        } else {
          goToScene(3);
          showToast('转动扭蛋机旋钮即可解锁');
        }
      });
      grid.appendChild(btn);
    });

    dialog.showModal();
  }

  function setupGacha() {
    const machine = document.getElementById('gacha-machine');
    const capsule = document.getElementById('dispensed-capsule');

    const spinGacha = () => {
      if (state.isSpinning) return;
      state.isSpinning = true;
      global.ChiikawaAudio.ensureContext();
      global.ChiikawaAudio.playGachaCrank();

      capsule.classList.remove('is-drop');
      machine.classList.add('is-shaking');

      global.setTimeout(() => {
        capsule.classList.add('is-drop');
      }, 480);

      global.setTimeout(() => {
        machine.classList.remove('is-shaking');
        const prize = pickNextPrize();
        const isNew = !state.unlockedPrizes.includes(prize.id);
        if (isNew) {
          state.unlockedPrizes.push(prize.id);
          saveState();
          updateGachaProgressUI();
        }
        global.ChiikawaAudio.playFanfare();
        spawnConfetti(global.innerWidth * 0.5, global.innerHeight * 0.45, 32);
        openPrizeDialog(prize, isNew);
        state.isSpinning = false;
      }, 960);
    };

    document.getElementById('btn-gacha-spin').addEventListener('click', spinGacha);
    document.getElementById('btn-gacha-cta').addEventListener('click', spinGacha);
    document.getElementById('btn-bag').addEventListener('click', openBagDialog);

    document.querySelectorAll('.shelf-slot').forEach((slot) => {
      slot.addEventListener('click', () => {
        const id = slot.dataset.prizeId;
        if (!state.unlockedPrizes.includes(id)) {
          showToast('转动扭蛋机旋钮即可解锁该赏品');
          return;
        }
        const prize = PRIZES.find((p) => p.id === id);
        if (prize) openPrizeDialog(prize, false);
      });
    });

    updateGachaProgressUI();
  }

  /* ==========================================================================
     10. 第 5 幕：星夜许愿吹蜡烛与终章信笺
     ========================================================================== */
  function setBlowProgress(pct) {
    state.blowProgress = Math.max(0, Math.min(100, pct));
    const fill = document.getElementById('blow-meter-fill');
    const cakeWrap = document.getElementById('cake-wrap');
    if (fill) fill.style.width = `${state.blowProgress}%`;
    if (cakeWrap && !state.candlesOut) {
      cakeWrap.classList.toggle('is-blowing', state.blowProgress > 12);
    }
    if (state.blowProgress >= 100 && !state.candlesOut) {
      extinguishCandles();
    }
  }

  function extinguishCandles() {
    state.candlesOut = true;
    stopHoldBlow();
    stopMicListening();

    const cakeWrap = document.getElementById('cake-wrap');
    const statusText = document.getElementById('wish-status-text');
    const label = document.getElementById('blow-meter-label');
    const controls = document.getElementById('wish-controls');
    const letter = document.getElementById('final-letter');

    if (cakeWrap) {
      cakeWrap.classList.remove('is-blowing');
      cakeWrap.classList.add('is-out');
    }
    if (statusText) statusText.textContent = '祝你生日快乐，2027 高考顺利，如愿以偿。';
    if (label) label.textContent = '烛火已熄灭，生日信笺已展开';
    if (controls) controls.hidden = true;
    if (letter) letter.hidden = false;

    global.ChiikawaAudio.playBirthdayRiff();
    spawnConfetti(global.innerWidth * 0.35, global.innerHeight * 0.34, 24);
    global.setTimeout(() => spawnConfetti(global.innerWidth * 0.65, global.innerHeight * 0.3, 24), 260);
  }

  function relightCandles() {
    state.candlesOut = false;
    setBlowProgress(0);
    const cakeWrap = document.getElementById('cake-wrap');
    const statusText = document.getElementById('wish-status-text');
    const label = document.getElementById('blow-meter-label');
    const controls = document.getElementById('wish-controls');
    const letter = document.getElementById('final-letter');

    if (cakeWrap) cakeWrap.classList.remove('is-out', 'is-blowing');
    if (statusText) statusText.textContent = '闭上眼睛许个愿望，随后轻轻吹灭蜡烛吧';
    if (label) label.textContent = '可长按下方按钮，或开启麦克风轻轻一吹';
    if (controls) controls.hidden = false;
    if (letter) letter.hidden = true;
    global.ChiikawaAudio.playPop();
  }

  function stopHoldBlow() {
    if (state.holdTimer) {
      global.clearInterval(state.holdTimer);
      state.holdTimer = null;
    }
  }

  function stopMicListening() {
    state.micActive = false;
    global.ChiikawaAudio.stopMicBlowDetector();
    const micBtn = document.getElementById('btn-mic-blow');
    if (micBtn) {
      micBtn.classList.remove('is-listening');
      micBtn.textContent = '开启麦克风吹气';
    }
  }

  function setupWishStage() {
    const holdBtn = document.getElementById('btn-hold-blow');
    const micBtn = document.getElementById('btn-mic-blow');
    const label = document.getElementById('blow-meter-label');

    const startHold = (e) => {
      if (state.candlesOut) return;
      e.preventDefault();
      global.ChiikawaAudio.ensureContext();
      stopHoldBlow();
      if (label) label.textContent = '正在吹灭烛火…';
      state.holdTimer = global.setInterval(() => {
        setBlowProgress(state.blowProgress + 8);
      }, 65);
    };

    const endHold = () => {
      stopHoldBlow();
      if (!state.candlesOut && state.blowProgress < 100) {
        setBlowProgress(Math.max(0, state.blowProgress - 25));
        if (label) label.textContent = '请稍多按住片刻即可吹灭';
      }
    };

    holdBtn.addEventListener('pointerdown', startHold);
    holdBtn.addEventListener('pointerup', endHold);
    holdBtn.addEventListener('pointerleave', endHold);
    holdBtn.addEventListener('pointercancel', endHold);

    micBtn.addEventListener('click', async () => {
      if (state.candlesOut) return;
      if (state.micActive) {
        stopMicListening();
        return;
      }
      const ok = await global.ChiikawaAudio.startMicBlowDetector(
        (level) => {
          if (level > 36) {
            setBlowProgress(state.blowProgress + (level - 28) * 0.25);
            if (label) label.textContent = '已感应到气流，继续轻吹…';
          } else {
            setBlowProgress(Math.max(0, state.blowProgress - 1.2));
          }
        },
        (errMsg) => {
          showToast(errMsg);
          stopMicListening();
        }
      );
      if (ok) {
        state.micActive = true;
        micBtn.classList.add('is-listening');
        micBtn.textContent = '麦克风已开启，请轻吹';
        if (label) label.textContent = '对着手机话筒轻轻吹一口气即可';
      }
    });

    document.getElementById('btn-relight').addEventListener('click', relightCandles);
    document.getElementById('btn-open-cert-direct').addEventListener('click', () => {
      openGeneratedCard('cert');
    });
  }

  /* ==========================================================================
     11. 称呼微调面板
     ========================================================================== */
  function openCustomDialog() {
    const dialog = document.getElementById('custom-dialog');
    document.getElementById('input-name').value = GIFT_CONFIG.recipientName;
    document.getElementById('input-sender').value = GIFT_CONFIG.senderSign.replace(/^——\s*/, '');
    dialog.showModal();
  }

  function setupCustomForm() {
    const form = document.getElementById('custom-form');
    const tip = document.getElementById('custom-link-tip');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameVal = document.getElementById('input-name').value.trim();
      const senderVal = document.getElementById('input-sender').value.trim();
      if (nameVal) GIFT_CONFIG.recipientName = nameVal;
      if (senderVal) GIFT_CONFIG.senderSign = `—— ${senderVal}`;
      bindConfigText();

      const nextUrl = new URL(global.location.href);
      nextUrl.searchParams.set('name', GIFT_CONFIG.recipientName);
      if (senderVal) nextUrl.searchParams.set('from', senderVal);

      tip.hidden = false;
      tip.textContent = `专属链接：${nextUrl.toString()}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(nextUrl.toString()).then(() => {
          showToast('已更新并复制专属链接');
        }).catch(() => {});
      }
    });
  }

  /* ==========================================================================
     12. 初始化入口
     ========================================================================== */
  function init() {
    loadState();
    global.ChiikawaArt.hydrateCharacters(document);
    bindConfigText();
    setupDialogs();
    setupNavigation();
    setupCoverAndMeadow();
    setupMusicRoom();
    setupGacha();
    setupWishStage();
    setupCustomForm();

    resizeFx();
    global.addEventListener('resize', resizeFx);
    goToScene(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
