import React, { useState } from "react";
import "./item.css";

function Item({ title, onPlayTrack, displayTitle, metrics }) {
  const [showPlayer, setShowPlayer] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(title)
      .then(() => {
        // You could add a toast notification here
        console.log("Link copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
      });
  };

  const handlePlayTrack = () => {
    setShowPlayer(!showPlayer);
    if (onPlayTrack) {
      onPlayTrack(metrics.id);
    }
  };

  const formatMetric = (value) => {
    return (value * 100).toFixed(1) + "%";
  };

  return (
    <div className="card mb-2">
      <div className="card-body">
        <h5 className="card-title">{displayTitle}</h5>
        <button
          className="btn btn-primary btn-sm me-2"
          onClick={handlePlayTrack}
        >
          {showPlayer ? "Hide Player" : "Play"}
        </button>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={handleCopyLink}
        >
          Copy YouTube Link
        </button>
        {showPlayer && (
          <div className="mt-2">
            <iframe
              width="300"
              height="80"
              src={title}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="YouTube Music Player"
            />
          </div>
        )}
        <div className="metrics-grid mt-2">
          <div className="metric">
            <span className="metric-label">Danceability:</span>
            <span className="metric-value">
              {formatMetric(metrics.danceability || 0)}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Energy:</span>
            <span className="metric-value">
              {formatMetric(metrics.energy || 0)}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Acousticness:</span>
            <span className="metric-value">
              {formatMetric(metrics.acousticness || 0)}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Instrumentalness:</span>
            <span className="metric-value">
              {formatMetric(metrics.instrumentalness || 0)}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Liveness:</span>
            <span className="metric-value">
              {formatMetric(metrics.liveness || 0)}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Valence:</span>
            <span className="metric-value">
              {formatMetric(metrics.valence || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Item;
