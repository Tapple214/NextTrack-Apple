import React, { useState } from "react";
import customRecommender from "../utils/customRecommender";
import "./TrackRecommendationForm.css";

const TrackRecommendationForm = ({ onRecommendations }) => {
  const [trackUrl, setTrackUrl] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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

      // Get track details and recommendations using our custom recommender
      const seedTrack = await customRecommender.getTrackFeatures(trackId);
      console.log("Got seed track:", seedTrack.name);

      const recommendations = await customRecommender.findSimilarTracks(
        trackId
      );
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
              placeholder="Paste a Spotify track URL"
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
    </div>
  );
};

export default TrackRecommendationForm;
