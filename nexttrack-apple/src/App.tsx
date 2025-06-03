import React, { useState } from "react";
import "./App.css";
import TrackDisplay from "./components/TrackDisplay";
import Item from "./components/item";

function App() {
  const [trackId, setTrackId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleRecommendationFormSubmit = async () => {
    setError("");
    setResult(null);

    if (!trackId) {
      setError("Please enter a track ID");
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackId }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setResult(data);
      }
    } catch (error: any) {
      setError(error.message || "Network error");
    }
  };

  return (
    <div
      className="d-flex flex-column"
      style={{ height: "100vh", width: "100vw" }}
    >
      <div className="d-flex col-6" style={{ height: "50%", width: "100vw" }}>
        <div
          className="d-flex flex-column flex-grow-1"
          style={{ maxWidth: "50%" }}
        >
          {/* Tools */}
          <div
            className="bg-primary flex-grow-1 d-flex justify-content-around align-items-center"
            style={{ height: "10%", fontSize: "30px" }}
          >
            <i className="bi bi-magic"></i>
            <i className="bi bi-film"></i>
            <i className="bi bi-info-circle-fill"></i>
          </div>
          {/* Preview */}
          <div
            className="bg-secondary flex-grow-1 d-flex flex-column justify-content-center align-items-center"
            style={{ height: "80%" }}
          >
            {/* Recommendation Form */}
            <div className="d-flex mb-3">
              <input
                type="text"
                className="form-control me-2"
                placeholder="Enter Spotify Track ID"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
              />
              <button
                className="btn btn-primary"
                onClick={handleRecommendationFormSubmit}
              >
                Get Recommendations
              </button>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {/* Spotify Preview */}
            {result && (
              <iframe
                src={`https://open.spotify.com/embed/track/${trackId}`}
                width="495"
                height="350"
                frameBorder="0"
                allow="encrypted-media"
              ></iframe>
            )}
          </div>
        </div>
        {/* Recommendation Results */}
        <div
          className="bg-success flex-grow-1"
          style={{ maxWidth: "50%", overflowY: "auto" }}
        >
          {result && (
            <TrackDisplay
              track={result.track}
              recommendations={result.recommendations}
            />
          )}
        </div>
      </div>

      <div className="d-flex col-6" style={{ height: "50%", width: "100vw" }}>
        {/* Ready-made Track List */}
        <div
          className="bg-danger flex-grow-1 px-3 pt-3"
          style={{ maxWidth: "50%" }}
        >
          <Item title="hello" />
        </div>
        {/* Custom Track List */}
        <div className="bg-warning flex-grow-1" style={{ maxWidth: "50%" }}>
          5
        </div>
      </div>
    </div>
  );
}

export default App;
