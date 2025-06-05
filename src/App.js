import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import Item from "./components/item.js";
import TrackRecommendationForm from "./components/TrackRecommendationForm.js";
import recommenderAPI from "./utils/RecommenderAPI.js";

function App() {
  const [recommendations, setRecommendations] = useState([]);
  const [trackInfo, setTrackInfo] = useState(null);
  const [sampleTracks, setSampleTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [activeView, setActiveView] = useState("form"); // 'form' or 'player'

  useEffect(() => {
    const loadSampleTracks = async () => {
      try {
        // Get sample tracks from our custom recommender
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
    // Find the track in recommendations or sampleTracks
    const allTracks = [...recommendations, ...sampleTracks];
    const track = allTracks.find((t) => t.id === trackId);
    setCurrentTrack(track);
    setActiveView("player"); // Switch to player view when a track is played
  };

  const renderMainContent = () => {
    if (activeView === "player") {
      return (
        <Card className="music-player mt-3">
          <Card.Body>
            <Card.Title>Now Playing:</Card.Title>
            {currentTrack ? (
              <>
                <Card.Text>
                  <strong>{currentTrack.name}</strong> by{" "}
                  {currentTrack.artists?.map((a) => a.name).join(", ") ||
                    "Unknown Artist"}
                </Card.Text>
                <iframe
                  width="300"
                  height="80"
                  src={`https://open.spotify.com/embed/track/${currentTrack.id}`}
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title="Spotify Music Player"
                />
              </>
            ) : (
              <Card.Text>Select a track to play</Card.Text>
            )}
            <Button
              variant="secondary"
              className="mt-2"
              onClick={() => {
                setActiveView("form");
                setCurrentTrack(null);
              }}
            >
              Close Player
            </Button>
          </Card.Body>
        </Card>
      );
    }
    return (
      <TrackRecommendationForm onRecommendations={handleRecommendations} />
    );
  };

  return (
    <Container fluid className="App">
      <Row style={{ height: "50vh" }}>
        <Col md={6} className="d-flex flex-column" style={{ height: "100%" }}>
          {/* Tools Area */}
          <div
            className="bg-primary d-flex justify-content-around align-items-center"
            style={{ height: "10%", fontSize: "30px" }}
          >
            <Button
              variant="link"
              className="text-white"
              onClick={() => {
                setActiveView("form");
                setCurrentTrack(null);
              }}
              title="Get Recommendations"
            >
              <i className="bi bi-magic"></i>
            </Button>
            <Button
              variant="link"
              className="text-white"
              onClick={() => setActiveView("player")}
              title="Play Track"
            >
              <i className="bi bi-film"></i>
            </Button>
            <Button variant="link" className="text-white" title="Information">
              <i className="bi bi-info-circle-fill"></i>
            </Button>
          </div>
          {/* Preview */}
          <div
            className="mt-5 z-3 flex-grow-1 d-flex justify-content-center align-items-center"
            style={{ height: "80%", overflow: "hidden" }}
          >
            {renderMainContent()}
          </div>
        </Col>
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
      </Row>

      <Row className="d-flex" style={{ height: "50%", width: "100vw" }}>
        {/* Ready-made Track List */}
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
        {/*  Custom Track List */}
        <Col
          md={6}
          className="bg-warning d-flex justify-content-center align-items-center"
        >
          this will be the area to allow users to create their customized
          playlist
        </Col>
      </Row>
    </Container>
  );
}

export default App;
