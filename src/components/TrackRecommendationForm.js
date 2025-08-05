import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import recommenderAPI from "../utils/RecommenderAPI.js";

const TrackRecommendationForm = ({ handleRecommendations }) => {
  const [trackUrl, setTrackUrl] = useState("");
  const [recommendationType, setRecommendationType] = useState("hybrid");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Extract track ID from Spotify track URL
  const extractTrackId = (url) => {
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    if (!match) throw new Error("Invalid Spotify track URL");
    return match[1];
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Checks if track URL is valid
      const trackId = extractTrackId(trackUrl);

      // Get seed track info
      const seedTrack = await recommenderAPI.getTrackFeatures(trackId);

      // Get recommendations based on selected type
      let recommendations;
      try {
        switch (recommendationType) {
          case "content":
            recommendations =
              await recommenderAPI.getContentBasedRecommendations(trackId);
            break;
          case "collaborative":
            recommendations =
              await recommenderAPI.getCollaborativeRecommendations(trackId);
            break;
          case "hybrid":
            recommendations = await recommenderAPI.getHybridRecommendations(
              trackId
            );
            break;
          case "original":
          default:
            recommendations = await recommenderAPI.findSimilarTracks(trackId);
            break;
        }
      } catch (error) {
        console.warn(
          "Primary recommendation method failed, using robust fallback:",
          error
        );
        // Use robust fallback if primary method fails
        recommendations = await recommenderAPI.getRobustRecommendations(
          trackId
        );
      }

      // Pass recommendations and seed track to parent component
      handleRecommendations(recommendations, seedTrack, recommendationType);
    } catch (err) {
      setError(err.message || "Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-center mb-4">Get Track Recommendations</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Recommendation System</Form.Label>
          <Form.Select
            value={recommendationType}
            onChange={(e) => setRecommendationType(e.target.value)}
          >
            <option value="hybrid">Hybrid System (Recommended)</option>
            <option value="content">Content-Based Filtering</option>
            <option value="collaborative">Collaborative Filtering</option>
            <option value="original">Original (Artist-Based)</option>
          </Form.Select>
          <Form.Text className="text-muted">
            {recommendationType === "hybrid" &&
              "Combines audio features and user behavior patterns for the most accurate recommendations"}
            {recommendationType === "content" &&
              "Recommends based on similar audio features (tempo, energy, danceability, etc.)"}
            {recommendationType === "collaborative" &&
              "Recommends based on what similar users like"}
            {recommendationType === "original" &&
              "Recommends tracks by the same artist"}
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Control
            type="text"
            value={trackUrl}
            onChange={(e) => setTrackUrl(e.target.value)}
            placeholder="Enter your Spotify track URL"
            required
          />
        </Form.Group>

        {/* Submit button */}
        <Button type="submit" disabled={loading} className="w-100 py-3 btn">
          {loading ? "Loading..." : "Get Recommendations"}
        </Button>
      </Form>

      {/* Error message */}
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
    </div>
  );
};

export default TrackRecommendationForm;
