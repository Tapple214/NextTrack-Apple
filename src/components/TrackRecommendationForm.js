import React, { useState } from "react";
import spotifyDataset from "../utils/spotifyDataset";
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
      // Get track details and recommendations using spotifyDataset
      const seedTrack = await spotifyDataset.getTrackByUrl(trackUrl);
      const recommendations = await spotifyDataset.findSimilarTracks(seedTrack);

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
