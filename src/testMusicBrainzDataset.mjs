import musicBrainzDataset from "./datasets/musicBrainzDataset.js";

async function testMusicBrainzDataset() {
  try {
    // Test artist search
    console.log("Searching for Billie Eilish...");
    const artists = await musicBrainzDataset.searchArtist("Billie Eilish");
    console.log("Found artists:", artists.length);

    if (artists.length > 0) {
      const artist = artists[0];
      console.log("\nArtist details:", {
        name: artist.name,
        id: artist.id,
        type: artist.type,
        country: artist.country,
      });

      // Test getting artist details
      console.log("\nFetching artist details...");
      const artistDetails = await musicBrainzDataset.getArtistDetails(
        artist.id
      );
      console.log("Artist details fetched successfully");

      // Test getting similar tracks
      console.log("\nFetching similar tracks...");
      const similarTracks = await musicBrainzDataset.getSimilarTracks(
        artist.id,
        3
      );
      console.log(
        "Similar tracks:",
        similarTracks.map((track) => ({
          title: track.title,
          youtubeUrl: musicBrainzDataset.getYouTubeEmbedUrl(
            track.title,
            artist.name
          ),
        }))
      );

      // Test track search
      console.log("\nSearching for 'bad guy'...");
      const tracks = await musicBrainzDataset.searchTrack("bad guy");
      if (tracks.length > 0) {
        const track = tracks[0];
        console.log("Found track:", {
          title: track.title,
          artist: track["artist-credit"]?.[0]?.name,
          youtubeUrl: musicBrainzDataset.getYouTubeEmbedUrl(
            track.title,
            artist.name
          ),
        });
      }
    }
  } catch (error) {
    console.error("Error testing MusicBrainzDataset:", error);
  }
}

testMusicBrainzDataset();
