// src/components/VideoStretch.jsx
import React, { useEffect, useRef, useState } from "react";

// keep your Skypack style
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

    this.i = i; // grid col
    this.j = j; // grid row
    this.pinned = pinned;

    // stable per-vertex wobble seed
    this.seed = (i * 92821 + j * 68917) % 1000;
  }

  applyForce(fx, fy, fz = 0) {
    this.fx += fx;
    this.fy += fy;
    this.fz += fz;
  }

  applyAutoWobble(t, strength) {
    // cheap “noise-ish” wobble (no extra deps)
    const s = this.seed * 0.01;
    const ax = (Math.sin(t * 1.7 + s) + Math.sin(t * 0.9 + s * 2.0)) * 0.5;
    const ay = (Math.cos(t * 1.3 + s) + Math.sin(t * 1.1 + s * 3.0)) * 0.5;
    this.applyForce(ax * strength, ay * strength, 0);
  }

  solve(elasticity, damping) {
    if (this.pinned) {
      // hard pin to rest
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

    // spring back to origin (p5-like)
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

    // clear forces
    this.fx = 0;
    this.fy = 0;
    this.fz = 0;
  }
}

/* =========================
   Engine: stretchy video plane
========================= */
class VideoStretchEngine {
  constructor(containerEl, videoEl, options = {}) {
    this.container = containerEl;
    this.video = videoEl;

    // Feel knobs (tune these)
    this.params = {
      segX: options.segX ?? 60,
      segY: options.segY ?? 60,

      elasticity: options.elasticity ?? 0.02, // spring back strength
      damping: options.damping ?? 0.78, // velocity damping

      adjacentK: options.adjacentK ?? 0.1, // neighbor coupling like your p5 ADJACENT_SPRING_CONSTANT
      mouseStrength: options.mouseStrength ?? 0.65,
      mouseRadius: options.mouseRadius ?? 0.35, // in plane local units

      autoWobble: options.autoWobble ?? 0.0025, // set to 0 to disable

      // “depth” bulge (optional)
      zBulge: options.zBulge ?? 0.05,
      zDrag: options.zDrag ?? 0.12,
    };

    // three core
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.mesh = null;
    this.geometry = null;
    this.material = null;

    this.videoTexture = null;

    // physics grid
    this.springs = [];
    this.neighbors = []; // per index: [left,right,up,down] indices (or -1)

    // pointer in plane space
    this.raycaster = new THREE.Raycaster();
    this.pointerNDC = new THREE.Vector2();
    this.lastHit = null; // {x,y}
    this.hit = null; // {x,y}

    // clock
    this.clock = new THREE.Clock();

    this._onResize = () => this.resize();
    this._onPointerMove = (e) => this.handlePointerMove(e);
  }

  init() {
    if (!this.container || !this.video) return;

    // renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.inset = 0;
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.display = "block";
    this.container.appendChild(this.renderer.domElement);

    // scene/camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 10);
    this.camera.position.set(0, 0, 2.2);
    this.camera.lookAt(0, 0, 0);

    // video texture
    this.videoTexture = new THREE.VideoTexture(this.video);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;
    this.videoTexture.format = THREE.RGBFormat;

    // geometry/material/mesh
    this.buildMesh();

    // listeners
    window.addEventListener("resize", this._onResize);
    // pointer events on renderer for correct coords
    this.renderer.domElement.addEventListener(
      "pointermove",
      this._onPointerMove,
      { passive: true }
    );

    // size now
    this.resize();

    // loop
    this.renderer.setAnimationLoop(() => this.update());
  }

