// src/components/VideoStretchWithBoundary.jsx
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "https://cdn.skypack.dev/three@0.124.0/build/three.module.js";

/* =========================================================
   Error Boundary
========================================================= */
export class VideoStretchErrorBoundary extends React.Component {
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
   2D spring vertex (stable)
========================================================= */
class SpringVertex2D {
  constructor(x, y, u, v) {
    this.x = x;
    this.y = y;
    this.ox = x;
    this.oy = y;
    this.vx = 0;
    this.vy = 0;
    this.fx = 0;
    this.fy = 0;
    this.u = u;
    this.v = v; // 0..1
  }
  applyForce(fx, fy) {
    this.fx += fx;
    this.fy += fy;
  }

  solve(elasticity, damping, maxStep) {
    // spring back
    this.fx += (this.ox - this.x) * elasticity;
    this.fy += (this.oy - this.y) * elasticity;

    this.vx = this.vx * damping + this.fx;
    this.vy = this.vy * damping + this.fy;

    // clamp (prevents explosions)
    this.vx = Math.max(-maxStep, Math.min(maxStep, this.vx));
    this.vy = Math.max(-maxStep, Math.min(maxStep, this.vy));

    this.x += this.vx;
    this.y += this.vy;

    this.fx = 0;
    this.fy = 0;
  }
}

/* =========================================================
   Engine: EDGE-ONLY stretch, ORTHO camera, events on container
========================================================= */
class VideoStretchEngineEdgeOnly {
  constructor(containerEl, videoEl, options) {
    this.container = containerEl || null;
    this.video = videoEl || null;

    const o = options || {};
    this.params = {
      segX: o.segX ?? 40,
      segY: o.segY ?? 40,

      planeW: o.planeW ?? 2.0,
      planeH: o.planeH ?? 2.0,

      elasticity: o.elasticity ?? 0.07,
      damping: o.damping ?? 0.82,
      adjacentK: o.adjacentK ?? 0.03,

      mouseStrength: o.mouseStrength ?? 1.35,
      mouseRadius: o.mouseRadius ?? 0.45,
      edgeBand: o.edgeBand ?? 0.14,

      maxStep: o.maxStep ?? 0.05,
    };

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.mesh = null;
    this.geometry = null;
    this.material = null;
    this.videoTexture = null;

    this.springs = [];
    this.neighbors = [];

    this.pointerNDC = new THREE.Vector2(0, 0);
    this.lastPointerNDC = new THREE.Vector2(0, 0);
    this.hasPointer = false;

    this._onResize = () => this.resize();
    this._onPointerEnter = (e) => this.handlePointerEnter(e);
    this._onPointerMove = (e) => this.handlePointerMove(e);
  }

  init() {
    if (!this.container)
      throw new Error("VideoStretchEngine: container missing");
    if (!this.video) throw new Error("VideoStretchEngine: video missing");

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const canvas = this.renderer.domElement;
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.zIndex = "3"; // ✅ on top
    canvas.style.pointerEvents = "none"; // ✅ events handled by container (more reliable)
    this.container.appendChild(canvas);

    // ✅ container receives pointer
    this.container.style.pointerEvents = "auto";

    this.scene = new THREE.Scene();

    // Ortho: consistent sizing
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.0, 10);
    this.camera.position.set(0, 0, 2);
    this.camera.lookAt(0, 0, 0);

    this.videoTexture = new THREE.VideoTexture(this.video);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;
    this.videoTexture.format = THREE.RGBFormat;

    this.buildMesh();

    window.addEventListener("resize", this._onResize);

    // ✅ attach to container, not canvas
    this.container.addEventListener("pointerenter", this._onPointerEnter, {
      passive: true,
    });
    this.container.addEventListener("pointermove", this._onPointerMove, {
      passive: true,
    });

    this.resize();
    this.renderer.setAnimationLoop(() => this.update());
  }

