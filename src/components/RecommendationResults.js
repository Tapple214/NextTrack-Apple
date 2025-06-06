import Item from "./Item.js";

export default function RecommendationResults({
  trackInfo,
  recommendations,
  handlePlayTrack,
}) {
  return (
    <>
      {trackInfo ? (
        <>
          {trackInfo && (
            <div className="mb-3 bg-light p-2 rounded">
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
              <p className="fw-bold">Similar Tracks:</p>
              <div className="recommendation-list">
                {recommendations.map((track) => (
                  <Item
                    key={track.id}
                    title={`https://open.spotify.com/embed/track/${track.id}`}
                    onPlayTrack={handlePlayTrack}
                    displayTitle={
                      <div>
                        {track.name}
                        <br />
                        <p className="m-0" style={{ fontSize: "12px" }}>
                          {track.artists?.map((a) => a.name).join(", ") ||
                            "Unknown Artist"}
                        </p>
                      </div>
                    }
                    metrics={track}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="h-100 d-flex justify-content-center align-items-center text-center">
          Your results will show up here once you get your song recommendations!
        </div>
      )}
    </>
  );
}
