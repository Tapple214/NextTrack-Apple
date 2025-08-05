import SpotifyWebApi from "spotify-web-api-node";

class RecommenderAPI {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.REACT_APP_SPOTIFY_CLIENT_ID,
      clientSecret: process.env.REACT_APP_SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.REACT_APP_REDIRECT_URI,
    });
    this.lastFmApiKey = process.env.REACT_APP_LASTFM_API_KEY;
    this.tokenExpirationTime = null;
    this.trackCache = new Map();
  }

  async authenticate() {
    const credentials = btoa(
      `${this.spotifyApi.getClientId()}:${this.spotifyApi.getClientSecret()}`
    );

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok)
      throw new Error(`Authentication failed: ${response.status}`);

    const { access_token, expires_in } = await response.json();
    this.spotifyApi.setAccessToken(access_token);
    this.tokenExpirationTime = Date.now() + (expires_in - 300) * 1000;
  }

  async ensureAuthenticated() {
    if (!this.tokenExpirationTime || Date.now() >= this.tokenExpirationTime) {
      await this.authenticate();
    }
  }

  async getTrackFeatures(trackId) {
    if (this.trackCache.has(trackId)) return this.trackCache.get(trackId);

    await this.ensureAuthenticated();

    const trackData = await this.spotifyApi.getTrack(trackId);
    const trackInfo = {
      id: trackId,
      name: trackData.body.name,
      artists: trackData.body.artists.map((artist) => ({
        name: artist.name,
        id: artist.id,
      })),
    };

    this.trackCache.set(trackId, trackInfo);
    return trackInfo;
  }

  async findSimilarTracks(seedTrackId, searchParams = {}) {
    const {
      limit = 10,
      genres = [],
      decade = "",
      yearRange = { min: "", max: "" },
      popularity = "mixed",
      artistSimilarityWeight = 0.6,
    } = searchParams;

    await this.ensureAuthenticated();

    const seedTrack = await this.getTrackFeatures(seedTrackId);
    const seenTrackIds = new Set([seedTrackId]);
    const recommendations = [];

    // Build search query based on parameters
    let searchQuery = "";
    const queryParts = [];

    // Add genre filters
    if (genres.length > 0) {
      queryParts.push(`genre:${genres.join(" OR genre:")}`);
    }

    // Add decade filter
    if (decade) {
      const decadeYears = this.getDecadeYears(decade);
      if (decadeYears) {
        queryParts.push(`year:${decadeYears.min}-${decadeYears.max}`);
      }
    }

    // Add year range filter
    if (yearRange.min && yearRange.max) {
      queryParts.push(`year:${yearRange.min}-${yearRange.max}`);
    }

    // Add popularity filter
    if (popularity === "mainstream") {
      queryParts.push("tag:popular");
    } else if (popularity === "underground") {
      queryParts.push("tag:indie OR tag:underground");
    }

    // Build final search query
    if (queryParts.length > 0) {
      searchQuery = queryParts.join(" AND ");
    }

    // Get recommendations from similar artists
    for (const artist of seedTrack.artists) {
      const artistQuery = searchQuery
        ? `artist:${artist.name} AND ${searchQuery}`
        : `artist:${artist.name}`;

      const {
        body: {
          tracks: { items },
        },
      } = await this.spotifyApi.searchTracks(artistQuery, {
        limit: Math.min(limit * 3, 50),
        market: "US",
      });

      for (const track of items) {
        if (!seenTrackIds.has(track.id)) {
          const trackFeatures = await this.getTrackFeatures(track.id);
          recommendations.push(trackFeatures);
          seenTrackIds.add(track.id);
          if (recommendations.length >= limit * 2) break;
        }
      }
    }

    // If we need more recommendations, search by genre or general terms
    if (recommendations.length < limit) {
      const fallbackQuery = searchQuery || "year:2020-2024";
      const {
        body: {
          tracks: { items },
        },
      } = await this.spotifyApi.searchTracks(fallbackQuery, {
        limit: (limit - recommendations.length) * 2,
        market: "US",
      });

      for (const track of items) {
        if (!seenTrackIds.has(track.id)) {
          const trackFeatures = await this.getTrackFeatures(track.id);
          recommendations.push(trackFeatures);
          if (recommendations.length >= limit * 2) break;
        }
      }
    }

    return recommendations.slice(0, limit);
  }

  async getSampleTracks(limit = 10) {
    await this.ensureAuthenticated();
    const tracks = [];
    const seenTrackIds = new Set();

    try {
      const lastFmTracks = await this.getLastFmTracks(limit * 2);

      for (const lastFmTrack of lastFmTracks) {
        if (tracks.length >= limit) break;

        const spotifyTrack = await this.findSpotifyTrack(lastFmTrack);
        if (spotifyTrack && !seenTrackIds.has(spotifyTrack.id)) {
          tracks.push(spotifyTrack);
          seenTrackIds.add(spotifyTrack.id);
        }
      }
    } catch {
      return this.getFallbackSampleTracks(limit);
    }

    return tracks;
  }

  async getLastFmTracks(limit = 10) {
    const tracks = [];
    const tags = ["pop", "rock", "hip-hop", "electronic", "jazz"];

    for (const tag of tags) {
      if (tracks.length >= limit) break;

      try {
        const url = `https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&api_key=${
          this.lastFmApiKey
        }&tag=${encodeURIComponent(tag)}&limit=2&format=json`;
        const response = await fetch(url);
        if (!response.ok) continue;

        const data = await response.json();
        const trackList = data.tracks?.track || [];

        for (const track of trackList) {
          if (tracks.length >= limit) break;
          tracks.push({
            title: track.name,
            artist: track.artist?.name || "Unknown Artist",
            mbid: track.mbid || null,
            playcount: track.playcount || 0,
            listeners: track.listeners || 0,
          });
        }
      } catch {
        continue;
      }
    }

    return tracks;
  }

  async findSpotifyTrack(externalTrack) {
    try {
      const trackTitle = externalTrack.title || externalTrack.name;
      const trackArtist = externalTrack.artist;

      const searchStrategies = [
        `track:"${trackTitle}" artist:"${trackArtist}"`,
        `"${trackTitle}" "${trackArtist}"`,
        `track:${trackTitle} artist:${trackArtist}`,
        `${trackTitle} ${trackArtist}`,
      ];

      for (const query of searchStrategies) {
        try {
          const {
            body: {
              tracks: { items },
            },
          } = await this.spotifyApi.searchTracks(query, {
            limit: 1,
            market: "US",
          });

          if (items?.length > 0) {
            const track = items[0];
            return {
              id: track.id,
              name: track.name,
              artists: track.artists.map((a) => ({ name: a.name, id: a.id })),
            };
          }
        } catch {
          continue;
        }
      }
    } catch {
      return null;
    }

    return null;
  }

  async getFallbackSampleTracks(limit = 10) {
    const genres = ["pop", "rock", "hip-hop", "electronic", "jazz"];
    const tracks = [];
    const seenTrackIds = new Set();

    for (const genre of genres) {
      try {
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
      } catch (error) {
        console.warn(`Failed to get tracks for genre ${genre}:`, error);
        continue;
      }
    }

    return tracks;
  }

  // Enhanced fallback method with multiple strategies
  async getGuaranteedRecommendations(
    seedTrackId,
    searchParams = {},
    limit = 10
  ) {
    const strategies = [
      // Strategy 1: Try Last.fm if available
      async () => {
        const lastFmMatch = await this.findLastFmCounterpart(seedTrackId);
        if (lastFmMatch) {
          return await this.findSimilarTracksFromLastFm(
            lastFmMatch,
            seedTrackId,
            searchParams
          );
        }
        return [];
      },

      // Strategy 2: Try Spotify with original parameters
      async () => {
        return await this.findSimilarTracks(seedTrackId, searchParams);
      },

      // Strategy 3: Try broader Spotify search (remove filters)
      async () => {
        const broadParams = { limit: limit * 2 };
        return await this.findSimilarTracks(seedTrackId, broadParams);
      },

      // Strategy 4: Try by artist only
      async () => {
        const seedTrack = await this.getTrackFeatures(seedTrackId);
        const artistName = seedTrack.artists[0]?.name;
        if (artistName) {
          const {
            body: {
              tracks: { items },
            },
          } = await this.spotifyApi.searchTracks(`artist:"${artistName}"`, {
            limit: limit,
            market: "US",
          });
          return items.map((track) => ({
            id: track.id,
            name: track.name,
            artists: track.artists.map((a) => ({ name: a.name, id: a.id })),
          }));
        }
        return [];
      },

      // Strategy 5: Get sample tracks
      async () => {
        return await this.getSampleTracks(limit);
      },

      // Strategy 6: Ultimate fallback
      async () => {
        return await this.getFallbackSampleTracks(limit);
      },
    ];

    for (const strategy of strategies) {
      try {
        const results = await strategy();
        if (results && results.length > 0) {
          return results.slice(0, limit);
        }
      } catch (error) {
        console.warn("Strategy failed:", error);
        continue;
      }
    }

    // If all strategies fail, return empty array
    return [];
  }

  // Helper method to get decade year ranges
  getDecadeYears(decade) {
    const decadeMap = {
      "1950s": { min: 1950, max: 1959 },
      "1960s": { min: 1960, max: 1969 },
      "1970s": { min: 1970, max: 1979 },
      "1980s": { min: 1980, max: 1989 },
      "1990s": { min: 1990, max: 1999 },
      "2000s": { min: 2000, max: 2009 },
      "2010s": { min: 2010, max: 2019 },
      "2020s": { min: 2020, max: 2029 },
    };
    return decadeMap[decade] || null;
  }

  // Helper method to filter tracks by audio features
  async filterByAudioFeatures(tracks, targetFeatures) {
    const { energy, danceability, valence } = targetFeatures;
    const filteredTracks = [];

    for (const track of tracks) {
      try {
        // Get audio features for the track
        const audioFeatures = await this.spotifyApi.getAudioFeaturesForTrack(
          track.id
        );
        const features = audioFeatures.body;

        let matches = true;

        // Check energy
        if (energy !== null) {
          const energyDiff = Math.abs(features.energy - energy);
          if (energyDiff > 0.3) matches = false; // 30% tolerance
        }

        // Check danceability
        if (danceability !== null && matches) {
          const danceabilityDiff = Math.abs(
            features.danceability - danceability
          );
          if (danceabilityDiff > 0.3) matches = false;
        }

        // Check valence
        if (valence !== null && matches) {
          const valenceDiff = Math.abs(features.valence - valence);
          if (valenceDiff > 0.3) matches = false;
        }

        if (matches) {
          filteredTracks.push(track);
        }
      } catch (error) {
        // If we can't get audio features, include the track anyway
        filteredTracks.push(track);
      }
    }

    return filteredTracks;
  }

  async findLastFmCounterpart(spotifyTrackId) {
    try {
      await this.ensureAuthenticated();

      const trackData = await this.spotifyApi.getTrack(spotifyTrackId);
      const { name: trackName } = trackData.body;
      const artistName = trackData.body.artists[0].name;

      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${
          this.lastFmApiKey
        }&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(
          trackName
        )}&format=json`
      );

      if (!response.ok) return null;

      const data = await response.json();
      const track = data.track;

      if (track?.name) {
        return {
          name: track.name,
          artist: track.artist?.name || artistName,
          mbid: track.mbid || null,
          tags: track.toptags?.tag || [],
          playcount: track.playcount || 0,
          listeners: track.listeners || 0,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  async findSimilarTracksFromLastFm(
    lastFmTrack,
    originalSpotifyTrackId,
    searchParams = {}
  ) {
    const {
      limit = 10,
      genres = [],
      decade = "",
      yearRange = { min: "", max: "" },
      popularity = "mixed",
      artistSimilarityWeight = 0.6,
    } = searchParams;
    try {
      const similarTracks = [];
      const seenTrackIds = new Set();

      if (lastFmTrack.name && lastFmTrack.artist) {
        const similarTracksResponse = await this.getLastFmSimilarTracks(
          lastFmTrack.artist,
          lastFmTrack.name,
          limit * 4
        );

        for (const track of similarTracksResponse) {
          const trackId = track.mbid || track.title;
          if (!seenTrackIds.has(trackId)) {
            similarTracks.push({
              ...track,
              collaborativeScore: parseFloat(track.match) || 0.5,
              source: "collaborative",
            });
            seenTrackIds.add(trackId);
          }
        }
      }

      if (lastFmTrack.tags?.length > 0) {
        const tagTracks = await this.getLastFmTracksByTags(
          lastFmTrack.tags,
          limit * 4
        );

        for (const track of tagTracks) {
          const trackId = track.mbid || track.title;
          if (!seenTrackIds.has(trackId)) {
            similarTracks.push({
              ...track,
              collaborativeScore: 0,
              source: "content",
            });
            seenTrackIds.add(trackId);
          }
        }
      }

      const scoredTracks = [];
      for (const track of similarTracks) {
        const contentScore = await this.calculateContentSimilarity(
          lastFmTrack,
          track
        );
        const hybridScore =
          track.collaborativeScore * artistSimilarityWeight +
          contentScore * (1 - artistSimilarityWeight);

        scoredTracks.push({
          ...track,
          contentScore,
          hybridScore,
          tagSimilarity: this.calculateTagSimilarity(
            lastFmTrack.tags || [],
            track.tags || []
          ),
        });
      }

      // Apply genre filtering if specified
      let filteredTracks = scoredTracks;
      if (genres.length > 0) {
        filteredTracks = scoredTracks.filter((track) => {
          const trackTags = track.tags || [];
          return genres.some((genre) =>
            trackTags.some((tag) =>
              (typeof tag === "string" ? tag : tag.name)
                ?.toLowerCase()
                .includes(genre.toLowerCase())
            )
          );
        });
      }

      // Apply decade filtering if specified
      if (decade) {
        const decadeYears = this.getDecadeYears(decade);
        if (decadeYears) {
          filteredTracks = filteredTracks.filter((track) => {
            // This would need track year information from Last.fm
            // For now, we'll skip this filter
            return true;
          });
        }
      }

      // Apply popularity filtering
      if (popularity === "mainstream") {
        filteredTracks = filteredTracks.filter(
          (track) => (track.playcount || 0) > 100000
        );
      } else if (popularity === "underground") {
        filteredTracks = filteredTracks.filter(
          (track) => (track.playcount || 0) < 100000
        );
      }

      const finalTracks = filteredTracks
        .filter((track) => track.hybridScore > 0.1)
        .sort((a, b) => b.hybridScore - a.hybridScore)
        .slice(0, limit * 3);

      const spotifyTracks = [];
      for (const lastFmTrack of finalTracks.slice(0, limit)) {
        const spotifyTrack = await this.findSpotifyTrack(lastFmTrack);
        if (spotifyTrack) {
          Object.assign(spotifyTrack, {
            similarityScore: lastFmTrack.hybridScore,
            contentScore: lastFmTrack.contentScore,
            collaborativeScore: lastFmTrack.collaborativeScore,
            tagSimilarity: lastFmTrack.tagSimilarity,
          });
          spotifyTracks.push(spotifyTrack);
        }
      }

      return spotifyTracks.length > 0
        ? spotifyTracks
        : await this.findSimilarTracks(originalSpotifyTrackId, searchParams);
    } catch {
      return [];
    }
  }

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
    } catch {
      return [];
    }
  }

  calculateTagSimilarity(tags1, tags2) {
    if (!tags1?.length || !tags2?.length) return 0;

    const normalizeTags = (tags) =>
      tags
        .map((tag) => (typeof tag === "string" ? tag : tag.name)?.toLowerCase())
        .filter(Boolean);

    const set1 = new Set(normalizeTags(tags1));
    const set2 = new Set(normalizeTags(tags2));
    const intersection = new Set([...set1].filter((tag) => set2.has(tag)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  async getArtistSimilarity(artist1, artist2) {
    try {
      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=artist.getSimilar&api_key=${
          this.lastFmApiKey
        }&artist=${encodeURIComponent(artist1)}&limit=50&format=json`
      );

      if (!response.ok) return 0;

      const data = await response.json();
      const similarArtists = data.similarartists?.artist || [];
      const match = similarArtists.find(
        (artist) => artist.name?.toLowerCase() === artist2.toLowerCase()
      );

      return match ? parseFloat(match.match) || 0 : 0;
    } catch {
      return 0;
    }
  }

  async calculateContentSimilarity(originalTrack, candidateTrack) {
    let score = 0;
    let factors = 0;

    if (originalTrack.tags && candidateTrack.tags) {
      score +=
        this.calculateTagSimilarity(originalTrack.tags, candidateTrack.tags) *
        0.4;
      factors += 0.4;
    }

    if (originalTrack.artist && candidateTrack.artist) {
      score +=
        (await this.getArtistSimilarity(
          originalTrack.artist,
          candidateTrack.artist
        )) * 0.3;
      factors += 0.3;
    }

    if (originalTrack.playcount && candidateTrack.playcount) {
      const originalPopularity = Math.log10(
        parseInt(originalTrack.playcount) + 1
      );
      const candidatePopularity = Math.log10(
        parseInt(candidateTrack.playcount) + 1
      );
      const popularitySimilarity =
        1 -
        Math.abs(originalPopularity - candidatePopularity) /
          Math.max(originalPopularity, candidatePopularity);
      score += Math.max(0, popularitySimilarity) * 0.2;
      factors += 0.2;
    }

    if (originalTrack.duration && candidateTrack.duration) {
      const durationDiff = Math.abs(
        parseInt(originalTrack.duration) - parseInt(candidateTrack.duration)
      );
      const avgDuration =
        (parseInt(originalTrack.duration) + parseInt(candidateTrack.duration)) /
        2;
      const durationSimilarity = 1 - durationDiff / avgDuration;
      score += Math.max(0, durationSimilarity) * 0.1;
      factors += 0.1;
    }

    return factors > 0 ? score / factors : 0;
  }

  async getLastFmTracksByTags(tags, limit = 10) {
    try {
      const tracks = [];
      for (const tag of tags.slice(0, 3)) {
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
    } catch {
      return [];
    }
  }
}

const recommenderAPI = new RecommenderAPI();
export default recommenderAPI;
