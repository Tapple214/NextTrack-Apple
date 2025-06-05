const fetch = require("node-fetch");

class SpotifyDataset {
  constructor() {
    this.clientId = "c6d965d704db458abac7673400b7b007";
    this.clientSecret = "a91f9fdde7e94d6cbb2e1ef59badac46";
    this.accessToken = null;
    this.tokenExpirationTime = null;
  }

  async authenticate() {
    try {
      console.log("Starting authentication process...");

      const credentials = btoa(`${this.clientId}:${this.clientSecret}`);
      console.log("Credentials encoded:", credentials);

      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
        body: "grant_type=client_credentials",
      });

      console.log("Authentication response status:", response.status);

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
      console.log("Authentication response data:", data);

      if (data.access_token) {
        this.accessToken = data.access_token;
        this.tokenExpirationTime = Date.now() + data.expires_in * 1000 - 300000;
        console.log("Successfully authenticated with Spotify API");
        console.log(
          "Token expiration time:",
          new Date(this.tokenExpirationTime)
        );
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
      !this.accessToken ||
      (this.tokenExpirationTime && Date.now() >= this.tokenExpirationTime)
    ) {
      console.log("Token expired or missing, re-authenticating...");
      await this.authenticate();
    } else {
      console.log(
        "Using existing token, expires at:",
        new Date(this.tokenExpirationTime)
      );
    }
  }

  async makeRequest(endpoint, method = "GET") {
    try {
      await this.ensureAuthenticated();

      const url = `https://api.spotify.com/v1${endpoint}`;
      console.log("Making request to:", url);
      console.log("Using token:", this.accessToken.substring(0, 10) + "...");

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API request failed:", {
          url,
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });

        // If we get a 401, try to re-authenticate once
        if (response.status === 401) {
          console.log("Received 401, attempting to re-authenticate...");
          await this.authenticate();
          return this.makeRequest(endpoint, method);
        }

        throw new Error(
          `API request failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("Request successful, received data:", data);
      return data;
    } catch (error) {
      console.error("Error in makeRequest:", error);
      throw error;
    }
  }

  // Get track details from Spotify API
  async getTrackByUrl(url) {
    try {
      const trackId = this.extractTrackId(url);
      console.log("Fetching track data for ID:", trackId);

      // Get track data
      const trackData = await this.makeRequest(`/tracks/${trackId}`);
      console.log("Track data received:", trackData);

      // Get audio features
      let audioFeatures;
      try {
        audioFeatures = await this.makeRequest(`/audio-features/${trackId}`);
        console.log("Audio features received:", audioFeatures);
      } catch (error) {
        console.warn("Could not fetch audio features, using default values");
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

      const result = {
        id: trackData.id,
        name: trackData.name,
        artists: trackData.artists.map((artist) => ({
          name: artist.name,
          id: artist.id,
        })),
        ...audioFeatures,
      };

      console.log("Combined track data:", result);
      return result;
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
      console.log("Getting recommendations for track:", seedTrack);

      // First verify the track exists
      try {
        await this.makeRequest(`/tracks/${seedTrack.id}`);
      } catch (error) {
        console.error("Error verifying track:", error);
        throw new Error("Invalid track ID or track not found");
      }

      // Prepare recommendation parameters
      const params = new URLSearchParams({
        seed_tracks: seedTrack.id,
        limit: limit.toString(),
        min_popularity: "50",
      });

      // Only add the most relevant target parameters
      // Spotify recommends using 1-2 target parameters for best results
      if (
        typeof seedTrack.danceability === "number" &&
        !isNaN(seedTrack.danceability)
      ) {
        params.append("target_danceability", seedTrack.danceability.toString());
      }
      if (typeof seedTrack.energy === "number" && !isNaN(seedTrack.energy)) {
        params.append("target_energy", seedTrack.energy.toString());
      }

      console.log("Recommendation parameters:", params.toString());
      const recommendations = await this.makeRequest(
        `/recommendations?${params.toString()}`
      );
      console.log("Recommendations received:", recommendations);

      // Get audio features for all recommended tracks
      const trackIds = recommendations.tracks.map((track) => track.id);
      let audioFeatures;
      try {
        audioFeatures = await this.makeRequest(
          `/audio-features?ids=${trackIds.join(",")}`
        );
        console.log("Audio features for recommendations:", audioFeatures);
      } catch (error) {
        console.warn(
          "Could not fetch audio features for recommendations, using default values"
        );
        audioFeatures = {
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
        };
      }

      const result = recommendations.tracks.map((track, index) => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map((artist) => ({
          name: artist.name,
          id: artist.id,
        })),
        popularity: track.popularity,
        ...audioFeatures.audio_features[index],
      }));

      console.log("Final recommendations:", result);
      return result;
    } catch (error) {
      console.error("Error in findSimilarTracks:", error);
      throw new Error(`Failed to find similar tracks: ${error.message}`);
    }
  }

  // Get sample tracks
  async getSampleTrackIds() {
    try {
      console.log("Fetching sample tracks...");

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
            const trackData = await this.makeRequest(`/tracks/${trackId}`);
            console.log(`Successfully fetched track: ${trackData.name}`);
            return trackData;
          } catch (error) {
            console.error(`Error fetching track ${trackId}:`, error);
            throw error;
          }
        })
      );

      // Get audio features for all tracks
      let audioFeatures;
      try {
        audioFeatures = await this.makeRequest(
          `/audio-features?ids=${popularTracks.join(",")}`
        );
        console.log("Successfully fetched audio features");
      } catch (error) {
        console.warn(
          "Could not fetch audio features for sample tracks, using default values"
        );
        audioFeatures = {
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
        };
      }

      const result = tracksData.map((trackData, index) => ({
        id: trackData.id,
        name: trackData.name,
        artist: trackData.artists[0].name,
        ...audioFeatures.audio_features[index],
      }));

      console.log("Successfully processed sample tracks:", result);
      return result;
    } catch (error) {
      console.error("Error in getSampleTrackIds:", error);
      return [];
    }
  }
}

module.exports = new SpotifyDataset();
