import React, { useState } from "react";
import recommendationService from "../utils/recommendationService";
import "./TrackRecommendationForm.css";

const TrackRecommendationForm = ({ onRecommendations }) => {
  const [trackUrl, setTrackUrl] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Extract track ID from URL
      const trackId = (() => {
        try {
          const urlObj = new URL(trackUrl);
          const pathParts = urlObj.pathname.split("/");
          return pathParts[pathParts.length - 1];
        } catch (err) {
          throw new Error("Invalid Spotify URL format");
        }
      })();

      if (!trackId) {
        throw new Error("Please provide a track URL");
      }

      // Get recommendations
      const recommendations = await recommendationService.getRecommendations([
        trackId,
      ]);

      // Get details for the track
      const seedTrack = await recommendationService.getTrackDetails(trackId);

      onRecommendations(recommendations, seedTrack);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
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

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default TrackRecommendationForm;
