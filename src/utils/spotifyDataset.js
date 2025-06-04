import Papa from "papaparse";

// Using a more reliable dataset URL
const DATASET_URL =
  "https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2020/2020-01-21/spotify_songs.csv";

class SpotifyDataset {
  constructor() {
    this.tracks = [];
    this.isLoaded = false;
  }

  async loadDataset() {
    try {
      const response = await fetch(DATASET_URL);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch dataset: ${response.status} ${response.statusText}`
        );
      }
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.error("CSV parsing errors:", results.errors);
          }
          this.tracks = results.data.map((track) => ({
            id: track.track_id,
            name: track.track_name,
            artists: [
              {
                name: track.track_artist,
                id: track.track_artist_id || track.track_id, // fallback to track_id if no artist_id
              },
            ],
            danceability: parseFloat(track.danceability),
            energy: parseFloat(track.energy),
            loudness: parseFloat(track.loudness),
            speechiness: parseFloat(track.speechiness),
            acousticness: parseFloat(track.acousticness),
            instrumentalness: parseFloat(track.instrumentalness),
            liveness: parseFloat(track.liveness),
            valence: parseFloat(track.valence),
            tempo: parseFloat(track.tempo),
          }));
          this.isLoaded = true;
          console.log("Dataset loaded with", this.tracks.length, "tracks");
          console.log("Sample track:", this.tracks[0]);
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
          throw error;
        },
      });
    } catch (error) {
      console.error("Error loading dataset:", error);
      throw error;
    }
  }

  // Calculate similarity between two tracks based on audio features
  calculateSimilarity(track1, track2) {
    const features = [
      "danceability",
      "energy",
      "loudness",
      "speechiness",
      "acousticness",
      "instrumentalness",
      "liveness",
      "valence",
      "tempo",
    ];

    let similarity = 0;
    features.forEach((feature) => {
      const diff = Math.abs(track1[feature] - track2[feature]);
      similarity += 1 - diff / Math.max(track1[feature], track2[feature]);
    });

    return similarity / features.length;
  }

  // Find similar tracks based on audio features
  findSimilarTracks(seedTrack, limit = 5) {
    if (!this.isLoaded) {
      throw new Error("Dataset not loaded");
    }

    const similarities = this.tracks.map((track) => ({
      track,
      similarity: this.calculateSimilarity(seedTrack, track),
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((item) => item.track);
  }

  // Get track by Spotify URL
  getTrackByUrl(url) {
    const trackId = this.extractTrackId(url);
    console.log("Looking for track with ID:", trackId);

    if (this.tracks.length === 0) {
      console.log("No tracks loaded in dataset");
      return null;
    }

    console.log(
      "First few track IDs in dataset:",
      this.tracks.slice(0, 3).map((t) => t.id)
    );

    const track = this.tracks.find((track) => track.id === trackId);
    if (!track) {
      console.log(
        "Track not found. Available columns:",
        Object.keys(this.tracks[0])
      );
    }
    return track;
  }

  // Extract track ID from Spotify URL
  extractTrackId(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      return pathParts[pathParts.length - 1];
    } catch (err) {
      throw new Error("Invalid Spotify URL format");
    }
  }
}

export default new SpotifyDataset();
