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
    <div className="bg-light p-2 rounded mb-1 d-flex justify-content-between">
      {/* Song name and artist */}
      {displayTitle}

      {/* Interaction buttons */}
      {/* TODO: include delete button, etc. for different parts of the app */}
      <div className="d-flex justify-content-end gap-2">
        {/* Copy link to clipboard */}
        <Button
          variant="link"
          onClick={handleCopyLink}
          title="Copy link to clipboard"
        >
          <i className="bi bi-link text-success"></i>
        </Button>

        {/* Play track */}
        <Button variant="link" onClick={handlePlayTrack} title="Play track">
          <i className="bi bi-play-fill text-success"></i>
        </Button>

        {/* Track information */}
        {metrics && (
          <OverlayTrigger
            trigger="hover"
            placement="top"
            overlay={metricsPopover}
          >
            <Button variant="link" title="Track characteristics">
              <i className="bi bi-info-circle-fill text-success"></i>
            </Button>
          </OverlayTrigger>
        )}
      </div>
    </div>
  );
}

export default Item;
