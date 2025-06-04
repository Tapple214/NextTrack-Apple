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

  // Fallback recommendation method when track is not in dataset
  const getFallbackRecommendations = (seedTrack) => {
    // Get random tracks from the dataset as fallback
    const shuffled = [...spotifyDataset.tracks].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isDatasetLoaded) {
      setError("Please wait while we load the track dataset...");
      return;
    }

    setLoading(true);
    setError(null);
    setTrackInfo(null);

    try {
      // Get the seed track from our dataset
      const seedTrack = spotifyDataset.getTrackByUrl(spotifyUrl);

      if (!seedTrack) {
        console.log(
          "Track not found in dataset, using fallback recommendations"
        );
        // Use a random track from the dataset as seed
        const randomTrack =
          spotifyDataset.tracks[
            Math.floor(Math.random() * spotifyDataset.tracks.length)
          ];
        setTrackInfo({
          name: "Track not found in dataset",
          artists: [{ name: "Using similar tracks instead" }],
          ...randomTrack,
        });
        const recommendedTracks = getFallbackRecommendations(randomTrack);
        onRecommendations(recommendedTracks, randomTrack);
        return;
      }

      setTrackInfo(seedTrack);

      // Get custom recommendations using our dataset
      const recommendedTracks = spotifyDataset.findSimilarTracks(seedTrack);
      onRecommendations(recommendedTracks, seedTrack);
    } catch (err) {
      console.error("Error:", err);
      setError(
        "Error fetching recommendations. Please check your Spotify URL and try again."
      );
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
        <button type="submit" disabled={loading || !isDatasetLoaded}>
          {loading ? "Loading..." : "Get Recommendations"}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

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
