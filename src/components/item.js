import React from "react";

function Item({ title, onPlayTrack, displayTitle }) {
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
    // Extract track ID from the Spotify URL
    const trackId = title.split("/").pop();
    if (onPlayTrack) {
      onPlayTrack(trackId);
    }
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
          <button className="btn btn-link p-0" title="Track information">
            <i className="bi bi-info-circle-fill"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Item;
