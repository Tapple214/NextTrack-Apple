import React, { useState, useEffect } from "react";
import "./App.css";
import Item from "./components/item";
import TrackRecommendationForm from "./components/TrackRecommendationForm";
import spotifyDataset from "./utils/spotifyDataset";
import "./components/TrackRecommendationForm.css";

function App() {
  const [recommendations, setRecommendations] = useState([]);
  const [trackInfo, setTrackInfo] = useState(null);
  const [sampleTracks, setSampleTracks] = useState([]);
  const [currentTrackId, setCurrentTrackId] = useState(
    "07WEDHF2YwVgYuBugi2ECO"
  );
  const [activeView, setActiveView] = useState("form"); // 'form' or 'player'

  useEffect(() => {
    const loadSampleTracks = async () => {
      await spotifyDataset.loadDataset();
      const samples = spotifyDataset.getSampleTrackIds();
      setSampleTracks(samples);
    };
    loadSampleTracks();
  }, []);

  const handleRecommendations = (newRecommendations, newTrackInfo) => {
    setRecommendations(newRecommendations);
    setTrackInfo(newTrackInfo);
  };

  const handlePlayTrack = (trackId) => {
    setCurrentTrackId(trackId);
    setActiveView("player"); // Switch to player view when a track is played
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
            <button
              className="btn btn-link text-white"
              onClick={() => setActiveView("form")}
              title="Get Recommendations"
            >
              <i className="bi bi-magic"></i>
            </button>
            <button
              className="btn btn-link text-white"
              onClick={() => setActiveView("player")}
              title="Play Track"
            >
              <i className="bi bi-film"></i>
            </button>
            <button className="btn btn-link text-white" title="Information">
              <i className="bi bi-info-circle-fill"></i>
            </button>
          </div>
          {/* Preview */}
          <div
            className="mt-5 z-3 flex-grow-1 d-flex justify-content-center align-items-center"
            style={{ height: "80%", overflow: "hidden" }}
          >
            {activeView === "player" ? (
              <iframe
                src={`https://open.spotify.com/embed/track/${currentTrackId}`}
                width="100%"
                height="380"
                frameBorder="0"
                allowtransparency="true"
                allow="encrypted-media"
              ></iframe>
            ) : (
              <TrackRecommendationForm
                onRecommendations={handleRecommendations}
              />
            )}
          </div>
        </div>
        {/* Recommendation Results */}
        <div
          className="similar-tracks flex-grow-1 p-3 overflow-auto"
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
              <div className="recommendation-list">
                {recommendations.map((track) => (
                  <Item
                    key={track.id}
                    title={`https://open.spotify.com/track/${track.id}`}
                    onPlayTrack={handlePlayTrack}
                    displayTitle={`${track.name} - ${track.artists
                      .map((artist) => artist.name)
                      .join(", ")}`}
                    metrics={track}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="d-flex col-6" style={{ height: "50%", width: "100vw" }}>
        {/* Ready-made Track List */}
        <div
          className="flex-grow-1 px-3 pt-3 overflow-auto"
          style={{ maxWidth: "50%" }}
        >
          <h3>Sample Tracks:</h3>
          {sampleTracks.map((track) => (
            <Item
              key={track.id}
              title={`https://open.spotify.com/track/${track.id}`}
              onPlayTrack={handlePlayTrack}
              displayTitle={`${track.name} - ${track.artist}`}
              metrics={track}
            />
          ))}
        </div>
        {/*  Custom Track List */}
        <div
          className="bg-warning flex-grow-1 d-flex justify-content-center align-items-center"
          style={{ maxWidth: "50%" }}
        >
          this will be the area to allow users to create their customized
          playlist
        </div>
      </div>
    </div>
  );
}

export default App;
