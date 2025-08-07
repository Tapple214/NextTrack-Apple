import React, { useState } from "react";
import {
  Button,
  Popover,
  OverlayTrigger,
  Toast,
  ToastContainer,
} from "react-bootstrap";

function Item({
  action,
  title,
  onPlayTrack,
  displayTitle,
  metrics,
  onDeleteTrack,
  trackId,
}) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(title)
      .then(() => {
        showNotification("Link copied to clipboard!");
      })
      .catch((err) => {
        showNotification("Failed to copy link");
        console.error("Failed to copy link:", err);
      });
  };

  const handlePlayTrack = () => {
    if (onPlayTrack) {
      onPlayTrack(metrics.id);
      showNotification("Playing track...");
    }
  };

  const handleDeleteTrack = () => {
    if (onDeleteTrack) {
      onDeleteTrack(trackId);
      showNotification("Track removed from list");
    }
  };

  const metricsPopover = (
    <Popover id="metrics-popover" className="p-3">
      <Popover.Body>
        <div className="metrics-grid">
          <strong>Track Details:</strong>
          <br />
          {metrics?.name && <span>Name: {metrics.name}</span>}
          {metrics?.artists && (
            <span>Artist: {metrics.artists.map((a) => a.name).join(", ")}</span>
          )}
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <>
      <div className="items mx-3 p-3 rounded mb-3 d-flex justify-content-between align-items-center rounded-2">
        {/* Track Info */}
        <span className="pe-3">{displayTitle}</span>

        {/* Action Buttons */}
        <div className="d-flex justify-content-center align-items-center gap-2">
          {/* Copy Link */}
          <Button
            variant="link"
            id="icon-btn"
            onClick={handleCopyLink}
            title="Copy link to clipboard"
          >
            <i className="bi bi-link mb-0"></i>
          </Button>

          {/* Play Track */}
          <Button
            variant="link"
            className="btn"
            id="icon-btn"
            onClick={handlePlayTrack}
            title="Play track"
          >
            <i className="bi bi-play-fill"></i>
          </Button>

          {/* Conditional Button */}
          {action === "create" && onDeleteTrack ? (
            <Button
              variant="link"
              className="btn"
              id="icon-btn"
              onClick={handleDeleteTrack}
              title="Delete track"
            >
              <i className="bi bi-trash-fill"></i>
            </Button>
          ) : (
            metrics && (
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
            )
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg="success"
        >
          <Toast.Header>
            <strong className="me-auto">Notification</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}

export default Item;
