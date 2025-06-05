import SpotifyWebApi from "spotify-web-api-node";

class SpotifyDataset {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: "c6d965d704db458abac7673400b7b007",
      clientSecret: "a91f9fdde7e94d6cbb2e1ef59badac46",
      redirectUri: "https://localhost:3000",
    });
    this.isAuthenticated = false;
    this.tokenExpirationTime = null;
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
        const errorText = await response.text();
        console.error("Authentication response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
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
        console.error("Authentication response missing access token:", data);
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

  // Get track details from Spotify API
  async getTrackByUrl(url) {
    try {
      await this.ensureAuthenticated();
      const trackId = this.extractTrackId(url);

      console.log("Fetching track data for ID:", trackId);

      // First get the track data
      const trackData = await this.spotifyApi.getTrack(trackId);

      // Then try to get audio features with retry logic
      let audioFeatures = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          audioFeatures = await this.spotifyApi.getAudioFeaturesForTrack(
            trackId
          );
          break;
        } catch (error) {
          retryCount++;
          console.log(`Retry ${retryCount} for audio features...`);
          if (retryCount === maxRetries) {
            console.warn(
              "Could not fetch audio features after retries, using default values"
            );
            // Use default values if we can't get audio features
            audioFeatures = {
              body: {
                danceability: 0.5,
                energy: 0.5,
                valence: 0.5,
                tempo: 120,
                acousticness: 0.5,
                instrumentalness: 0.5,
                liveness: 0.5,
                speechiness: 0.5,
              },
            };
          } else {
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      return {
        id: trackData.body.id,
        name: trackData.body.name,
        artists: trackData.body.artists.map((artist) => ({
          name: artist.name,
          id: artist.id,
        })),
        ...audioFeatures.body,
      };
    } catch (error) {
      console.error("Error in getTrackByUrl:", error);
      throw new Error(`Failed to get track data: ${error.message}`);
    }
  }

  // Extract track ID from Spotify URL
  extractTrackId(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const trackId = pathParts[pathParts.length - 1];
      if (!trackId) {
        throw new Error("No track ID found in URL");
      }
      return trackId;
    } catch (err) {
      console.error("URL parsing error:", err);
      throw new Error("Invalid Spotify URL format");
    }
  }

  // Find similar tracks using Spotify's recommendation API
  async findSimilarTracks(seedTrack, limit = 5) {
    try {
      await this.ensureAuthenticated();

      console.log("Getting recommendations for track:", seedTrack.id);

      // First verify the track exists
      try {
        await this.spotifyApi.getTrack(seedTrack.id);
      } catch (error) {
        console.error("Error verifying track:", error);
        throw new Error("Invalid track ID or track not found");
      }

      // Prepare recommendation parameters
      const recommendationParams = {
        seed_tracks: [seedTrack.id],
        limit: limit,
        min_popularity: 50,
      };

      // Only add target parameters if they exist and are valid numbers
      const addTargetParam = (param, value) => {
        if (
          typeof value === "number" &&
          !isNaN(value) &&
          value >= 0 &&
          value <= 1
        ) {
          recommendationParams[`target_${param}`] = value;
        }
      };

      addTargetParam("danceability", seedTrack.danceability);
      addTargetParam("energy", seedTrack.energy);
      addTargetParam("valence", seedTrack.valence);
      addTargetParam("acousticness", seedTrack.acousticness);
      addTargetParam("instrumentalness", seedTrack.instrumentalness);
      addTargetParam("liveness", seedTrack.liveness);
      addTargetParam("speechiness", seedTrack.speechiness);

      // Tempo is on a different scale (0-200+)
      if (
        typeof seedTrack.tempo === "number" &&
        !isNaN(seedTrack.tempo) &&
        seedTrack.tempo > 0
      ) {
        recommendationParams.target_tempo = seedTrack.tempo;
      }

      console.log("Recommendation parameters:", recommendationParams);

      const recommendations = await this.spotifyApi.getRecommendations(
        recommendationParams
      );

      // Get audio features for all recommended tracks
      const trackIds = recommendations.body.tracks.map((track) => track.id);
      let audioFeatures;

      try {
        audioFeatures = await this.spotifyApi.getAudioFeaturesForTracks(
          trackIds
        );
      } catch (error) {
        console.warn(
          "Could not fetch audio features for recommendations, using default values"
        );
        // Use default values if we can't get audio features
        audioFeatures = {
          body: {
            audio_features: trackIds.map(() => ({
              danceability: 0.5,
              energy: 0.5,
              valence: 0.5,
              tempo: 120,
              acousticness: 0.5,
              instrumentalness: 0.5,
              liveness: 0.5,
              speechiness: 0.5,
            })),
          },
        };
      }

      return recommendations.body.tracks.map((track, index) => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map((artist) => ({
          name: artist.name,
          id: artist.id,
        })),
        popularity: track.popularity,
        ...audioFeatures.body.audio_features[index],
      }));
    } catch (error) {
      console.error("Error in findSimilarTracks:", error);
      throw new Error(`Failed to find similar tracks: ${error.message}`);
    }
  }

  // Get sample tracks from Spotify's featured playlists
  async getSampleTrackIds() {
    try {
      // Ensure we're authenticated first
      if (!this.isAuthenticated) {
        console.log("Not authenticated, attempting to authenticate...");
        await this.authenticate();
      }

      console.log("Fetching sample tracks...");

      // Use a curated list of popular tracks with current, valid IDs
      const popularTracks = [
        "5QO79kh1waicV47BqGRL3g", // "Bad Guy" by Billie Eilish
        "6rqhFgbbKwnb9MLmUQDhG6", // "Blinding Lights" by The Weeknd
        "3ee8Jmje8o58CHK66QrVC2", // "Watermelon Sugar" by Harry Styles
        "4cOdK2wGLETKBW3PvgPWqT", // "Shape of You" by Ed Sheeran
        "0V3wPSX9ygBnCm8psDIegu", // "As It Was" by Harry Styles
      ];

      // Get track details for all tracks
      console.log("Fetching track details...");
      const tracksData = await Promise.all(
        popularTracks.map(async (trackId) => {
          try {
            const trackData = await this.spotifyApi.getTrack(trackId);
            console.log(`Successfully fetched track: ${trackData.body.name}`);
            return trackData;
          } catch (error) {
            console.error(`Error fetching track ${trackId}:`, error);
            throw error;
          }
        })
      );

      // Get audio features for all tracks
      console.log("Fetching audio features...");
      let audioFeatures;
      try {
        audioFeatures = await this.spotifyApi.getAudioFeaturesForTracks(
          popularTracks
        );
        console.log("Successfully fetched audio features");
      } catch (error) {
        console.warn(
          "Could not fetch audio features for sample tracks, using default values"
        );
        audioFeatures = {
          body: {
            audio_features: popularTracks.map(() => ({
              danceability: 0.5,
              energy: 0.5,
              valence: 0.5,
              tempo: 120,
              acousticness: 0.5,
              instrumentalness: 0.5,
              liveness: 0.5,
              speechiness: 0.5,
            })),
          },
        };
      }

      const result = tracksData.map((trackData, index) => ({
        id: trackData.body.id,
        name: trackData.body.name,
        artist: trackData.body.artists[0].name,
        ...audioFeatures.body.audio_features[index],
      }));

      console.log("Successfully processed sample tracks:", result);
      return result;
    } catch (error) {
      console.error("Error in getSampleTrackIds:", error);
      // Return empty array instead of throwing error to prevent UI from breaking
      return [];
    }
  }
}

export default new SpotifyDataset();
