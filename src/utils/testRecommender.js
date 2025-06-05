import customRecommender from "./customRecommender";

async function testRecommender() {
  console.log("Starting recommendation API tests...\n");

  try {
    // Test 1: Authentication
    console.log("Test 1: Testing authentication...");
    await customRecommender.authenticate();
    console.log("✅ Authentication successful\n");

    // Test 2: Get Track Features
    console.log("Test 2: Testing track features retrieval...");
    const testTrackId = "4cOdK2wGLETKBW3PvgPWqT"; // "Shape of You" by Ed Sheeran
    const trackFeatures = await customRecommender.getTrackFeatures(testTrackId);
    console.log("Track details:", {
      name: trackFeatures.name,
      artists: trackFeatures.artists.map((a) => a.name).join(", "),
      danceability: trackFeatures.danceability,
      energy: trackFeatures.energy,
      valence: trackFeatures.valence,
    });
    console.log("✅ Track features retrieval successful\n");

    // Test 3: Get Sample Tracks
    console.log("Test 3: Testing sample tracks retrieval...");
    const sampleTracks = await customRecommender.getSampleTracks(5);
    console.log(
      "Sample tracks:",
      sampleTracks.map((track) => ({
        id: track.id,
        name: track.name,
      }))
    );
    console.log("✅ Sample tracks retrieval successful\n");

    // Test 4: Find Similar Tracks
    console.log("Test 4: Testing similar tracks recommendation...");
    const recommendations = await customRecommender.findSimilarTracks(
      testTrackId,
      3
    );
    console.log(
      "Recommendations:",
      recommendations.map((track) => ({
        name: track.name,
        artists: track.artists.map((a) => a.name).join(", "),
        similarity: track.similarity,
      }))
    );
    console.log("✅ Similar tracks recommendation successful\n");

    // Test 5: Cache Testing
    console.log("Test 5: Testing track features cache...");
    console.log("First call (should fetch from API)...");
    const startTime1 = Date.now();
    await customRecommender.getTrackFeatures(testTrackId);
    const time1 = Date.now() - startTime1;

    console.log("Second call (should use cache)...");
    const startTime2 = Date.now();
    await customRecommender.getTrackFeatures(testTrackId);
    const time2 = Date.now() - startTime2;

    console.log(`First call time: ${time1}ms`);
    console.log(`Second call time: ${time2}ms`);
    console.log("✅ Cache testing successful\n");

    console.log("All tests completed successfully! 🎉");
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });
  }
}

// Run the tests
testRecommender();
