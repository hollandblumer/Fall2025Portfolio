// src/pages/Work.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ElasticMenu from "../components/nav/ElasticMenu";
import VideoCloth from "../components/VideoCloth";
import FilmGrainLayer from "../components/textures/FilmGrainLayer";
import LoadingBlobs from "../components/loading/LoadingBlobs.jsx";
import VideoSmear from "../components/VideoSmear.jsx";
import VideoStretch from "../components/VideoStretch.jsx";
import VideoStretchErrorBoundary from "../components/VideoStretchErrorBoundary.jsx";
import VideoLiquidErrorBoundary from "../components/VideoLiquidErrorBoundary.jsx";
import VideoStretch2 from "../components/VideoStretch2.jsx";

export const projects = [
  {
    id: 1,
    slug: "checkerboard3d",
    categories: ["featured", "creative"],
    title: "Checkerboard in Motion and 3D with Three.js",
    description: "Thrilled to see it featured by CodePen ",
    type: "video",
    videoSrc:
      "https://assets.codepen.io/9259849/5cc44ca4-52f5-4d90-98a1-0d993bc4b837.mp4",
    posterSrc: new URL("../assets/images/checkerboard3d.jpeg", import.meta.url)
      .href,
  },

  {
    id: 2,
    slug: "katherinegroverfinejewelry",
    categories: ["featured", "for clients"],
    title: "Animation for Katherine Grover Fine Jewelry",
    description:
      "Canvas Particle Animation using jewels from Katherine Grover Fine Jewelry",
    type: "video",
    videoSrc:
      "https://hollandblumer.github.io/portfolio_videos/Subheading%20(12).mp4",
    posterSrc: new URL("../assets/images/grover.jpeg", import.meta.url).href,
  },
  {
    id: 3,
    slug: "floatinglibrary",
    categories: ["featured", "for clients"],
    title: "Floating Three.js Library for Steven Shorkey",
    description:
      "A Three.js hero concept designed for an author looking beyond traditional book websites.",
    type: "video",
    videoSrc:
      "https://hollandblumer.github.io/portfolio_videos/floatinglibrary.mp4",
    posterSrc: new URL("../assets/images/floatinglibrary.png", import.meta.url)
      .href,
  },

  {
    id: 4,
    slug: "abstractolives",
    categories: ["featured", "creative"],
    title: "Design with a Splash of Code Using p5.js",
    description: "Thrilled to see it featured by CodePen ",
    type: "video",
    videoSrc:
      "https://hollandblumer.github.io/portfolio_videos/abstract-olives.mp4",
    posterSrc: new URL("../assets/images/abstractolives.jpeg", import.meta.url)
      .href,
  },

  {
    id: 5,
    slug: "chargepoint",
    categories: ["featured", "research"],
    title: "Automated Quality Assurance System for ChargePoint",
    description: "Microscopic UV-monitoring wearable",
    type: "image",
    imageSrc: new URL("../assets/images/chargepoint.png", import.meta.url).href,
  },
  {
    id: 6,
    slug: "meredithnorvell",
    categories: ["featured", "for clients"],
    title: "Wordpress Website for Meredith Norvell",
    description:
      "Designed and built with interactive book elements that steal the show",
    type: "video",
    videoSrc:
      "https://hollandblumer.github.io/portfolio_videos/meredithnorvell.mp4",
    posterSrc: new URL("../assets/images/meredith.png", import.meta.url).href,
  },

  {
    id: 7,
    slug: "americanseasons",
    categories: ["featured", "for clients"],
    title: "Buzz-Worthy Animation for American Seasons",
    description: "In light of them opening for the season on Nantucket",
    type: "video",
    videoSrc: "https://hollandblumer.github.io/portfolio_videos/seasons.mp4",
    posterSrc: new URL("../assets/images/seasons.png", import.meta.url).href,
  },
  {
    id: 8,
    slug: "larq",
    categories: ["featured", "research"],
    title: "Filter Sensor Experiments for the LARQ PureVis Pitcher",
    description:
      "Designing and validating a capacitance-based system to track filter lifespan.",
    type: "image",
    imageSrc: new URL("../assets/images/larq.png", import.meta.url).href,
  },
  {
    id: 9,
    slug: "3dslicescountdown",
    categories: ["featured", "creative"],
    title: "3D Slices Countdown",
    description:
      "A 3D countdown built from vertical ribbons that extrude forward to reveal each digit. Each ribbon samples a blurred digit field and offsets its geometry by row, creating a soft carved edge. I originally wanted to add stronger contour-line bands, but ended up keeping a subtle halo-like contour around the number for a calmer, more sculptural read.",
    type: "video",
    videoSrc:
      "https://hollandblumer.github.io/portfolio_videos/3dslicescountdown.mp4",
    posterSrc: new URL(
      "../assets/images/3dslicescountdown.png",
      import.meta.url,
    ).href,
  },

  {
    id: 10,
    slug: "cherylfudge",
    categories: ["featured", "for clients"],
    title: "Cherylfudge.com",
    description:
      "A website design that compliments Cheryl Fudge's modern, dynamic art with a nod to Nantucket.",
    type: "video",
    videoSrc: "https://hollandblumer.github.io/portfolio_videos/cfudge.mp4",
    posterSrc: new URL("../assets/images/cheryl.png", import.meta.url).href,
  },

  {
    id: 11,
    slug: "uvsense",
    categories: ["featured", "research"],
    title: "Antenna Design for the World’s Smallest UV Sensor",
    description:
      "Designed and validated a functional antenna for an ultra-compact wearable UV sensor, balancing size constraints with signal reliability.",
    type: "image",
    imageSrc: new URL("../assets/images/uv-sense.png", import.meta.url).href,
  },
  {
    id: 12,
    slug: "madewithlove",
    categories: ["featured", "for clients"],
    title: "Made With Love and p5.js",
    description:
      "When it comes together like this, it’s Valentine’s Day post-worthy",
    type: "video",
    videoSrc:
      "https://cdn.dribbble.com/userupload/40906361/file/original-391a3ed9ce0b7e144eca01fb724be566.mp4",
    posterSrc: new URL("../assets/images/madewithlove.png", import.meta.url)
      .href,
  },
  {
    id: 13,
    slug: "partana",
    categories: ["featured", "creative"],
    title: "Smear Effect for Templates",
    description: "First Template",
    type: "video",
    videoSrc: "https://hollandblumer.github.io/portfolio_videos/partana.mp4",
    posterSrc: new URL("../assets/images/partana.png", import.meta.url).href,
  },

  {
    id: 14,
    slug: "aj",
    categories: ["featured", "for clients"],
    title: "Matter.js Animation for AJ Integrated",
    description: "Short film exploring movement and tension in oil and light",
    type: "video",
    videoSrc: "https://hollandblumer.github.io/portfolio_videos/aj.mp4",
    posterSrc: new URL("../assets/images/aj.png", import.meta.url).href,
  },
  {
    id: 15,
    slug: "ccnycposter",
    categories: ["featured", "creative"],
    title: "Creative Coding NYC Poster",
    description:
      "Exploring how timing and motion can make shapes appear through perception",
    type: "video",
    videoSrc: "https://hollandblumer.github.io/portfolio_videos/ccnyc2.mp4",
    posterSrc: new URL("../assets/images/ccnyc.PNG", import.meta.url).href,
  },
];

