import React from "react";

interface Track {
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  external_urls: {
    spotify: string;
  };
}

interface TrackDisplayProps {
  track: Track;
  recommendations: {
    tracks: Track[];
  };
}

export default function TrackDisplay({
  track,
  recommendations,
}: TrackDisplayProps) {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="mb-3">Current Track</h2>
        <div className="d-flex align-items-center">
          <img
            src={track.album.images[0]?.url}
            alt={track.album.name}
            style={{ width: "150px", height: "150px", objectFit: "cover" }}
            className="me-3"
          />
          <div>
            <h3>{track.name}</h3>
            <p className="text-muted">
              {track.artists.map((artist) => artist.name).join(", ")}
            </p>
            <p>Album: {track.album.name}</p>
            <a
              href={track.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Open in Spotify
            </a>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3">Recommended Tracks</h2>
        <div className="row">
          {recommendations.tracks.map((recTrack, index) => (
            <div key={index} className="col-md-6 mb-3">
              <div className="card">
                <img
                  src={recTrack.album.images[0]?.url}
                  alt={recTrack.album.name}
                  className="card-img-top"
                  style={{ height: "200px", objectFit: "cover" }}
                />
                <div className="card-body">
                  <h5 className="card-title">{recTrack.name}</h5>
                  <p className="card-text text-muted">
                    {recTrack.artists.map((artist) => artist.name).join(", ")}
                  </p>
                  <a
                    href={recTrack.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary"
                  >
                    Play in Spotify
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
