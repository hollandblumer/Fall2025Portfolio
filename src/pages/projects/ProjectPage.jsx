import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import DiamondTitle from "../../components/DiamondTitle.jsx";
import ElasticMenu from "../../components/nav/ElasticMenu.jsx";
import projectData from "../../assets/projectData.js";

/**
 * Helper to fetch LinkedIn OEmbed data
 */
function LinkedInEmbed({ url }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const oembedUrl = `https://www.linkedin.com/oembed?url=${encodeURIComponent(
      url,
    )}&format=json`;

    fetch(oembedUrl)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData({ fallback: true });
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!data || data.fallback) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        Read the LinkedIn article
      </a>
    );
  }

  return (
    <a
      className="linkedin-embed"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open LinkedIn article: ${data.title}`}
    >
      {data.thumbnail_url && (
        <img
          src={data.thumbnail_url}
          alt={data.title}
          className="linkedin-embed-thumb"
        />
      )}
      <div className="linkedin-embed-meta">
        <h4 className="linkedin-embed-title">{data.title}</h4>
        {data.author_name && (
          <p className="linkedin-embed-author">{data.author_name}</p>
        )}
      </div>
    </a>
  );
}

const getLinkLabel = (href) => {
  try {
    const url = new URL(href);
    const host = url.hostname.replace("www.", "");
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("codepen.io")) return "CodePen";
    if (host.includes("linkedin.com")) return "LinkedIn";
    return host;
  } catch (e) {
    return "Link";
  }
};

export default function ProjectPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [slug]);

  const project = useMemo(() => {
    if (Array.isArray(projectData)) {
      return projectData.find((p) => p.slug === slug);
    }
    if (projectData && typeof projectData === "object") {
      return projectData[slug];
    }
    return null;
  }, [slug]);

  if (!project) {
    return (
      <main className="page not-found">
        <h1>Not found</h1>
        <p>
          This project doesn’t exist. <Link to="/work">Back to Work</Link>
        </p>
      </main>
    );
  }

  const { title, tagLine, hero, palette = {}, sections = [] } = project;
  const bg = palette.bg || "#fff";
  const ink = palette.ink || "#222";

  return (
    <main
      className="project-page page"
      style={{
        background: bg,
        color: ink,
        lineHeight: 1.7,
      }}
    >
      <header className="project-hero">
        <div className="project-close-wrapper">
          <ElasticMenu isOpen={true} onClick={() => navigate(-1)} />
        </div>

        <div className="hero">
          <div className="hero-text">
            <h1>{title}</h1>
            {(tagLine || project.tagLink) && (
              <p className="tagline">
                {tagLine}
                {tagLine && project.tagLink ? " " : null}
                {project.tagLink ? (
                  <a
                    href={project.tagLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {project.tagLink.label}
                  </a>
                ) : null}
              </p>
            )}
          </div>

          {hero?.type === "instagram" && hero.embed && (
            <div className="hero-embed">
              <iframe
                src={`https://www.instagram.com/p/${
                  hero.embed.split("/p/")[1].split("/")[0]
                }/embed`}
                width="100%"
                height="480"
                frameBorder="0"
                scrolling="no"
                allowTransparency
                allow="encrypted-media"
                title={hero.alt || title}
              />
            </div>
          )}

          {hero?.image && !hero?.type && (
            <img
              src={hero.image}
              alt={hero.alt || title}
              className="hero-img"
            />
          )}
        </div>
      </header>

      <section className="project-content">
        {sections.map((block, i) => {
          switch (block.type) {
            case "text":
              // Split content by **text** markers
              const parts = block.content.split(/(\*\*.*?\*\*)/g);
              return (
                <div key={i} className="text-block">
                  {parts.map((part, index) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      // Render as a heading
                      return (
                        <h2 key={index} className="project-section-heading">
                          {part.slice(2, -2)}
                        </h2>
                      );
                    }
                    // Render as a paragraph, trimming extra whitespace
                    return part.trim() ? (
                      <p key={index}>{part.trim()}</p>
                    ) : null;
                  })}
                </div>
              );

            case "image":
              return (
                <figure key={i} className="image-block">
                  <img src={block.src} alt={block.alt || ""} />
                  {block.caption && <figcaption>{block.caption}</figcaption>}
                </figure>
              );

            case "video":
              return (
                <figure key={i} className="video-block">
                  <video
                    src={block.src}
                    playsInline
                    autoPlay
                    loop={block.loop ?? true}
                    muted
                    controls
                  />
                  {block.caption && <figcaption>{block.caption}</figcaption>}
                </figure>
              );

            case "imageGrid":
              return (
                <div key={i} className="image-grid">
                  {block.title && <h3>{block.title}</h3>}
                  <div className="grid">
                    {block.images.map((img, j) => (
                      <img key={j} src={img.src} alt={img.alt || ""} />
                    ))}
                  </div>
                  {block.caption && (
                    <p className="caption">
                      <em>{block.caption}</em>
                    </p>
                  )}
                </div>
              );

            case "link":
              const label = getLinkLabel(block.href);
              const nextBlockIsLink = sections[i + 1]?.type === "link";

              // If it's a LinkedIn link, we can use the special embed
              if (
                block.href.includes("linkedin.com/pulse") ||
                block.href.includes("/posts/")
              ) {
                return <LinkedInEmbed key={i} url={block.href} />;
              }

              return (
                <span key={i} className="link-inline-wrapper">
                  <a
                    href={block.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {label}
                  </a>
                  {nextBlockIsLink ? ", " : ". "}
                </span>
              );

            default:
              return null;
          }
        })}
      </section>

      <footer className="project-footer">
        <Link to="/work" className="cta">
          ← Back to all projects
        </Link>
      </footer>
    </main>
  );
}
