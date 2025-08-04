import React, { useState, useEffect } from "react";
import Item from "./components/ItemDisplay.js";

import recommenderAPI from "./utils/RecommenderAPI.js";
import ToolsArea from "./components/ToolsArea.js";
import ToolsToggle from "./components/ToolsToggle.js";
import RecommendationResults from "./components/RecommendationResults.js";
import CreateTrackList from "./components/createTrackList.js";

// TODO: Apply responsive design
function App() {
  const [recommendations, setRecommendations] = useState([]);
  const [trackInfo, setTrackInfo] = useState(null);
  const [sampleTracks, setSampleTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [activeView, setActiveView] = useState("form");

  useEffect(() => {
    const loadSampleTracks = async () => {
      try {
        const tracks = await recommenderAPI.getSampleTracks(5);
        setSampleTracks(tracks);
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
    const allTracks = [...recommendations, ...sampleTracks];
    const track = allTracks.find((t) => t.id === trackId);
    setCurrentTrack(track);
    setActiveView("player");
  };

  return (
    <div className="d-flex flex-column vh-100 overflow-hidden">
      {/* Top half of the page */}
      <div className="h-50 d-flex overflow-hidden">
        {/* Tools Area (Left) */}
        <ToolsArea
          setActiveView={setActiveView}
          setCurrentTrack={setCurrentTrack}
        />
        <div
          className="sections w-50 d-flex flex-column overflow-hidden mb-2 ms-4 me-2 rounded-4"
          style={{ marginTop: "45px" }}
        >
          <ToolsToggle
            activeView={activeView}
            currentTrack={currentTrack}
            handleRecommendations={handleRecommendations}
          />
        </div>

        {/* Recommendation Results */}
        <div
          md={6}
          className="sections w-50 overflow-auto mt-4 mb-2 ms-2 me-4 rounded-4"
        >
          <RecommendationResults
            trackInfo={trackInfo}
            recommendations={recommendations}
            handlePlayTrack={handlePlayTrack}
          />
        </div>
      </div>

      {/* Bottom half of the page */}
      <div className="d-flex overflow-hidden" style={{ height: "50%" }}>
        {/* Predefined Tracks */}
        <div className="sections w-50 overflow-auto mt-2 mb-4 ms-4 me-2 rounded-4">
          <p className="fw-bold mt-3 ms-3 mb-3">
            Here are some tracks to get you started!
          </p>
          {sampleTracks.map((track) => (
            <Item
              action="listen"
              key={track.id}
              trackId={track.id}
              title={`https://open.spotify.com/embed/track/${track.id}`}
              onPlayTrack={handlePlayTrack}
              displayTitle={
                <div>
                  <b>{track.name}</b>
                  <br />
                  <p className="m-0" style={{ fontSize: "12px" }}>
                    {track.artists?.map((a) => a.name).join(", ") ||
                      "Unknown Artist"}
                  </p>
                </div>
              }
              metrics={track}
            />
          ))}
        </div>

        {/* Create Custom Playlist */}
        <CreateTrackList />
      </div>
    </div>
  );
}

export default App;
