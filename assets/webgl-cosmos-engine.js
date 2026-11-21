/**
 * SherlockYzz // WebGL2 超维宇宙 GPU 实时渲染引擎 v2.0
 * 真正的 3D Raymarching 法线光照、菲涅尔能量护盾、液态铬金属环面结、赛博日蚀网格与时空虫洞。
 */
(function () {
    'use strict';

    const canvas = document.getElementById('webgl-stage');
    if (!canvas) {
        window.__WEBGL_COSMOS__ = { active: false };
        return;
    }

    const gl = canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false
    }) || canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance'
    });

    if (!gl) {
        window.__WEBGL_COSMOS__ = { active: false };
        return;
    }

    const isWebGL2 = (typeof WebGL2RenderingContext !== 'undefined') && (gl instanceof WebGL2RenderingContext);

    const VERT_SRC = `
        attribute vec2 aPos;
        varying vec2 vUv;
        void main() {
            vUv = aPos * 0.5 + 0.5;
            gl_Position = vec4(aPos, 0.0, 1.0);
        }
    `;

    const FRAG_SRC = `
        precision highp float;

        varying vec2 vUv;

        uniform vec2 uResolution;
        uniform float uTime;
        uniform float uModeA;
        uniform float uModeB;
        uniform float uMix;
        uniform vec2 uRot;
        uniform vec2 uMouse;
        uniform float uCharge;
        uniform float uBass;
        uniform float uMid;
        uniform float uScroll;
        uniform float uShake;
        uniform vec2 uShockPos;
        uniform float uShockTime;
        uniform float uShockPower;
        uniform float uFocusX;
        uniform float uZoom;

        #define PI 3.14159265359

        float hash21(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
        }

        float noise2(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            float a = hash21(i);
            float b = hash21(i + vec2(1.0, 0.0));
            float c = hash21(i + vec2(0.0, 1.0));
            float d = hash21(i + vec2(1.0, 1.0));
            return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
            for (int i = 0; i < 4; i++) {
                v += a * noise2(p);
                p = rot * p * 2.04 + vec2(1.7, 9.2);
                a *= 0.5;
            }
            return v;
        }

        mat2 rot2(float a) {
            float s = sin(a);
            float c = cos(a);
            return mat2(c, -s, s, c);
        }

        float sdOctahedron(vec3 p, float s) {
            p = abs(p);
            return (p.x + p.y + p.z - s) * 0.57735027;
        }

        float sdTorus(vec3 p, vec2 t) {
            vec2 q = vec2(length(p.xz) - t.x, p.y);
            return length(q) - t.y;
        }

        float smin(float a, float b, float k) {
            float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
            return mix(b, a, h) - k * h * (1.0 - h);
        }

        vec3 acesToneMap(vec3 x) {
            float a = 2.51;
            float b = 0.03;
            float c = 2.43;
            float d = 0.59;
            float e = 0.14;
            return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
        }

        // 深空星云背景
        vec3 renderCosmicBackdrop(vec2 uv, float t, float scrollNorm) {
            vec2 starUv = uv * 2.3 + vec2(uRot.y * 0.22, -uRot.x * 0.22 - scrollNorm * 0.28);
            float n1 = fbm(starUv + t * 0.04);
            float n2 = fbm(starUv * 1.9 - t * 0.05 + vec2(n1 * 1.6));

            vec3 col = vec3(0.011, 0.017, 0.036);
            col += vec3(0.0, 0.28, 0.44) * pow(n1, 2.2) * 0.55;
            col += vec3(0.42, 0.12, 0.62) * pow(n2, 2.3) * 0.50;
            col += vec3(0.68, 0.20, 0.34) * pow(max(0.0, n1 * n2), 2.0) * 0.34;

            // 双层闪烁星空
            for (int l = 0; l < 2; l++) {
                float fl = float(l);
                vec2 grid = uv * (18.0 + fl * 16.0) + uRot * (0.6 + fl * 0.45);
                vec2 id = floor(grid);
                vec2 gv = fract(grid) - 0.5;
                float rnd = hash21(id + fl * 31.7);
                if (rnd > 0.84) {
                    vec2 offset = (vec2(rnd, fract(rnd * 37.0)) - 0.5) * 0.65;
                    float d = length(gv - offset);
                    float twinkle = 0.55 + 0.45 * sin(t * (2.2 + rnd * 4.5) + rnd * 23.0);
                    float star = (0.0045 / (d * d + 0.004)) * twinkle;
                    vec3 sCol = mix(vec3(0.0, 0.94, 1.0), vec3(1.0, 0.55, 0.72), fract(rnd * 13.7));
                    col += sCol * min(star, 1.8) * (0.45 - fl * 0.14);
                }
            }
            return col;
        }

        // ==================== 模式 0：量子引力晶核 + 三重陀螺仪戴森环 + 黑洞吸积盘 ====================
        float mapCore(vec3 p, float t, float beatScale) {
            vec3 cp = p;
            cp.xy *= rot2(t * 0.62);
            cp.yz *= rot2(t * 0.48);
            float dCrystal = sdOctahedron(cp, 0.58 * beatScale);
            dCrystal -= 0.032 * sin(cp.x * 11.0 + t * 2.5) * sin(cp.y * 11.0 - t * 2.0);
            float dSphere = length(cp) - 0.36 * beatScale;
            dCrystal = smin(dCrystal, dSphere, 0.16);

            vec3 r1 = p; r1.xy *= rot2(0.55 + t * 0.45); r1.yz *= rot2(0.35);
            float dR1 = sdTorus(r1, vec2(1.02 * beatScale, 0.026));

            vec3 r2 = p; r2.yz *= rot2(-0.65 - t * 0.38); r2.xz *= rot2(0.45);
            float dR2 = sdTorus(r2, vec2(1.26 * beatScale, 0.022));

            vec3 r3 = p; r3.xz *= rot2(t * 0.31); r3.xy *= rot2(1.18);
            float dR3 = sdTorus(r3, vec2(1.48 * beatScale, 0.018));

            return min(dCrystal, min(dR1, min(dR2, dR3)));
        }

        vec3 calcCoreNormal(vec3 p, float t, float beatScale) {
            vec2 e = vec2(0.004, 0.0);
            return normalize(vec3(
                mapCore(p + e.xyy, t, beatScale) - mapCore(p - e.xyy, t, beatScale),
                mapCore(p + e.yxy, t, beatScale) - mapCore(p - e.yxy, t, beatScale),
                mapCore(p + e.yyx, t, beatScale) - mapCore(p - e.yyx, t, beatScale)
            ));
        }

        vec3 renderMode0(vec2 p, float t, float scrollNorm) {
            vec3 col = renderCosmicBackdrop(p, t, scrollNorm);

            vec2 centerShift = vec2((uFocusX - 0.5) * (uResolution.x / max(uResolution.y, 1.0)) * 2.0, -scrollNorm * 0.14);
            vec2 q = p - centerShift;

            vec2 mDelta = p - uMouse;
            float mDist = length(mDelta) + 0.001;
            if (uCharge > 0.01) {
                float pull = uCharge * 0.22 / (mDist * mDist + 0.07);
                q -= normalize(mDelta) * min(pull, 0.45);
            }

            vec3 ro = vec3(0.0, 0.0, (-3.45 + uBass * 0.25) / clamp(uZoom, 0.72, 1.45));
            vec3 rd = normalize(vec3(q, 1.55));
            mat2 ry = rot2(uRot.y * 1.15 + t * 0.16);
            mat2 rx = rot2(uRot.x * 0.95);

            float beatScale = 1.0 + uBass * 0.22 + uCharge * 0.15;
            vec3 glowAccum = vec3(0.0);
            float distAcc = 0.0;
            bool hit = false;

            for (int i = 0; i < 42; i++) {
                vec3 pos = ro + rd * distAcc;
                pos.xz *= ry;
                pos.yz *= rx;

                float d = mapCore(pos, t, beatScale);

                // 紧贴三维表面的体积泛光累积
                vec3 cp = pos;
                cp.xy *= rot2(t * 0.62); cp.yz *= rot2(t * 0.48);
                float dC = sdOctahedron(cp, 0.58 * beatScale);
                float gCore = 0.022 / (abs(dC) + 0.036);
                float gRing = 0.015 / (abs(d) + 0.022);

                glowAccum += vec3(0.0, 0.95, 1.0) * (gCore * 0.55 + gRing * 0.72);
                glowAccum += vec3(0.66, 0.33, 0.98) * (gRing * 0.55 + gCore * 0.3);
                glowAccum += vec3(1.0, 0.44, 0.58) * (gRing * 0.35 + gCore * 0.25 * (0.4 + uMid));

                if (d < 0.004) {
                    hit = true;
                    break;
                }
                if (distAcc > 6.8) break;
                distAcc += max(d * 0.72, 0.025);
            }

            if (hit) {
                vec3 pos = ro + rd * distAcc;
                pos.xz *= ry;
                pos.yz *= rx;
                vec3 nor = calcCoreNormal(pos, t, beatScale);
                vec3 viewDir = normalize(-pos);
                float fresnel = pow(1.0 - max(dot(nor, viewDir), 0.0), 2.8);
                float spec = pow(max(dot(reflect(-viewDir, nor), normalize(vec3(0.6, 0.8, -0.5))), 0.0), 24.0);

                vec3 matCol = mix(vec3(0.02, 0.14, 0.26), vec3(0.0, 0.94, 1.0), fresnel);
                matCol += vec3(1.0, 0.45, 0.65) * pow(fresnel, 1.8) * 0.75;
                matCol += vec3(1.0) * spec * 1.1;
                col = mix(col, matCol, 0.92);
            }

            // 倾斜相对论吸积盘光环
            vec2 diskUv = q;
            diskUv *= rot2(-0.24 + uRot.y * 0.25);
            diskUv.y *= 3.0;
            float rDisk = length(diskUv);
            float diskSpiral = sin(rDisk * 18.0 - t * 3.8 + atan(diskUv.y, diskUv.x) * 4.0) * 0.5 + 0.5;
            float diskMask = exp(-abs(rDisk - 1.15 * beatScale) * 4.6) * (0.5 + 0.5 * diskSpiral);
            vec3 diskCol = mix(vec3(0.0, 0.94, 1.0), vec3(1.0, 0.46, 0.58), smoothstep(0.7, 1.5, rDisk));

            col += glowAccum * (0.045 + uBass * 0.018);
            col += diskCol * diskMask * (0.62 + uBass * 0.28);
            col += vec3(0.08, 0.55, 0.75) * exp(-length(q) * 2.0) * 0.42;
            return col;
        }

        // ==================== 模式 1：赛博网格视界 + 切片全息日蚀 ====================
        vec3 renderMode1(vec2 p, float t, float scrollNorm) {
            vec3 col = vec3(0.014, 0.012, 0.038);

            float horizon = -0.06 - uRot.x * 0.35 - scrollNorm * 0.08;
            vec2 q = p - vec2(uRot.y * 0.42, horizon);

            // 赛博日蚀巨日
            vec2 sunPos = q - vec2(0.0, 0.28);
            float sunDist = length(sunPos);
            float sunDisc = smoothstep(0.46 + uBass * 0.04, 0.42, sunDist);
            float scanSlit = smoothstep(0.15, 0.78, sin(sunPos.y * 54.0 - t * 3.2) * 0.5 + 0.5);
            float sunBody = sunDisc * mix(0.25, 1.0, smoothstep(-0.22, 0.25, sunPos.y)) * mix(1.0, scanSlit, step(sunPos.y, 0.18));
            vec3 sunGrad = mix(vec3(1.0, 0.2, 0.52), vec3(1.0, 0.78, 0.22), clamp(sunPos.y * 1.9 + 0.45, 0.0, 1.0));
            sunGrad = mix(sunGrad, vec3(0.0, 0.94, 1.0), smoothstep(0.12, 0.42, sunPos.y) * 0.45);
            col += sunGrad * sunBody * 1.05;
            col += vec3(1.0, 0.35, 0.65) * exp(-abs(sunDist - 0.46) * 14.0) * (0.72 + uBass * 0.35);

            // 环绕巨日的斜向星轨光环
            vec2 ringUv = sunPos * rot2(-0.35);
            ringUv.y *= 3.4;
            float rOrb = abs(length(ringUv) - 0.64);
            col += vec3(0.0, 0.94, 1.0) * exp(-rOrb * 34.0) * 0.85;

            // 上下双层无限起伏透视电网
            float absY = abs(q.y);
            if (absY > 0.01) {
                float isCeil = step(0.0, q.y);
                float depth = (0.58 * clamp(uZoom, 0.75, 1.4)) / (absY + 0.012);
                float terrainWave = sin(q.x * 3.4 + t * 1.7) * 0.045 * (1.0 - isCeil);
                vec2 gridUv = vec2(q.x * depth * 1.45, depth * 1.9 + t * 2.8 + terrainWave * 5.0);

                vec2 gv = abs(fract(gridUv - 0.5) - 0.5);
                float lineW = clamp(0.028 + depth * 0.01, 0.025, 0.16);
                float gx = 1.0 - smoothstep(0.0, lineW, gv.x);
                float gz = 1.0 - smoothstep(0.0, lineW, gv.y);
                float gridLine = max(gx, gz);

                float pulse = smoothstep(0.91, 1.0, sin(gridUv.y * 0.68 - t * 5.2)) * gz;
                float fog = exp(-depth * 0.21);

                vec3 floorCol = mix(vec3(0.0, 0.94, 1.0), vec3(0.68, 0.32, 1.0), 0.35 + 0.3 * sin(gridUv.x * 0.35));
                vec3 ceilCol = mix(vec3(1.0, 0.32, 0.62), vec3(0.62, 0.3, 1.0), 0.4);
                col += mix(floorCol, ceilCol, isCeil) * gridLine * fog * (0.85 + uBass * 0.3);
                col += vec3(1.0) * pulse * fog * 0.75;
            }

            col += vec3(0.0, 0.94, 1.0) * exp(-absY * 22.0) * (0.85 + uBass * 0.35);
            return col;
        }

        // ==================== 模式 2：微分拓扑 · 莫比乌斯流形（精确 UV 参数坐标网 + 4π 单侧测地光波） ====================
        vec3 mobiusTransform(vec3 p, float t) {
            p.xz *= rot2(t * 0.22);
            p.xy *= rot2(0.32 + sin(t * 0.16) * 0.10);
            p.yz *= rot2(0.18);
            return p;
        }

        // 返回 vec2(signedDistance, matType: 0=MobiusStrip, 1=RefRing)
        vec2 mapMobiusScene(vec3 p, float t, out vec3 outLocal) {
            vec3 mp = mobiusTransform(p, t);
            float r = length(mp.xz);
            float a = atan(mp.z, mp.x + 1e-5);
            vec2 q = vec2(r - 1.06, mp.y);
            q *= rot2(a * 0.5 + t * 0.26);

            // 超薄精致莫比乌斯带截面 SDF（对称截面保证在 ±π 接缝处 100% C0 连续）
            float halfW = 0.35 + uBass * 0.025;
            float halfH = 0.015;
            vec2 b = abs(q) - vec2(halfW, halfH);
            float dStrip = (length(max(b, 0.0)) + min(max(b.x, b.y), 0.0) - 0.008) * 0.62;

            // 外围极细解析参考双圆环（天球经纬测量框）
            vec3 rp1 = mp;
            rp1.yz *= rot2(0.42);
            float dRing1 = sdTorus(rp1, vec2(1.62, 0.009));

            vec3 rp2 = mp;
            rp2.xy *= rot2(-0.52);
            rp2.xz *= rot2(0.35);
            float dRing2 = sdTorus(rp2, vec2(1.76, 0.007));

            float dRings = min(dRing1, dRing2);
            outLocal = vec3(a, q.x, q.y);

            if (dStrip < dRings) {
                return vec2(dStrip, 0.0);
            }
            return vec2(dRings, 1.0);
        }

        vec3 calcMobiusNormal(vec3 p, float t) {
            vec2 e = vec2(0.0035, 0.0);
            vec3 dummy;
            return normalize(vec3(
                mapMobiusScene(p + e.xyy, t, dummy).x - mapMobiusScene(p - e.xyy, t, dummy).x,
                mapMobiusScene(p + e.yxy, t, dummy).x - mapMobiusScene(p - e.yxy, t, dummy).x,
                mapMobiusScene(p + e.yyx, t, dummy).x - mapMobiusScene(p - e.yyx, t, dummy).x
            ));
        }

        vec3 renderMode2(vec2 p, float t, float scrollNorm) {
            vec3 col = renderCosmicBackdrop(p * 0.92, t, scrollNorm);

            // 背景克制优雅的极坐标数学波纹场（微弱等相位线）
            vec2 aq = p + vec2(uRot.y * 0.25, -uRot.x * 0.22 - scrollNorm * 0.14);
            vec2 mOff = p - uMouse;
            aq += mOff * exp(-dot(mOff, mOff) * 2.4) * (0.12 + uCharge * 0.22);
            float polarR = length(aq);
            float polarA = atan(aq.y, aq.x + 1e-5);
            float phaseField = sin(polarR * 9.0 - t * 0.8 + sin(polarA * 3.0 + t * 0.4) * 1.1);
            float isoLine = exp(-abs(phaseField) * 14.0);
            col += mix(vec3(0.14, 0.48, 0.95), vec3(0.66, 0.33, 0.98), 0.5 + 0.5 * sin(polarA * 2.0 + t * 0.3)) * isoLine * 0.14;

            // 前景 3D 微分拓扑莫比乌斯流形
            vec2 centerShift = vec2((uFocusX - 0.5) * (uResolution.x / max(uResolution.y, 1.0)) * 2.0, 0.0);
            vec2 q = p - centerShift;
            vec3 ro = vec3(0.0, 0.0, -3.55 / clamp(uZoom, 0.75, 1.45));
            vec3 rd = normalize(vec3(q, 1.62));
            mat2 ry = rot2(uRot.y * 1.15);
            mat2 rx = rot2(uRot.x * 0.95);

            float distAcc = 0.0;
            bool hit = false;
            float hitMat = 0.0;
            vec3 hitLocal = vec3(0.0);
            vec3 glowAcc = vec3(0.0);

            for (int i = 0; i < 48; i++) {
                vec3 pos = ro + rd * distAcc;
                pos.xz *= ry;
                pos.yz *= rx;

                vec3 localInfo;
                vec2 res = mapMobiusScene(pos, t, localInfo);
                float d = res.x;

                vec3 glowHue = (res.y < 0.5)
                    ? mix(vec3(0.0, 0.92, 1.0), vec3(0.68, 0.36, 1.0), 0.5 + 0.5 * sin(localInfo.x * 1.0 + t * 0.4))
                    : vec3(0.98, 0.75, 0.25);
                glowAcc += glowHue * (0.0085 / (abs(d) + 0.022));

                if (d < 0.0032) {
                    hit = true;
                    hitMat = res.y;
                    hitLocal = localInfo;
                    break;
                }
                if (distAcc > 6.6) break;
                distAcc += clamp(d * 0.78, 0.018, 0.28);
            }

            if (hit) {
                vec3 pos = ro + rd * distAcc;
                pos.xz *= ry;
                pos.yz *= rx;
                vec3 nor = calcMobiusNormal(pos, t);
                vec3 viewDir = normalize(-pos);
                float ndv = max(dot(nor, viewDir), 0.0);
                float fresnel = pow(1.0 - ndv, 2.35);

                if (hitMat < 0.5) {
                    // 单侧 4π 无接缝连续坐标 u4，与对称横向参数 vMag
                    float a = hitLocal.x;
                    float vx = hitLocal.y;
                    float u4 = (vx >= 0.0) ? a : (a + 2.0 * PI);
                    float vAbs = abs(vx);

                    // 精密等参 UV 微分网格线（每 π/6 经线 + 8 条纬线）
                    float uCell = abs(fract(u4 * (12.0 / (2.0 * PI))) - 0.5);
                    float vCell = abs(fract(vAbs * 11.428) - 0.5);
                    float uGrid = 1.0 - smoothstep(0.0, 0.055, uCell);
                    float vGrid = 1.0 - smoothstep(0.0, 0.065, vCell);
                    float gridMask = max(uGrid, vGrid);

                    // 边界高亮棱线 & 沿 4π 单侧闭轨高速奔跑的测地线解波包
                    float edgeRim = smoothstep(0.28, 0.345, vAbs);
                    float geodesicPulse = pow(0.5 + 0.5 * sin(0.5 * u4 - t * 2.1), 16.0);
                    float geodesicPulse2 = pow(0.5 + 0.5 * cos(0.5 * u4 + PI * 0.5 - t * 2.1), 16.0);

                    vec3 baseGlass = mix(vec3(0.025, 0.05, 0.13), vec3(0.11, 0.16, 0.38), fresnel);
                    vec3 gridCol = mix(vec3(0.0, 0.94, 1.0), vec3(0.68, 0.38, 1.0), 0.45 + 0.45 * sin(0.5 * u4 + t * 0.5));
                    vec3 pulseCol = mix(vec3(1.0, 0.78, 0.25), vec3(1.0, 0.45, 0.72), vAbs * 2.4);

                    float spec = pow(max(dot(reflect(-viewDir, nor), normalize(vec3(0.65, 0.85, -0.45))), 0.0), 36.0);
                    vec3 finalMat = baseGlass;
                    finalMat += gridCol * gridMask * (0.62 + 0.45 * fresnel);
                    finalMat += vec3(0.0, 0.95, 1.0) * edgeRim * 0.78;
                    finalMat += pulseCol * (geodesicPulse + geodesicPulse2 * 0.65) * 1.15;
                    finalMat += vec3(0.45, 0.78, 1.0) * fresnel * 0.55;
                    finalMat += vec3(1.0) * spec * 0.85;

                    col = mix(col, finalMat, 0.88 + fresnel * 0.12);
                } else {
                    // 参考测量圆环：微光香槟金/电青刻度光感
                    float tick = pow(0.5 + 0.5 * sin(hitLocal.x * 24.0 + t * 1.2), 6.0);
                    vec3 ringMat = mix(vec3(0.12, 0.52, 0.78), vec3(1.0, 0.80, 0.32), 0.45 + 0.55 * tick);
                    col = mix(col, ringMat * (0.9 + fresnel * 0.8), 0.92);
                }
            }
            col += glowAcc * (0.028 + uBass * 0.015);
            return col;
        }

        // ==================== 模式 3：矩阵奇点空间（3D 六边形全息穹顶与雷达扫描波） ====================
        vec3 renderMode3(vec2 p, float t, float scrollNorm) {
            vec2 q = p + vec2(uRot.y * 0.32, -uRot.x * 0.26);
            vec3 col = vec3(0.008, 0.022, 0.028);

            float field = fbm(q * 3.0 + vec2(0.0, t * 0.32 + scrollNorm * 0.45));
            col += vec3(0.0, 0.35, 0.25) * pow(field, 1.9) * 0.68;
            col += vec3(0.0, 0.55, 0.65) * exp(-length(q) * 1.35) * 0.35;

            // 六边形全息电路蜂窝
            vec2 hUv = q * (8.5 / clamp(uZoom, 0.75, 1.4));
            vec2 r = vec2(1.0, 1.7320508);
            vec2 h = r * 0.5;
            vec2 a = mod(hUv, r) - h;
            vec2 b = mod(hUv - h, r) - h;
            vec2 gv = dot(a, a) < dot(b, b) ? a : b;
            float hexDist = max(abs(gv.x), dot(abs(gv), normalize(vec2(1.0, 1.7320508))));
            float hexLine = smoothstep(0.455, 0.495, hexDist);

            // 雷达同心扫描冲击波
            float radar = pow(0.5 + 0.5 * sin(length(q) * 9.0 - t * 3.5), 6.0);
            col += vec3(0.06, 0.96, 0.68) * hexLine * (0.09 + 0.28 * radar + uBass * 0.22);
            col += vec3(0.0, 0.92, 1.0) * radar * exp(-length(q) * 0.9) * 0.22;

            float scan = 0.9 + 0.1 * sin(vUv.y * uResolution.y * 0.5);
            return col * scan;
        }

        // ==================== 模式 4：超维星轨跃迁虫洞 (Hyperspace Stargate) ====================
        vec3 renderMode4(vec2 p, float t, float scrollNorm) {
            vec2 vanish = vec2(uRot.y * 0.45, -uRot.x * 0.38 - scrollNorm * 0.12);
            vec2 q = p - vanish;

            float radius = length(q) + 0.001;
            float angle = atan(q.y, q.x);
            float tunnelDepth = (0.95 * clamp(uZoom, 0.75, 1.45)) / (radius + 0.07) + t * 3.1;
            float warpFbm = fbm(vec2(angle * 3.0 + sin(tunnelDepth * 0.35) * 0.55, tunnelDepth * 0.5));

            vec3 col = vec3(0.012, 0.016, 0.038);

            // 高速径向星云彩流
            float streak = pow(warpFbm, 2.0);
            vec3 tunnelTint = mix(vec3(0.0, 0.9, 1.0), vec3(1.0, 0.42, 0.64), 0.5 + 0.5 * sin(angle * 3.0 + t * 1.6));
            tunnelTint = mix(tunnelTint, vec3(0.68, 0.35, 1.0), 0.3 + 0.3 * cos(angle * 2.0 - t));
            col += tunnelTint * streak * smoothstep(0.04, 0.78, radius) * (1.15 + uBass * 0.45);

            // 时空门脉冲能源环
            float ringWave = pow(0.5 + 0.5 * sin(tunnelDepth * 3.6 - t * 3.4), 12.0);
            col += mix(vec3(0.0, 0.95, 1.0), vec3(1.0, 0.5, 0.7), 0.35) * ringWave * exp(-radius * 0.55) * (0.75 + uBass * 0.45);

            // 虫洞终点白热眩光
            col += vec3(0.75, 0.96, 1.0) * exp(-radius * 4.2) * (0.85 + uCharge * 0.6);
            return col;
        }

        vec3 evalMode(float modeIdx, vec2 p, float t, float scrollNorm) {
            if (modeIdx < 0.5) return renderMode0(p, t, scrollNorm);
            if (modeIdx < 1.5) return renderMode1(p, t, scrollNorm);
            if (modeIdx < 2.5) return renderMode2(p, t, scrollNorm);
            if (modeIdx < 3.5) return renderMode3(p, t, scrollNorm);
            return renderMode4(p, t, scrollNorm);
        }

        void main() {
            vec2 uv = vUv;
            float aspect = uResolution.x / max(uResolution.y, 1.0);

            float shockAge = uTime - uShockTime;
            vec2 shockOffset = vec2(0.0);
            float shockRingGlow = 0.0;
            if (shockAge > 0.0 && shockAge < 2.2) {
                vec2 toShock = (uv - uShockPos);
                toShock.x *= aspect;
                float sd = length(toShock);
                float waveRadius = shockAge * 1.45;
                float ringMask = exp(-abs(sd - waveRadius) * 18.0) * (1.0 - shockAge / 2.2);
                vec2 dir = sd > 0.001 ? toShock / sd : vec2(0.0);
                shockOffset = dir * ringMask * 0.026 * uShockPower;
                shockRingGlow = ringMask * 0.55 * uShockPower;
            }

            vec2 shakeJit = vec2(sin(uTime * 57.0), cos(uTime * 63.0)) * uShake * 0.003;
            vec2 displacedUv = uv - shockOffset + shakeJit;
            vec2 p = (displacedUv - 0.5) * vec2(aspect, 1.0) * 2.0;

            vec3 colA = evalMode(uModeA, p, uTime, uScroll);
            vec3 col = colA;
            if (uMix > 0.001 && abs(uModeA - uModeB) > 0.1) {
                vec3 colB = evalMode(uModeB, p, uTime, uScroll);
                col = mix(colA, colB, smoothstep(0.0, 1.0, uMix));
            }

            col += mix(vec3(0.0, 0.94, 1.0), vec3(1.0, 0.46, 0.58), 0.5) * shockRingGlow;

            if (uCharge > 0.02) {
                float mDist = length(p - uMouse);
                float singGlow = exp(-mDist * 4.8) * uCharge;
                col += mix(vec3(0.0, 0.94, 1.0), vec3(1.0, 0.45, 0.6), 0.5) * singGlow * 1.05;
            }

            float vig = 1.0 - dot(uv - 0.5, uv - 0.5) * 0.55;
            col *= clamp(vig, 0.5, 1.0);

            col = acesToneMap(col);
            col += (hash21(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) / 255.0;

            gl_FragColor = vec4(col, 1.0);
        }
    `;

    function compileShader(type, src) {
        const sh = gl.createShader(type);
        if (!sh) return null;
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            console.warn('[WebGL Cosmos] Shader compile error:', gl.getShaderInfoLog(sh));
            gl.deleteShader(sh);
            return null;
        }
        return sh;
    }

    const vs = compileShader(gl.VERTEX_SHADER, VERT_SRC);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) {
        window.__WEBGL_COSMOS__ = { active: false };
        return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn('[WebGL Cosmos] Program link error:', gl.getProgramInfoLog(program));
        window.__WEBGL_COSMOS__ = { active: false };
        return;
    }

    gl.useProgram(program);

    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);

    const aPosLoc = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
        uResolution: gl.getUniformLocation(program, 'uResolution'),
        uTime: gl.getUniformLocation(program, 'uTime'),
        uModeA: gl.getUniformLocation(program, 'uModeA'),
        uModeB: gl.getUniformLocation(program, 'uModeB'),
        uMix: gl.getUniformLocation(program, 'uMix'),
        uRot: gl.getUniformLocation(program, 'uRot'),
        uMouse: gl.getUniformLocation(program, 'uMouse'),
        uCharge: gl.getUniformLocation(program, 'uCharge'),
        uBass: gl.getUniformLocation(program, 'uBass'),
        uMid: gl.getUniformLocation(program, 'uMid'),
        uScroll: gl.getUniformLocation(program, 'uScroll'),
        uShake: gl.getUniformLocation(program, 'uShake'),
        uShockPos: gl.getUniformLocation(program, 'uShockPos'),
        uShockTime: gl.getUniformLocation(program, 'uShockTime'),
        uShockPower: gl.getUniformLocation(program, 'uShockPower'),
        uFocusX: gl.getUniformLocation(program, 'uFocusX'),
        uZoom: gl.getUniformLocation(program, 'uZoom')
    };

    const state = {
        active: true,
        isWebGL2: isWebGL2,
        paused: false,
        contextLost: false,
        modeA: 0,
        modeB: 0,
        mix: 0,
        transitionStart: 0,
        transitionDuration: 550,
        rotX: 0.2,
        rotY: 0.3,
        mouseX: window.innerWidth * 0.5,
        mouseY: window.innerHeight * 0.5,
        charge: 0,
        bass: 0,
        mid: 0,
        scroll: 0,
        shake: 0,
        shockX: 0.5,
        shockY: 0.5,
        shockTime: -10,
        shockPower: 0,
        zoom: 1.0,
        renderScale: 1.0
    };

    let width = window.innerWidth;
    let height = window.innerHeight;
    let rafId = 0;
    const startClock = performance.now();
    let lastTick = startClock;
    let avgFrameMs = 16.6;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        const baseDpr = width <= 768 ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.35);
        const effDpr = baseDpr * state.renderScale;
        canvas.width = Math.max(1, Math.floor(width * effDpr));
        canvas.height = Math.max(1, Math.floor(height * effDpr));
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();

    function drawFrame(now) {
        if (state.paused || state.contextLost) {
            rafId = 0;
            return;
        }
        rafId = requestAnimationFrame(drawFrame);

        const dt = now - lastTick;
        lastTick = now;

        if (dt > 0 && dt < 200) {
            avgFrameMs = avgFrameMs * 0.92 + dt * 0.08;
            if (avgFrameMs > 28 && state.renderScale > 0.68) {
                state.renderScale = Math.max(0.68, state.renderScale - 0.08);
                resize();
            } else if (avgFrameMs < 15 && state.renderScale < 1.0) {
                state.renderScale = Math.min(1.0, state.renderScale + 0.05);
                resize();
            }
        }

        const elapsed = (now - startClock) * 0.001;

        if (state.modeA !== state.modeB) {
            const progress = Math.min(1.0, (now - state.transitionStart) / state.transitionDuration);
            state.mix = progress;
            if (progress >= 1.0) {
                state.modeA = state.modeB;
                state.mix = 0;
            }
        }

        const aspect = width / Math.max(height, 1);
        const normMouseX = (state.mouseX / Math.max(width, 1) - 0.5) * aspect * 2.0;
        const normMouseY = (0.5 - state.mouseY / Math.max(height, 1)) * 2.0;
        const focusX = width > 1024 ? 0.62 : 0.5;

        gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
        gl.uniform1f(uniforms.uTime, elapsed);
        gl.uniform1f(uniforms.uModeA, state.modeA);
        gl.uniform1f(uniforms.uModeB, state.modeB);
        gl.uniform1f(uniforms.uMix, state.mix);
        gl.uniform2f(uniforms.uRot, state.rotX, state.rotY);
        gl.uniform2f(uniforms.uMouse, normMouseX, normMouseY);
        gl.uniform1f(uniforms.uCharge, state.charge);
        gl.uniform1f(uniforms.uBass, state.bass);
        gl.uniform1f(uniforms.uMid, state.mid);
        gl.uniform1f(uniforms.uScroll, state.scroll);
        gl.uniform1f(uniforms.uShake, state.shake);
        gl.uniform2f(uniforms.uShockPos, state.shockX, state.shockY);
        gl.uniform1f(uniforms.uShockTime, state.shockTime);
        gl.uniform1f(uniforms.uShockPower, state.shockPower);
        gl.uniform1f(uniforms.uFocusX, focusX);
        gl.uniform1f(uniforms.uZoom, state.zoom);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function ensureLoop() {
        if (!state.paused && !state.contextLost && !rafId) {
            lastTick = performance.now();
            rafId = requestAnimationFrame(drawFrame);
        }
    }

    canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        state.contextLost = true;
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
        }
    });

    canvas.addEventListener('webglcontextrestored', () => {
        state.contextLost = false;
        ensureLoop();
    });

    const reducedMotionQuery = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotionQuery && reducedMotionQuery.matches) {
        state.paused = true;
        drawFrame(performance.now());
    } else {
        ensureLoop();
    }

    window.__WEBGL_COSMOS__ = {
        active: true,
        isWebGL2: isWebGL2,
        getMode() {
            return state.modeB;
        },
        setMode(index) {
            const target = Math.max(0, Math.min(4, Number(index) || 0));
            if (target === state.modeB && state.modeA === target) return;
            state.modeA = state.modeB;
            state.modeB = target;
            state.mix = 0;
            state.transitionStart = performance.now();
            if (state.paused) {
                const prevPaused = state.paused;
                state.paused = false;
                state.modeA = target;
                state.modeB = target;
                state.mix = 0;
                drawFrame(performance.now());
                state.paused = prevPaused;
            }
        },
        triggerShockwave(clientX, clientY, power = 1.0) {
            state.shockX = Math.max(0, Math.min(1, clientX / Math.max(width, 1)));
            state.shockY = Math.max(0, Math.min(1, 1.0 - clientY / Math.max(height, 1)));
            state.shockTime = (performance.now() - startClock) * 0.001;
            state.shockPower = Math.max(0.4, Math.min(2.2, power));
        },
        updateState(patch) {
            if (!patch) return;
            if (typeof patch.rotX === 'number') state.rotX = patch.rotX;
            if (typeof patch.rotY === 'number') state.rotY = patch.rotY;
            if (typeof patch.mouseX === 'number') state.mouseX = patch.mouseX;
            if (typeof patch.mouseY === 'number') state.mouseY = patch.mouseY;
            if (typeof patch.charge === 'number') state.charge = patch.charge;
            if (typeof patch.bass === 'number') state.bass = patch.bass;
            if (typeof patch.mid === 'number') state.mid = patch.mid;
            if (typeof patch.scroll === 'number') state.scroll = patch.scroll;
            if (typeof patch.shake === 'number') state.shake = patch.shake;
            if (typeof patch.zoom === 'number') state.zoom = patch.zoom;
        },
        setPaused(paused) {
            state.paused = !!paused;
            if (state.paused && rafId) {
                cancelAnimationFrame(rafId);
                rafId = 0;
            } else if (!state.paused) {
                ensureLoop();
            }
        },
        isPaused() {
            return state.paused;
        }
    };
})();
