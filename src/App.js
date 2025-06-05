import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import Item from "./components/item.js";

import recommenderAPI from "./utils/RecommenderAPI.js";
import Tools from "./components/tools.js";
import ToolsToggle from "./components/ToolsToggle.js";

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
    <div className="d-flex flex-column vh-100">
      {/* Top half of the page */}
      <div className="h-50">
        {/* Tools Area */}
        <Col md={6} className="d-flex flex-column h-100 bg-warning">
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
        <Col
          md={6}
          className="p-3 overflow-auto"
          style={{
            backgroundColor: "#f8f9fa",
            borderLeft: "1px solid #dee2e6",
          }}
        >
          {trackInfo && (
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Seed Track:</Card.Title>
                <Card.Text>
                  <strong>{trackInfo.name}</strong> by{" "}
                  {trackInfo.artists?.map((a) => a.name).join(", ") ||
                    "Unknown Artist"}
                </Card.Text>
              </Card.Body>
            </Card>
          )}

          {recommendations.length > 0 && (
            <div className="recommendations">
              <h3>Similar Tracks:</h3>
              <div className="recommendation-list">
                {recommendations.map((track) => (
                  <Item
                    key={track.id}
                    title={`https://open.spotify.com/embed/track/${track.id}`}
                    onPlayTrack={handlePlayTrack}
                    displayTitle={`${track.name} - ${
                      track.artists?.map((a) => a.name).join(", ") ||
                      "Unknown Artist"
                    }`}
                    metrics={track}
                  />
                ))}
              </div>
            </div>
          )}
        </Col>
      </div>

      {/* Bottom half of the page */}
      <div className="d-flex" style={{ height: "50%" }}>
        <Col md={6} className="px-3 pt-3 overflow-auto">
          <h3>Sample Tracks:</h3>
          {sampleTracks.map((track) => (
            <Item
              key={track.id}
              title={`https://open.spotify.com/embed/track/${track.id}`}
              onPlayTrack={handlePlayTrack}
              displayTitle={`${track.name} - ${
                track.artists?.map((a) => a.name).join(", ") || "Unknown Artist"
              }`}
              metrics={track}
            />
          ))}
        </Col>
        <Col
          md={6}
          className="bg-warning d-flex justify-content-center align-items-center"
        >
          this will be the area to allow users to create their customized
          playlist
        </Col>
      </div>
    </div>
  );
}

export default App;
