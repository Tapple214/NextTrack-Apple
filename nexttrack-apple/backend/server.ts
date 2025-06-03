import http from "http";

const SPOTIFY_CLIENT_ID = "c6d965d704db458abac7673400b7b007";
const SPOTIFY_CLIENT_SECRET = "a91f9fdde7e94d6cbb2e1ef59badac46";

let accessToken = "";
let tokenExpiry = 0;

async function getSpotifyAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const basicAuth = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get access token for spotify");
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000;
  return accessToken;
}

async function getTrackInfo(trackId: string) {
  const token = await getSpotifyAccessToken();
  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("track info", token);
  if (!response.ok) {
    throw new Error("Track not found");
  }
  return response.json();
}

async function getRecommendations(trackId: string) {
  const token = await getSpotifyAccessToken();

  console.log(trackId);
  console.log(
    "Full URL:",
    `https://api.spotify.com/v1/recommendations?seed_tracks=${trackId}&limit=10`
  );

  const response = await fetch(
    `https://api.spotify.com/v1/recommendations?seed_tracks=${trackId}&limit=10`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.log(">>", errorText);
    console.error(
      "Spotify recommendation fetch failed:",
      response.status,
      errorText
    );
    throw new Error("hi Failed to get recommendations");
  }
  console.log("token here recommendation", token);
  return response.json();
}

const server = http.createServer(async (request, response) => {
  //   Handling CORS preflight requests
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return response.end();
  }

  if (request.method === "POST" && request.url === "/recommend") {
    console.log("post recc");
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", async () => {
      try {
        const { trackId } = JSON.parse(body);

        if (!trackId) {
          response.writeHead(400, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          });
          response.end(JSON.stringify({ error: "TrackId is required" }));
        }

        console.log("here my", trackId);

        const track = await getTrackInfo(trackId);
        console.log("track", track);

        const recommendations = await getRecommendations(trackId);
        console.log("rec", recommendations);

        response.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });

        response.end(JSON.stringify({ track, recommendations }));
      } catch (error: any) {
        response.writeHead(500, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        response.end(JSON.stringify({ error: error.message }));
      }
    });
  } else {
    response.writeHead(404);
    response.end();
  }
});

const PORT = 4000;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