export default function Work() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("featured");

  // NEW: loader state (hide when iframe loads)
  const [isLoading, setIsLoading] = useState(true);
  const loadStartRef = useRef(Date.now());

  // keep this src as a variable so loader can re-trigger if you ever change it
  const workIframeSrc = "./SmearTextWork.html?text=WORK&scale=3.7";

  // if src ever changes, show loader again
  useEffect(() => {
    loadStartRef.current = Date.now();
    setIsLoading(true);
  }, [workIframeSrc]);

  // Optional: prevent scrolling while loading (same as Home)
  useEffect(() => {
    document.body.style.overflow = isLoading ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLoading]);

  const visibleProjects = projects.filter((project) =>
    activeFilter === "all" ? true : project.categories.includes(activeFilter),
  );

  return (
    <>
      {/* NEW: overlay loader */}
      <LoadingBlobs show={isLoading} />

      <FilmGrainLayer />
      <main className="projects-section page">
        {/* Social icons */}
        <div className="mobile-social-icons">
          <a
            href="https://instagram.com/hollandblumer"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fa-brands fa-instagram"></i>
          </a>
          <a
            href="https://linkedin.com/in/hollandblumer"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fa-brands fa-linkedin"></i>
          </a>
        </div>

        <div className="work-nav">
          <div className="work-menu-wrapper">
            <ElasticMenu
              isOpen={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            />
          </div>{" "}
          <div className="work-desktop-social-icons">
            <a
              href="https://instagram.com/hollandblumer"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a
              href="https://linkedin.com/in/hollandblumer"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fa-brands fa-linkedin"></i>
            </a>
          </div>
          <aside className={`slideout-menu ${menuOpen ? "open" : ""}`}>
            <ul>
              <li>
                <Link to="/work" onClick={() => setMenuOpen(false)}>
                  Work
                </Link>
              </li>
              <li>
                <Link to="/#about" onClick={() => setMenuOpen(false)}>
                  About
                </Link>
              </li>
              <li>
                <Link to="/templates" onClick={() => setMenuOpen(false)}>
                  Templates
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hollandblumer6@icloud.com?subject=Website%20Inquiry&body=Hi%20Holland!"
                  onClick={() => setMenuOpen(false)}
                >
                  Contact
                </a>
              </li>
              <li>
                <a href="/" onClick={() => setMenuOpen(false)}>
                  Home
                </a>
              </li>
            </ul>
          </aside>
        </div>

        {/* Header + filters */}
        <div className="projects-header">
          <iframe
            key={workIframeSrc}
            src={workIframeSrc}
            title="Squishy Letters"
            className="work-frame"
            onLoad={() => {
              const elapsed = Date.now() - loadStartRef.current;
              const MIN_DURATION = 3000; // match Home

              const remaining = Math.max(MIN_DURATION - elapsed, 0);

              setTimeout(() => {
                setIsLoading(false);
              }, remaining);
            }}
            onError={() => setIsLoading(false)}
          />

          <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }} />

          <div className="filter-menu">
            {["featured", "for clients", "research", "creative"].map((cat) => (
              <button
                key={cat}
                className={`filter-button ${
                  activeFilter === cat ? "active" : ""
                }`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* GRID of VideoCloth components */}
        <div className="projects-grid">
          {visibleProjects.map((project) => {
            const targetLink =
              project.slug === "partana"
                ? "/templates"
                : `/work/${project.slug}`;

            return (
              <Link
                key={project.id}
                to={targetLink}
                className="project-card-link"
              >
                <div className="media-frame">
                  {project.type === "video" ? (
                    <video
                      src={project.videoSrc}
                      poster={project.posterSrc}
                      muted
                      loop
                      playsInline
                      autoPlay
                    />
                  ) : (
                    <img src={project.imageSrc} alt={project.title} />
                  )}
                </div>
                <h3 className="project-title">{project.title}</h3>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
