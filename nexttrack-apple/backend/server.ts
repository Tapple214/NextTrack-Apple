import http from 'http';

const SPOTIFY_CLIENT_ID = ;
const SPOTIFY_CLIENT_SECRET = ;

let accessToken = '';
let tokenExpiry = 0;

async function getSpotifyAccessToken() {
    if (accessToken && Date.now() < tokenExpiry) {
        return accessToken;
    }

    const basicAuth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`.toString('base64'));

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    })

    if (!response.ok) {
        throw new Error('Failed to get access token for spotify')
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + data.expires_in * 1000;
    return accessToken;
}

async function getTrackInfo(trackId: string){
    const token = await getSpotifyAccessToken();
    const response = await fetch(`https://api.spotify.com/v1/track/${trackId}`, { 
    headers: { Authorization: `Bearer ${token}`} 
    })
    if (!response.ok) {
        throw new Error('Track not found')
    }
    return response.json();
}

async function getRecommendations(trackId: string) {
    const token = await getSpotifyAccessToken();
    const response = await fetch(
        `https://api.spotify.com/v1/recommendations?seed_tracks=${trackId}&limit=10`,
        {
            headers: {Authorization: 'Bearer ${token}'},
        }
    );
    if(!response.ok){
        throw new Error('Failed to get recommendations')    
    }
    return response.json();
}

const server = http.createServer(async(request, response) =>{
    if(request.method === 'POST' && request.url === '/recommend') {
        let body =''
        request.on('data', (chunk) => (body += chunk));
        request.on('end', async()=> {
            try{
                const {trackId} = JSON.parse(body);

                if(!trackId) {
                    response.writeHead(400, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify({error:'TrackId is required'}))
                }

                const track = await getTrackInfo(trackId)
                const recommendations = await getRecommendations(trackId);
                
                response.writeHead(200, {'Content-Type': 'application/json'})
                response.end(JSON.stringify({track, recommendations}))
            } catch (error : any) {
                response.writeHead(500, {'Content-Type': 'application/json'})
                response.end(JSON.stringify({error : error.message}))
            }
        })
    } else {
        response.writeHead(404)
        response.end()
    }
})