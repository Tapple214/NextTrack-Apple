import React, { useState } from "react";
import recommenderAPI from "../utils/RecommenderAPI.js";
import "./TrackRecommendationForm.css";

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
      // Extract track ID from URL
      const trackId = extractTrackId(trackUrl);
      console.log("Extracted track ID:", trackId);
      setCurrentTrackId(trackId);

      // Get track details and recommendations using our custom recommender
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
    <div className="track-recommendation-form">
      <h2>Get Track Recommendations</h2>
      <form onSubmit={handleSubmit}>
        <div className="track-inputs">
          <div className="track-input-group">
            <input
              type="text"
              value={trackUrl}
              onChange={(e) => setTrackUrl(e.target.value)}
              placeholder="Spotify Track URL"
              required
            />
          </div>
        </div>
        <button className="submit-button" type="submit" disabled={loading}>
          {loading ? "Loading..." : "Get Recommendations"}
        </button>
      </form>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <p className="error-help">
            Please make sure you're using a valid Spotify track URL (e.g.,
            https://open.spotify.com/track/...)
          </p>
        </div>
      )}

      {currentTrackId && (
        <div className="mt-4">
          <iframe
            width="300"
            height="80"
            src={`https://open.spotify.com/embed/track/${currentTrackId}`}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="Spotify Music Player"
          />
        </div>
      )}
    </div>
  );
};

export default TrackRecommendationForm;
