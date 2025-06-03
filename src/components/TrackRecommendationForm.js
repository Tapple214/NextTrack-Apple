import React, { useState, useEffect } from "react";
import SpotifyWebApi from "spotify-web-api-node";

// Initialize Spotify Web API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.REACT_APP_SPOTIFY_CLIENT_ID,
  clientSecret: process.env.REACT_APP_SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.REACT_APP_SPOTIFY_REDIRECT_URI,
});

const TrackRecommendationForm = () => {
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trackInfo, setTrackInfo] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Authenticate with Spotify
  useEffect(() => {
    const authenticate = async () => {
      try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
              "Basic " +
              btoa(
                process.env.REACT_APP_SPOTIFY_CLIENT_ID +
                  ":" +
                  process.env.REACT_APP_SPOTIFY_CLIENT_SECRET
              ),
          },
          body: "grant_type=client_credentials",
        });

        const data = await response.json();
        if (data.access_token) {
          spotifyApi.setAccessToken(data.access_token);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Authentication error:", err);
        setError(
          "Failed to authenticate with Spotify. Please check your credentials."
        );
      }
    };

    authenticate();
  }, []);

  // Extract track ID from Spotify URL
  const extractTrackId = (url) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const trackId = pathParts[pathParts.length - 1];
      return trackId;
    } catch (err) {
      throw new Error("Invalid Spotify URL format");
    }
  };

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

  // Get audio features for a track
  const getAudioFeatures = async (trackId) => {
    try {
      const response = await spotifyApi.getAudioFeaturesForTrack(trackId);
      return response.body;
    } catch (err) {
      console.error("Error fetching audio features:", err);
      return null;
    }
  };

  // Custom recommendation function with multiple fallback methods
  const getCustomRecommendations = async (seedTrack) => {
    try {
      let recommendedTracks = [];

      // Method 1: Try to get recommendations based on artist genres
      const seedGenres = await getArtistGenres(seedTrack.artists[0].id);

      if (seedGenres && seedGenres.length > 0) {
        // Search for tracks in the same genre
        const genreQuery = seedGenres[0];
        const response = await spotifyApi.searchTracks(`genre:${genreQuery}`, {
          limit: 50,
          market: "US",
        });

        recommendedTracks = response.body.tracks.items;
      }

      // Method 2: If no genres or not enough tracks, search by artist
      if (recommendedTracks.length < 5) {
        const artistName = seedTrack.artists[0].name;
        const response = await spotifyApi.searchTracks(
          `artist:"${artistName}"`,
          {
            limit: 50,
            market: "US",
          }
        );

        recommendedTracks = [
          ...recommendedTracks,
          ...response.body.tracks.items,
        ];
      }

      // Method 3: If still not enough tracks, use track name
      if (recommendedTracks.length < 5) {
        const trackName = seedTrack.name;
        const response = await spotifyApi.searchTracks(`track:"${trackName}"`, {
          limit: 50,
          market: "US",
        });

        recommendedTracks = [
          ...recommendedTracks,
          ...response.body.tracks.items,
        ];
      }

      // Process and filter recommendations
      const processedTracks = recommendedTracks
        .filter((track) => track.id !== seedTrack.id) // Remove the seed track
        .filter(
          (track, index, self) =>
            index === self.findIndex((t) => t.id === track.id) // Remove duplicates
        )
        .slice(0, 5) // Get top 5 recommendations
        .map((track) => ({
          ...track,
          preview_url: track.preview_url,
          external_url: track.external_urls.spotify,
        }));

      if (processedTracks.length === 0) {
        throw new Error("Could not find any similar tracks");
      }

      return processedTracks;
    } catch (err) {
      console.error("Error in custom recommendations:", err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError("Please wait while we authenticate with Spotify...");
      return;
    }

    setLoading(true);
    setError(null);
    setRecommendations([]);
    setTrackInfo(null);

    try {
      // Extract track ID from URL
      const trackId = extractTrackId(spotifyUrl);

      // Get the seed track's information
      const trackResponse = await spotifyApi.getTrack(trackId);
      const seedTrack = trackResponse.body;
      setTrackInfo(seedTrack);

      // Get custom recommendations
      const recommendedTracks = await getCustomRecommendations(seedTrack);
      setRecommendations(recommendedTracks);
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
      {!isAuthenticated && (
        <div className="loading-message">Connecting to Spotify...</div>
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
            disabled={!isAuthenticated}
          />
        </div>
        <button type="submit" disabled={loading || !isAuthenticated}>
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
              <li key={track.id} className="recommendation-item">
                <div className="track-name">
                  <strong>{track.name}</strong> -{" "}
                  {track.artists.map((artist) => artist.name).join(", ")}
                </div>
                {track.preview_url && (
                  <audio controls className="preview-player">
                    <source src={track.preview_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                )}
                <a
                  href={track.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="spotify-link"
                >
                  Open in Spotify
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TrackRecommendationForm;
