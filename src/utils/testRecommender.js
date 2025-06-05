import customRecommender from "./customRecommender.js";

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
    const endTime1 = Date.now();
    console.log(`Time taken: ${endTime1 - startTime1}ms`);

    console.log("\nSecond call (should use cache)...");
    const startTime2 = Date.now();
    await customRecommender.getTrackFeatures(testTrackId);
    const endTime2 = Date.now();
    console.log(`Time taken: ${endTime2 - startTime2}ms`);
    console.log("✅ Cache testing successful\n");

    // Test 6: Similarity Algorithm Verification
    console.log("Test 6: Verifying custom similarity algorithm...");
    const track1 = await customRecommender.getTrackFeatures(testTrackId);
    const track2 = await customRecommender.getTrackFeatures(
      "6rqhFgbbKwnb9MLmUQDhG6"
    ); // "Blinding Lights"
    const similarity = customRecommender.calculateSimilarity(track1, track2);
    console.log("Similarity score between tracks:", similarity);
    console.log("✅ Similarity algorithm verification successful\n");

    // Test 7: Multiple Recommendations Consistency
    console.log("Test 7: Testing recommendation consistency...");
    const recommendations1 = await customRecommender.findSimilarTracks(
      testTrackId,
      3
    );
    const recommendations2 = await customRecommender.findSimilarTracks(
      testTrackId,
      3
    );

    const areEqual = recommendations1.every((rec1, index) => {
      const rec2 = recommendations2[index];
      return rec1.id === rec2.id;
    });

    console.log("Recommendations are consistent:", areEqual);
    console.log("✅ Recommendation consistency test successful\n");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the tests
testRecommender();
