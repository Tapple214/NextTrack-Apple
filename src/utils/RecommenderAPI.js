import SpotifyWebApi from "spotify-web-api-node";

class RecommenderAPI {
  // Initializes Spotify API and sets up cache
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: "c6d965d704db458abac7673400b7b007",
      clientSecret: "a91f9fdde7e94d6cbb2e1ef59badac46",
      redirectUri: "https://localhost:3000",
    });
    this.lastFmApiKey = "0f26d1bcf6447ee11b20b6134cddbd42"; // Replace with your Last.fm API key
    this.tokenExpirationTime = null;
    this.trackCache = new Map();
  }

  // Gets access token using credentials
  async authenticate() {
    // Encodes credentials to base64 for authentication
    const credentials = btoa(
      `${this.spotifyApi.getClientId()}:${this.spotifyApi.getClientSecret()}`
    );

    // Sends request to Spotify API to get access token
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials",
    });

    // Throws error if authentication fails
    if (!response.ok)
      throw new Error(`Authentication failed: ${response.status}`);

    // Sets access token and expiration time
    const { access_token, expires_in } = await response.json();
    this.spotifyApi.setAccessToken(access_token);
    this.tokenExpirationTime = Date.now() + (expires_in - 300) * 1000;
  }

  // Checks if access token is valid, else fetches new token using authenticate()
  async ensureAuthenticated() {
    if (!this.tokenExpirationTime || Date.now() >= this.tokenExpirationTime) {
      await this.authenticate();
    }
  }

  // Gets track features from Spotify API (my external data source); TODO: use audio features instead of track artist
  // TODO: this is not really useful, just keeping it for now
  async getTrackFeatures(trackId) {
    // Checks if track data is cached, else fetches new track data
    if (this.trackCache.has(trackId)) return this.trackCache.get(trackId);

    await this.ensureAuthenticated();

    // Gets track data from Spotify API using trackId
    const trackData = await this.spotifyApi.getTrack(trackId);
    const trackInfo = {
      id: trackId,
      name: trackData.body.name,
      artists: trackData.body.artists.map((artist) => ({
        name: artist.name,
        id: artist.id,
      })),
    };

    // Caches track data
    this.trackCache.set(trackId, trackInfo);
    return trackInfo;
  }

  // Finds similar tracks to seed track; limited to 5 recs for now
  async findSimilarTracks(seedTrackId, limit = 5) {
    await this.ensureAuthenticated();

    // Gets seed track features; TOOD: currently not needed just yet, just keeping it for now
    const seedTrack = await this.getTrackFeatures(seedTrackId);

    // Sets up seen track ids (to avoid duplicates) and recommendations
    const seenTrackIds = new Set([seedTrackId]);
    const recommendations = [];

    // Get tracks by the same artist
    for (const artist of seedTrack.artists) {
      // items = tracks by same artist of seed track
      const {
        body: {
          tracks: { items },
        },
      } = await this.spotifyApi.searchTracks(`artist:${artist.name}`, {
        limit: limit * 2,
        market: "US",
      });

      // Checks items for duplicates, adds to recommendations if not seen
      for (const track of items) {
        if (!seenTrackIds.has(track.id)) {
          recommendations.push(await this.getTrackFeatures(track.id));
          seenTrackIds.add(track.id);
          if (recommendations.length >= limit) return recommendations;
        }
      }
    }

    // Get recent tracks if needed; only done if not enough similar tracks found
    if (recommendations.length < limit) {
      const {
        body: {
          tracks: { items },
        },
      } = await this.spotifyApi.searchTracks("year:2020-2024", {
        limit: (limit - recommendations.length) * 2,
        market: "US",
      });

      for (const track of items) {
        if (!seenTrackIds.has(track.id)) {
          recommendations.push(await this.getTrackFeatures(track.id));
          if (recommendations.length >= limit) break;
        }
      }
    }

    return recommendations.slice(0, limit);
  }

  // Sample tracks/Predefined tracks from Last.fm
  async getSampleTracks(limit = 5) {
    await this.ensureAuthenticated();
    const tracks = [];
    const seenTrackIds = new Set();

    console.log(`Getting sample tracks with limit: ${limit}`);

    try {
      // Get popular tracks from Last.fm using different search criteria
      const lastFmTracks = await this.getLastFmTracks(limit * 2);
      console.log(`Retrieved ${lastFmTracks.length} Last.fm tracks`);

      // Convert Last.fm tracks to Spotify tracks
      for (const lastFmTrack of lastFmTracks) {
        if (tracks.length >= limit) break;

        console.log(
          `Converting Last.fm track to Spotify: ${lastFmTrack.title} by ${lastFmTrack.artist}`
        );
        const spotifyTrack = await this.findSpotifyTrack(lastFmTrack);

        if (spotifyTrack && !seenTrackIds.has(spotifyTrack.id)) {
          tracks.push(spotifyTrack);
          seenTrackIds.add(spotifyTrack.id);
          console.log(
            `Successfully converted: ${spotifyTrack.name} by ${spotifyTrack.artists[0]?.name}`
          );
        } else {
          console.log(
            `Failed to convert or duplicate: ${lastFmTrack.title} by ${lastFmTrack.artist}`
          );
        }
      }
    } catch (error) {
      console.error("Error fetching Last.fm tracks:", error);
      // Fallback to original Spotify genre search if Last.fm fails
      console.log("Falling back to Spotify genre search");
      return this.getFallbackSampleTracks(limit);
    }

    console.log(`Final sample tracks count: ${tracks.length}`);
    return tracks;
  }

  // Get tracks from Last.fm API
  async getLastFmTracks(limit = 10) {
    const tracks = [];

    // Search for popular tracks using different tags
    const tags = ["pop", "rock", "hip-hop", "electronic", "jazz"];

    console.log(`Fetching Last.fm tracks with limit: ${limit}`);

    for (const tag of tags) {
      if (tracks.length >= limit) break;

      try {
        const url = `https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&api_key=${
          this.lastFmApiKey
        }&tag=${encodeURIComponent(tag)}&limit=2&format=json`;

        console.log(`Fetching Last.fm data for tag: ${tag}`);
        const response = await fetch(url);

        if (!response.ok) {
          console.log(`Last.fm API error for tag ${tag}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        console.log(`Last.fm response for tag ${tag}:`, data);

        const trackList = data.tracks?.track || [];
        console.log(`Found ${trackList.length} tracks for tag ${tag}`);

        for (const track of trackList) {
          if (tracks.length >= limit) break;

          // Extract track info from Last.fm
          const trackInfo = {
            title: track.name,
            artist: track.artist?.name || "Unknown Artist",
            mbid: track.mbid || null,
            playcount: track.playcount || 0,
            listeners: track.listeners || 0,
          };

          tracks.push(trackInfo);
          console.log(`Added track: ${trackInfo.title} by ${trackInfo.artist}`);
        }
      } catch (error) {
        console.error(`Error fetching Last.fm data for tag: ${tag}`, error);
        continue;
      }
    }

    console.log(`Total Last.fm tracks collected: ${tracks.length}`);
    return tracks;
  }

  // Find corresponding Spotify track for Last.fm or MusicBrainz track
  async findSpotifyTrack(externalTrack) {
    try {
      // Handle both Last.fm and MusicBrainz track formats
      const trackTitle = externalTrack.title || externalTrack.name;
      const trackArtist = externalTrack.artist;

      // Try multiple search strategies
      const searchStrategies = [
        `track:"${trackTitle}" artist:"${trackArtist}"`,
        `"${trackTitle}" "${trackArtist}"`,
        `track:${trackTitle} artist:${trackArtist}`,
        trackTitle + " " + trackArtist,
      ];

      for (const query of searchStrategies) {
        console.log(`Searching Spotify for: ${query}`);

        try {
          const {
            body: {
              tracks: { items },
            },
          } = await this.spotifyApi.searchTracks(query, {
            limit: 1,
            market: "US",
          });

          console.log(
            `Spotify search results for "${trackTitle}" with query "${query}":`,
            items
          );

          if (items && items.length > 0) {
            const track = items[0];
            const result = {
              id: track.id,
              name: track.name,
              artists: track.artists.map((a) => ({ name: a.name, id: a.id })),
            };
            console.log(`Successfully found Spotify track:`, result);
            return result;
          }
        } catch (searchError) {
          console.log(
            `Search failed for query "${query}":`,
            searchError.message
          );
          continue;
        }
      }

      console.log(
        `No Spotify tracks found for: ${trackTitle} by ${trackArtist} with any search strategy`
      );
    } catch (error) {
      console.error(
        `Error finding Spotify track for: ${
          externalTrack.title || externalTrack.name
        }`,
        error
      );
    }

    return null;
  }

  // Fallback method using original Spotify genre search
  async getFallbackSampleTracks(limit = 5) {
    const genres = ["pop", "rock", "hip-hop", "electronic", "jazz"];
    const tracks = [];
    const seenTrackIds = new Set();

    for (const genre of genres) {
      const {
        body: {
          tracks: { items },
        },
      } = await this.spotifyApi.searchTracks(`genre:${genre}`, {
        limit: 2,
        market: "US",
      });

      for (const track of items) {
        if (!seenTrackIds.has(track.id)) {
          tracks.push({
            id: track.id,
            name: track.name,
            artists: track.artists.map((a) => ({ name: a.name, id: a.id })),
          });
          seenTrackIds.add(track.id);
          if (tracks.length >= limit) return tracks;
        }
      }
    }

    return tracks;
  }

  // Find Last.fm counterpart for a Spotify track
  async findLastFmCounterpart(spotifyTrackId) {
    try {
      await this.ensureAuthenticated();

      // Get track details from Spotify
      const trackData = await this.spotifyApi.getTrack(spotifyTrackId);
      const trackName = trackData.body.name;
      const artistName = trackData.body.artists[0].name;

      // Search Last.fm for track info
      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${
          this.lastFmApiKey
        }&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(
          trackName
        )}&format=json`
      );

      if (!response.ok) {
        console.log("No Last.fm match found");
        return null;
      }

      const data = await response.json();

      if (data.track && data.track.name) {
        console.log("Last.fm match found");
        return {
          name: data.track.name,
          artist: data.track.artist?.name || artistName,
          mbid: data.track.mbid || null,
          tags: data.track.toptags?.tag || [],
          playcount: data.track.playcount || 0,
          listeners: data.track.listeners || 0,
        };
      } else {
        console.log("No Last.fm match found");
        return null;
      }
    } catch (error) {
      console.error("Error finding Last.fm counterpart:", error);
      return null;
    }
  }

  // Find similar tracks using Last.fm features
  async findSimilarTracksFromLastFm(
    lastFmTrack,
    originalSpotifyTrackId,
    limit = 5
  ) {
    try {
      console.log("Finding similar tracks using Last.fm data:", lastFmTrack);
      const similarTracks = [];
      const seenTrackIds = new Set();

      // Strategy 1: Use Last.fm's getSimilar API method
      if (lastFmTrack.name && lastFmTrack.artist) {
        const similarTracksResponse = await this.getLastFmSimilarTracks(
          lastFmTrack.artist,
          lastFmTrack.name,
          limit * 2
        );
        console.log(
          `Found ${similarTracksResponse.length} similar tracks from Last.fm:`,
          similarTracksResponse
        );
        for (const track of similarTracksResponse) {
          if (!seenTrackIds.has(track.mbid || track.title)) {
            similarTracks.push(track);
            seenTrackIds.add(track.mbid || track.title);
            if (similarTracks.length >= limit) break;
          }
        }
      }

      // Strategy 2: Find tracks with similar tags
      if (similarTracks.length < limit && lastFmTrack.tags.length > 0) {
        const tagTracks = await this.getLastFmTracksByTags(
          lastFmTrack.tags,
          limit * 2
        );
        console.log(
          `Found ${tagTracks.length} tracks by similar tags from Last.fm:`,
          tagTracks
        );
        for (const track of tagTracks) {
          if (!seenTrackIds.has(track.mbid || track.title)) {
            similarTracks.push(track);
            seenTrackIds.add(track.mbid || track.title);
            if (similarTracks.length >= limit) break;
          }
        }
      }

      // Log all similar tracks found from Last.fm
      console.log(
        `Total similar tracks found from Last.fm: ${similarTracks.length}`,
        similarTracks
      );

      // Convert Last.fm tracks to Spotify tracks
      const spotifyTracks = [];
      for (const lastFmTrack of similarTracks.slice(0, limit)) {
        console.log(`Converting Last.fm track to Spotify:`, lastFmTrack);
        const spotifyTrack = await this.findSpotifyTrack(lastFmTrack);
        console.log(`Spotify track result:`, spotifyTrack);
        if (spotifyTrack) {
          spotifyTracks.push(spotifyTrack);
        } else {
          console.log(
            `Failed to convert Last.fm track to Spotify:`,
            lastFmTrack
          );
        }
      }

      if (spotifyTracks.length > 0) {
        console.log("found similar tracks from last.fm data");
        console.log(
          `Successfully converted ${spotifyTracks.length} Last.fm tracks to Spotify format:`,
          spotifyTracks
        );
        return spotifyTracks;
      } else {
        console.log(
          "No Last.fm tracks were successfully converted to Spotify format"
        );
        console.log(
          "Falling back to original Spotify-based recommendations..."
        );
        // Fallback to original Spotify recommendations
        return await this.findSimilarTracks(originalSpotifyTrackId, limit);
      }
    } catch (error) {
      console.error("Error finding similar tracks from Last.fm:", error);
      return [];
    }
  }

  // Get Last.fm similar tracks using track.getSimilar API
  async getLastFmSimilarTracks(artist, track, limit = 10) {
    try {
      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=track.getSimilar&api_key=${
          this.lastFmApiKey
        }&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(
          track
        )}&limit=${limit}&format=json`
      );

      if (!response.ok) return [];

      const data = await response.json();
      const similarTracks = data.similartracks?.track || [];

      return similarTracks.map((track) => ({
        title: track.name,
        artist: track.artist?.name || "Unknown Artist",
        mbid: track.mbid || null,
        match: track.match || 0,
      }));
    } catch (error) {
      console.error("Error fetching similar tracks from Last.fm:", error);
      return [];
    }
  }

  // Get Last.fm tracks by tags
  async getLastFmTracksByTags(tags, limit = 10) {
    try {
      const tracks = [];
      for (const tag of tags.slice(0, 3)) {
        // Use first 3 tags
        const tagName = typeof tag === "string" ? tag : tag.name;
        const response = await fetch(
          `https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&api_key=${
            this.lastFmApiKey
          }&tag=${encodeURIComponent(tagName)}&limit=${Math.ceil(
            limit / 3
          )}&format=json`
        );

        if (response.ok) {
          const data = await response.json();
          const trackList = data.tracks?.track || [];
          tracks.push(
            ...trackList.map((track) => ({
              title: track.name,
              artist: track.artist?.name || "Unknown Artist",
              mbid: track.mbid || null,
              playcount: track.playcount || 0,
              listeners: track.listeners || 0,
            }))
          );
        }
      }
      return tracks;
    } catch (error) {
      console.error("Error fetching tracks by tags from Last.fm:", error);
      return [];
    }
  }
}

const recommenderAPI = new RecommenderAPI();
export default recommenderAPI;
