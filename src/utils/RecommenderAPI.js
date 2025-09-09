import SpotifyWebApi from "spotify-web-api-node";

class RecommenderAPI {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: "c6d965d704db458abac7673400b7b007",
      clientSecret: "a91f9fdde7e94d6cbb2e1ef59badac46",
      redirectUri: "https://localhost:3000",
    });
    this.lastFmApiKey = "0f26d1bcf6447ee11b20b6134cddbd42";
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

  async findSimilarTracks(seedTrackId, limit = 10) {
    await this.ensureAuthenticated();

    const seedTrack = await this.getTrackFeatures(seedTrackId);
    const seenTrackIds = new Set([seedTrackId]);
    const recommendations = [];

    for (const artist of seedTrack.artists) {
      const {
        body: {
          tracks: { items },
        },
      } = await this.spotifyApi.searchTracks(`artist:${artist.name}`, {
        limit: limit * 2,
        market: "US",
      });

      for (const track of items) {
        if (!seenTrackIds.has(track.id)) {
          recommendations.push(await this.getTrackFeatures(track.id));
          seenTrackIds.add(track.id);
          if (recommendations.length >= limit) return recommendations;
        }
      }
    }

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
    limit = 10
  ) {
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
        const hybridScore = track.collaborativeScore * 0.6 + contentScore * 0.4;

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

      const filteredTracks = scoredTracks
        .filter((track) => track.hybridScore > 0.1)
        .sort((a, b) => b.hybridScore - a.hybridScore)
        .slice(0, limit * 3);

      const spotifyTracks = [];
      for (const lastFmTrack of filteredTracks.slice(0, limit)) {
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
        : await this.findSimilarTracks(originalSpotifyTrackId, limit);
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
