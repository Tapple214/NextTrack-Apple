import React, { useState, useEffect } from "react";
import "./App.css";
import Item from "./components/item.js";
import TrackRecommendationForm from "./components/TrackRecommendationForm.js";
import musicBrainzDataset from "./datasets/musicBrainzDataset.js";
import "./components/TrackRecommendationForm.css";

function App() {
  const [recommendations, setRecommendations] = useState([]);
  const [trackInfo, setTrackInfo] = useState(null);
  const [sampleTracks, setSampleTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [activeView, setActiveView] = useState("form"); // 'form' or 'player'

  useEffect(() => {
    const loadSampleTracks = async () => {
      try {
        // For demo, use Billie Eilish as sample artist
        const artists = await musicBrainzDataset.searchArtist("Billie Eilish");
        if (!artists.length) return;
        const artist = artists[0];
        const tracks = await musicBrainzDataset.getSimilarTracks(artist.id, 5);
        const formatted = tracks.map((t) =>
          musicBrainzDataset.formatTrackData(t, artist)
        );
        setSampleTracks(formatted);
      } catch (error) {
        console.error("Error loading sample tracks:", error);
      }
    };
    loadSampleTracks();
  }, []);

  const handleRecommendations = (newRecommendations, newTrackInfo) => {
    setRecommendations(newRecommendations);
    setTrackInfo(newTrackInfo);
  };

  const handlePlayTrack = (trackId) => {
    // Find the track in recommendations or sampleTracks
    const allTracks = [...recommendations, ...sampleTracks];
    const track = allTracks.find((t) => t.id === trackId);
    setCurrentTrack(track);
    setActiveView("player"); // Switch to player view when a track is played
  };

  return (
    <div className="App container-fluid">
      <div className="row" style={{ height: "50vh" }}>
        <div className="col-6 d-flex flex-column" style={{ height: "100%" }}>
          <TrackRecommendationForm onRecommendations={handleRecommendations} />
          {activeView === "player" && currentTrack && (
            <div className="music-player mt-3">
              <h4>Now Playing:</h4>
              <div>
                <strong>{currentTrack.name}</strong> by {currentTrack.artist}
              </div>
              <iframe
                width="300"
                height="80"
                src={currentTrack.youtubeEmbedUrl}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="YouTube Music Player"
              />
              <button
                className="btn btn-secondary mt-2"
                onClick={() => setActiveView("form")}
              >
                Close Player
              </button>
            </div>
          )}
        </div>
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
                <strong>{trackInfo.name}</strong> by {trackInfo.artist}
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
                    title={track.youtubeEmbedUrl}
                    onPlayTrack={handlePlayTrack}
                    displayTitle={`${track.name} - ${track.artist}`}
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
              title={track.youtubeEmbedUrl}
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
