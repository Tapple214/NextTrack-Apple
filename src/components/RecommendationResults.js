import Item from "./ItemDisplay.js";
import RecommendationInfo from "./RecommendationInfo.js";

// Format artist name for display
const formatArtistName = (artists) =>
  artists?.map((a) => a.name).join(", ") || "Unknown Artist";

// Format recommendation system name
const formatRecommendationType = (type) => {
  switch (type) {
    case "hybrid":
      return "Hybrid System";
    case "content":
      return "Content-Based Filtering";
    case "collaborative":
      return "Collaborative Filtering";
    case "original":
      return "Artist-Based";
    default:
      return "Recommendations";
  }
};

// Format score for display
const formatScore = (track, type) => {
  if (type === "content" && track.similarity) {
    return `Similarity: ${(track.similarity * 100).toFixed(1)}%`;
  }
  if (type === "collaborative" && track.collaborativeScore) {
    return `Score: ${(track.collaborativeScore * 100).toFixed(1)}%`;
  }
  if (type === "hybrid" && track.hybridScore) {
    return `Hybrid Score: ${(track.hybridScore * 100).toFixed(1)}%`;
  }
  return null;
};

export default function RecommendationResults({
  trackInfo,
  recommendations,
  recommendationType = "original",
  handlePlayTrack,
}) {
  if (!trackInfo) {
    return (
      <div className="h-100 d-flex justify-content-center align-items-center text-center">
        Your results will show up here once you get your song recommendations!
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 p-2 rounded ps-3 pt-3">
        <strong>Added Track:</strong>
        <div>
          {trackInfo.name} by {formatArtistName(trackInfo.artists)}
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="recommendations">
          <RecommendationInfo recommendationType={recommendationType} />
          <div className="d-flex justify-content-between align-items-center ps-3 mb-2">
            <p className="fw-bold mb-0">
              {formatRecommendationType(recommendationType)}:
            </p>
            {recommendationType !== "original" && (
              <small className="text-muted">
                {recommendationType === "content" &&
                  "Based on audio features similarity"}
                {recommendationType === "collaborative" &&
                  "Based on user behavior patterns"}
                {recommendationType === "hybrid" &&
                  "Combines content and collaborative filtering"}
              </small>
            )}
          </div>
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
                    {formatScore(track, recommendationType) && (
                      <p
                        className="m-0"
                        style={{ fontSize: "11px", color: "#1db954" }}
                      >
                        {formatScore(track, recommendationType)}
                      </p>
                    )}
                    {track.reason && (
                      <p
                        className="m-0"
                        style={{ fontSize: "10px", color: "#666" }}
                      >
                        {track.reason}
                      </p>
                    )}
                  </div>
                }
                metrics={track}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
