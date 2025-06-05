import React, { useState } from "react";
import musicBrainzDataset from "../datasets/musicBrainzDataset.js";
import "./TrackRecommendationForm.css";

const TrackRecommendationForm = ({ onRecommendations }) => {
  const [trackName, setTrackName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Search for the track by name and artist
      const searchQuery = `${trackName} ${artistName}`.trim();
      const tracks = await musicBrainzDataset.searchTrack(searchQuery);
      if (!tracks.length) throw new Error("Track not found");
      const track = tracks[0];
      // Get artist info
      const artist = track["artist-credit"]?.[0]?.artist || {
        name: artistName,
      };
      // Get similar tracks
      const recommendations = await musicBrainzDataset.getSimilarTracks(
        artist.id,
        5
      );
      // Format recommendations for the web app
      const formatted = recommendations.map((t) =>
        musicBrainzDataset.formatTrackData(t, artist)
      );
      onRecommendations(
        formatted,
        musicBrainzDataset.formatTrackData(track, artist)
      );
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
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder="Track Name"
              required
            />
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Artist Name"
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
