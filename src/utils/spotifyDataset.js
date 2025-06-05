import SpotifyWebApi from "spotify-web-api-node";

class SpotifyDataset {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.REACT_APP_SPOTIFY_CLIENT_ID,
      clientSecret: process.env.REACT_APP_SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.REACT_APP_REDIRECT_URI,
    });
    this.isAuthenticated = false;
  }

  async authenticate() {
    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.spotifyApi.setAccessToken(data.body["access_token"]);
      this.isAuthenticated = true;
      console.log("Successfully authenticated with Spotify API");
    } catch (error) {
      console.error("Error authenticating with Spotify API:", error);
      throw error;
    }
  }

  async ensureAuthenticated() {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }
  }

  // Get track details from Spotify API
  async getTrackByUrl(url) {
    await this.ensureAuthenticated();
    const trackId = this.extractTrackId(url);

    try {
      const trackData = await this.spotifyApi.getTrack(trackId);
      const audioFeatures = await this.spotifyApi.getAudioFeaturesForTrack(
        trackId
      );

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
      console.error("Error fetching track data:", error);
      throw error;
    }
  }

  // Extract track ID from Spotify URL
  extractTrackId(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const trackId = pathParts[pathParts.length - 1];
      return trackId;
    } catch (err) {
      throw new Error("Invalid Spotify URL format");
    }
  }

  // Find similar tracks using Spotify's recommendation API
  async findSimilarTracks(seedTrack, limit = 5) {
    await this.ensureAuthenticated();

    try {
      const recommendations = await this.spotifyApi.getRecommendations({
        seed_tracks: [seedTrack.id],
        limit: limit,
        target_danceability: seedTrack.danceability,
        target_energy: seedTrack.energy,
        target_valence: seedTrack.valence,
        target_tempo: seedTrack.tempo,
      });

      return recommendations.body.tracks.map((track) => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map((artist) => ({
          name: artist.name,
          id: artist.id,
        })),
        // Note: Audio features will need to be fetched separately if needed
      }));
    } catch (error) {
      console.error("Error getting recommendations:", error);
      throw error;
    }
  }

  // Get sample tracks from Spotify's featured playlists
  async getSampleTrackIds() {
    await this.ensureAuthenticated();

    try {
      const featuredPlaylists = await this.spotifyApi.getFeaturedPlaylists({
        limit: 1,
      });
      if (featuredPlaylists.body.playlists.items.length === 0) {
        return [];
      }

      const playlistId = featuredPlaylists.body.playlists.items[0].id;
      const playlistTracks = await this.spotifyApi.getPlaylistTracks(
        playlistId,
        { limit: 10 }
      );

      return playlistTracks.body.items.map((item) => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists[0].name,
      }));
    } catch (error) {
      console.error("Error getting sample tracks:", error);
      throw error;
    }
  }
}

export default new SpotifyDataset();
