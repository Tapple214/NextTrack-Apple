import SpotifyWebApi from "spotify-web-api-node";

class CustomRecommender {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: "c6d965d704db458abac7673400b7b007",
      clientSecret: "a91f9fdde7e94d6cbb2e1ef59badac46",
      redirectUri: "https://localhost:3000",
    });
    this.isAuthenticated = false;
    this.tokenExpirationTime = null;
    this.trackDatabase = new Map(); // Cache for track features
  }

  async authenticate() {
    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            btoa(
              "c6d965d704db458abac7673400b7b007" +
                ":" +
                "a91f9fdde7e94d6cbb2e1ef59badac46"
            ),
        },
        body: "grant_type=client_credentials",
      });

      if (!response.ok) {
        throw new Error(
          `Authentication failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.access_token) {
        this.spotifyApi.setAccessToken(data.access_token);
        this.isAuthenticated = true;
        this.tokenExpirationTime = Date.now() + data.expires_in * 1000 - 300000;
        console.log("Successfully authenticated with Spotify API");
      } else {
        throw new Error("Failed to get access token from response");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    }
  }

  async ensureAuthenticated() {
    if (
      !this.isAuthenticated ||
      (this.tokenExpirationTime && Date.now() >= this.tokenExpirationTime)
    ) {
      await this.authenticate();
    }
  }

  async getTrackFeatures(trackId) {
    try {
      // Check cache first
      if (this.trackDatabase.has(trackId)) {
        return this.trackDatabase.get(trackId);
      }

      await this.ensureAuthenticated();

      // Get track data from Spotify
      const trackData = await this.spotifyApi.getTrack(trackId);

      // Try to get audio features, but don't fail if we can't
      let audioFeatures = null;
      try {
        const featuresResponse = await this.spotifyApi.getAudioFeaturesForTrack(
          trackId
        );
        audioFeatures = featuresResponse.body;
      } catch (error) {
        console.warn(
          `Could not fetch audio features for track ${trackId}, using default values`
        );
        audioFeatures = {
          danceability: 0.5,
          energy: 0.5,
          valence: 0.5,
          tempo: 120,
          acousticness: 0.5,
          instrumentalness: 0.5,
          liveness: 0.5,
          speechiness: 0.5,
        };
      }

      const trackInfo = {
        id: trackId,
        name: trackData.body.name,
        artists: trackData.body.artists.map((artist) => ({
          name: artist.name,
          id: artist.id,
        })),
        ...audioFeatures,
      };

      this.trackDatabase.set(trackId, trackInfo);
      return trackInfo;
    } catch (error) {
      console.error("Error in getTrackFeatures:", error);
      throw new Error(`Failed to get track features: ${error.message}`);
    }
  }

  async findSimilarTracks(seedTrackId, limit = 5) {
    try {
      await this.ensureAuthenticated();

      // Get seed track features
      const seedTrack = await this.getTrackFeatures(seedTrackId);
      console.log("Found seed track:", seedTrack.name);

      // Get recommendations based on artist and genre
      const recommendations = [];
      const seenTrackIds = new Set([seedTrackId]);

      // 1. Get tracks by the same artist
      for (const artist of seedTrack.artists) {
        try {
          const artistTracks = await this.spotifyApi.searchTracks(
            `artist:${artist.name}`,
            { limit: Math.ceil(limit * 2), market: "US" }
          );

          for (const track of artistTracks.body.tracks.items) {
            if (!seenTrackIds.has(track.id)) {
              const trackFeatures = await this.getTrackFeatures(track.id);
              recommendations.push(trackFeatures);
              seenTrackIds.add(track.id);
            }
            if (recommendations.length >= limit) break;
          }
        } catch (error) {
          console.warn(
            `Error fetching tracks for artist ${artist.name}:`,
            error
          );
        }
        if (recommendations.length >= limit) break;
      }

      // 2. If we don't have enough recommendations, get tracks with similar audio features
      if (recommendations.length < limit) {
        const remainingLimit = limit - recommendations.length;
        try {
          const similarTracks = await this.spotifyApi.searchTracks(
            `year:2020-2024`, // Recent tracks
            { limit: remainingLimit * 2, market: "US" }
          );

          for (const track of similarTracks.body.tracks.items) {
            if (!seenTrackIds.has(track.id)) {
              const trackFeatures = await this.getTrackFeatures(track.id);
              recommendations.push(trackFeatures);
              seenTrackIds.add(track.id);
            }
            if (recommendations.length >= limit) break;
          }
        } catch (error) {
          console.warn("Error fetching similar tracks:", error);
        }
      }

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error("Error in findSimilarTracks:", error);
      throw new Error(`Failed to find similar tracks: ${error.message}`);
    }
  }

  async getSampleTracks(limit = 5) {
    try {
      await this.ensureAuthenticated();

      // Get popular tracks from different genres
      const genres = ["pop", "rock", "hip-hop", "electronic", "jazz"];
      const tracks = [];
      const seenTrackIds = new Set();

      for (const genre of genres) {
        try {
          const searchResults = await this.spotifyApi.searchTracks(
            `genre:${genre}`,
            { limit: 2, market: "US" }
          );

          for (const track of searchResults.body.tracks.items) {
            if (!seenTrackIds.has(track.id)) {
              tracks.push({
                id: track.id,
                name: track.name,
                artists: track.artists.map((a) => ({
                  name: a.name,
                  id: a.id,
                })),
              });
              seenTrackIds.add(track.id);
            }
            if (tracks.length >= limit) break;
          }
        } catch (error) {
          console.warn(`Error fetching tracks for genre ${genre}:`, error);
        }
        if (tracks.length >= limit) break;
      }

      return tracks.slice(0, limit);
    } catch (error) {
      console.error("Error in getSampleTracks:", error);
      throw new Error(`Failed to get sample tracks: ${error.message}`);
    }
  }
}

export default new CustomRecommender();
