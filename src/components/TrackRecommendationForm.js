import React, { useState } from "react";
import recommendationService from "../utils/recommendationService";
import "./TrackRecommendationForm.css";

const TrackRecommendationForm = ({ onRecommendations }) => {
  const [trackUrls, setTrackUrls] = useState([""]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    audioFeatures: 0.4,
    genre: 0.2,
    artist: 0.2,
    lyrics: 0.1,
    metadata: 0.1,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Extract track IDs from URLs
      const trackIds = trackUrls
        .filter((url) => url.trim() !== "")
        .map((url) => {
          try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split("/");
            return pathParts[pathParts.length - 1];
          } catch (err) {
            throw new Error("Invalid Spotify URL format");
          }
        });

      if (trackIds.length === 0) {
        throw new Error("Please provide at least one track URL");
      }

      // Get recommendations
      const recommendations = await recommendationService.getRecommendations(
        trackIds,
        preferences
      );

      // Get details for the first track (seed track)
      const seedTrack = await recommendationService.getTrackDetails(
        trackIds[0]
      );

      onRecommendations(recommendations, seedTrack);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrack = () => {
    setTrackUrls([...trackUrls, ""]);
  };

  const handleRemoveTrack = (index) => {
    const newUrls = trackUrls.filter((_, i) => i !== index);
    setTrackUrls(newUrls);
  };

  const handleTrackUrlChange = (index, value) => {
    const newUrls = [...trackUrls];
    newUrls[index] = value;
    setTrackUrls(newUrls);
  };

  const handlePreferenceChange = (factor, value) => {
    setPreferences((prev) => ({
      ...prev,
      [factor]: parseFloat(value),
    }));
  };

  return (
    <div className="track-recommendation-form">
      <h2>Get Track Recommendations</h2>
      <form onSubmit={handleSubmit}>
        <div className="track-inputs">
          {trackUrls.map((url, index) => (
            <div key={index} className="track-input-group">
              <input
                type="text"
                value={url}
                onChange={(e) => handleTrackUrlChange(index, e.target.value)}
                placeholder="Paste a Spotify track URL"
                required={index === 0}
              />
              {index > 0 && (
                <button
                  type="button"
                  className="remove-track"
                  onClick={() => handleRemoveTrack(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" className="add-track" onClick={handleAddTrack}>
            Add Another Track
          </button>
        </div>

        <div className="preferences-section">
          <h3>Recommendation Preferences</h3>
          <div className="preference-sliders">
            {Object.entries(preferences).map(([factor, value]) => (
              <div key={factor} className="preference-slider">
                <label htmlFor={factor}>
                  {factor.charAt(0).toUpperCase() + factor.slice(1)}:
                </label>
                <input
                  type="range"
                  id={factor}
                  min="0"
                  max="1"
                  step="0.1"
                  value={value}
                  onChange={(e) =>
                    handlePreferenceChange(factor, e.target.value)
                  }
                />
                <span>{value}</span>
              </div>
            ))}
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
