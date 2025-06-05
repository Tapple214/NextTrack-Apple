import { MusicBrainzApi } from "musicbrainz-api";

const mbApi = new MusicBrainzApi({
  appName: "NextTrack-Apple",
  appVersion: "1.0.0",
  appContactInfo: "your-email@example.com",
});

async function testMusicBrainz() {
  try {
    // Search for an artist (e.g., Billie Eilish)
    const artistSearch = await mbApi.browse("artist", {
      query: "Billie Eilish",
    });
    console.log("Artist Search Results:", artistSearch);

    // Get detailed artist info using the first result's MBID
    if (artistSearch.artists && artistSearch.artists.length > 0) {
      const artistId = artistSearch.artists[0].id;
      const artistDetails = await mbApi.lookup("artist", artistId, [
        "releases",
      ]);
      console.log("Artist Details:", artistDetails);
    } else {
      console.log("No artist found.");
    }
  } catch (error) {
    console.error("Error fetching data from MusicBrainz:", error);
  }
}

testMusicBrainz();
