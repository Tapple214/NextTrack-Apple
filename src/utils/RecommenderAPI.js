import SpotifyWebApi from "spotify-web-api-node";

class RecommenderAPI {
  // Initializes Spotify API and sets up cache
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: "c6d965d704db458abac7673400b7b007",
      clientSecret: "a91f9fdde7e94d6cbb2e1ef59badac46",
      redirectUri: "https://localhost:3000",
    });
    this.tokenExpirationTime = null;
    this.trackCache = new Map();
    this.audioFeaturesCache = new Map();
    this.userPreferences = new Map(); // For collaborative filtering
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.lastRequestTime = 0;
    this.minRequestInterval = 100; // Minimum 100ms between requests
  }

  // Gets access token using credentials
  async authenticate() {
    // Encodes credentials to base64 for authentication
    const credentials = btoa(
      `${this.spotifyApi.getClientId()}:${this.spotifyApi.getClientSecret()}`
    );

    // Sends request to Spotify API to get access token
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials",
    });

    // Throws error if authentication fails
    if (!response.ok)
      throw new Error(`Authentication failed: ${response.status}`);

    // Sets access token and expiration time
    const { access_token, expires_in } = await response.json();
    this.spotifyApi.setAccessToken(access_token);
    this.tokenExpirationTime = Date.now() + (expires_in - 300) * 1000;
  }

  // Checks if access token is valid, else fetches new token using authenticate()
  async ensureAuthenticated() {
    if (!this.tokenExpirationTime || Date.now() >= this.tokenExpirationTime) {
      await this.authenticate();
    }
  }

  // Test Spotify API connectivity
  async testApiConnection() {
    try {
      await this.ensureAuthenticated();
      const testTrack = await this.spotifyApi.getTrack(
        "4iV5W9uYEdYUVa79Axb7Rh"
      ); // Test with a known track
      return testTrack.body ? true : false;
    } catch (error) {
      console.error("Spotify API connection test failed:", error);
      return false;
    }
  }

  // Rate limiting helper
  async throttleRequest() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
  }

  // Gets track features from Spotify API (my external data source); TODO: use audio features instead of track artist
  // TODO: this is not really useful, just keeping it for now
  async getTrackFeatures(trackId) {
    // Checks if track data is cached, else fetches new track data
    if (this.trackCache.has(trackId)) return this.trackCache.get(trackId);

    await this.ensureAuthenticated();
    await this.throttleRequest();

    try {
      // Gets track data from Spotify API using trackId
      const trackData = await this.spotifyApi.getTrack(trackId);
      const trackInfo = {
        id: trackId,
        name: trackData.body.name,
        artists: trackData.body.artists.map((artist) => ({
          name: artist.name,
          id: artist.id,
        })),
      };

      // Caches track data
      this.trackCache.set(trackId, trackInfo);
      return trackInfo;
    } catch (error) {
      console.error(
        `Error getting track features for track ${trackId}:`,
        error
      );
      // Return a basic track info object if API fails
      return {
        id: trackId,
        name: "Unknown Track",
        artists: [{ name: "Unknown Artist", id: "unknown" }],
      };
    }
  }

  // Gets audio features for content-based filtering
  async getAudioFeatures(trackId) {
    if (this.audioFeaturesCache.has(trackId)) {
      return this.audioFeaturesCache.get(trackId);
    }

    await this.ensureAuthenticated();
    await this.throttleRequest();

    try {
      const features = await this.spotifyApi.getAudioFeaturesForTrack(trackId);
      const audioFeatures = {
        id: trackId,
        danceability: features.body.danceability,
        energy: features.body.energy,
        key: features.body.key,
        loudness: features.body.loudness,
        mode: features.body.mode,
        speechiness: features.body.speechiness,
        acousticness: features.body.acousticness,
        instrumentalness: features.body.instrumentalness,
        liveness: features.body.liveness,
        valence: features.body.valence,
        tempo: features.body.tempo,
        duration_ms: features.body.duration_ms,
        time_signature: features.body.time_signature,
      };

      this.audioFeaturesCache.set(trackId, audioFeatures);
      return audioFeatures;
    } catch (error) {
      console.error(
        `Error getting audio features for track ${trackId}:`,
        error
      );

      // Return default features if API fails
      const defaultFeatures = {
        id: trackId,
        danceability: 0.5,
        energy: 0.5,
        key: 0,
        loudness: -10,
        mode: 1,
        speechiness: 0.1,
        acousticness: 0.5,
        instrumentalness: 0.1,
        liveness: 0.1,
        valence: 0.5,
        tempo: 120,
        duration_ms: 180000,
        time_signature: 4,
      };

      // Cache the default features to avoid repeated API calls
      this.audioFeaturesCache.set(trackId, defaultFeatures);
      return defaultFeatures;
    }
  }

  // Content-Based Filtering: Recommends based on audio features similarity
  async getContentBasedRecommendations(seedTrackId, limit = 5) {
    await this.ensureAuthenticated();

    const seedFeatures = await this.getAudioFeatures(seedTrackId);
    const seedTrack = await this.getTrackFeatures(seedTrackId);
    const recommendations = [];
    const seenTrackIds = new Set([seedTrackId]);

    // If audio features are unavailable, fallback to genre-based search
    if (!seedFeatures || seedFeatures.danceability === 0.5) {
      console.warn(
        "Audio features unavailable, using genre-based content filtering"
      );
      return this.getGenreBasedRecommendations(seedTrackId, limit);
    }

    // Calculate target ranges based on seed track features
    const targetRanges = {
      tempo: { min: seedFeatures.tempo * 0.8, max: seedFeatures.tempo * 1.2 },
      energy: {
        min: Math.max(0, seedFeatures.energy - 0.2),
        max: Math.min(1, seedFeatures.energy + 0.2),
      },
      danceability: {
        min: Math.max(0, seedFeatures.danceability - 0.2),
        max: Math.min(1, seedFeatures.danceability + 0.2),
      },
      valence: {
        min: Math.max(0, seedFeatures.valence - 0.2),
        max: Math.min(1, seedFeatures.valence + 0.2),
      },
      instrumentalness: {
        min: Math.max(0, seedFeatures.instrumentalness - 0.2),
        max: Math.min(1, seedFeatures.instrumentalness + 0.2),
      },
    };

    try {
      // Search by tempo range
      const tempoQuery = `tempo:${Math.floor(
        targetRanges.tempo.min
      )}-${Math.ceil(targetRanges.tempo.max)}`;
      const {
        body: {
          tracks: { items: tempoTracks },
        },
      } = await this.spotifyApi.searchTracks(tempoQuery, {
        limit: limit * 3,
        market: "US",
      });

      for (const track of tempoTracks) {
        if (!seenTrackIds.has(track.id)) {
          const trackFeatures = await this.getAudioFeatures(track.id);
          if (trackFeatures && trackFeatures.danceability !== 0.5) {
            const similarity = this.calculateFeatureSimilarity(
              seedFeatures,
              trackFeatures
            );
            if (similarity > 0.6) {
              // Threshold for similarity
              recommendations.push({
                ...(await this.getTrackFeatures(track.id)),
                similarity: similarity,
                features: trackFeatures,
              });
              seenTrackIds.add(track.id);
              if (recommendations.length >= limit) break;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in content-based search:", error);
      // Fallback to collaborative filtering if search fails
      return this.getCollaborativeRecommendations(seedTrackId, limit);
    }

    // If we don't have enough recommendations, fallback to collaborative
    if (recommendations.length < limit) {
      console.log(
        `Only found ${recommendations.length} content-based recommendations, supplementing with collaborative`
      );
      const collaborativeRecs = await this.getCollaborativeRecommendations(
        seedTrackId,
        limit - recommendations.length
      );
      recommendations.push(...collaborativeRecs);
    }

    // Sort by similarity and return top recommendations
    return recommendations
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, limit);
  }

  // Genre-based content filtering fallback
  async getGenreBasedRecommendations(seedTrackId, limit = 5) {
    await this.ensureAuthenticated();

    const seedTrack = await this.getTrackFeatures(seedTrackId);
    const recommendations = [];
    const seenTrackIds = new Set([seedTrackId]);

    // Try to find tracks in similar genres
    const genreKeywords = this.extractGenreKeywords(
      seedTrack.name,
      seedTrack.artists[0]?.name
    );

    for (const keyword of genreKeywords) {
      if (recommendations.length >= limit) break;

      await this.throttleRequest();

      try {
        const {
          body: {
            tracks: { items },
          },
        } = await this.spotifyApi.searchTracks(keyword, {
          limit: limit * 2,
          market: "US",
        });

        for (const track of items) {
          if (!seenTrackIds.has(track.id)) {
            recommendations.push({
              ...(await this.getTrackFeatures(track.id)),
              similarity: 0.7, // Default similarity for genre-based
              reason: `Similar genre: ${keyword}`,
            });
            seenTrackIds.add(track.id);
            if (recommendations.length >= limit) break;
          }
        }
      } catch (error) {
        console.error(`Error searching for keyword ${keyword}:`, error);
        continue;
      }
    }

    return recommendations.slice(0, limit);
  }

  // Extract genre keywords from track name and artist
  extractGenreKeywords(trackName, artistName) {
    const keywords = [];

    // Common genre indicators in track names
    const genreIndicators = {
      rock: ["rock", "guitar", "electric", "heavy"],
      pop: ["pop", "catchy", "melody", "radio"],
      "hip-hop": ["rap", "hip-hop", "trap", "beats"],
      electronic: ["electronic", "edm", "dance", "synth"],
      jazz: ["jazz", "smooth", "saxophone", "piano"],
      country: ["country", "folk", "acoustic", "guitar"],
      classical: ["classical", "orchestra", "piano", "violin"],
      "r&b": ["r&b", "soul", "smooth", "vocal"],
    };

    const searchText = `${trackName} ${artistName}`.toLowerCase();

    for (const [genre, indicators] of Object.entries(genreIndicators)) {
      for (const indicator of indicators) {
        if (searchText.includes(indicator)) {
          keywords.push(genre);
          break;
        }
      }
    }

    // If no specific genre found, use general terms
    if (keywords.length === 0) {
      keywords.push("popular", "trending", "chart");
    }

    return keywords;
  }

  // Calculate similarity between two tracks based on audio features
  calculateFeatureSimilarity(features1, features2) {
    const weights = {
      tempo: 0.2,
      energy: 0.2,
      danceability: 0.2,
      valence: 0.15,
      instrumentalness: 0.15,
      acousticness: 0.1,
    };

    let totalSimilarity = 0;
    let totalWeight = 0;

    for (const [feature, weight] of Object.entries(weights)) {
      if (
        features1[feature] !== undefined &&
        features2[feature] !== undefined
      ) {
        const diff = Math.abs(features1[feature] - features2[feature]);
        const maxValue = feature === "tempo" ? 200 : 1; // Tempo can go up to ~200 BPM
        const similarity = Math.max(0, 1 - diff / maxValue);
        totalSimilarity += similarity * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? totalSimilarity / totalWeight : 0;
  }

  // Collaborative Filtering: Simulates user behavior patterns
  async getCollaborativeRecommendations(seedTrackId, limit = 5) {
    await this.ensureAuthenticated();

    const seedTrack = await this.getTrackFeatures(seedTrackId);
    const recommendations = [];
    const seenTrackIds = new Set([seedTrackId]);

    // Simulate collaborative filtering by finding tracks that are often liked together
    // In a real system, this would use actual user data

    // Get tracks by the same artist (simulating "users who liked this also liked")
    for (const artist of seedTrack.artists) {
      await this.throttleRequest();

      try {
        const {
          body: {
            tracks: { items },
          },
        } = await this.spotifyApi.searchTracks(`artist:${artist.name}`, {
          limit: limit * 2,
          market: "US",
        });

        for (const track of items) {
          if (!seenTrackIds.has(track.id)) {
            recommendations.push({
              ...(await this.getTrackFeatures(track.id)),
              collaborativeScore: 0.8, // High score for same artist
              reason: `Same artist as ${seedTrack.name}`,
            });
            seenTrackIds.add(track.id);
            if (recommendations.length >= limit) break;
          }
        }
      } catch (error) {
        console.error(`Error searching for artist ${artist.name}:`, error);
        continue; // Skip this artist and try the next one
      }
    }

    // Get recent tracks if needed; only done if not enough similar tracks found
    if (recommendations.length < limit) {
      await this.throttleRequest();

      try {
        const {
          body: {
            tracks: { items },
          },
        } = await this.spotifyApi.searchTracks("year:2020-2024", {
          limit: (limit - recommendations.length) * 2,
          market: "US",
        });

        for (const track of items) {
          if (!seenTrackIds.has(track.id)) {
            recommendations.push(await this.getTrackFeatures(track.id));
            if (recommendations.length >= limit) break;
          }
        }
      } catch (error) {
        console.error("Error searching for recent tracks:", error);
      }
    }

    return recommendations.slice(0, limit);
  }

  // Robust fallback method that doesn't rely on audio features
  async getRobustRecommendations(seedTrackId, limit = 5) {
    await this.ensureAuthenticated();

    const seedTrack = await this.getTrackFeatures(seedTrackId);
    const recommendations = [];
    const seenTrackIds = new Set([seedTrackId]);

    // Method 1: Same artist tracks
    for (const artist of seedTrack.artists) {
      if (recommendations.length >= limit) break;

      await this.throttleRequest();

      try {
        const {
          body: {
            tracks: { items },
          },
        } = await this.spotifyApi.searchTracks(`artist:${artist.name}`, {
          limit: limit * 2,
          market: "US",
        });

        for (const track of items) {
          if (!seenTrackIds.has(track.id)) {
            recommendations.push({
              ...(await this.getTrackFeatures(track.id)),
              similarity: 0.8,
              reason: `Same artist: ${artist.name}`,
            });
            seenTrackIds.add(track.id);
            if (recommendations.length >= limit) break;
          }
        }
      } catch (error) {
        console.error(`Error searching for artist ${artist.name}:`, error);
        continue;
      }
    }

    // Method 2: Popular tracks in similar style
    if (recommendations.length < limit) {
      await this.throttleRequest();

      try {
        const {
          body: {
            tracks: { items },
          },
        } = await this.spotifyApi.searchTracks("year:2020-2024", {
          limit: (limit - recommendations.length) * 3,
          market: "US",
        });

        for (const track of items) {
          if (!seenTrackIds.has(track.id)) {
            recommendations.push({
              ...(await this.getTrackFeatures(track.id)),
              similarity: 0.6,
              reason: "Popular recent track",
            });
            seenTrackIds.add(track.id);
            if (recommendations.length >= limit) break;
          }
        }
      } catch (error) {
        console.error("Error searching for popular tracks:", error);
      }
    }

    // Method 3: Genre-based search
    if (recommendations.length < limit) {
      const genreKeywords = this.extractGenreKeywords(
        seedTrack.name,
        seedTrack.artists[0]?.name
      );

      for (const keyword of genreKeywords) {
        if (recommendations.length >= limit) break;

        await this.throttleRequest();

        try {
          const {
            body: {
              tracks: { items },
            },
          } = await this.spotifyApi.searchTracks(keyword, {
            limit: (limit - recommendations.length) * 2,
            market: "US",
          });

          for (const track of items) {
            if (!seenTrackIds.has(track.id)) {
              recommendations.push({
                ...(await this.getTrackFeatures(track.id)),
                similarity: 0.7,
                reason: `Similar genre: ${keyword}`,
              });
              seenTrackIds.add(track.id);
              if (recommendations.length >= limit) break;
            }
          }
        } catch (error) {
          console.error(`Error searching for genre ${keyword}:`, error);
          continue;
        }
      }
    }

    return recommendations.slice(0, limit);
  }

  // Hybrid System: Combines content-based and collaborative filtering
  async getHybridRecommendations(seedTrackId, limit = 5) {
    await this.ensureAuthenticated();

    try {
      // Get both types of recommendations
      const [contentBased, collaborative] = await Promise.allSettled([
        this.getContentBasedRecommendations(seedTrackId, limit * 2),
        this.getCollaborativeRecommendations(seedTrackId, limit * 2),
      ]);

      // Handle failed promises
      const contentBasedResults =
        contentBased.status === "fulfilled" ? contentBased.value : [];
      const collaborativeResults =
        collaborative.status === "fulfilled" ? collaborative.value : [];

      // If both failed, fallback to original method
      if (
        contentBasedResults.length === 0 &&
        collaborativeResults.length === 0
      ) {
        console.warn(
          "Both content-based and collaborative filtering failed, using original method"
        );
        return this.findSimilarTracks(seedTrackId, limit);
      }

      // Combine and score recommendations
      const combinedTracks = new Map();

      // Add content-based recommendations
      contentBasedResults.forEach((track) => {
        combinedTracks.set(track.id, {
          ...track,
          contentScore: track.similarity || 0,
          collaborativeScore: 0,
          hybridScore: (track.similarity || 0) * 0.6, // 60% weight to content
        });
      });

      // Add collaborative recommendations
      collaborativeResults.forEach((track) => {
        if (combinedTracks.has(track.id)) {
          // Update existing track
          const existing = combinedTracks.get(track.id);
          existing.collaborativeScore = track.collaborativeScore || 0;
          existing.hybridScore =
            existing.contentScore * 0.6 + existing.collaborativeScore * 0.4;
          existing.reason = `High similarity + ${track.reason}`;
        } else {
          // Add new track
          combinedTracks.set(track.id, {
            ...track,
            contentScore: 0,
            collaborativeScore: track.collaborativeScore || 0,
            hybridScore: (track.collaborativeScore || 0) * 0.4, // 40% weight to collaborative
          });
        }
      });

      // Sort by hybrid score and return top recommendations
      return Array.from(combinedTracks.values())
        .sort((a, b) => b.hybridScore - a.hybridScore)
        .slice(0, limit);
    } catch (error) {
      console.error("Error in hybrid recommendations:", error);
      // Fallback to collaborative filtering
      return this.getCollaborativeRecommendations(seedTrackId, limit);
    }
  }

  // Finds similar tracks to seed track; limited to 5 recs for now
  async findSimilarTracks(seedTrackId, limit = 5) {
    await this.ensureAuthenticated();

    // Gets seed track features; TOOD: currently not needed just yet, just keeping it for now
    const seedTrack = await this.getTrackFeatures(seedTrackId);

    // Sets up seen track ids (to avoid duplicates) and recommendations
    const seenTrackIds = new Set([seedTrackId]);
    const recommendations = [];

    // Get tracks by the same artist
    for (const artist of seedTrack.artists) {
      await this.throttleRequest();

      try {
        // items = tracks by same artist of seed track
        const {
          body: {
            tracks: { items },
          },
        } = await this.spotifyApi.searchTracks(`artist:${artist.name}`, {
          limit: limit * 2,
          market: "US",
        });

        // Checks items for duplicates, adds to recommendations if not seen
        for (const track of items) {
          if (!seenTrackIds.has(track.id)) {
            recommendations.push(await this.getTrackFeatures(track.id));
            seenTrackIds.add(track.id);
            if (recommendations.length >= limit) return recommendations;
          }
        }
      } catch (error) {
        console.error(`Error searching for artist ${artist.name}:`, error);
        continue;
      }
    }

    // Get recent tracks if needed; only done if not enough similar tracks found
    if (recommendations.length < limit) {
      await this.throttleRequest();

      try {
        const {
          body: {
            tracks: { items },
          },
        } = await this.spotifyApi.searchTracks("year:2020-2024", {
          limit: (limit - recommendations.length) * 2,
          market: "US",
        });

        for (const track of items) {
          if (!seenTrackIds.has(track.id)) {
            recommendations.push(await this.getTrackFeatures(track.id));
            if (recommendations.length >= limit) break;
          }
        }
      } catch (error) {
        console.error("Error searching for recent tracks:", error);
      }
    }

    return recommendations.slice(0, limit);
  }

  // Sample tracks/Predefined tracks categorized by genre
  async getSampleTracks(limit = 5) {
    await this.ensureAuthenticated();
    const genres = ["pop", "rock", "hip-hop", "electronic", "jazz"];
    const tracks = [];
    const seenTrackIds = new Set();

    for (const genre of genres) {
      await this.throttleRequest();

      try {
        const {
          body: {
            tracks: { items },
          },
        } = await this.spotifyApi.searchTracks(`genre:${genre}`, {
          limit: 2,
          market: "US",
        });

        for (const track of items) {
          if (!seenTrackIds.has(track.id)) {
            tracks.push({
              id: track.id,
              name: track.name,
              artists: track.artists.map((a) => ({ name: a.name, id: a.id })),
            });
            seenTrackIds.add(track.id);
            if (tracks.length >= limit) return tracks;
          }
        }
      } catch (error) {
        console.error(`Error searching for genre ${genre}:`, error);
        continue; // Skip this genre and try the next one
      }
    }

    return tracks;
  }
}

export default new RecommenderAPI();
