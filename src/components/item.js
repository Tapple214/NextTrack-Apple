import React from "react";
import "./item.css";

function Item({ title, onPlayTrack, displayTitle, metrics }) {
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
        <div className="d-flex justify-content-end gap-2">
          <button
            className="btn btn-link p-0"
            onClick={handleCopyLink}
            title="Copy link to clipboard"
          >
            <i className="bi bi-link"></i>
          </button>
          <button
            className="btn btn-link p-0"
            onClick={handlePlayTrack}
            title="Play track"
          >
            <i className="bi bi-play-fill"></i>
          </button>
          {metrics && (
            <div className="position-relative">
              <button
                className="btn btn-link p-0"
                title="Track characteristics"
              >
                <i className="bi bi-info-circle-fill"></i>
              </button>
              <div className="track-metrics-popover">
                <div className="metrics-grid">
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
          )}
        </div>
      </div>
    </div>
  );
}

export default Item;
