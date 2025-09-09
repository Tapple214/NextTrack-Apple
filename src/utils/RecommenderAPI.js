import SpotifyWebApi from "spotify-web-api-node";

class RecommenderAPI {
  // Initializes Spotify API and sets up cache
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: "c6d965d704db458abac7673400b7b007",
      clientSecret: "a91f9fdde7e94d6cbb2e1ef59badac46",
      redirectUri: "https://localhost:3000",
    });
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

  // Sample tracks/Predefined tracks from MusicBrainz
  async getSampleTracks(limit = 5) {
    await this.ensureAuthenticated();
    const tracks = [];
    const seenTrackIds = new Set();

    try {
      // Get popular tracks from MusicBrainz using different search criteria
      const musicBrainzTracks = await this.getMusicBrainzTracks(limit * 2);

      // Convert MusicBrainz tracks to Spotify tracks
      for (const mbTrack of musicBrainzTracks) {
        if (tracks.length >= limit) break;

        const spotifyTrack = await this.findSpotifyTrack(mbTrack);
        if (spotifyTrack && !seenTrackIds.has(spotifyTrack.id)) {
          tracks.push(spotifyTrack);
          seenTrackIds.add(spotifyTrack.id);
        }
      }
    } catch (error) {
      console.error("Error fetching MusicBrainz tracks:", error);
      // Fallback to original Spotify genre search if MusicBrainz fails
      return this.getFallbackSampleTracks(limit);
    }

    return tracks;
  }

  // Get tracks from MusicBrainz API
  async getMusicBrainzTracks(limit = 10) {
    const tracks = [];

    // Search for popular tracks using different criteria
    const searchQueries = [
      "tag:pop",
      "tag:rock",
      "tag:hip-hop",
      "tag:electronic",
      "tag:jazz",
    ];

    for (const query of searchQueries) {
      if (tracks.length >= limit) break;

      try {
        const response = await fetch(
          `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(
            query
          )}&fmt=json&limit=2`,
          {
            headers: {
              "User-Agent":
                "NextTrack-Apple/1.0 (https://github.com/your-repo)",
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        const recordings = data.recordings || [];

        for (const recording of recordings) {
          if (tracks.length >= limit) break;

          // Extract track info from MusicBrainz
          const trackInfo = {
            title: recording.title,
            artist: recording["artist-credit"]?.[0]?.name || "Unknown Artist",
            mbid: recording.id,
          };

          tracks.push(trackInfo);
        }
      } catch (error) {
        console.error(
          `Error fetching MusicBrainz data for query: ${query}`,
          error
        );
        continue;
      }
    }

    return tracks;
  }

  // Find corresponding Spotify track for MusicBrainz track
  async findSpotifyTrack(mbTrack) {
    try {
      // Try multiple search strategies
      const searchStrategies = [
        `track:"${mbTrack.title}" artist:"${mbTrack.artist}"`,
        `"${mbTrack.title}" "${mbTrack.artist}"`,
        `track:${mbTrack.title} artist:${mbTrack.artist}`,
        mbTrack.title + " " + mbTrack.artist,
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
            `Spotify search results for "${mbTrack.title}" with query "${query}":`,
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
        `No Spotify tracks found for: ${mbTrack.title} by ${mbTrack.artist} with any search strategy`
      );
    } catch (error) {
      console.error(`Error finding Spotify track for: ${mbTrack.title}`, error);
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

  // Find MusicBrainz counterpart for a Spotify track
  async findMusicBrainzCounterpart(spotifyTrackId) {
    try {
      await this.ensureAuthenticated();

      // Get track details from Spotify
      const trackData = await this.spotifyApi.getTrack(spotifyTrackId);
      const trackName = trackData.body.name;
      const artistName = trackData.body.artists[0].name;

      // Search MusicBrainz for matching recording with tags and relations
      const query = `recording:"${trackName}" AND artist:"${artistName}"`;
      const response = await fetch(
        `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(
          query
        )}&fmt=json&limit=1&inc=tags+genres+artist-rels`,
        {
          headers: {
            "User-Agent": "NextTrack-Apple/1.0 (https://github.com/your-repo)",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        console.log("No MusicBrainz match found");
        return null;
      }

      const data = await response.json();
      const recordings = data.recordings || [];

      if (recordings.length > 0) {
        const recording = recordings[0];
        console.log("match");
        return {
          mbid: recording.id,
          title: recording.title,
          artist: recording["artist-credit"]?.[0]?.name || "Unknown Artist",
          release: recording.releases?.[0]?.title || "Unknown Release",
          tags: recording.tags || [],
          genres: recording.genres || [],
          artistId: recording["artist-credit"]?.[0]?.artist?.id || null,
        };
      } else {
        console.log("No MusicBrainz match found");
        return null;
      }
    } catch (error) {
      console.error("Error finding MusicBrainz counterpart:", error);
      return null;
    }
  }

  // Find similar tracks using MusicBrainz features
  async findSimilarTracksFromMusicBrainz(
    mbTrack,
    originalSpotifyTrackId,
    limit = 5
  ) {
    try {
      console.log("Finding similar tracks using MusicBrainz data:", mbTrack);
      const similarTracks = [];
      const seenTrackIds = new Set();

      // Strategy 1: Find tracks by same artist
      if (mbTrack.artistId) {
        const artistTracks = await this.getMusicBrainzTracksByArtist(
          mbTrack.artistId,
          limit * 2
        );
        console.log(
          `Found ${artistTracks.length} tracks by same artist from MusicBrainz:`,
          artistTracks
        );
        for (const track of artistTracks) {
          if (!seenTrackIds.has(track.mbid)) {
            similarTracks.push(track);
            seenTrackIds.add(track.mbid);
            if (similarTracks.length >= limit) break;
          }
        }
      }

      // Strategy 2: Find tracks with similar tags/genres
      if (similarTracks.length < limit && mbTrack.tags.length > 0) {
        const tagTracks = await this.getMusicBrainzTracksByTags(
          mbTrack.tags,
          limit * 2
        );
        console.log(
          `Found ${tagTracks.length} tracks by similar tags from MusicBrainz:`,
          tagTracks
        );
        for (const track of tagTracks) {
          if (!seenTrackIds.has(track.mbid)) {
            similarTracks.push(track);
            seenTrackIds.add(track.mbid);
            if (similarTracks.length >= limit) break;
          }
        }
      }

      // Strategy 3: Find tracks from same release
      if (similarTracks.length < limit && mbTrack.release) {
        const releaseTracks = await this.getMusicBrainzTracksByRelease(
          mbTrack.release,
          limit * 2
        );
        console.log(
          `Found ${releaseTracks.length} tracks from same release from MusicBrainz:`,
          releaseTracks
        );
        for (const track of releaseTracks) {
          if (!seenTrackIds.has(track.mbid)) {
            similarTracks.push(track);
            seenTrackIds.add(track.mbid);
            if (similarTracks.length >= limit) break;
          }
        }
      }

      // Log all similar tracks found from MusicBrainz
      console.log(
        `Total similar tracks found from MusicBrainz: ${similarTracks.length}`,
        similarTracks
      );

      // Convert MusicBrainz tracks to Spotify tracks
      const spotifyTracks = [];
      for (const mbTrack of similarTracks.slice(0, limit)) {
        console.log(`Converting MusicBrainz track to Spotify:`, mbTrack);
        const spotifyTrack = await this.findSpotifyTrack(mbTrack);
        console.log(`Spotify track result:`, spotifyTrack);
        if (spotifyTrack) {
          spotifyTracks.push(spotifyTrack);
        } else {
          console.log(
            `Failed to convert MusicBrainz track to Spotify:`,
            mbTrack
          );
        }
      }

      if (spotifyTracks.length > 0) {
        console.log("found similar tracks from musicbrainz data");
        console.log(
          `Successfully converted ${spotifyTracks.length} MusicBrainz tracks to Spotify format:`,
          spotifyTracks
        );
        return spotifyTracks;
      } else {
        console.log(
          "No MusicBrainz tracks were successfully converted to Spotify format"
        );
        console.log(
          "Falling back to original Spotify-based recommendations..."
        );
        // Fallback to original Spotify recommendations
        return await this.findSimilarTracks(originalSpotifyTrackId, limit);
      }
    } catch (error) {
      console.error("Error finding similar tracks from MusicBrainz:", error);
      return [];
    }
  }

  // Get MusicBrainz tracks by artist
  async getMusicBrainzTracksByArtist(artistId, limit = 10) {
    try {
      const response = await fetch(
        `https://musicbrainz.org/ws/2/recording?artist=${artistId}&fmt=json&limit=${limit}`,
        {
          headers: {
            "User-Agent": "NextTrack-Apple/1.0 (https://github.com/your-repo)",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      return (data.recordings || []).map((recording) => ({
        mbid: recording.id,
        title: recording.title,
        artist: recording["artist-credit"]?.[0]?.name || "Unknown Artist",
        release: recording.releases?.[0]?.title || "Unknown Release",
      }));
    } catch (error) {
      console.error("Error fetching tracks by artist:", error);
      return [];
    }
  }

  // Get MusicBrainz tracks by tags
  async getMusicBrainzTracksByTags(tags, limit = 10) {
    try {
      const tracks = [];
      for (const tag of tags.slice(0, 3)) {
        // Use first 3 tags
        const response = await fetch(
          `https://musicbrainz.org/ws/2/recording?tag:${encodeURIComponent(
            tag.name
          )}&fmt=json&limit=${Math.ceil(limit / 3)}`,
          {
            headers: {
              "User-Agent":
                "NextTrack-Apple/1.0 (https://github.com/your-repo)",
              Accept: "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const recordings = data.recordings || [];
          tracks.push(
            ...recordings.map((recording) => ({
              mbid: recording.id,
              title: recording.title,
              artist: recording["artist-credit"]?.[0]?.name || "Unknown Artist",
              release: recording.releases?.[0]?.title || "Unknown Release",
            }))
          );
        }
      }
      return tracks;
    } catch (error) {
      console.error("Error fetching tracks by tags:", error);
      return [];
    }
  }

  // Get MusicBrainz tracks by release
  async getMusicBrainzTracksByRelease(releaseTitle, limit = 10) {
    try {
      const response = await fetch(
        `https://musicbrainz.org/ws/2/recording?release:"${encodeURIComponent(
          releaseTitle
        )}"&fmt=json&limit=${limit}`,
        {
          headers: {
            "User-Agent": "NextTrack-Apple/1.0 (https://github.com/your-repo)",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      return (data.recordings || []).map((recording) => ({
        mbid: recording.id,
        title: recording.title,
        artist: recording["artist-credit"]?.[0]?.name || "Unknown Artist",
        release: recording.releases?.[0]?.title || "Unknown Release",
      }));
    } catch (error) {
      console.error("Error fetching tracks by release:", error);
      return [];
    }
  }
}

export default new RecommenderAPI();
