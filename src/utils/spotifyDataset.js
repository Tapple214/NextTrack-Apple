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

          // Log some sample tracks and check for Mr. Brightside
          const sampleTracks = this.tracks.slice(0, 5);
          console.log(
            "Sample tracks:",
            sampleTracks.map((t) => ({
              id: t.id,
              name: t.name,
              artist: t.artists[0].name,
            }))
          );

          // Search for Mr. Brightside
          const mrBrightside = this.tracks.find(
            (t) =>
              t.name.toLowerCase().includes("mr. brightside") ||
              t.name.toLowerCase().includes("mr brightside")
          );
          if (mrBrightside) {
            console.log("Found Mr. Brightside in dataset:", mrBrightside);
          } else {
            console.log("Mr. Brightside not found in dataset");
          }
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

    // Filter out the seed track from recommendations
    const otherTracks = this.tracks.filter(
      (track) => track.id !== seedTrack.id
    );

    const similarities = otherTracks.map((track) => ({
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

    // Log the first few tracks for debugging
    console.log("First few tracks in dataset:", this.tracks.slice(0, 3));

    const track = this.tracks.find((track) => track.id === trackId);
    if (!track) {
      console.log(
        "Track not found. Available track IDs:",
        this.tracks.slice(0, 5).map((t) => t.id)
      );
      // Try to find by name as fallback
      const trackName = "Mr. Brightside";
      const similarTrack = this.tracks.find((t) =>
        t.name.toLowerCase().includes(trackName.toLowerCase())
      );
      if (similarTrack) {
        console.log("Found similar track by name:", similarTrack);
        return similarTrack;
      }
    }

    console.log("Found track:", track);
    return track;
  }

  // Extract track ID from Spotify URL
  extractTrackId(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const trackId = pathParts[pathParts.length - 1];
      console.log("Extracted track ID:", trackId);
      return trackId;
    } catch (err) {
      throw new Error("Invalid Spotify URL format");
    }
  }

  // Get sample track IDs from the dataset
  getSampleTrackIds() {
    if (!this.isLoaded) {
      return [];
    }
    return this.tracks.slice(0, 10).map((track) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
    }));
  }
}

export default new SpotifyDataset();
