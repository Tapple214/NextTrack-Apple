class ApiService {
  constructor() {
    this.spotifyBaseUrl = "https://api.spotify.com/v1";
    this.musicbrainzBaseUrl = "https://musicbrainz.org/ws/2";
    this.geniusBaseUrl = "https://api.genius.com";
    this.wikidataBaseUrl = "https://www.wikidata.org/w/api.php";
  }

  // Helper method to handle fetch responses
  async handleResponse(response) {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Get track details from Spotify
  async getSpotifyTrackDetails(trackId) {
    try {
      const response = await fetch(`${this.spotifyBaseUrl}/tracks/${trackId}`);
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching Spotify track details:", error);
      throw error;
    }
  }

  // Get artist details from MusicBrainz
  async getMusicBrainzArtistDetails(artistId) {
    try {
      const url = new URL(`${this.musicbrainzBaseUrl}/artist/${artistId}`);
      url.searchParams.append("fmt", "json");
      url.searchParams.append("inc", "releases+tags+genres");

      const response = await fetch(url);
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching MusicBrainz artist details:", error);
      throw error;
    }
  }

  // Get lyrics from Genius
  async getGeniusLyrics(songId) {
    try {
      const response = await fetch(`${this.geniusBaseUrl}/songs/${songId}`);
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching Genius lyrics:", error);
      throw error;
    }
  }

  // Get additional metadata from Wikidata
  async getWikidataInfo(entityId) {
    try {
      const url = new URL(this.wikidataBaseUrl);
      url.searchParams.append("action", "wbgetentities");
      url.searchParams.append("ids", entityId);
      url.searchParams.append("format", "json");
      url.searchParams.append("languages", "en");

      const response = await fetch(url);
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching Wikidata info:", error);
      throw error;
    }
  }

  // Get recommendations based on track sequence and preferences
  async getRecommendations(trackIds, preferences) {
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackIds,
          preferences,
        }),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      throw error;
    }
  }
}

export default new ApiService();
