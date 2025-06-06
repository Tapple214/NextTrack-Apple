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

  // Gets track features from Spotify API (my external data source); TODO: use audio features instead of track artist
  // TODO: this is not really useful, just keeping it for now
  async getTrackFeatures(trackId) {
    // Checks if track data is cached, else fetches new track data
    if (this.trackCache.has(trackId)) return this.trackCache.get(trackId);

    await this.ensureAuthenticated();

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
    }

    // Get recent tracks if needed; only done if not enough similar tracks found
    if (recommendations.length < limit) {
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
    }

    return tracks;
  }
}

export default new RecommenderAPI();
