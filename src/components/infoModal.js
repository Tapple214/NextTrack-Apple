import React from "react";
import { Button, Card, ProgressBar, Modal } from "react-bootstrap";

export default function TrackInfoModal({ track, show, setShow }) {
  if (!track) return null;

  const formatScore = (score) => Math.round((score || 0) * 100);

  const getMatchingReasons = () => {
    const reasons = [];

    if (track.similarityScore) {
      reasons.push({
        title: "Overall Similarity",
        score: track.similarityScore,
        description: "Combined similarity score based on multiple factors",
      });
    }

    if (track.contentScore) {
      reasons.push({
        title: "Content Similarity",
        score: track.contentScore,
        description: "Based on tags, artist, popularity, and duration",
      });
    }

    if (track.collaborativeScore) {
      reasons.push({
        title: "Collaborative Filtering",
        score: track.collaborativeScore,
        description: "Based on user listening patterns and similar tracks",
      });
    }

    if (track.tagSimilarity) {
      reasons.push({
        title: "Tag Similarity",
        score: track.tagSimilarity,
        description: "Musical genre and style similarity",
      });
    }

    // If no specific scores are available, show a generic message
    if (reasons.length === 0) {
      reasons.push({
        title: "Track Match",
        score: 0.5,
        description:
          "This track was recommended based on general similarity to your input",
      });
    }

    return reasons;
  };

  const matchingReasons = getMatchingReasons();

  return (
    <>
      {show && (
        <div
          className="w-100 h-100 bg-black d-flex justify-content-center align-items-center bg-opacity-50"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 1000,
          }}
        >
          <div
            className="p-4 w-75 rounded-3 d-flex flex-column text-white"
            style={{
              backgroundColor: "#48426d",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div className="mb-3">
              <h5 className="mb-2">Track Information</h5>
              <div className="mb-2">
                <strong>Name:</strong> {track.name}
              </div>
              <div className="mb-3">
                <strong>Artist(s):</strong>{" "}
                {track.artists?.map((a) => a.name).join(", ")}
              </div>
            </div>

            {matchingReasons.length > 0 && (
              <div className="mb-3">
                <h6 className="mb-3">Why This Track Matches:</h6>
                {matchingReasons.map((reason, index) => (
                  <Card
                    key={index}
                    className="mb-2"
                    style={{ backgroundColor: "#5a5475" }}
                  >
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong>{reason.title}</strong>
                        <span className="badge bg-primary">
                          {formatScore(reason.score)}%
                        </span>
                      </div>
                      <ProgressBar
                        now={formatScore(reason.score)}
                        variant="info"
                        className="mb-2"
                        style={{ height: "8px" }}
                      />
                      <small className="text-muted">{reason.description}</small>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}

            <div className="d-flex justify-content-end">
              <Button
                variant="outline-light"
                onClick={() => setShow(false)}
                className="px-4"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// General Info Modal for section information
export function InfoModal({ message, show, setShow }) {
  return (
    <Modal show={show} onHide={() => setShow(false)} centered>
      <Modal.Body className="text-center pt-4">{message}</Modal.Body>
      <Button
        className="m-3"
        variant="secondary"
        onClick={() => setShow(false)}
      >
        Close
      </Button>
    </Modal>
  );
}
