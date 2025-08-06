import React, { useState, useEffect } from "react";

import recommenderAPI from "./utils/RecommenderAPI.js";
import ToolsArea from "./components/ToolsArea.js";
import ToolsToggle from "./components/ToolsToggle.js";
import RecommendationResults from "./components/RecommendationResults.js";
import CreateTrackList from "./components/createTrackList.js";
import InfoModal from "./components/infoModal.js";
import PredefinedTracklist from "./components/predefinedTracklist.js";

// TODO: Apply responsive design
function App() {
  const [recommendations, setRecommendations] = useState([]);
  const [trackInfo, setTrackInfo] = useState(null);
  const [sampleTracks, setSampleTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [activeView, setActiveView] = useState("form");
  const [show, setShow] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

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
          setShow={setShow}
          setInfoMessage={setInfoMessage}
        />

        <ToolsToggle
          activeView={activeView}
          currentTrack={currentTrack}
          handleRecommendations={handleRecommendations}
        />

        {/* Recommendation Results */}

        <RecommendationResults
          trackInfo={trackInfo}
          recommendations={recommendations}
          handlePlayTrack={handlePlayTrack}
        />
      </div>

      {/* Bottom half of the page */}
      <div className="d-flex overflow-hidden" style={{ height: "50%" }}>
        {/* Predefined Tracks */}
        <PredefinedTracklist
          setShow={setShow}
          setInfoMessage={setInfoMessage}
          sampleTracks={sampleTracks}
          handlePlayTrack={handlePlayTrack}
        />

        {/* Create Custom Playlist */}
        <CreateTrackList setShow={setShow} setInfoMessage={setInfoMessage} />
      </div>

      <InfoModal message={infoMessage} show={show} setShow={setShow} />
    </div>
  );
}

export default App;
