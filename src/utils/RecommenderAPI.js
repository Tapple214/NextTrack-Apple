import SpotifyWebApi from "spotify-web-api-node";

class RecommenderAPI {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: "c6d965d704db458abac7673400b7b007",
      clientSecret: "a91f9fdde7e94d6cbb2e1ef59badac46",
      redirectUri: "https://localhost:3000",
    });
    this.tokenExpirationTime = null;
    this.trackCache = new Map();
  }

  async authenticate() {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(
          "c6d965d704db458abac7673400b7b007:a91f9fdde7e94d6cbb2e1ef59badac46"
        )}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const { access_token, expires_in } = await response.json();
    this.spotifyApi.setAccessToken(access_token);
    this.tokenExpirationTime = Date.now() + expires_in * 1000 - 300000;
  }

  async ensureAuthenticated() {
    if (!this.tokenExpirationTime || Date.now() >= this.tokenExpirationTime) {
      await this.authenticate();
    }
  }

  async getTrackFeatures(trackId) {
    if (this.trackCache.has(trackId)) {
      return this.trackCache.get(trackId);
    }

    await this.ensureAuthenticated();
    const [trackData, audioFeatures] = await Promise.all([
      this.spotifyApi.getTrack(trackId),
      this.spotifyApi.getAudioFeaturesForTrack(trackId).catch(() => ({
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
      })),
    ]);

    const trackInfo = {
      id: trackId,
      name: trackData.body.name,
      artists: trackData.body.artists.map((artist) => ({
        name: artist.name,
        id: artist.id,
      })),
      ...audioFeatures.body,
    };

    this.trackCache.set(trackId, trackInfo);
    return trackInfo;
  }

  async findSimilarTracks(seedTrackId, limit = 5) {
    await this.ensureAuthenticated();
    const seedTrack = await this.getTrackFeatures(seedTrackId);
    const recommendations = [];
    const seenTrackIds = new Set([seedTrackId]);

    // Get tracks by the same artist
    for (const artist of seedTrack.artists) {
      const artistTracks = await this.spotifyApi.searchTracks(
        `artist:${artist.name}`,
        {
          limit: Math.ceil(limit * 2),
          market: "US",
        }
      );

      for (const track of artistTracks.body.tracks.items) {
        if (!seenTrackIds.has(track.id)) {
          recommendations.push(await this.getTrackFeatures(track.id));
          seenTrackIds.add(track.id);
        }
        if (recommendations.length >= limit) break;
      }
      if (recommendations.length >= limit) break;
    }

    // If we need more recommendations, get recent tracks
    if (recommendations.length < limit) {
      const recentTracks = await this.spotifyApi.searchTracks(
        "year:2020-2024",
        {
          limit: (limit - recommendations.length) * 2,
          market: "US",
        }
      );

      for (const track of recentTracks.body.tracks.items) {
        if (!seenTrackIds.has(track.id)) {
          recommendations.push(await this.getTrackFeatures(track.id));
          seenTrackIds.add(track.id);
        }
        if (recommendations.length >= limit) break;
      }
    }

    return recommendations.slice(0, limit);
  }

  async getSampleTracks(limit = 5) {
    await this.ensureAuthenticated();
    const genres = ["pop", "rock", "hip-hop", "electronic", "jazz"];
    const tracks = [];
    const seenTrackIds = new Set();

    for (const genre of genres) {
      const searchResults = await this.spotifyApi.searchTracks(
        `genre:${genre}`,
        {
          limit: 2,
          market: "US",
        }
      );

      for (const track of searchResults.body.tracks.items) {
        if (!seenTrackIds.has(track.id)) {
          tracks.push({
            id: track.id,
            name: track.name,
            artists: track.artists.map((a) => ({ name: a.name, id: a.id })),
          });
          seenTrackIds.add(track.id);
        }
        if (tracks.length >= limit) break;
      }
      if (tracks.length >= limit) break;
    }

    return tracks.slice(0, limit);
  }
}

export default new RecommenderAPI();
