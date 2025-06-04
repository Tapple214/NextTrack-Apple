import React, { useState, useEffect } from "react";
import spotifyDataset from "../utils/spotifyDataset";

const TrackRecommendationForm = ({ onRecommendations }) => {
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trackInfo, setTrackInfo] = useState(null);
  const [isDatasetLoaded, setIsDatasetLoaded] = useState(false);

  // Load the dataset when component mounts
  useEffect(() => {
    const loadDataset = async () => {
      try {
        await spotifyDataset.loadDataset();
        setIsDatasetLoaded(true);
      } catch (err) {
        console.error("Error loading dataset:", err);
        setError("Failed to load track dataset. Please try again later.");
      }
    };

    loadDataset();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isDatasetLoaded) {
      setError("Please wait while we load the track dataset...");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the seed track from our dataset
      const seedTrack = spotifyDataset.getTrackByUrl(spotifyUrl);

      if (!seedTrack) {
        setError(
          <div>
            <p>Track not found in our dataset. This could be because:</p>
            <ul>
              <li>Our dataset is from 2020 and doesn't include newer tracks</li>
              <li>
                The track ID format has changed since our dataset was created
              </li>
              <li>The track is not available in our region</li>
            </ul>
            <p>
              Please try one of our sample tracks from the list below, or try a
              different track URL.
            </p>
            <p>
              Note: Our dataset contains tracks from before 2020, so newer
              tracks won't be found.
            </p>
          </div>
        );
        setTrackInfo(null);
        return;
      }

      // Only update track info if we found a valid track
      setTrackInfo(seedTrack);

      // Get custom recommendations using our dataset
      const recommendedTracks = spotifyDataset.findSimilarTracks(seedTrack);
      onRecommendations(recommendedTracks, seedTrack);
    } catch (err) {
      console.error("Error:", err);
      if (err.message === "Invalid Spotify URL format") {
        setError(
          <div>
            <p>Invalid Spotify URL format. Please make sure:</p>
            <ul>
              <li>The URL starts with "https://open.spotify.com/track/"</li>
              <li>The URL is complete and not truncated</li>
              <li>You've copied the entire URL from Spotify</li>
            </ul>
          </div>
        );
      } else {
        setError(
          "Error fetching recommendations. Please check your Spotify URL and try again."
        );
      }
      setTrackInfo(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="track-recommendation-form">
      <h2>Get Track Recommendations</h2>
      {!isDatasetLoaded && (
        <div className="loading-message">Loading track dataset...</div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="spotifyUrl">Spotify Track URL:</label>
          <input
            type="text"
            id="spotifyUrl"
            value={spotifyUrl}
            onChange={(e) => setSpotifyUrl(e.target.value)}
            placeholder="Paste a Spotify track URL (e.g., https://open.spotify.com/track/...)"
            required
            disabled={!isDatasetLoaded}
          />
        </div>
        <button
          className="btn-primary"
          type="submit"
          disabled={loading || !isDatasetLoaded}
        >
          {loading ? "Loading..." : "Get Recommendations"}
        </button>
      </form>

      {error && (
        <div
          className="error-message"
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#fff3f3",
            border: "1px solid #ffcdd2",
            borderRadius: "4px",
            color: "#d32f2f",
          }}
        >
          {error}
        </div>
      )}

      {trackInfo && (
        <div className="track-info">
          <h3>Seed Track:</h3>
          <div className="track-details">
            <strong>{trackInfo.name}</strong> by{" "}
            {trackInfo.artists.map((artist) => artist.name).join(", ")}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackRecommendationForm;
