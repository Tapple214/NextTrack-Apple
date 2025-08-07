import React, { useState, useEffect, useRef } from "react";

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
  const [currentSection, setCurrentSection] = useState(0);

  // Refs for each section
  const toolsAreaRef = useRef(null);
  const recommendationRef = useRef(null);
  const predefinedRef = useRef(null);
  const createPlaylistRef = useRef(null);

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

  // Scroll to specific section
  const scrollToSection = (sectionIndex) => {
    const sections = [
      toolsAreaRef,
      recommendationRef,
      predefinedRef,
      createPlaylistRef,
    ];
    const targetSection = sections[sectionIndex];

    if (targetSection?.current) {
      targetSection.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setCurrentSection(sectionIndex);
    }
  };

  // Handle scroll events to update current section
  const handleScroll = () => {
    const sections = [
      toolsAreaRef,
      recommendationRef,
      predefinedRef,
      createPlaylistRef,
    ];
    const scrollPosition = window.scrollY + window.innerHeight / 2;

    sections.forEach((sectionRef, index) => {
      if (sectionRef?.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        if (
          rect.top <= window.innerHeight / 2 &&
          rect.bottom >= window.innerHeight / 2
        ) {
          setCurrentSection(index);
        }
      }
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="app-container">
      {/* Mobile Navigation Dots */}
      <div className="mobile-nav-dots d-sm-none">
        <div
          className={`nav-dot ${currentSection === 0 ? "active" : ""}`}
          onClick={() => scrollToSection(0)}
        ></div>
        <div
          className={`nav-dot ${currentSection === 1 ? "active" : ""}`}
          onClick={() => scrollToSection(1)}
        ></div>
        <div
          className={`nav-dot ${currentSection === 2 ? "active" : ""}`}
          onClick={() => scrollToSection(2)}
        ></div>
        <div
          className={`nav-dot ${currentSection === 3 ? "active" : ""}`}
          onClick={() => scrollToSection(3)}
        ></div>
      </div>

      {/* Desktop Layout */}
      <div className="desktop-layout d-none d-sm-flex flex-column vh-100 overflow-hidden">
        {/* Top half of the page */}
        <div className="h-50 d-flex flex-sm-column flex--column flex-lg-row overflow-hidden">
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
      </div>

      {/* Mobile Layout - Full Page Sections */}
      <div className="mobile-layout d-sm-none">
        {/* Section 1: Tools Area */}
        <section ref={toolsAreaRef} className="mobile-section">
          <div className="section-content">
            <h2 className="section-title">Tools</h2>
            <ToolsArea
              setActiveView={setActiveView}
              setCurrentTrack={setCurrentTrack}
              setShow={setShow}
              setInfoMessage={setInfoMessage}
            />
          </div>
        </section>

        {/* Section 2: Recommendation Form & Results */}
        <section ref={recommendationRef} className="mobile-section">
          <div className="section-content">
            <h2 className="section-title">Get Recommendations</h2>
            <div className="mobile-recommendation-container">
              <ToolsToggle
                activeView={activeView}
                currentTrack={currentTrack}
                handleRecommendations={handleRecommendations}
              />
              <RecommendationResults
                trackInfo={trackInfo}
                recommendations={recommendations}
                handlePlayTrack={handlePlayTrack}
              />
            </div>
          </div>
        </section>

        {/* Section 3: Predefined Tracks */}
        <section ref={predefinedRef} className="mobile-section">
          <div className="section-content">
            <h2 className="section-title">Predefined Tracks</h2>
            <PredefinedTracklist
              setShow={setShow}
              setInfoMessage={setInfoMessage}
              sampleTracks={sampleTracks}
              handlePlayTrack={handlePlayTrack}
            />
          </div>
        </section>

        {/* Section 4: Create Custom Playlist */}
        <section ref={createPlaylistRef} className="mobile-section">
          <div className="section-content">
            <h2 className="section-title">Create Playlist</h2>
            <CreateTrackList
              setShow={setShow}
              setInfoMessage={setInfoMessage}
            />
          </div>
        </section>
      </div>

      <InfoModal message={infoMessage} show={show} setShow={setShow} />
    </div>
  );
}

export default App;
