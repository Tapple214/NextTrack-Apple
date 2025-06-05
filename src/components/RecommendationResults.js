import Item from "./item.js";

export default function RecommendationResults({
  trackInfo,
  recommendations,
  handlePlayTrack,
}) {
  return (
    <>
      {" "}
      {trackInfo && (
        <div className="mb-4 bg-light p-1">
          <strong>Added Track:</strong>
          <div>
            {trackInfo.name} by{" "}
            {trackInfo.artists?.map((a) => a.name).join(", ") ||
              "Unknown Artist"}
          </div>
        </div>
      )}
      {recommendations.length > 0 && (
        <div className="recommendations">
          <h3>Similar Tracks:</h3>
          <div className="recommendation-list">
            {recommendations.map((track) => (
              <Item
                key={track.id}
                title={`https://open.spotify.com/embed/track/${track.id}`}
                onPlayTrack={handlePlayTrack}
                displayTitle={`${track.name} - ${
                  track.artists?.map((a) => a.name).join(", ") ||
                  "Unknown Artist"
                }`}
                metrics={track}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
