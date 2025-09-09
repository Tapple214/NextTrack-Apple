import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import recommenderAPI from "../utils/RecommenderAPI.js";

const TrackRecommendationForm = ({ handleRecommendations }) => {
  const [trackUrl, setTrackUrl] = useState("");
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

      // Find MusicBrainz counterpart and log "match" if found
      const musicBrainzMatch = await recommenderAPI.findMusicBrainzCounterpart(
        trackId
      );

      // TODO: ensure that 2nd iteration of rec uses features rather than just same artist
      // Use util to get track features and recommendations
      // Uses features from seed track to find similar tracks (results in "recommendations")
      const [seedTrack, recommendations] = await Promise.all([
        recommenderAPI.getTrackFeatures(trackId),
        recommenderAPI.findSimilarTracks(trackId),
      ]);

      // Pass recommendations and seed track to parent component
      handleRecommendations(recommendations, seedTrack);
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