  buildMesh() {
    const { segX, segY } = this.params;

    // We'll size the plane to 2x2 world units-ish and then scale to cover container (object-fit: cover behavior)
    const planeW = 1.6;
    const planeH = 1.6;

    this.geometry = new THREE.PlaneGeometry(planeW, planeH, segX, segY);

    // material: keep video crisp + normal
    this.material = new THREE.MeshBasicMaterial({
      map: this.videoTexture,
      side: THREE.DoubleSide,
      toneMapped: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 0, 0);
    this.scene.add(this.mesh);

    // build spring grid from geometry positions
    const pos = this.geometry.attributes.position;
    this.springs = [];
    this.neighbors = [];

    // grid has (segX+1) * (segY+1) vertices
    const cols = segX + 1;
    const rows = segY + 1;

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const idx = j * cols + i;

        const x = pos.getX(idx);
        const y = pos.getY(idx);
        const z = pos.getZ(idx);

        // pin the 4 corners (stable, like cloth pins but minimal)
        const isCorner =
          (i === 0 && j === 0) ||
          (i === cols - 1 && j === 0) ||
          (i === 0 && j === rows - 1) ||
          (i === cols - 1 && j === rows - 1);

        const sv = new SpringVertex(x, y, z, i, j, isCorner);

        // optional gentle “bulge” in z so it feels pillowy
        if (this.params.zBulge > 0) {
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
    if (!this.container || !this.renderer || !this.camera) return;

    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;

    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    // Scale plane to behave like object-fit: cover
    // We want the video plane to fill the container, cropping if needed.
    const vidW = this.video.videoWidth || 16;
    const vidH = this.video.videoHeight || 9;

    const containerAspect = w / h;
    const videoAspect = vidW / vidH;

    // base plane size (from buildMesh)
    const baseW = 1.6;
    const baseH = 1.6;

    let scaleX = 1;
    let scaleY = 1;

    if (containerAspect > videoAspect) {
      // container wider -> expand X
      scaleX = containerAspect / videoAspect;
      scaleY = 1;
    } else {
      // container taller -> expand Y
      scaleX = 1;
      scaleY = videoAspect / containerAspect;
    }

    this.mesh.scale.set(scaleX, scaleY, 1);

    // mouse radius should feel consistent across scale
    this.params._effectiveMouseRadius =
      this.params.mouseRadius * Math.max(scaleX, scaleY);
  }

  handlePointerMove(e) {
    if (!this.renderer || !this.camera || !this.mesh) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    this.pointerNDC.set(x * 2 - 1, -(y * 2 - 1));

    this.raycaster.setFromCamera(this.pointerNDC, this.camera);

    const hits = this.raycaster.intersectObject(this.mesh, false);
    if (!hits || !hits.length) return;

    const p = hits[0].point; // world coords of hit
    // Convert to mesh local space so forces are stable even if scaled
    const local = this.mesh.worldToLocal(p.clone());

    this.lastHit = this.hit ? { ...this.hit } : { x: local.x, y: local.y };
    this.hit = { x: local.x, y: local.y };
  }

  applyMouseForces() {
    if (!this.hit || !this.lastHit) return;

    const dx = this.hit.x - this.lastHit.x;
    const dy = this.hit.y - this.lastHit.y;

    // if the pointer barely moved, don’t inject force
    if (dx === 0 && dy === 0) return;

    const r = this.params._effectiveMouseRadius ?? this.params.mouseRadius;
    const strength = this.params.mouseStrength;

    for (let k = 0; k < this.springs.length; k++) {
      const s = this.springs[k];
      const dist = Math.hypot(s.x - this.hit.x, s.y - this.hit.y);
      if (dist > r) continue;

      const falloff = 1 - dist / r;
      const fx = dx * falloff * strength;
      const fy = dy * falloff * strength;

      s.applyForce(fx, fy, 0);

      // optional slight “push into screen” on drag
      if (this.params.zDrag > 0) {
        const push =
          (Math.abs(dx) + Math.abs(dy)) * falloff * this.params.zDrag;
        s.applyForce(0, 0, -push);
      }
    }
  }

  applyNeighborCoupling() {
    // like your p5: neighbors contribute force based on their velocities
    const k = this.params.adjacentK;
    if (k <= 0) return;

    for (let idx = 0; idx < this.springs.length; idx++) {
      const s = this.springs[idx];
      const [l, r, u, d] = this.neighbors[idx];

      // sum neighbor velocities (simple + stable)
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

  update() {
    if (!this.renderer || !this.scene || !this.camera || !this.geometry) return;

    const t = this.clock.getElapsedTime();

    // 1) forces
    this.applyNeighborCoupling();
    this.applyMouseForces();

    // subtle auto-wobble (optional)
    if (this.params.autoWobble > 0) {
      for (let i = 0; i < this.springs.length; i++) {
        this.springs[i].applyAutoWobble(t, this.params.autoWobble);
      }
    }

    // 2) integrate + write to geometry
    const pos = this.geometry.attributes.position;
    const { elasticity, damping } = this.params;

    for (let i = 0; i < this.springs.length; i++) {
      const s = this.springs[i];
      s.solve(elasticity, damping);
      pos.setXYZ(i, s.x, s.y, s.z);
    }

    pos.needsUpdate = true;

    // 3) render
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

  // 1) Intersection observer
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

  // 2) Track video readiness
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

  // 3) Init engine once visible
  useEffect(() => {
    const containerEl = containerRef.current;
    const videoEl = videoRef.current;
    if (!isVisible || !containerEl || !videoEl) return;
    if (engineRef.current) return;

    // kick playback (will still work if autoplay blocked; texture updates after gesture)
    videoEl.play().catch(() => {});

    const engine = new VideoStretchEngine(containerEl, videoEl, {
      // feel knobs — tweak to taste
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
      setVideoReady(false);
    };
  }, [isVisible, videoSrc]);

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
        {/* WebGL target */}
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

        {/* Poster overlay until ready */}
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

        {/* Hidden video used as texture */}
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
