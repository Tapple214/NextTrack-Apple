import React from "react";
import { Button, Popover, OverlayTrigger } from "react-bootstrap";

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

  // TODO: Will contain track metrics/reason of selection (TBC)
  const metricsPopover = (
    <Popover id="metrics-popover" className="p-3">
      <Popover.Body>
        <div className="metrics-grid">Selected due to: same artist</div>
      </Popover.Body>
    </Popover>
  );

  return (
    <div className="bg-light p-2 rounded mb-1 d-flex justify-content-between align-items-center">
      {/* Song name and artist */}
      {displayTitle}

      {/* Interaction buttons */}
      {/* TODO: include delete button, etc. for different parts of the app */}
      <div className="d-flex justify-content-end gap-2">
        {/* Copy link to clipboard */}
        <Button
          variant="link"
          className="btn"
          id="icon-btn"
          onClick={handleCopyLink}
          title="Copy link to clipboard"
        >
          <i className="bi bi-link"></i>
        </Button>

        {/* Play track */}
        <Button
          variant="link"
          className="btn"
          id="icon-btn"
          onClick={handlePlayTrack}
          title="Play track"
        >
          <i className="bi bi-play-fill"></i>
        </Button>

        {/* Track information */}
        {metrics && (
          <OverlayTrigger
            trigger="hover"
            placement="top"
            overlay={metricsPopover}
          >
            <Button
              variant="link"
              className="btn"
              id="icon-btn"
              title="Track characteristics"
            >
              <i className="bi bi-info-circle-fill"></i>
            </Button>
          </OverlayTrigger>
        )}
      </div>
    </div>
  );
}

export default Item;