  buildMesh() {
    const { segX, segY, planeW, planeH } = this.params;

    const cols = segX + 1;
    const rows = segY + 1;
    const vertCount = cols * rows;

    const positions = new Float32Array(vertCount * 3);
    const uvs = new Float32Array(vertCount * 2);
    const indices = [];

    let p = 0,
      t = 0;
    for (let j = 0; j < rows; j++) {
      const v = j / segY;
      const y = (v - 0.5) * planeH;
      for (let i = 0; i < cols; i++) {
        const u = i / segX;
        const x = (u - 0.5) * planeW;

        positions[p++] = x;
        positions[p++] = -y;
        positions[p++] = 0;

        uvs[t++] = u;
        uvs[t++] = 1 - v;
      }
    }

    for (let j = 0; j < segY; j++) {
      for (let i = 0; i < segX; i++) {
        const a = j * cols + i;
        const b = a + 1;
        const c = a + cols;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    this.geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    this.geometry.setIndex(indices);

    this.material = new THREE.MeshBasicMaterial({
      map: this.videoTexture,
      side: THREE.DoubleSide,
      toneMapped: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    const pos = this.geometry.getAttribute("position");
    this.springs = new Array(vertCount);
    this.neighbors = new Array(vertCount);

    for (let j = 0; j < rows; j++) {
      const v = j / segY;
      for (let i = 0; i < cols; i++) {
        const u = i / segX;
        const idx = j * cols + i;
        this.springs[idx] = new SpringVertex2D(
          pos.getX(idx),
          pos.getY(idx),
          u,
          v
        );

        const left = i > 0 ? idx - 1 : -1;
        const right = i < cols - 1 ? idx + 1 : -1;
        const up = j > 0 ? idx - cols : -1;
        const down = j < rows - 1 ? idx + cols : -1;
        this.neighbors[idx] = [left, right, up, down];
      }
    }
  }

  resize() {
    if (!this.container || !this.renderer || !this.mesh) return;

    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);

    // ✅ object-fit: cover so every card looks consistent
    const vidW = this.video?.videoWidth || 16;
    const vidH = this.video?.videoHeight || 9;

    const containerAspect = w / h;
    const videoAspect = vidW / vidH;

    let sx = 1,
      sy = 1;
    if (containerAspect > videoAspect) {
      sx = containerAspect / videoAspect;
    } else {
      sy = videoAspect / containerAspect;
    }
    this.mesh.scale.set(sx, sy, 1);
  }

  _eventToNDC(e) {
    const rect = this.container.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    return { nx, ny };
  }

  handlePointerEnter(e) {
    const { nx, ny } = this._eventToNDC(e);
    this.pointerNDC.set(nx, ny);
    this.lastPointerNDC.set(nx, ny);
    this.hasPointer = true;
  }

  handlePointerMove(e) {
    const { nx, ny } = this._eventToNDC(e);
    this.lastPointerNDC.copy(this.pointerNDC);
    this.pointerNDC.set(nx, ny);
    this.hasPointer = true;
  }

  // 1 at edges, 0 in center
  edgeWeight(u, v) {
    const band = this.params.edgeBand;
    const dEdge = Math.min(u, 1 - u, v, 1 - v);
    let w = 1 - Math.min(1, dEdge / band);
    return w * w * (3 - 2 * w); // smoothstep
  }

  applyNeighborCoupling() {
    const k = this.params.adjacentK;
    if (!k) return;

    for (let idx = 0; idx < this.springs.length; idx++) {
      const s = this.springs[idx];
      const [l, r, u, d] = this.neighbors[idx];

      let fx = 0,
        fy = 0;
      if (l >= 0) {
        fx += this.springs[l].vx;
        fy += this.springs[l].vy;
      }
      if (r >= 0) {
        fx += this.springs[r].vx;
        fy += this.springs[r].vy;
      }
      if (u >= 0) {
        fx += this.springs[u].vx;
        fy += this.springs[u].vy;
      }
      if (d >= 0) {
        fx += this.springs[d].vx;
        fy += this.springs[d].vy;
      }

      s.applyForce(fx * k, fy * k);
    }
  }

  applyMouseForces() {
    if (!this.hasPointer || !this.mesh) return;

    const dxN = this.pointerNDC.x - this.lastPointerNDC.x;
    const dyN = this.pointerNDC.y - this.lastPointerNDC.y;
    if (Math.abs(dxN) + Math.abs(dyN) < 0.0001) return;

    // Ortho world x/y = NDC x/y (since camera is -1..1)
    // Convert to local by undoing mesh scale.
    const sx = this.mesh.scale.x || 1;
    const sy = this.mesh.scale.y || 1;

    const hitX = (this.pointerNDC.x * 1.0) / sx; // planeW/2 is 1.0 when planeW=2
    const hitY = (this.pointerNDC.y * 1.0) / sy;

    const dx = (dxN * 1.0) / sx;
    const dy = (dyN * 1.0) / sy;

    const r = this.params.mouseRadius;
    const strength = this.params.mouseStrength;

    for (let i = 0; i < this.springs.length; i++) {
      const s = this.springs[i];

      const ew = this.edgeWeight(s.u, s.v);
      if (ew <= 0.0005) continue;

      const dist = Math.hypot(s.x - hitX, s.y - hitY);
      if (dist > r) continue;

      const falloff = 1 - dist / r;
      const w = falloff * ew;

      s.applyForce(dx * w * strength, dy * w * strength);
    }
  }

  update() {
    if (!this.renderer || !this.scene || !this.camera || !this.geometry) return;

    this.applyNeighborCoupling();
    this.applyMouseForces();

    const pos = this.geometry.getAttribute("position");
    const { elasticity, damping, maxStep } = this.params;

    for (let i = 0; i < this.springs.length; i++) {
      const s = this.springs[i];
      s.solve(elasticity, damping, maxStep);
      pos.setXYZ(i, s.x, s.y, 0);
    }
    pos.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener("resize", this._onResize);

    if (this.container) {
      this.container.removeEventListener("pointerenter", this._onPointerEnter);
      this.container.removeEventListener("pointermove", this._onPointerMove);
    }

    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
      this.renderer.dispose();
      if (this.renderer.domElement?.parentNode) {
        this.renderer.domElement.parentNode.removeChild(
          this.renderer.domElement
        );
      }
    }

    this.videoTexture?.dispose?.();
    this.geometry?.dispose?.();
    this.material?.dispose?.();

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mesh = null;
    this.geometry = null;
    this.material = null;
    this.videoTexture = null;

    this.springs = [];
    this.neighbors = [];
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
        } catch {}

        if (cancelled) return;

        const engine = new VideoStretchEngineEdgeOnly(containerEl, videoEl, {
          segX: 40,
          segY: 40,

          // feel
          edgeBand: 0.14,
          adjacentK: 0.03,

          mouseStrength: 1.35,
          mouseRadius: 0.45,

          elasticity: 0.07,
          damping: 0.82,
          maxStep: 0.05,
        });

        engine.init();
        engineRef.current = engine;
        setEngineReady(true);
      } catch (e) {
        console.error("[VideoStretch edge-only] init failed:", e);
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
  }, [isVisible, videoReady, videoSrc]);

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
            pointerEvents: "auto", // ✅ receive pointer events
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
              pointerEvents: "none", // ✅ NEVER block pointer
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
              <div style={{ fontWeight: 700 }}>VideoStretch init failed</div>
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
    <VideoStretchErrorBoundary>
      <VideoStretch {...props} />
    </VideoStretchErrorBoundary>
  );
}
