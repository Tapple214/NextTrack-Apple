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

  // Calculate cosine similarity between two tracks
  calculateSimilarity(track1, track2) {
    const features = [
      "danceability",
      "energy",
      "valence",
      "acousticness",
      "instrumentalness",
      "liveness",
      "speechiness",
    ];

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (const feature of features) {
      dotProduct += track1[feature] * track2[feature];
      magnitude1 += track1[feature] * track1[feature];
      magnitude2 += track2[feature] * track2[feature];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }

  // Get track features from Spotify API
  async getTrackFeatures(trackId) {
    try {
      if (this.trackDatabase.has(trackId)) {
        return this.trackDatabase.get(trackId);
      }

      await this.ensureAuthenticated();

      // First get the track data
      const trackData = await this.spotifyApi.getTrack(trackId);
      console.log("Successfully fetched track data for:", trackId);

      // Then get audio features with retry logic
      let audioFeatures = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          audioFeatures = await this.spotifyApi.getAudioFeaturesForTrack(
            trackId
          );
          console.log("Successfully fetched audio features for:", trackId);
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

      const trackInfo = {
        id: trackId,
        name: trackData.body.name,
        artists: trackData.body.artists.map((artist) => ({
          name: artist.name,
          id: artist.id,
        })),
        ...audioFeatures.body,
      };

      this.trackDatabase.set(trackId, trackInfo);
      return trackInfo;
    } catch (error) {
      console.error("Error in getTrackFeatures:", error);
      throw new Error(`Failed to get track features: ${error.message}`);
    }
  }

  // Find similar tracks using our custom algorithm
  async findSimilarTracks(seedTrackId, limit = 5) {
    try {
      await this.ensureAuthenticated();

      // Get seed track features
      const seedTrack = await this.getTrackFeatures(seedTrackId);
      console.log("Found seed track:", seedTrack.name);

      // Get a sample of tracks to compare against
      const sampleTracks = await this.getSampleTracks(50);
      console.log("Found sample tracks:", sampleTracks.length);

      // Calculate similarity scores for all tracks
      const tracksWithScores = await Promise.all(
        sampleTracks.map(async (track) => {
          const features = await this.getTrackFeatures(track.id);
          const similarity = this.calculateSimilarity(seedTrack, features);
          return { ...features, similarity };
        })
      );

      // Sort by similarity and return top matches
      return tracksWithScores
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(({ similarity, ...track }) => track);
    } catch (error) {
      console.error("Error in findSimilarTracks:", error);
      throw new Error(`Failed to find similar tracks: ${error.message}`);
    }
  }

  // Get a sample of tracks to compare against
  async getSampleTracks(limit) {
    try {
      await this.ensureAuthenticated();

      // Use a curated list of popular tracks with current, valid IDs
      const popularTracks = [
        "4cOdK2wGLETKBW3PvgPWqT", // "Shape of You" by Ed Sheeran
        "6rqhFgbbKwnb9MLmUQDhG6", // "Blinding Lights" by The Weeknd
        "3ee8Jmje8o58CHK66QrVC2", // "Watermelon Sugar" by Harry Styles
        "0V3wPSX9ygBnCm8psDIegu", // "As It Was" by Harry Styles
        "07WEDHF2YwVgYuBugi2ECO", // "Bad Guy" by Billie Eilish
      ];

      // Get track details for all tracks
      const tracksData = await Promise.all(
        popularTracks.map(async (trackId) => {
          try {
            const trackData = await this.spotifyApi.getTrack(trackId);
            return trackData;
          } catch (error) {
            console.error(`Error fetching track ${trackId}:`, error);
            throw error;
          }
        })
      );

      return tracksData.map((track) => ({
        id: track.body.id,
        name: track.body.name,
      }));
    } catch (error) {
      console.error("Error in getSampleTracks:", error);
      throw new Error(`Failed to get sample tracks: ${error.message}`);
    }
  }
}

export default new CustomRecommender();
