import React, { useState } from "react";
import { Form, Button, Alert, Container } from "react-bootstrap";
import recommenderAPI from "../utils/RecommenderAPI.js";

const TrackRecommendationForm = ({ onRecommendations }) => {
  const [trackUrl, setTrackUrl] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState(null);

  const extractTrackId = (url) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const trackId = pathParts[pathParts.length - 1];
      if (!trackId) {
        throw new Error("No track ID found in URL");
      }
      return trackId;
    } catch (err) {
      throw new Error("Invalid Spotify URL format");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const trackId = extractTrackId(trackUrl);
      console.log("Extracted track ID:", trackId);
      setCurrentTrackId(trackId);

      const seedTrack = await recommenderAPI.getTrackFeatures(trackId);
      console.log("Got seed track:", seedTrack.name);

      const recommendations = await recommenderAPI.findSimilarTracks(trackId);
      console.log("Got recommendations:", recommendations.length);

      onRecommendations(recommendations, seedTrack);
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError(
        err.message || "An error occurred while getting recommendations"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="track-recommendation-form">
      <h2 className="text-center mb-4">Get Track Recommendations</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-4">
          <Form.Control
            type="text"
            value={trackUrl}
            onChange={(e) => setTrackUrl(e.target.value)}
            placeholder="Spotify Track URL"
            required
          />
        </Form.Group>
        <Button
          variant="success"
          type="submit"
          disabled={loading}
          className="w-100 py-3"
        >
          {loading ? "Loading..." : "Get Recommendations"}
        </Button>
      </Form>

      {error && (
        <Alert variant="danger" className="mt-3">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <hr />
          <p className="mb-0">
            Please make sure you're using a valid Spotify track URL (e.g.,
            https://open.spotify.com/track/...)
          </p>
        </Alert>
      )}
    </Container>
  );
};

export default TrackRecommendationForm;
