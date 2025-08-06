import Item from "./ItemDisplay.js";

// Format artist name for display
const formatArtistName = (artists) =>
  artists?.map((a) => a.name).join(", ") || "Unknown Artist";

export default function RecommendationResults({
  trackInfo,
  recommendations,
  handlePlayTrack,
}) {
  if (!trackInfo) {
    return (
      <div className="sections w-50 overflow-auto mt-4 mb-2 ms-2 me-4 rounded-4">
        Your results will show up here once you get your song recommendations!
      </div>
    );
  }

  return (
    <div className="sections w-50 overflow-auto mt-4 mb-2 ms-2 me-4 rounded-4">
      <div className="mb-3 p-2 rounded ps-3 pt-3">
        <strong>Added Track:</strong>
        <div>
          {trackInfo.name} by {formatArtistName(trackInfo.artists)}
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="recommendations">
          <p className="fw-bold ps-3">Similar Tracks:</p>
          <div className="recommendation-list">
            {recommendations.map((track) => (
              <Item
                action="listen"
                key={track.id}
                trackId={track.id}
                title={`https://open.spotify.com/embed/track/${track.id}`}
                onPlayTrack={handlePlayTrack}
                displayTitle={
                  <div>
                    {track.name}
                    <br />
                    <p className="m-0" style={{ fontSize: "12px" }}>
                      {formatArtistName(track.artists)}
                    </p>
                  </div>
                }
                metrics={track}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
