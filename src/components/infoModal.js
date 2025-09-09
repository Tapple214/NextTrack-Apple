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
    <Modal
      className="rounded-4"
      show={show}
      onHide={() => setShow(false)}
      centered
      size="lg"
      style={{ border: "none" }}
    >
      <Modal.Body
        className="text-center pt-4 rounded-4"
        style={{ border: "none" }}
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
                style={{ backgroundColor: "#f8f9fa" }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>{reason.title}</strong>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: "#998edf",
                        color: "white",
                      }}
                    >
                      {formatScore(reason.score)}%
                    </span>
                  </div>
                  <ProgressBar
                    now={formatScore(reason.score)}
                    className="mb-2"
                    style={{
                      height: "8px",
                      backgroundColor: "rgba(153, 142, 223, 0.2)",
                    }}
                  >
                    <ProgressBar
                      now={formatScore(reason.score)}
                      style={{
                        backgroundColor: "#998edf",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </ProgressBar>
                  <small className="text-muted">{reason.description}</small>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Modal.Body>
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

// General Info Modal for section information
export function InfoModal({ message, show, setShow }) {
  return (
    <Modal
      className="rounded-4"
      show={show}
      onHide={() => setShow(false)}
      centered
      style={{ border: "none" }}
    >
      <Modal.Body
        className="text-center pt-4 rounded-4"
        style={{ border: "none" }}
      >
        {message}
      </Modal.Body>
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
