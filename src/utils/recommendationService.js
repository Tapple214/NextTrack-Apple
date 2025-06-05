import apiService from "./apiService";

class RecommendationService {
  constructor() {
    this.weightFactors = {
      audioFeatures: 0.4,
      genre: 0.2,
      artist: 0.2,
      lyrics: 0.1,
      metadata: 0.1,
    };
  }

  // Calculate similarity score between two tracks
  async calculateSimilarityScore(track1, track2, preferences) {
    const scores = {
      audioFeatures: this.calculateAudioFeatureSimilarity(track1, track2),
      genre: await this.calculateGenreSimilarity(track1, track2),
      artist: await this.calculateArtistSimilarity(track1, track2),
      lyrics: await this.calculateLyricsSimilarity(track1, track2),
      metadata: await this.calculateMetadataSimilarity(track1, track2),
    };

    // Apply user preferences to weights
    const adjustedWeights = this.adjustWeights(preferences);

    // Calculate final score
    let finalScore = 0;
    for (const [factor, score] of Object.entries(scores)) {
      finalScore += score * adjustedWeights[factor];
    }

    return finalScore;
  }

  // Calculate similarity based on audio features
  calculateAudioFeatureSimilarity(track1, track2) {
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

  // Calculate similarity based on genres
  async calculateGenreSimilarity(track1, track2) {
    try {
      const artist1Details = await apiService.getMusicBrainzArtistDetails(
        track1.artistId
      );
      const artist2Details = await apiService.getMusicBrainzArtistDetails(
        track2.artistId
      );

      const genres1 = new Set(artist1Details.genres.map((g) => g.name));
      const genres2 = new Set(artist2Details.genres.map((g) => g.name));

      const intersection = new Set([...genres1].filter((x) => genres2.has(x)));
      const union = new Set([...genres1, ...genres2]);

      return intersection.size / union.size;
    } catch (error) {
      console.error("Error calculating genre similarity:", error);
      return 0;
    }
  }

  // Calculate similarity based on artist information
  async calculateArtistSimilarity(track1, track2) {
    try {
      const artist1Details = await apiService.getMusicBrainzArtistDetails(
        track1.artistId
      );
      const artist2Details = await apiService.getMusicBrainzArtistDetails(
        track2.artistId
      );

      // Compare tags
      const tags1 = new Set(artist1Details.tags.map((t) => t.name));
      const tags2 = new Set(artist2Details.tags.map((t) => t.name));

      const tagIntersection = new Set([...tags1].filter((x) => tags2.has(x)));
      const tagUnion = new Set([...tags1, ...tags2]);

      return tagIntersection.size / tagUnion.size;
    } catch (error) {
      console.error("Error calculating artist similarity:", error);
      return 0;
    }
  }

  // Calculate similarity based on lyrics
  async calculateLyricsSimilarity(track1, track2) {
    try {
      const lyrics1 = await apiService.getGeniusLyrics(track1.geniusId);
      const lyrics2 = await apiService.getGeniusLyrics(track2.geniusId);

      // Simple word overlap comparison
      const words1 = new Set(lyrics1.split(/\s+/));
      const words2 = new Set(lyrics2.split(/\s+/));

      const intersection = new Set([...words1].filter((x) => words2.has(x)));
      const union = new Set([...words1, ...words2]);

      return intersection.size / union.size;
    } catch (error) {
      console.error("Error calculating lyrics similarity:", error);
      return 0;
    }
  }

  // Calculate similarity based on metadata
  async calculateMetadataSimilarity(track1, track2) {
    try {
      const metadata1 = await apiService.getWikidataInfo(track1.wikidataId);
      const metadata2 = await apiService.getWikidataInfo(track2.wikidataId);

      // Compare common properties
      const properties1 = new Set(Object.keys(metadata1.claims));
      const properties2 = new Set(Object.keys(metadata2.claims));

      const intersection = new Set(
        [...properties1].filter((x) => properties2.has(x))
      );
      const union = new Set([...properties1, ...properties2]);

      return intersection.size / union.size;
    } catch (error) {
      console.error("Error calculating metadata similarity:", error);
      return 0;
    }
  }

  // Adjust weights based on user preferences
  adjustWeights(preferences) {
    const weights = { ...this.weightFactors };

    if (preferences) {
      Object.keys(preferences).forEach((pref) => {
        if (weights[pref] !== undefined) {
          weights[pref] = preferences[pref];
        }
      });
    }

    // Normalize weights
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    Object.keys(weights).forEach((key) => {
      weights[key] = weights[key] / total;
    });

    return weights;
  }

  // Get recommendations based on track sequence and preferences
  async getRecommendations(trackIds, preferences = {}) {
    try {
      // Get details for all tracks in the sequence
      const trackDetails = await Promise.all(
        trackIds.map((id) => apiService.getSpotifyTrackDetails(id))
      );

      // Get potential recommendations
      const recommendations = await apiService.getRecommendations(
        trackIds,
        preferences
      );

      // Calculate similarity scores for each recommendation
      const scoredRecommendations = await Promise.all(
        recommendations.map(async (track) => {
          const scores = await Promise.all(
            trackDetails.map((seedTrack) =>
              this.calculateSimilarityScore(seedTrack, track, preferences)
            )
          );

          // Use the highest similarity score
          const maxScore = Math.max(...scores);

          return {
            ...track,
            similarityScore: maxScore,
          };
        })
      );

      // Sort by similarity score and return top recommendations
      return scoredRecommendations
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 10);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      throw error;
    }
  }
}

export default new RecommendationService();
