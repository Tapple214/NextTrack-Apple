import React, { useState } from "react";
import { Form, Button, Alert, Container } from "react-bootstrap";
import recommenderAPI from "../utils/RecommenderAPI.js";

const TrackRecommendationForm = ({ onRecommendations }) => {
  const [trackUrl, setTrackUrl] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const extractTrackId = (url) => {
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    if (!match) throw new Error("Invalid Spotify track URL");
    return match[1];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const trackId = extractTrackId(trackUrl);
      const [seedTrack, recommendations] = await Promise.all([
        recommenderAPI.getTrackFeatures(trackId),
        recommenderAPI.findSimilarTracks(trackId),
      ]);
      onRecommendations(recommendations, seedTrack);
    } catch (err) {
      setError(err.message || "Failed to get recommendations");
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
            Please enter a valid Spotify track URL (e.g.,
            https://open.spotify.com/track/...)
          </p>
        </Alert>
      )}
    </Container>
  );
};

export default TrackRecommendationForm;
