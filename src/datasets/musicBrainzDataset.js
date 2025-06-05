import { MusicBrainzApi } from "musicbrainz-api";

class MusicBrainzDataset {
  constructor() {
    this.mbApi = new MusicBrainzApi({
      appName: "NextTrack-Apple",
      appVersion: "1.0.0",
      appContactInfo: "your-email@example.com",
    });
  }

  async searchArtist(query) {
    try {
      const results = await this.mbApi.browse("artist", { query });
      return results.artists || [];
    } catch (error) {
      console.error("Error searching artist:", error);
      return [];
    }
  }

  async getArtistDetails(artistId) {
    try {
      const details = await this.mbApi.lookup("artist", artistId, [
        "releases",
        "url-rels",
      ]);
      return details;
    } catch (error) {
      console.error("Error getting artist details:", error);
      return null;
    }
  }

  async getArtistReleases(artistId) {
    try {
      const details = await this.mbApi.lookup("artist", artistId, ["releases"]);
      return details.releases || [];
    } catch (error) {
      console.error("Error getting artist releases:", error);
      return [];
    }
  }

  async searchTrack(query) {
    try {
      const results = await this.mbApi.browse("recording", { query });
      return results.recordings || [];
    } catch (error) {
      console.error("Error searching track:", error);
      return [];
    }
  }

  async getTrackDetails(recordingId) {
    try {
      const details = await this.mbApi.lookup("recording", recordingId, [
        "artist-credits",
        "releases",
      ]);
      return details;
    } catch (error) {
      console.error("Error getting track details:", error);
      return null;
    }
  }

  // Helper method to get YouTube embed URL for a track
  getYouTubeEmbedUrl(trackName, artistName) {
    const searchQuery = encodeURIComponent(`${trackName} ${artistName} audio`);
    return `https://www.youtube.com/embed?listType=search&list=${searchQuery}`;
  }

  // Method to get similar tracks based on artist and genre
  async getSimilarTracks(artistId, limit = 5) {
    try {
      // Get artist details to find their genre
      const artistDetails = await this.getArtistDetails(artistId);
      if (!artistDetails) return [];

      // Get artist's releases
      const releases = await this.getArtistReleases(artistId);
      if (!releases.length) return [];

      // Get tracks from recent releases
      const recentReleases = releases
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

      const similarTracks = [];
      for (const release of recentReleases) {
        const releaseDetails = await this.mbApi.lookup("release", release.id, [
          "recordings",
        ]);
        if (releaseDetails.media && releaseDetails.media[0].tracks) {
          similarTracks.push(...releaseDetails.media[0].tracks);
        }
      }

      return similarTracks.slice(0, limit);
    } catch (error) {
      console.error("Error getting similar tracks:", error);
      return [];
    }
  }

  // Method to format track data for the web app
  formatTrackData(track, artist) {
    return {
      id: track.id,
      name: track.title,
      artist: artist.name,
      artistId: artist.id,
      album: track.releases?.[0]?.title || "Unknown Album",
      releaseDate: track.releases?.[0]?.date || "Unknown",
      duration: track.length || 0,
      youtubeEmbedUrl: this.getYouTubeEmbedUrl(track.title, artist.name),
    };
  }
}

export default new MusicBrainzDataset();
