import React, { useState } from "react";
import "./App.css";
import Item from "./components/item";
import TrackRecommendationForm from "./components/TrackRecommendationForm";
import "./components/TrackRecommendationForm.css";

function App() {
  const [recommendations, setRecommendations] = useState([]);
  const [trackInfo, setTrackInfo] = useState(null);

  const handleRecommendations = (newRecommendations, newTrackInfo) => {
    setRecommendations(newRecommendations);
    setTrackInfo(newTrackInfo);
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
            className="bg-secondary flex-grow-1 d-flex justify-content-center align-items-center"
            style={{ height: "80%" }}
          >
            <TrackRecommendationForm
              onRecommendations={handleRecommendations}
            />
          </div>
        </div>
        {/* Recommendation Results */}
        <div
          className="similar-tracks flex-grow-1 p-3 overflow-auto bg-primary"
          style={{
            maxWidth: "50%",
            backgroundColor: "#f8f9fa",
            borderLeft: "1px solid #dee2e6",
          }}
        >
          {trackInfo && (
            <div className="track-info mb-4">
              <h3>Seed Track:</h3>
              <div className="track-details">
                <strong>{trackInfo.name}</strong> by{" "}
                {trackInfo.artists.map((artist) => artist.name).join(", ")}
              </div>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="recommendations">
              <h3>Similar Tracks:</h3>
              <ul className="list-unstyled">
                {recommendations.map((track) => (
                  <li
                    key={track.id}
                    className="recommendation-item mb-3 p-2 border rounded"
                  >
                    <div className="track-name">
                      <strong>{track.name}</strong> -{" "}
                      {track.artists.map((artist) => artist.name).join(", ")}
                    </div>
                    {track.preview_url && (
                      <audio controls className="preview-player w-100 mt-2">
                        <source src={track.preview_url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    )}
                    <a
                      href={track.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="spotify-link btn btn-primary btn-sm mt-2"
                    >
                      Open in Spotify
                    </a>
                  </li>
                ))}
              </ul>
            </div>
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
          <Item title="https://open.spotify.com/track/5QO79kh1waicV47BqGRL3g" />
        </div>
        {/*  Custom Track List */}
        <div className="bg-warning flex-grow-1" style={{ maxWidth: "50%" }}>
          5
        </div>
      </div>
    </div>
  );
}

export default App;
