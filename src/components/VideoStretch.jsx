import React, { useEffect, useRef, useState } from "react";
import * as THREE from "https://cdn.skypack.dev/three@0.124.0/build/three.module.js";

/* =========================
   Spring vertex (p5-like)
========================= */
class SpringVertex {
  constructor(x, y, z, i, j, pinned = false) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.ox = x;
    this.oy = y;
    this.oz = z;

    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.fx = 0;
    this.fy = 0;
    this.fz = 0;

    this.i = i;
    this.j = j;
    this.pinned = pinned;

    this.seed = (i * 92821 + j * 68917) % 1000;
  }

  applyForce(fx, fy, fz = 0) {
    this.fx += fx;
    this.fy += fy;
    this.fz += fz;
  }

  applyAutoWobble(t, strength) {
    if (strength <= 0) return;
    const s = this.seed * 0.01;
    const ax = (Math.sin(t * 1.7 + s) + Math.sin(t * 0.9 + s * 2.0)) * 0.5;
    const ay = (Math.cos(t * 1.3 + s) + Math.sin(t * 1.1 + s * 3.0)) * 0.5;
    this.applyForce(ax * strength, ay * strength, 0);
  }

  solve(elasticity, damping) {
    if (this.pinned) {
      this.x = this.ox;
      this.y = this.oy;
      this.z = this.oz;
      this.vx = 0;
      this.vy = 0;
      this.vz = 0;
      this.fx = 0;
      this.fy = 0;
      this.fz = 0;
      return;
    }

    // spring back
    this.fx += (this.ox - this.x) * elasticity;
    this.fy += (this.oy - this.y) * elasticity;
    this.fz += (this.oz - this.z) * elasticity;

    // integrate
    this.vx = this.vx * damping + this.fx;
    this.vy = this.vy * damping + this.fy;
    this.vz = this.vz * damping + this.fz;

    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;

    this.fx = 0;
    this.fy = 0;
    this.fz = 0;
  }
}

/* =========================
   Engine
========================= */
class VideoStretchEngine {
  constructor(containerEl, videoEl, options) {
    this.container = containerEl || null;
    this.video = videoEl || null;

    const o = options || {};

    this.params = {
      segX: o.segX ?? 70,
      segY: o.segY ?? 70,

      elasticity: o.elasticity ?? 0.02,
      damping: o.damping ?? 0.78,

      adjacentK: o.adjacentK ?? 0.1,

      mouseStrength: o.mouseStrength ?? 0.65,
      mouseRadius: o.mouseRadius ?? 0.35,

      autoWobble: o.autoWobble ?? 0.0025,

      zBulge: o.zBulge ?? 0.05,
      zDrag: o.zDrag ?? 0.12,
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

    this.raycaster = new THREE.Raycaster();
    this.pointerNDC = new THREE.Vector2();
    this.lastHit = null;
    this.hit = null;

    this.clock = new THREE.Clock();

    this._onResize = () => this.resize();
    this._onPointerMove = (e) => this.handlePointerMove(e);
  }

  init() {
    if (!this.container)
      throw new Error("VideoStretchEngine: container is missing");
    if (!this.video)
      throw new Error("VideoStretchEngine: video element is missing");

    // renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const canvas = this.renderer.domElement;
    canvas.style.position = "absolute";
    canvas.style.inset = 0;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    this.container.appendChild(canvas);

    // scene/camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 10);
    this.camera.position.set(0, 0, 2.2);
    this.camera.lookAt(0, 0, 0);

    // texture (safe even if autoplay is blocked)
    this.videoTexture = new THREE.VideoTexture(this.video);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;
    this.videoTexture.format = THREE.RGBFormat;

    // mesh
    this.buildMesh();

    window.addEventListener("resize", this._onResize);
    this.renderer.domElement.addEventListener(
      "pointermove",
      this._onPointerMove,
      { passive: true }
    );

    this.resize();
    this.renderer.setAnimationLoop(() => this.update());
  }

  buildMesh() {
    const segX = this.params?.segX ?? 70;
    const segY = this.params?.segY ?? 70;

    const planeW = 1.6;
    const planeH = 1.6;

    this.geometry = new THREE.PlaneGeometry(planeW, planeH, segX, segY);
    const pos = this.geometry.attributes?.position;

    if (!pos)
      throw new Error(
        "VideoStretchEngine: geometry position attribute missing"
      );

    this.material = new THREE.MeshBasicMaterial({
      map: this.videoTexture,
      side: THREE.DoubleSide,
      toneMapped: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    // springs
    this.springs = [];
    this.neighbors = [];

    const cols = segX + 1;
    const rows = segY + 1;

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const idx = j * cols + i;

        const x = pos.getX(idx);
        const y = pos.getY(idx);
        const z = pos.getZ(idx);

        const isCorner =
          (i === 0 && j === 0) ||
          (i === cols - 1 && j === 0) ||
          (i === 0 && j === rows - 1) ||
          (i === cols - 1 && j === rows - 1);

        const sv = new SpringVertex(x, y, z, i, j, isCorner);

        // pillow bulge
        if ((this.params.zBulge ?? 0) > 0) {
          const cx = (i / (cols - 1)) * 2 - 1;
          const cy = (j / (rows - 1)) * 2 - 1;
          const d = Math.min(1, Math.sqrt(cx * cx + cy * cy));
          sv.z -= (1 - d) * this.params.zBulge;
          sv.oz = sv.z;
        }

        this.springs[idx] = sv;

        const left = i > 0 ? idx - 1 : -1;
        const right = i < cols - 1 ? idx + 1 : -1;
        const up = j > 0 ? idx - cols : -1;
        const down = j < rows - 1 ? idx + cols : -1;

        this.neighbors[idx] = [left, right, up, down];
      }
    }
  }

  resize() {
    if (!this.container || !this.renderer || !this.camera || !this.mesh) return;

    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;

    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    // object-fit: cover scaling based on video aspect
    const vidW = this.video?.videoWidth || 16;
    const vidH = this.video?.videoHeight || 9;

    const containerAspect = w / h;
    const videoAspect = vidW / vidH;

    let scaleX = 1;
    let scaleY = 1;

    if (containerAspect > videoAspect) {
      scaleX = containerAspect / videoAspect;
      scaleY = 1;
    } else {
      scaleX = 1;
      scaleY = videoAspect / containerAspect;
    }

    this.mesh.scale.set(scaleX, scaleY, 1);

    this.params._effectiveMouseRadius =
      this.params.mouseRadius * Math.max(scaleX, scaleY);
  }

  handlePointerMove(e) {
    if (!this.renderer || !this.camera || !this.mesh) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    this.pointerNDC.set(nx, ny);
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);

    const hits = this.raycaster.intersectObject(this.mesh, false);
    if (!hits || hits.length === 0) return;

    const local = this.mesh.worldToLocal(hits[0].point.clone());

    this.lastHit = this.hit ? { ...this.hit } : { x: local.x, y: local.y };
    this.hit = { x: local.x, y: local.y };
  }

