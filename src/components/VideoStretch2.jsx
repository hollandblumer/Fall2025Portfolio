import React from "react";

export default function VideoStretch2({ videoSrc, className = "" }) {
  if (!videoSrc) return null;

  return (
    <div style={{ position: "relative", width: "100%", paddingBottom: "133%" }}>
      <video
        className={className}
        src={videoSrc}
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "cover",
        }}
      />
    </div>
  );
}
