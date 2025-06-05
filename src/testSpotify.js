const spotifyDataset = require("./utils/spotifyDataset");

async function testArtistSeed() {
  try {
    const artistSearch = await spotifyDataset.makeRequest(
      "/search?q=billie+eilish&type=artist&limit=1"
    );
    const artist = artistSearch.artists.items[0];
    if (!artist) return console.error("Artist not found!");
    const params = new URLSearchParams({ seed_artists: artist.id, limit: "5" });
    const recs = await spotifyDataset.makeRequest(
      `/recommendations?${params.toString()}`
    );
    console.log("\n[Artist Seed Only]");
    recs.tracks.forEach((rec, i) =>
      console.log(
        `${i + 1}. ${rec.name} - ${rec.artists.map((a) => a.name).join(", ")}`
      )
    );
  } catch (e) {
    console.error("[Artist Seed Error]", e);
  }
}

async function testTrackSeed() {
  try {
    const search = await spotifyDataset.makeRequest(
      "/search?q=bad+guy+billie+eilish&type=track&limit=1"
    );
    const track = search.tracks.items[0];
    if (!track) return console.error("Track not found!");
    const params = new URLSearchParams({ seed_tracks: track.id, limit: "5" });
    const recs = await spotifyDataset.makeRequest(
      `/recommendations?${params.toString()}`
    );
    console.log("\n[Track Seed Only]");
    recs.tracks.forEach((rec, i) =>
      console.log(
        `${i + 1}. ${rec.name} - ${rec.artists.map((a) => a.name).join(", ")}`
      )
    );
  } catch (e) {
    console.error("[Track Seed Error]", e);
  }
}

async function testGenreSeed() {
  try {
    const params = new URLSearchParams({ seed_genres: "pop", limit: "5" });
    const recs = await spotifyDataset.makeRequest(
      `/recommendations?${params.toString()}`
    );
    console.log("\n[Genre Seed Only]");
    recs.tracks.forEach((rec, i) =>
      console.log(
        `${i + 1}. ${rec.name} - ${rec.artists.map((a) => a.name).join(", ")}`
      )
    );
  } catch (e) {
    console.error("[Genre Seed Error]", e);
  }
}

async function printValidGenres() {
  try {
    const genres = await spotifyDataset.makeRequest(
      "/recommendations/available-genre-seeds"
    );
    console.log("\n[Valid Genre Seeds]");
    console.log(genres.genres.join(", "));
  } catch (e) {
    console.error("[Genre List Error]", e);
  }
}

async function runAllTests() {
  await printValidGenres();
  await testArtistSeed();
  await testTrackSeed();
  await testGenreSeed();
}

runAllTests();
