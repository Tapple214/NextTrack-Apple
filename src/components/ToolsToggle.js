import TrackRecommendationForm from "./TrackRecommendationForm.js";
import { Card } from "react-bootstrap";

export default function ToolsToggle({
  activeView,
  currentTrack,
  handleRecommendations,
}) {
  return (
    <div className="d-flex h-100 justify-content-center align-items-center">
      {activeView === "form" ? (
        <TrackRecommendationForm
          handleRecommendations={handleRecommendations}
        />
      ) : (
        <div className="pt-4 mt-4 w-100 d-flex justify-content-center align-items-center">
          {currentTrack ? (
            <>
              <iframe
                src={`https://open.spotify.com/embed/track/${currentTrack.id}`}
                width="90%"
                height="270"
                allowtransparency="true"
                allow="encrypted-media"
                title={`Spotify player for ${currentTrack.name} by ${
                  currentTrack.artists?.map((a) => a.name).join(", ") ||
                  "Unknown Artist"
                }`}
              ></iframe>
            </>
          ) : (
            <Card.Text className="pb-4 mb-4">
              <p className="pb-1">Select a track to play</p>
            </Card.Text>
          )}
        </div>
      )}
    </div>
  );
}
