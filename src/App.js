import React, { useState, useEffect } from "react";
import { Col } from "react-bootstrap";
import Item from "./components/Item.js";

import recommenderAPI from "./utils/RecommenderAPI.js";
import Tools from "./components/Tools.js";
import ToolsToggle from "./components/ToolsToggle.js";
import RecommendationResults from "./components/RecommendationResults.js";

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
        <Col md={6} className="d-flex flex-column h-100 overflow-hidden">
          <Tools
            setActiveView={setActiveView}
            setCurrentTrack={setCurrentTrack}
          />

          <ToolsToggle
            activeView={activeView}
            currentTrack={currentTrack}
            handleRecommendations={handleRecommendations}
          />
        </Col>

        {/* Recommendation Results */}
        <Col md={6} className="p-3 overflow-auto bg-success bg-opacity-10">
          <RecommendationResults
            trackInfo={trackInfo}
            recommendations={recommendations}
            handlePlayTrack={handlePlayTrack}
          />
        </Col>
      </div>

      {/* Bottom half of the page */}
      <div className="d-flex overflow-hidden" style={{ height: "50%" }}>
        <Col
          md={6}
          className="px-3 pt-3 overflow-auto bg-success bg-opacity-10"
        >
          <p className="fw-bold">Here are some tracks to get you started!</p>
          {sampleTracks.map((track) => (
            <Item
              key={track.id}
              title={`https://open.spotify.com/embed/track/${track.id}`}
              onPlayTrack={handlePlayTrack}
              displayTitle={
                <div>
                  {track.name}
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
        </Col>
        <Col
          md={6}
          className="d-flex text-center justify-content-center align-items-center"
        >
          This will be the area to allow users to create their customized
          playlist (TBC)
        </Col>
      </div>
    </div>
  );
}

export default App;
