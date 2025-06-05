import React from "react";
import { Card, Button, Popover, OverlayTrigger } from "react-bootstrap";

function Item({ title, onPlayTrack, displayTitle, metrics }) {
  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(title)
      .then(() => {
        // TODO: Add a toast notification
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

  const metricsPopover = (
    <Popover id="metrics-popover" className="p-3">
      <Popover.Body>
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
      </Popover.Body>
    </Popover>
  );

  return (
    <Card className="mb-2">
      <Card.Body>
        <Card.Title>{displayTitle}</Card.Title>
        <div className="d-flex justify-content-end gap-2">
          <Button
            variant="link"
            className="p-0"
            onClick={handleCopyLink}
            title="Copy link to clipboard"
          >
            <i className="bi bi-link"></i>
          </Button>
          <Button
            variant="link"
            className="p-0"
            onClick={handlePlayTrack}
            title="Play track"
          >
            <i className="bi bi-play-fill"></i>
          </Button>
          {metrics && (
            <OverlayTrigger
              trigger="hover"
              placement="right"
              overlay={metricsPopover}
            >
              <Button
                variant="link"
                className="p-0"
                title="Track characteristics"
              >
                <i className="bi bi-info-circle-fill"></i>
              </Button>
            </OverlayTrigger>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export default Item;
