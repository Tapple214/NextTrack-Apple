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
      <div className="h-50 d-flex flex-sm-column flex--column  flex-lg-row overflow-hidden">
        {/* Tools Area (Left) */}
        <ToolsArea
          setActiveView={setActiveView}
          setCurrentTrack={setCurrentTrack}
          setShow={setShow}
          setInfoMessage={setInfoMessage}
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
        <div className="sections w-50 overflow-auto mt-4 mb-2 ms-2 me-4 rounded-4">
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