  applyNeighborCoupling() {
    const k = this.params.adjacentK;
    if (k <= 0) return;

    for (let idx = 0; idx < this.springs.length; idx++) {
      const s = this.springs[idx];
      const [l, r, u, d] = this.neighbors[idx];

      let fx = 0,
        fy = 0,
        fz = 0;
      if (l >= 0) {
        fx += this.springs[l].vx;
        fy += this.springs[l].vy;
        fz += this.springs[l].vz;
      }
      if (r >= 0) {
        fx += this.springs[r].vx;
        fy += this.springs[r].vy;
        fz += this.springs[r].vz;
      }
      if (u >= 0) {
        fx += this.springs[u].vx;
        fy += this.springs[u].vy;
        fz += this.springs[u].vz;
      }
      if (d >= 0) {
        fx += this.springs[d].vx;
        fy += this.springs[d].vy;
        fz += this.springs[d].vz;
      }

      s.applyForce(fx * k, fy * k, fz * k);
    }
  }

  applyMouseForces() {
    if (!this.hit || !this.lastHit) return;

    const dx = this.hit.x - this.lastHit.x;
    const dy = this.hit.y - this.lastHit.y;
    if (dx === 0 && dy === 0) return;

    const r = this.params._effectiveMouseRadius ?? this.params.mouseRadius;
    const strength = this.params.mouseStrength;

    for (let i = 0; i < this.springs.length; i++) {
      const s = this.springs[i];
      const dist = Math.hypot(s.x - this.hit.x, s.y - this.hit.y);
      if (dist > r) continue;

      const falloff = 1 - dist / r;

      s.applyForce(dx * falloff * strength, dy * falloff * strength, 0);

      if (this.params.zDrag > 0) {
        const push =
          (Math.abs(dx) + Math.abs(dy)) * falloff * this.params.zDrag;
        s.applyForce(0, 0, -push);
      }
    }
  }

  update() {
    if (!this.renderer || !this.scene || !this.camera || !this.geometry) return;

    const t = this.clock.getElapsedTime();

    this.applyNeighborCoupling();
    this.applyMouseForces();

    if (this.params.autoWobble > 0) {
      for (let i = 0; i < this.springs.length; i++) {
        this.springs[i].applyAutoWobble(t, this.params.autoWobble);
      }
    }

    const pos = this.geometry.attributes.position;

    for (let i = 0; i < this.springs.length; i++) {
      const s = this.springs[i];
      s.solve(this.params.elasticity, this.params.damping);
      pos.setXYZ(i, s.x, s.y, s.z);
    }

    pos.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener("resize", this._onResize);

    if (this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener(
        "pointermove",
        this._onPointerMove
      );
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

    if (this.videoTexture) this.videoTexture.dispose();
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mesh = null;
    this.geometry = null;
    this.material = null;
    this.videoTexture = null;

    this.springs = [];
    this.neighbors = [];
    this.hit = null;
    this.lastHit = null;
  }
}

/* =========================
   React component
========================= */
export default function VideoStretch({
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

  // Observe visibility
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Track video readiness
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

  // Init engine ONLY when visible + videoReady + refs exist
  useEffect(() => {
    const containerEl = containerRef.current;
    const videoEl = videoRef.current;

    if (!isVisible || !videoReady) return;
    if (!containerEl || !videoEl) return;
    if (engineRef.current) return;

    // attempt autoplay (safe if blocked)
    videoEl.play().catch(() => {});

    const engine = new VideoStretchEngine(containerEl, videoEl, {
      segX: 70,
      segY: 70,
      elasticity: 0.02,
      damping: 0.78,
      adjacentK: 0.1,
      mouseStrength: 0.65,
      mouseRadius: 0.35,
      autoWobble: 0.0025,
      zBulge: 0.05,
      zDrag: 0.12,
    });

    engine.init();
    engineRef.current = engine;
    setEngineReady(true);

    return () => {
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
      </div>

      {title && <h3 className="project-title">{title}</h3>}
      {children}
    </article>
  );
}
