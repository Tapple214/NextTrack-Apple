import React, { useState } from "react";
import { Button, Toast, ToastContainer } from "react-bootstrap";
import TrackInfoModal from "./infoModal.js";

function Item({
  action,
  title,
  onPlayTrack,
  displayTitle,
  metrics,
  onDeleteTrack,
  trackId,
  hideInfoIcon = false,
  disableLocalNotifications = false,
}) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);

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
      if (!disableLocalNotifications) {
        showNotification("Playing track...");
      }
    }
  };

  const handleDeleteTrack = () => {
    if (onDeleteTrack) {
      onDeleteTrack(trackId);
      if (!disableLocalNotifications) {
        showNotification("Track removed from list");
      }
    }
  };

  const handleShowInfo = () => {
    setShowInfoModal(true);
  };

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
            metrics &&
            !hideInfoIcon && (
              <Button
                variant="link"
                className="btn"
                id="icon-btn"
                onClick={handleShowInfo}
                title="Track characteristics and matching reasons"
              >
                <i className="bi bi-info-circle-fill"></i>
              </Button>
            )
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {!disableLocalNotifications && (
        <ToastContainer position="top-end" className="p-3">
          <Toast
            show={showToast}
            onClose={() => setShowToast(false)}
            delay={3000}
            autohide
          >
            <Toast.Header>
              <strong className="me-auto">Notification</strong>
            </Toast.Header>
            <Toast.Body>{toastMessage}</Toast.Body>
          </Toast>
        </ToastContainer>
      )}

      {/* Track Info Modal */}
      <TrackInfoModal
        track={metrics}
        show={showInfoModal}
        setShow={setShowInfoModal}
      />
    </>
  );
}

export default Item;
