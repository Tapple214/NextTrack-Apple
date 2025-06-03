import React, { useState } from "react";
import SpotifyWebApi from "spotify-web-api-node";

// Initialize Spotify Web API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.REACT_APP_SPOTIFY_CLIENT_ID,
  clientSecret: process.env.REACT_APP_SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.REACT_APP_SPOTIFY_REDIRECT_URI,
});

const TrackRecommendationForm = () => {
  const [trackId, setTrackId] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trackInfo, setTrackInfo] = useState(null);

  // Get artist genres for a track
  const getArtistGenres = async (artistId) => {
    try {
      const response = await spotifyApi.getArtist(artistId);
      return response.body.genres;
    } catch (err) {
      console.error("Error fetching artist genres:", err);
      return [];
    }
  };

  // Custom recommendation function
  const getCustomRecommendations = async (seedTrack) => {
    try {
      // Get genres of the seed track's artist
      const seedGenres = await getArtistGenres(seedTrack.artists[0].id);

      // Search for tracks in the same genre
      const genreQuery = seedGenres[0] || "pop"; // Use first genre or default to pop
      const response = await spotifyApi.searchTracks(`genre:${genreQuery}`, {
        limit: 20,
        market: "US",
      });

      const tracks = response.body.tracks.items;

      // Filter out the seed track and get recommendations
      const recommendations = tracks
        .filter((track) => track.id !== trackId) // Remove the seed track
        .slice(0, 5); // Get top 5 recommendations

      return recommendations;
    } catch (err) {
      console.error("Error in custom recommendations:", err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get the seed track's information
      const trackResponse = await spotifyApi.getTrack(trackId);
      const seedTrack = trackResponse.body;
      setTrackInfo(seedTrack);

      // Get custom recommendations
      const recommendedTracks = await getCustomRecommendations(seedTrack);
      setRecommendations(recommendedTracks);
    } catch (err) {
      setError(
        "Error fetching recommendations. Please check your track ID and try again."
      );
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="track-recommendation-form">
      <h2>Get Track Recommendations</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="trackId">Spotify Track ID:</label>
          <input
            type="text"
            id="trackId"
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            placeholder="Enter Spotify Track ID"
            required
          />
        </div>
        <button type="submit" disabled={loading}>
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

      {recommendations.length > 0 && (
        <div className="recommendations">
          <h3>Similar Tracks:</h3>
          <ul>
            {recommendations.map((track) => (
              <li key={track.id}>
                <strong>{track.name}</strong> -{" "}
                {track.artists.map((artist) => artist.name).join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TrackRecommendationForm;
