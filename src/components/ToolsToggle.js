import TrackRecommendationForm from "./TrackRecommendationForm.js";
import { Card } from "react-bootstrap";

export default function ToolsToggle({
  activeView,
  currentTrack,
  handleRecommendations,
}) {
  return (
    <>
      <div className="h-100 w-100">
        {activeView === "form" ? (
          <div className="form-scrollable-container">
            <TrackRecommendationForm
              handleRecommendations={handleRecommendations}
            />
          </div>
        ) : (
          <div className="pt-4 mt-md-3 w-100 h-100 pb-3 d-flex justify-content-center align-items-center">
            {currentTrack ? (
              <>
                <iframe
                  src={`https://open.spotify.com/embed/track/${currentTrack.id}`}
                  width="95%"
                  height="360"
                  allowtransparency="true"
                  allow="encrypted-media"
                  title={`Spotify player for ${currentTrack.name} by ${
                    currentTrack.artists?.map((a) => a.name).join(", ") ||
                    "Unknown Artist"
                  }`}
                  style={{ border: "none" }}
                ></iframe>
              </>
            ) : (
              <Card.Text className="pb-4 mb-4 mb-0">
                Select a track to play
              </Card.Text>
            )}
          </div>
        )}
      </div>
    </>
  );
}
