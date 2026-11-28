/**
 * Chiikawa 原画级角色素材管理 & 活版和纸风 Canvas 纪念卡渲染引擎
 * 全部角色均使用 ./assets/chars/ 下的原画级高清透明 PNG，支持多姿态动态切换与 Canvas 合成。
 */
(function (global) {
  'use strict';

  const INK = '#383028';
  const INK_MID = '#635649';
  const ROSE_DEEP = '#b86274';
  const BRASS_DEEP = '#9b7837';

  /** 原画角色帧路径映射 */
  const SPRITE_MAP = {
    chiikawa: {
      idle: './assets/chars/chiikawa_idle.png',
      happy: './assets/chars/chiikawa_happy.png',
      cheer: './assets/chars/chiikawa_cheer.png',
      wave: './assets/chars/chiikawa_wave.png'
    },
    hachiware: {
      idle: './assets/chars/hachiware_idle.png',
      happy: './assets/chars/hachiware_happy.png',
      cheer: './assets/chars/hachiware_cheer.png',
      wave: './assets/chars/hachiware_wave.png'
    },
    usagi: {
      idle: './assets/chars/usagi_idle.png',
      happy: './assets/chars/usagi_happy.png',
      cheer: './assets/chars/usagi_cheer.png',
      wave: './assets/chars/usagi_wave.png'
    },
    momonga: {
      idle: './assets/chars/momonga_idle.png',
      happy: './assets/chars/momonga_happy.png',
      cheer: './assets/chars/momonga_cheer.png',
      wave: './assets/chars/momonga_wave.png'
    },
    rakko: {
      idle: './assets/chars/rakko_idle.png',
      happy: './assets/chars/rakko_happy.png',
      cheer: './assets/chars/rakko_happy.png',
      wave: './assets/chars/rakko_wave.png'
    },
    kurimanju: {
      idle: './assets/chars/kurimanju_idle.png',
      happy: './assets/chars/kurimanju_happy.png',
      cheer: './assets/chars/kurimanju_happy.png',
      wave: './assets/chars/kurimanju_wave.png'
    },
    shisa: {
      idle: './assets/chars/shisa_idle.png',
      happy: './assets/chars/shisa_happy.png',
      cheer: './assets/chars/shisa_happy.png',
      wave: './assets/chars/shisa_wave.png'
    }
  };

  const imageCache = new Map();

  function getSpriteSrc(charId, pose = 'idle') {
    const group = SPRITE_MAP[charId] || SPRITE_MAP.chiikawa;
    return group[pose] || group.idle;
  }

  /** 预加载图片供瞬时切帧与 Canvas 合成使用 */
  function loadImage(src) {
    if (imageCache.has(src)) return imageCache.get(src);
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    imageCache.set(src, promise);
    return promise;
  }

  /**
   * 柔和手绘水彩感双层草莓奶油蛋糕（极简柔细笔触，无厚重黑边框）
   */
  function svgWatercolorCake() {
    return `<svg viewBox="0 0 220 142" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="手绘草莓奶油生日蛋糕">
      <defs>
        <linearGradient id="spongeA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f7e8cc"/>
          <stop offset="100%" stop-color="#edd5ae"/>
        </linearGradient>
        <linearGradient id="spongeB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f5dde2"/>
          <stop offset="100%" stop-color="#eac4cd"/>
        </linearGradient>
        <linearGradient id="creamGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fffef9"/>
          <stop offset="100%" stop-color="#f5ede0"/>
        </linearGradient>
      </defs>
      <!-- 奶油白瓷盘 -->
      <ellipse cx="110" cy="126" rx="92" ry="12" fill="#f7f1e6" stroke="#5b4d3f" stroke-width="1.6"/>
      <ellipse cx="110" cy="124" rx="74" ry="7.5" fill="none" stroke="#c9a35b" stroke-width="0.9" opacity="0.55"/>
      <!-- 下层蛋糕 -->
      <rect x="38" y="72" width="144" height="50" rx="14" fill="url(#spongeA)" stroke="#5b4d3f" stroke-width="1.6"/>
      <path d="M38 82 Q52 94 66 82 Q80 94 94 82 Q108 94 122 82 Q136 94 150 82 Q164 94 182 82 L182 72 L38 72 Z"
            fill="url(#creamGrad)" stroke="#5b4d3f" stroke-width="1.4" stroke-linejoin="round"/>
      <!-- 上层蛋糕 -->
      <rect x="62" y="34" width="96" height="40" rx="12" fill="url(#spongeB)" stroke="#5b4d3f" stroke-width="1.6"/>
      <path d="M62 44 Q74 54 86 44 Q98 54 110 44 Q122 54 134 44 Q146 54 158 44 L158 34 L62 34 Z"
            fill="url(#creamGrad)" stroke="#5b4d3f" stroke-width="1.4" stroke-linejoin="round"/>
      <!-- 水彩草莓 -->
      <g stroke="#5b4d3f" stroke-width="1.3">
        <path d="M76 34 C71 26 76 20 80 20 C84 20 89 26 84 34 Z" fill="#d96b78"/>
        <path d="M106 32 C100 24 105 17 110 17 C115 17 120 24 114 32 Z" fill="#d96b78"/>
        <path d="M136 34 C131 26 136 20 140 20 C144 20 149 26 144 34 Z" fill="#d96b78"/>
      </g>
      <!-- 精致丝带与祝福牌 -->
      <rect x="74" y="93" width="72" height="20" rx="6" fill="#fcf9f2" stroke="#c9a35b" stroke-width="1.2"/>
      <text x="110" y="106.5" text-anchor="middle" font-size="9.5" font-family="Georgia, serif" letter-spacing="1.2" fill="#5b4d3f">HAPPY BDAY</text>
    </svg>`;
  }

  /**
   * 填充页面所有原画角色 img 与水彩蛋糕
   */
  function hydrateCharacters(root = document) {
    root.querySelectorAll('img.char-img[data-char]').forEach((img) => {
      const charId = img.dataset.char;
      const pose = img.dataset.pose || 'idle';
      img.src = getSpriteSrc(charId, pose);
      img.decoding = 'async';
    });

    const cakeSlot = root.getElementById ? root.getElementById('cake-svg-slot') : null;
    if (cakeSlot) {
      cakeSlot.innerHTML = svgWatercolorCake();
    }

    // 后台静默预加载常用姿态，点击切帧零延迟
    ['chiikawa', 'hachiware', 'usagi', 'momonga', 'rakko', 'shisa', 'kurimanju'].forEach((id) => {
      Object.values(SPRITE_MAP[id]).forEach((src) => {
        loadImage(src).catch(() => {});
      });
    });
  }

  /** 临时切换某个角色图片至互动姿态再恢复 */
  function flashPose(imgEl, charId, targetPose = 'cheer', durationMs = 780) {
    if (!imgEl) return;
    const basePose = imgEl.dataset.pose || 'idle';
    imgEl.src = getSpriteSrc(charId, targetPose);
    global.clearTimeout(imgEl._poseTimer);
    imgEl._poseTimer = global.setTimeout(() => {
      imgEl.src = getSpriteSrc(charId, basePose);
    }, durationMs);
  }

  /* ==========================================================================
     Canvas 活版印刷和纸风高清纪念图（直接使用原画级透明 PNG 合成）
     ========================================================================== */
  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawAspectContain(ctx, img, cx, bottomY, maxW, maxH) {
    const ratio = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    ctx.drawImage(img, cx - w / 2, bottomY - h, w, h);
  }

  /**
   * 异步生成高清《除草检定 · 2027 高考祈愿纪念证》PNG
   */
  async function generateGaokaoCertificate({ recipientName, dateText, senderSign }) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d');

    // 和纸暖米色基底
    const bg = ctx.createLinearGradient(0, 0, 0, 1440);
    bg.addColorStop(0, '#f7f1e5');
    bg.addColorStop(1, '#ede4d4');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1440);

    // 细腻纸张颗粒
    ctx.fillStyle = 'rgba(56, 48, 40, 0.04)';
    for (let y = 24; y < 1440; y += 36) {
      for (let x = 24; x < 1080; x += 36) {
        ctx.fillRect(x, y, 2, 2);
      }
    }

    // 居中特种纸纪念卡
    ctx.save();
    ctx.shadowColor = 'rgba(56, 48, 40, 0.14)';
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 16;
    drawRoundedRect(ctx, 74, 78, 932, 1284, 28);
    ctx.fillStyle = '#fcf9f2';
    ctx.fill();
    ctx.restore();

    // 精致双层烫金细线边框
    drawRoundedRect(ctx, 74, 78, 932, 1284, 28);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(56, 48, 40, 0.28)';
    ctx.stroke();

    drawRoundedRect(ctx, 102, 106, 876, 1228, 18);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(155, 120, 55, 0.48)';
    ctx.stroke();

    // 眉标
    ctx.textAlign = 'center';
    ctx.fillStyle = BRASS_DEEP;
    ctx.font = '600 24px Georgia, serif';
    ctx.fillText('CHIIKAWA  MEMORIAL  CERTIFICATE  ·  2027', 540, 178);

    // 典雅衬线大标题
    ctx.fillStyle = INK;
    ctx.font = '700 58px "Songti SC", "STSong", "SimSun", Georgia, serif';
    ctx.fillText('除草检定 · 高考祈愿证', 540, 266);

    ctx.fillStyle = INK_MID;
    ctx.font = '400 28px "Songti SC", "STSong", "SimSun", serif';
    ctx.fillText('谨 祝 生 日 快 乐 ， 愿 明 年 六 月 如 愿 以 偿', 540, 326);

    // 分隔细线
    ctx.strokeStyle = 'rgba(155, 120, 55, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(220, 366);
    ctx.lineTo(860, 366);
    ctx.stroke();

    // 水彩插画窗与 3 位正统原画角色
    try {
      const [meadowImg, hachiImg, chiiImg, usagiImg] = await Promise.all([
        loadImage('./assets/bg/bg_meadow.webp'),
        loadImage(getSpriteSrc('hachiware', 'wave')),
        loadImage(getSpriteSrc('chiikawa', 'happy')),
        loadImage(getSpriteSrc('usagi', 'happy'))
      ]);

      ctx.save();
      drawRoundedRect(ctx, 152, 404, 776, 320, 20);
      ctx.clip();
      ctx.drawImage(meadowImg, 152, 260, 776, 560);
      ctx.restore();

      drawRoundedRect(ctx, 152, 404, 776, 320, 20);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(56, 48, 40, 0.22)';
      ctx.stroke();

      drawAspectContain(ctx, hachiImg, 324, 696, 185, 205);
      drawAspectContain(ctx, chiiImg, 540, 700, 195, 210);
      drawAspectContain(ctx, usagiImg, 756, 696, 185, 220);
    } catch (_) {}

    // 证书信息排版
    ctx.textAlign = 'left';
    const leftX = 166;
    ctx.fillStyle = INK_MID;
    ctx.font = '600 28px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('收礼人', leftX, 804);
    ctx.fillStyle = INK;
    ctx.font = '700 42px "Songti SC", "STSong", "SimSun", serif';
    ctx.fillText(recipientName, leftX + 136, 807);

    ctx.fillStyle = INK_MID;
    ctx.font = '400 26px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(`祈愿方向：高三文科 · 2027 届金榜题名`, leftX, 868);
    ctx.fillText(`纪念编号：NO. 2027-CHIIKAWA-0607`, leftX, 916);
    ctx.fillText(`签发日期：${dateText}`, leftX, 964);

    // 文科四科雅致祝福印签（2x2 排版，高级文创感）
    const badges = [
      { sub: '语文', note: '笔底春风 · 文思清朗' },
      { sub: '历史', note: '古今脉络 · 了然于胸' },
      { sub: '政治', note: '逻辑明晰 · 切中肯綮' },
      { sub: '地理', note: '山川经纬 · 洞若观火' }
    ];
    badges.forEach((b, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = 166 + col * 384;
      const by = 1010 + row * 94;
      drawRoundedRect(ctx, bx, by, 362, 74, 14);
      ctx.fillStyle = '#f6f0e4';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(155, 120, 55, 0.38)';
      ctx.stroke();

      ctx.fillStyle = ROSE_DEEP;
      ctx.font = '700 28px "Songti SC", "STSong", serif';
      ctx.fillText(b.sub, bx + 24, by + 46);

      ctx.fillStyle = INK;
      ctx.font = '500 24px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(b.note, bx + 102, by + 45);
    });

    // 朱红篆刻风方印
    ctx.save();
    ctx.translate(836, 872);
    ctx.rotate(-0.14);
    drawRoundedRect(ctx, -64, -64, 128, 128, 12);
    ctx.fillStyle = 'rgba(185, 74, 88, 0.08)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#b94a58';
    ctx.stroke();
    ctx.fillStyle = '#b94a58';
    ctx.textAlign = 'center';
    ctx.font = '700 38px "Songti SC", "STSong", "SimSun", serif';
    ctx.fillText('金榜', 0, -10);
    ctx.fillText('题名', 0, 38);
    ctx.restore();

    // 底部寄语与落款
    ctx.textAlign = 'center';
    ctx.fillStyle = INK;
    ctx.font = '600 28px "Songti SC", "STSong", "SimSun", serif';
    ctx.fillText('「总会有办法的。」愿步履从容，前程朗阔。', 540, 1244);
    ctx.fillStyle = INK_MID;
    ctx.font = '400 24px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(senderSign, 540, 1292);

    return canvas.toDataURL('image/png');
  }

  /**
   * 异步生成高清《森野生日拍立得相卡》PNG
   */
  async function generatePolaroidCard({ recipientName, dateText }) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ebe3d5';
    ctx.fillRect(0, 0, 1080, 1440);

    // 复古相纸
    ctx.save();
    ctx.shadowColor = 'rgba(56, 48, 40, 0.2)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 18;
    drawRoundedRect(ctx, 86, 86, 908, 1268, 18);
    ctx.fillStyle = '#fcfaf5';
    ctx.fill();
    ctx.restore();

    // 相框水彩风景与原画五人组
    try {
      const [meadowImg, hachiImg, chiiImg, usagiImg, rakkoImg] = await Promise.all([
        loadImage('./assets/bg/bg_meadow.webp'),
        loadImage(getSpriteSrc('hachiware', 'happy')),
        loadImage(getSpriteSrc('chiikawa', 'cheer')),
        loadImage(getSpriteSrc('usagi', 'happy')),
        loadImage(getSpriteSrc('rakko', 'idle'))
      ]);

      ctx.save();
      drawRoundedRect(ctx, 138, 140, 804, 886, 10);
      ctx.clip();
      ctx.drawImage(meadowImg, 138, 100, 804, 1020);
      ctx.restore();

      drawRoundedRect(ctx, 138, 140, 804, 886, 10);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(56, 48, 40, 0.16)';
      ctx.stroke();

      // 上方典雅英文标题
      ctx.textAlign = 'center';
      ctx.fillStyle = '#4e4237';
      ctx.font = '600 44px Georgia, serif';
      ctx.fillText('Happy Birthday', 540, 270);
      ctx.fillStyle = '#756657';
      ctx.font = '400 26px "Songti SC", "STSong", serif';
      ctx.fillText('森 野 晴 空 纪 念 · 2027 高 考 顺 利', 540, 326);

      // 四位原画角色在草坪野餐布上合影
      drawAspectContain(ctx, rakkoImg, 250, 905, 175, 195);
      drawAspectContain(ctx, hachiImg, 435, 922, 200, 220);
      drawAspectContain(ctx, chiiImg, 635, 926, 205, 220);
      drawAspectContain(ctx, usagiImg, 825, 908, 185, 225);
    } catch (_) {}

    // 相纸底边手写风落款
    ctx.textAlign = 'center';
    ctx.fillStyle = INK;
    ctx.font = '700 40px "Songti SC", "STSong", "SimSun", serif';
    ctx.fillText(`致 ${recipientName}`, 540, 1134);
    ctx.fillStyle = INK_MID;
    ctx.font = '400 28px "Songti SC", "STSong", "SimSun", serif';
    ctx.fillText('生 日 快 乐 · 愿 高 考 顺 利 · 岁 岁 常 安', 540, 1198);
    ctx.fillStyle = BRASS_DEEP;
    ctx.font = '600 22px Georgia, serif';
    ctx.fillText(`CHIIKAWA PICTURE BOOK  ·  ${dateText}`, 540, 1268);

    return canvas.toDataURL('image/png');
  }

  global.ChiikawaArt = {
    getSpriteSrc,
    hydrateCharacters,
    flashPose,
    svgWatercolorCake,
    generateGaokaoCertificate,
    generatePolaroidCard
  };
})(window);
