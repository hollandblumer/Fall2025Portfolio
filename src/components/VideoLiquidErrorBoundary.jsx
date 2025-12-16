// src/components/VideoStretchWithBoundary.jsx
import React, { useEffect, useRef, useState } from "react";

/* =========================================================
   Error Boundary
========================================================= */
export class VideoLiquidErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) {
    return { err };
  }
  componentDidCatch(err, info) {
    console.error("[VideoStretch ErrorBoundary] Caught error:", err);
    console.error(
      "[VideoStretch ErrorBoundary] Component stack:",
      info?.componentStack
    );
  }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 12, background: "rgba(255,0,0,0.08)" }}>
          <div style={{ fontWeight: 700 }}>VideoStretch crashed</div>
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
            Check the console for the full stack trace.
          </div>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
            {String(this.state.err?.message || this.state.err)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/* =========================================================
   Helpers: clamp + seeded RNG
========================================================= */

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function hashStringToUint32(str = "") {
  // FNV-1a
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/* =========================================================
   Fluid-distortion engine (raw WebGL1)
   - AUTO mode: center-weighted distortion by default
   - Seeded per instance: different look per card
   - Efficient: 1 splat per frame
========================================================= */

class FluidDistortEngine {
  constructor(containerEl, videoEl, options = {}) {
    this.container = containerEl || null;
    this.video = videoEl || null;

    this.params = {
      // feel
      cursorSize: options.cursorSize ?? 2.0,
      cursorPower: options.cursorPower ?? 24.0,
      distortionPower: options.distortionPower ?? 0.25,

      // sim
      velocityDissipation: options.velocityDissipation ?? 0.97,
      dyeDissipation: options.dyeDissipation ?? 0.98,
      pressureIters: options.pressureIters ?? 16,

      // internal sim resolution scaling
      minSimRes: options.minSimRes ?? 256,
      maxDpr: options.maxDpr ?? 2,

      // AUTO mode (no mouse/touch)
      auto: options.auto ?? true,
      seed: options.seed ?? 1,
      autoSplatsPerFrame: options.autoSplatsPerFrame ?? 1, // keep low
      autoSpeed: options.autoSpeed ?? 0.55,
      autoRadius: options.autoRadius ?? 0.26, // fraction of min dimension in UV-ish terms
      autoCenterBias: options.autoCenterBias ?? 2.4, // higher = tighter center clustering
      autoVel: options.autoVel ?? 30.0,
      autoDye: options.autoDye ?? 22.0,
      warmStartSplats: options.warmStartSplats ?? 18, // makes it juicy immediately
    };

    this.canvas = null;
    this.gl = null;

    this._raf = 0;
    this._running = false;

    // (kept for non-auto mode; you asked for no mouse controls)
    this.pointer = {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      moved: false,
      inited: false,
    };

    this.res = { w: 0, h: 0 };

    // GL resources
    this.vertexShader = null;

    this.progSplat = null;
    this.progDivergence = null;
    this.progPressure = null;
    this.progGradSub = null;
    this.progAdvection = null;
    this.progDisplay = null;

    this.bufferVbo = null;
    this.bufferIbo = null;

    this.extFloat = null;
    this.extFloatLin = null;

    // FBOs
    this.velocity = null; // double
    this.dye = null; // double (the "offset/dye" field)
    this.divergence = null; // single
    this.pressure = null; // double

    // Video texture
    this.videoTex = null;
    this.videoW = 16;
    this.videoH = 9;

    // seeded auto state
    this._rng = mulberry32(this.params.seed >>> 0);
    this._autoPhase = this._rng() * 1000.0;
    this._didWarmStart = false;

    // events (only used if auto=false)
    this._onResize = () => this.resize();
    this._onPointerEnter = (e) => this._handlePointer(e, true);
    this._onPointerMove = (e) => this._handlePointer(e, false);
    this._onPointerLeave = () => this._handleLeave();
    this._onTouchMove = (e) => this._handleTouch(e);
  }

  init() {
    if (!this.container)
      throw new Error("FluidDistortEngine: container missing");
    if (!this.video) throw new Error("FluidDistortEngine: video missing");

    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.zIndex = "3";
    canvas.style.pointerEvents = "none";
    this.container.appendChild(canvas);
    this.canvas = canvas;

    // IMPORTANT: no mouse/touch controls in auto mode
    this.container.style.pointerEvents = this.params.auto ? "none" : "auto";

    if (!this.params.auto) {
      this.container.addEventListener("pointerenter", this._onPointerEnter, {
        passive: true,
      });
      this.container.addEventListener("pointermove", this._onPointerMove, {
        passive: true,
      });
      this.container.addEventListener("pointerleave", this._onPointerLeave, {
        passive: true,
      });
      this.container.addEventListener("touchmove", this._onTouchMove, {
        passive: false,
      });
    }

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    });
    if (!gl) throw new Error("WebGL not supported");
    this.gl = gl;

    this.extFloat = gl.getExtension("OES_texture_float");
    this.extFloatLin = gl.getExtension("OES_texture_float_linear");
    if (!this.extFloat) {
      throw new Error(
        "OES_texture_float not supported (required for this effect)"
      );
    }

    this._initQuadBuffers();
    this._initPrograms();
    this._initVideoTexture();

    window.addEventListener("resize", this._onResize);
    this.resize();

    this._running = true;
    this._raf = requestAnimationFrame((t) => this._render(t));
  }

  _initQuadBuffers() {
    const gl = this.gl;

    this.bufferVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
      gl.STATIC_DRAW
    );

    this.bufferIbo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufferIbo);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([0, 1, 2, 0, 2, 3]),
      gl.STATIC_DRAW
    );
  }

  _shader(type, source) {
    const gl = this.gl;
    const sh = gl.createShader(type);
    gl.shaderSource(sh, source);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const msg = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error(msg || "Shader compile failed");
    }
    return sh;
  }

  _program(vs, fs) {
    const gl = this.gl;
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const msg = gl.getProgramInfoLog(p);
      gl.deleteProgram(p);
      throw new Error(msg || "Program link failed");
    }
    return p;
  }

  _uniforms(program) {
    const gl = this.gl;
    const out = {};
    const n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(program, i).name;
      out[name] = gl.getUniformLocation(program, name);
    }
    return out;
  }

  _initPrograms() {
    const gl = this.gl;

    const vert = `
      precision highp float;
      attribute vec2 a_position;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 u_texel;

      void main(){
        vUv = 0.5 * (a_position + 1.0);
        vL = vUv - vec2(u_texel.x, 0.0);
        vR = vUv + vec2(u_texel.x, 0.0);
        vT = vUv + vec2(0.0, u_texel.y);
        vB = vUv - vec2(0.0, u_texel.y);
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    this.vertexShader = this._shader(gl.VERTEX_SHADER, vert);

    const fragSplat = `
      precision highp float;
      precision highp sampler2D;

      varying vec2 vUv;
      uniform sampler2D u_input_texture;
      uniform float u_ratio;
      uniform vec3 u_point_value;
      uniform vec2 u_point;
      uniform float u_point_size;

      void main(){
        vec2 p = vUv - u_point.xy;
        p.x *= u_ratio;
        vec3 splat = 0.6 * pow(2.0, -dot(p,p) / max(1e-6, u_point_size)) * u_point_value;
        vec3 base = texture2D(u_input_texture, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
      }
    `;

    const fragDivergence = `
      precision highp float;
      precision highp sampler2D;

      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D u_velocity_texture;

      void main(){
        float L = texture2D(u_velocity_texture, vL).x;
        float R = texture2D(u_velocity_texture, vR).x;
        float T = texture2D(u_velocity_texture, vT).y;
        float B = texture2D(u_velocity_texture, vB).y;
        float div = 0.25 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `;

    const fragPressure = `
      precision highp float;
      precision highp sampler2D;

      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;

      uniform sampler2D u_pressure_texture;
      uniform sampler2D u_divergence_texture;

      void main(){
        float L = texture2D(u_pressure_texture, vL).x;
        float R = texture2D(u_pressure_texture, vR).x;
        float T = texture2D(u_pressure_texture, vT).x;
        float B = texture2D(u_pressure_texture, vB).x;
        float divergence = texture2D(u_divergence_texture, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
      }
    `;

    const fragGradSub = `
      precision highp float;
      precision highp sampler2D;

      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;

      uniform sampler2D u_pressure_texture;
      uniform sampler2D u_velocity_texture;

      void main(){
        float L = texture2D(u_pressure_texture, vL).x;
        float R = texture2D(u_pressure_texture, vR).x;
        float T = texture2D(u_pressure_texture, vT).x;
        float B = texture2D(u_pressure_texture, vB).x;
        vec2 velocity = texture2D(u_velocity_texture, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `;

    const fragAdvection = `
      precision highp float;
      precision highp sampler2D;

      varying vec2 vUv;
      uniform sampler2D u_velocity_texture;
      uniform sampler2D u_input_texture;
      uniform vec2 u_texel;
      uniform vec2 u_output_textel;
      uniform float u_dt;
      uniform float u_dissipation;

      vec4 bilerp(sampler2D sam, vec2 uv, vec2 tsize){
        vec2 st = uv / tsize - 0.5;
        vec2 iuv = floor(st);
        vec2 fuv = fract(st);

        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);

        return mix(mix(a,b,fuv.x), mix(c,d,fuv.x), fuv.y);
      }

      void main(){
        vec2 coord = vUv - u_dt * bilerp(u_velocity_texture, vUv, u_texel).xy * u_texel;
        vec4 val = bilerp(u_input_texture, coord, u_output_textel);
        gl_FragColor = u_dissipation * val;
      }
    `;

    const fragDisplay = `
      precision highp float;
      precision highp sampler2D;

      varying vec2 vUv;

      uniform float u_ratio;
      uniform float u_img_ratio;
      uniform float u_disturb_power;

      uniform sampler2D u_dye_texture;
      uniform sampler2D u_velocity_texture;
      uniform sampler2D u_video_texture;

      vec2 getCoverUv(){
        vec2 uv = vUv;
        uv -= 0.5;

        // object-fit: cover
        if(u_ratio > u_img_ratio){
          uv.x = uv.x * u_ratio / u_img_ratio;
        } else {
          uv.y = uv.y * u_img_ratio / u_ratio;
        }

        uv += 0.5;
        return uv;
      }

      float frameAlpha(vec2 uv, float fw){
        float a = smoothstep(0.0, fw, uv.x) * smoothstep(1.0, 1.0 - fw, uv.x);
        a *= smoothstep(0.0, fw, uv.y) * smoothstep(1.0, 1.0 - fw, uv.y);
        return a;
      }

      void main(){
        float offset = texture2D(u_dye_texture, vUv).r;

        vec2 vel = texture2D(u_velocity_texture, vUv).xy;
        vel += vec2(0.001);

        vec2 imgUv = getCoverUv();

        vec2 dir = normalize(vel);
        imgUv -= u_disturb_power * dir * offset;
        imgUv -= u_disturb_power * dir * offset;

        vec3 col = texture2D(u_video_texture, vec2(imgUv.x, 1.0 - imgUv.y)).rgb;

        float alpha = frameAlpha(imgUv, 0.0025);
        gl_FragColor = vec4(col, alpha);
      }
    `;

    const fsSplat = this._shader(gl.FRAGMENT_SHADER, fragSplat);
    const fsDiv = this._shader(gl.FRAGMENT_SHADER, fragDivergence);
    const fsPress = this._shader(gl.FRAGMENT_SHADER, fragPressure);
    const fsGrad = this._shader(gl.FRAGMENT_SHADER, fragGradSub);
    const fsAdv = this._shader(gl.FRAGMENT_SHADER, fragAdvection);
    const fsDisp = this._shader(gl.FRAGMENT_SHADER, fragDisplay);

    const make = (fs) => {
      const program = this._program(this.vertexShader, fs);
      const uniforms = this._uniforms(program);
      return { program, uniforms };
    };

    this.progSplat = make(fsSplat);
    this.progDivergence = make(fsDiv);
    this.progPressure = make(fsPress);
    this.progGradSub = make(fsGrad);
    this.progAdvection = make(fsAdv);
    this.progDisplay = make(fsDisp);
  }

  _initVideoTexture() {
    const gl = this.gl;
    this.videoTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255])
    );
  }

  _bindQuadAttrib(programObj) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufferIbo);

    const loc = gl.getAttribLocation(programObj.program, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }

  _blit(targetFboObjOrNull) {
    const gl = this.gl;

    if (targetFboObjOrNull == null) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, targetFboObjOrNull.fbo);
      gl.viewport(0, 0, targetFboObjOrNull.width, targetFboObjOrNull.height);
    }

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  _createFBO(w, h) {
    const gl = this.gl;

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, w, h, 0, gl.RGB, gl.FLOAT, null);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex,
      0
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return {
      fbo,
      texture: tex,
      width: w,
      height: h,
      attach: (unit) => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        return unit;
      },
      dispose: () => {
        gl.deleteFramebuffer(fbo);
        gl.deleteTexture(tex);
      },
    };
  }

  _createDoubleFBO(w, h) {
    let a = this._createFBO(w, h);
    let b = this._createFBO(w, h);

    return {
      width: w,
      height: h,
      texelSizeX: 1 / w,
      texelSizeY: 1 / h,
      read: () => a,
      write: () => b,
      swap: () => {
        const t = a;
        a = b;
        b = t;
      },
      dispose: () => {
        a.dispose();
        b.dispose();
      },
    };
  }

  _initFBOs() {
    const w = this.res.w;
    const h = this.res.h;

    this.velocity?.dispose?.();
    this.dye?.dispose?.();
    this.pressure?.dispose?.();
    this.divergence?.dispose?.();

    this.velocity = this._createDoubleFBO(w, h);
    this.dye = this._createDoubleFBO(w, h);
    this.pressure = this._createDoubleFBO(w, h);
    this.divergence = this._createFBO(w, h);
  }

  resize() {
    if (!this.canvas || !this.gl || !this.container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, this.params.maxDpr);
    const cw = Math.max(1, this.container.clientWidth);
    const ch = Math.max(1, this.container.clientHeight);

    this.canvas.width = Math.floor(cw * dpr);
    this.canvas.height = Math.floor(ch * dpr);

    const ratio = cw / ch;
    const minRes = this.params.minSimRes;

    const simW = Math.max(minRes * ratio, cw);
    const simH = Math.max(minRes, ch);

    this.res.w = Math.floor(simW);
    this.res.h = Math.floor(simH);

    if (this.video) {
      this.videoW = this.video.videoWidth || this.videoW;
      this.videoH = this.video.videoHeight || this.videoH;
    }

    this._initFBOs();

    if (!this.pointer.inited) {
      this.pointer.inited = true;
      this.pointer.x = cw * 0.6;
      this.pointer.y = ch * 0.5;
    }
  }

  _handleLeave() {
    this.pointer.moved = false;
  }

  _handleTouch(e) {
    if (!this.container) return;
    if (!e?.targetTouches?.[0]) return;
    e.preventDefault();
    const t = e.targetTouches[0];
    this._handlePointer({ clientX: t.clientX, clientY: t.clientY }, false);
  }

  _handlePointer(e, isEnter) {
    if (!this.container) return;

    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!this.pointer.inited) {
      this.pointer.inited = true;
      this.pointer.x = x;
      this.pointer.y = y;
      this.pointer.dx = 0;
      this.pointer.dy = 0;
      this.pointer.moved = false;
      return;
    }

    const dx = 6 * (x - this.pointer.x);
    const dy = 6 * (y - this.pointer.y);

    this.pointer.dx = dx;
    this.pointer.dy = dy;
    this.pointer.x = x;
    this.pointer.y = y;

    this.pointer.moved = true;
    if (isEnter) {
      this.pointer.dx *= 0.25;
      this.pointer.dy *= 0.25;
    }
  }

  _updateVideoTexture() {
    const gl = this.gl;
    const v = this.video;
    if (!gl || !v || !this.videoTex) return;

    if (v.readyState < 2) return;

    const vw = v.videoWidth || this.videoW;
    const vh = v.videoHeight || this.videoH;
    if (vw && vh) {
      this.videoW = vw;
      this.videoH = vh;
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
    } catch {
      // Safari sometimes throws while switching sources; ignore this frame
    }
  }

  _autoInject(isWarm = false) {
    const gl = this.gl;
    if (!gl || !this.container) return;

    const cw = Math.max(1, this.container.clientWidth);
    const ch = Math.max(1, this.container.clientHeight);
    const ratio = cw / ch;

    this._autoPhase += this.params.autoSpeed * 0.016;
    const t = this._autoPhase;

    const seed = this.params.seed >>> 0 || 1;
    const o1 = (seed % 997) * 0.001;
    const o2 = (seed % 577) * 0.001;

    // --- 1) CENTER MOVES LIKE A SCANLINE (not orbit) ---
    // ping-pong across X
    const scanSpeed = this.params.autoScanSpeed ?? 0.22; // lower = slower
    const s = (t * scanSpeed + o1) % 1; // 0..1
    const ping = 1 - Math.abs(2 * s - 1); // 0..1..0 (ping-pong)
    let cx = 0.08 + 0.84 * ping; // keep inside

    // slight vertical drift (seeded), but not circular
    let cy = 0.5 + 0.18 * Math.sin(t * 0.17 + o2);
    cy = Math.max(0.08, Math.min(0.92, cy));

    // --- 2) SPLATS ARE JITTER AROUND CENTER (not radial/ang) ---
    const n = Math.max(1, this.params.autoSplatsPerFrame | 0);

    // smaller initial smear
    const warmSizeMul = isWarm ? 0.55 : 1.0;
    const warmJitterMul = isWarm ? 0.45 : 1.0;

    // how wide the smear "brush" is around the moving center
    const jitter = (this.params.autoJitter ?? 0.035) * warmJitterMul; // << small = tight smear

    // swipe direction: mostly horizontal, per-instance slight tilt
    const baseAng = ((seed % 1000) / 1000) * 0.35 - 0.175; // about [-0.175..0.175] radians
    const wobble = 0.05 * Math.sin(t * 0.35 + (seed % 97));
    const sweepAng = baseAng + wobble;

    let sx = Math.cos(sweepAng);
    let sy = Math.sin(sweepAng);
    const slen = Math.max(1e-5, Math.hypot(sx, sy));
    sx /= slen;
    sy /= slen;

    for (let k = 0; k < n; k++) {
      // jitter around center (box jitter, not circle)
      let u = cx + (this._rng() * 2 - 1) * jitter;
      let v = cy + (this._rng() * 2 - 1) * jitter;

      u = Math.max(0.03, Math.min(0.97, u));
      v = Math.max(0.03, Math.min(0.97, v));

      const mag =
        this.params.autoVel * (0.75 + 0.25 * Math.sin(t * 1.1 + k * 2.0));

      // --- velocity splat
      gl.useProgram(this.progSplat.program);
      this._bindQuadAttrib(this.progSplat);

      gl.uniform1i(
        this.progSplat.uniforms.u_input_texture,
        this.velocity.read().attach(1)
      );
      gl.uniform1f(this.progSplat.uniforms.u_ratio, ratio);
      gl.uniform2f(this.progSplat.uniforms.u_point, u, v);
      gl.uniform3f(
        this.progSplat.uniforms.u_point_value,
        sx * mag,
        sy * mag,
        0
      );

      gl.uniform1f(
        this.progSplat.uniforms.u_point_size,
        this.params.cursorSize * 0.00075 * warmSizeMul // smaller footprint
      );
      this._blit(this.velocity.write());
      this.velocity.swap();

      // --- dye splat
      gl.uniform1i(
        this.progSplat.uniforms.u_input_texture,
        this.dye.read().attach(1)
      );

      const dyeAmt =
        this.params.autoDye * (0.85 + 0.15 * Math.sin(t * 0.9 + k));
      gl.uniform3f(this.progSplat.uniforms.u_point_value, dyeAmt * 0.001, 0, 0);

      gl.uniform1f(
        this.progSplat.uniforms.u_point_size,
        this.params.cursorSize * 0.00075 * warmSizeMul
      );

      this._blit(this.dye.write());
      this.dye.swap();
    }
  }

  _warmStart() {
    const gl = this.gl;
    if (!gl) return;

    const bursts = Math.max(0, this.params.warmStartSplats | 0);
    if (!bursts) return;

    for (let i = 0; i < bursts; i++) this._autoInject(true); // <<< warm = smaller
  }

  _render() {
    if (!this._running) return;

    const gl = this.gl;
    if (!gl) return;

    const dt = 1 / 60;

    this._updateVideoTexture();

    if (this.params.auto) {
      if (!this._didWarmStart) {
        this._didWarmStart = true;
        this._warmStart();
      }
      this._autoInject();
    } else if (this.pointer.moved) {
      // (kept for completeness; you asked for auto mode)
      this.pointer.moved = false;

      const cw = Math.max(1, this.container.clientWidth);
      const ch = Math.max(1, this.container.clientHeight);

      const u = clamp01(this.pointer.x / cw);
      const v = clamp01(1 - this.pointer.y / ch);

      gl.useProgram(this.progSplat.program);
      this._bindQuadAttrib(this.progSplat);

      gl.uniform1i(
        this.progSplat.uniforms.u_input_texture,
        this.velocity.read().attach(1)
      );
      gl.uniform1f(this.progSplat.uniforms.u_ratio, cw / ch);
      gl.uniform2f(this.progSplat.uniforms.u_point, u, v);
      gl.uniform3f(
        this.progSplat.uniforms.u_point_value,
        this.pointer.dx,
        -this.pointer.dy,
        0
      );
      gl.uniform1f(
        this.progSplat.uniforms.u_point_size,
        this.params.cursorSize * 0.001
      );
      this._blit(this.velocity.write());
      this.velocity.swap();

      gl.uniform1i(
        this.progSplat.uniforms.u_input_texture,
        this.dye.read().attach(1)
      );
      gl.uniform3f(
        this.progSplat.uniforms.u_point_value,
        this.params.cursorPower * 0.001,
        0,
        0
      );
      this._blit(this.dye.write());
      this.dye.swap();
    }

    // divergence
    gl.useProgram(this.progDivergence.program);
    this._bindQuadAttrib(this.progDivergence);
    gl.uniform1i(
      this.progDivergence.uniforms.u_velocity_texture,
      this.velocity.read().attach(1)
    );
    gl.uniform2f(
      this.progDivergence.uniforms.u_texel,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    this._blit(this.divergence);

    // pressure solve
    gl.useProgram(this.progPressure.program);
    this._bindQuadAttrib(this.progPressure);
    gl.uniform2f(
      this.progPressure.uniforms.u_texel,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    gl.uniform1i(
      this.progPressure.uniforms.u_divergence_texture,
      this.divergence.attach(1)
    );
    for (let i = 0; i < this.params.pressureIters; i++) {
      gl.uniform1i(
        this.progPressure.uniforms.u_pressure_texture,
        this.pressure.read().attach(2)
      );
      this._blit(this.pressure.write());
      this.pressure.swap();
    }

    // gradient subtract
    gl.useProgram(this.progGradSub.program);
    this._bindQuadAttrib(this.progGradSub);
    gl.uniform2f(
      this.progGradSub.uniforms.u_texel,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    gl.uniform1i(
      this.progGradSub.uniforms.u_pressure_texture,
      this.pressure.read().attach(1)
    );
    gl.uniform1i(
      this.progGradSub.uniforms.u_velocity_texture,
      this.velocity.read().attach(2)
    );
    this._blit(this.velocity.write());
    this.velocity.swap();

    // advect velocity
    gl.useProgram(this.progAdvection.program);
    this._bindQuadAttrib(this.progAdvection);
    gl.uniform2f(
      this.progAdvection.uniforms.u_texel,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    gl.uniform2f(
      this.progAdvection.uniforms.u_output_textel,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );
    gl.uniform1i(
      this.progAdvection.uniforms.u_velocity_texture,
      this.velocity.read().attach(1)
    );
    gl.uniform1i(
      this.progAdvection.uniforms.u_input_texture,
      this.velocity.read().attach(1)
    );
    gl.uniform1f(this.progAdvection.uniforms.u_dt, dt);
    gl.uniform1f(
      this.progAdvection.uniforms.u_dissipation,
      this.params.velocityDissipation
    );
    this._blit(this.velocity.write());
    this.velocity.swap();

    // advect dye
    gl.uniform2f(
      this.progAdvection.uniforms.u_output_textel,
      this.dye.texelSizeX,
      this.dye.texelSizeY
    );
    gl.uniform1i(
      this.progAdvection.uniforms.u_input_texture,
      this.dye.read().attach(2)
    );
    gl.uniform1f(this.progAdvection.uniforms.u_dt, 8 * dt);
    gl.uniform1f(
      this.progAdvection.uniforms.u_dissipation,
      this.params.dyeDissipation
    );
    this._blit(this.dye.write());
    this.dye.swap();

    // display
    const cw = Math.max(1, this.container.clientWidth);
    const ch = Math.max(1, this.container.clientHeight);
    const ratio = cw / ch;
    const FIXED_MEDIA_RATIO = 3 / 4;

    gl.useProgram(this.progDisplay.program);
    this._bindQuadAttrib(this.progDisplay);

    gl.uniform2f(
      this.progDisplay.uniforms.u_texel,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY
    );

    gl.uniform1f(this.progDisplay.uniforms.u_ratio, ratio);
    gl.uniform1f(this.progDisplay.uniforms.u_img_ratio, FIXED_MEDIA_RATIO);

    gl.uniform1f(
      this.progDisplay.uniforms.u_disturb_power,
      this.params.distortionPower
    );

    gl.uniform1i(
      this.progDisplay.uniforms.u_dye_texture,
      this.dye.read().attach(1)
    );
    gl.uniform1i(
      this.progDisplay.uniforms.u_velocity_texture,
      this.velocity.read().attach(2)
    );

    gl.activeTexture(gl.TEXTURE0 + 3);
    gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
    gl.uniform1i(this.progDisplay.uniforms.u_video_texture, 3);

    this._blit(null);

    this._raf = requestAnimationFrame((tt) => this._render(tt));
  }

  dispose() {
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);

    window.removeEventListener("resize", this._onResize);

    if (this.container && !this.params.auto) {
      this.container.removeEventListener("pointerenter", this._onPointerEnter);
      this.container.removeEventListener("pointermove", this._onPointerMove);
      this.container.removeEventListener("pointerleave", this._onPointerLeave);
      this.container.removeEventListener("touchmove", this._onTouchMove);
    }

    const gl = this.gl;
    if (gl) {
      this.velocity?.dispose?.();
      this.dye?.dispose?.();
      this.pressure?.dispose?.();
      this.divergence?.dispose?.();

      if (this.videoTex) gl.deleteTexture(this.videoTex);

      const kill = (p) => p?.program && gl.deleteProgram(p.program);
      kill(this.progSplat);
      kill(this.progDivergence);
      kill(this.progPressure);
      kill(this.progGradSub);
      kill(this.progAdvection);
      kill(this.progDisplay);

      if (this.vertexShader) gl.deleteShader(this.vertexShader);

      if (this.bufferVbo) gl.deleteBuffer(this.bufferVbo);
      if (this.bufferIbo) gl.deleteBuffer(this.bufferIbo);
    }

    if (this.canvas?.parentNode)
      this.canvas.parentNode.removeChild(this.canvas);

    this.canvas = null;
    this.gl = null;
  }
}

/* =========================================================
   VideoStretch (component)
========================================================= */
export function VideoStretch({
  videoSrc,
  className = "",
  title,
  children,
  posterSrc,
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const engineRef = useRef(null);

  const [isVisible, setIsVisible] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [crashMsg, setCrashMsg] = useState("");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { rootMargin: "200px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    setVideoReady(false);

    const markReady = () => setVideoReady(true);
    const markNotReady = () => setVideoReady(false);

    v.addEventListener("loadeddata", markReady);
    v.addEventListener("canplay", markReady);
    v.addEventListener("canplaythrough", markReady);
    v.addEventListener("error", markNotReady);

    return () => {
      v.removeEventListener("loadeddata", markReady);
      v.removeEventListener("canplay", markReady);
      v.removeEventListener("canplaythrough", markReady);
      v.removeEventListener("error", markNotReady);
    };
  }, [videoSrc]);

  useEffect(() => {
    const containerEl = containerRef.current;
    const videoEl = videoRef.current;

    if (!isVisible || !videoReady) return;
    if (!containerEl || !videoEl) return;
    if (engineRef.current) return;

    let cancelled = false;

    const start = async () => {
      try {
        setCrashMsg("");

        try {
          await videoEl.play();
        } catch {
          // autoplay might be blocked; effect still works when frames are available
        }

        if (cancelled) return;

        const seed =
          hashStringToUint32(
            String(videoSrc || "") + "|" + String(posterSrc || "")
          ) || 1;

        const engine = new FluidDistortEngine(containerEl, videoEl, {
          // your baseline feel
          cursorSize: 2,
          cursorPower: 24,
          distortionPower: 0.28, // a touch stronger

          pressureIters: 16,
          velocityDissipation: 0.97,
          dyeDissipation: 0.98,
          minSimRes: 256,
          maxDpr: 2,

          // auto mode defaults
          auto: true,
          seed,

          // perf + look
          autoSplatsPerFrame: 1,
          autoSpeed: 0.55,
          autoRadius: 0.26,
          autoCenterBias: 2.4,
          autoVel: 30,
          autoDye: 22,
          warmStartSplats: 18,
        });

        engine.init();
        engineRef.current = engine;
        setEngineReady(true);
      } catch (e) {
        console.error("[FluidDistort] init failed:", e);
        setEngineReady(false);
        setCrashMsg(String(e?.message || e));
      }
    };

    start();

    return () => {
      cancelled = true;
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      setEngineReady(false);
    };
  }, [isVisible, videoReady, videoSrc, posterSrc]);

  const showCanvas = engineReady && videoReady;

  return (
    <article className={`project-card ${className}`}>
      <div
        className="project-media"
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: "133%",
          overflow: "hidden",
        }}
      >
        <div
          ref={containerRef}
          className="video-stretch-instance"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            overflow: "hidden",
            opacity: showCanvas ? 1 : 0,
            transition: "opacity 0.35s ease-in-out",
            zIndex: 2,
            pointerEvents: "none", // auto mode: no mouse controls
          }}
        />

        {posterSrc && (
          <img
            src={posterSrc}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: showCanvas ? 0 : 1,
              transition: "opacity 0.35s ease-in-out",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />
        )}

        <video
          ref={videoRef}
          src={videoSrc}
          muted
          loop
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
            opacity: 0,
            pointerEvents: "none",
          }}
        />

        {crashMsg && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: 12,
              background: "rgba(255,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "left",
              zIndex: 10,
            }}
          >
            <div style={{ maxWidth: 520 }}>
              <div style={{ fontWeight: 700 }}>Distortion init failed</div>
              <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                {crashMsg}
              </pre>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                (Check the console for the full stack trace.)
              </div>
            </div>
          </div>
        )}
      </div>

      {title && <h3 className="project-title">{title}</h3>}
      {children}
    </article>
  );
}

/* =========================================================
   Default export: wrapped
========================================================= */
export default function VideoStretchWithBoundary(props) {
  return (
    <VideoLiquidErrorBoundary>
      <VideoStretch {...props} />
    </VideoLiquidErrorBoundary>
  );
}
