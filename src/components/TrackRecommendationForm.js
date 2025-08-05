import React, { useState } from "react";
import { Form, Button, Alert, Row, Col } from "react-bootstrap";
import recommenderAPI from "../utils/RecommenderAPI.js";

const TrackRecommendationForm = ({ handleRecommendations }) => {
  const [trackUrl, setTrackUrl] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // New form state for additional parameters
  const [formData, setFormData] = useState({
    genre: "",
    decade: "",
    yearRange: { min: "", max: "" },
    popularity: "mixed", // "mainstream", "underground", "mixed"
    artistSimilarityWeight: 0.6,
  });

  // Extract track ID from Spotify track URL
  const extractTrackId = (url) => {
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    if (!match) throw new Error("Invalid Spotify track URL");
    return match[1];
  };

  // Handle form data changes
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle genre selection
  const handleGenreChange = (genre) => {
    setFormData((prev) => ({
      ...prev,
      genre: genre,
    }));
  };

  // Available genres for selection
  const availableGenres = [
    "pop",
    "rock",
    "hip-hop",
    "electronic",
    "jazz",
    "classical",
    "country",
    "folk",
    "blues",
    "reggae",
    "funk",
    "soul",
    "indie",
    "alternative",
    "punk",
    "metal",
    "r&b",
    "disco",
  ];

  // Available decades
  const decades = [
    { value: "", label: "Any Decade" },
    { value: "1950s", label: "1950s" },
    { value: "1960s", label: "1960s" },
    { value: "1970s", label: "1970s" },
    { value: "1980s", label: "1980s" },
    { value: "1990s", label: "1990s" },
    { value: "2000s", label: "2000s" },
    { value: "2010s", label: "2010s" },
    { value: "2020s", label: "2020s" },
  ];

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Checks if track URL is valid
      const trackId = extractTrackId(trackUrl);

      // Prepare search parameters
      const searchParams = {
        limit: 10, // Fixed limit since Last.fm doesn't support custom limits
        genres: formData.genre ? [formData.genre] : [],
        decade: formData.decade,
        yearRange: formData.yearRange,
        popularity: formData.popularity,
        artistSimilarityWeight: formData.artistSimilarityWeight,
      };

      // Get guaranteed recommendations using multiple fallback strategies
      let recommendations = [];
      let seedTrack = null;

      try {
        // Get seed track info first
        seedTrack = await recommenderAPI.getTrackFeatures(trackId);

        // Get recommendations with guaranteed fallbacks
        recommendations = await recommenderAPI.getGuaranteedRecommendations(
          trackId,
          searchParams,
          10
        );

        // If still no recommendations, try one more time with broader search
        if (recommendations.length === 0) {
          const broadParams = { limit: 10 };
          recommendations = await recommenderAPI.getGuaranteedRecommendations(
            trackId,
            broadParams,
            10
          );
        }
      } catch (apiError) {
        console.warn("API error, using fallback recommendations:", apiError);

        // Final fallback: try to get any recommendations
        try {
          recommendations = await recommenderAPI.getSampleTracks(10);
        } catch {
          recommendations = await recommenderAPI.getFallbackSampleTracks(10);
        }
      }

      // Ensure we always have a seed track
      if (!seedTrack) {
        try {
          seedTrack = await recommenderAPI.getTrackFeatures(trackId);
        } catch {
          // If we can't get the original track, use the first recommendation as seed
          seedTrack = recommendations[0] || {
            id: trackId,
            name: "Selected Track",
            artists: [{ name: "Unknown Artist", id: "unknown" }],
          };
        }
      }

      // Pass recommendations and seed track to parent component
      handleRecommendations(recommendations, seedTrack);
    } catch (err) {
      setError(err.message || "Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-3">
      <Form onSubmit={handleSubmit}>
        {/* Basic Track Input */}
        <Form.Group className="mb-3">
          <Form.Label>Spotify Track URL</Form.Label>
          <Form.Control
            type="text"
            value={trackUrl}
            onChange={(e) => setTrackUrl(e.target.value)}
            placeholder="Enter your Spotify track URL"
            required
          />
        </Form.Group>

        {/* Search Parameters */}
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Decade</Form.Label>
              <Form.Select
                value={formData.decade}
                onChange={(e) => handleFormChange("decade", e.target.value)}
              >
                {decades.map((decade) => (
                  <option key={decade.value} value={decade.value}>
                    {decade.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Popularity Level</Form.Label>
              <Form.Select
                value={formData.popularity}
                onChange={(e) => handleFormChange("popularity", e.target.value)}
              >
                <option value="mixed">Mixed</option>
                <option value="mainstream">Mainstream</option>
                <option value="underground">Underground</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {/* Genre Selection */}

        <Form.Group className="mt-2">
          <Form.Label>Select Genre (Optional)</Form.Label>
          <Form.Select
            value={formData.genre}
            onChange={(e) => handleGenreChange(e.target.value)}
          >
            <option value="">Any Genre</option>
            {availableGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre.charAt(0).toUpperCase() + genre.slice(1)}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        {/* Advanced Settings */}

        <Form.Group className="my-3">
          <Form.Label>
            Artist Similarity Weight:{" "}
            {Math.round(formData.artistSimilarityWeight * 100)}%
          </Form.Label>
          <Form.Range
            min="0"
            max="1"
            step="0.1"
            value={formData.artistSimilarityWeight}
            onChange={(e) =>
              handleFormChange(
                "artistSimilarityWeight",
                parseFloat(e.target.value)
              )
            }
          />
          <Form.Text className="text-muted">
            Higher values prioritize similar artists, lower values focus on
            other musical features
          </Form.Text>
        </Form.Group>

        {/* Submit button */}
        <Button type="submit" disabled={loading} className="w-100 py-3">
          {loading ? "Loading..." : "Get Recommendations"}
        </Button>
      </Form>

      {/* Error message */}
      {error && (
        <Alert variant="danger" className="mt-3">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <hr />
          <p className="mb-0">
            Please enter a valid Spotify track URL (e.g.,
            https://open.spotify.com/track/...)
          </p>
        </Alert>
      )}
    </div>
  );
};

export default TrackRecommendationForm;
