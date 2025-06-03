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
          className="flex-grow-1 p-3 overflow-auto"
          style={{
            maxWidth: "50%",
            backgroundColor: "#f8f9fa",
            borderLeft: "1px solid #dee2e6",
          }}
        >
          {trackInfo && (
            <div className="mb-4">
              <h3 className="text-primary mb-3">Seed Track</h3>
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{trackInfo.name}</h5>
                  <p className="card-text">
                    {trackInfo.artists.map((artist) => artist.name).join(", ")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {recommendations.length > 0 && (
            <div>
              <h3 className="text-primary mb-3">Recommended Tracks</h3>
              <div className="recommendations-list">
                {recommendations.map((track) => (
                  <div key={track.id} className="card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">{track.name}</h5>
                      <p className="card-text">
                        {track.artists.map((artist) => artist.name).join(", ")}
                      </p>
                      {track.preview_url && (
                        <audio controls className="w-100 mb-2">
                          <source src={track.preview_url} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      )}
                      <a
                        href={track.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary btn-sm"
                      >
                        Open in Spotify
                      </a>
                    </div>
                  </div>
                ))}
              </div>
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
