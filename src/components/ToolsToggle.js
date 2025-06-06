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
        <TrackRecommendationForm handleRecommendations={handleRecommendations} />
      ) : (
        <div className="pt-4 w-100 d-flex justify-content-center align-items-center">
          {currentTrack ? (
            <>
              <iframe
                src={`https://open.spotify.com/embed/track/${currentTrack.id}`}
                width="90%"
                height="380"
                allowtransparency="true"
                allow="encrypted-media"
                title={`Spotify player for ${currentTrack.name} by ${
                  currentTrack.artists?.map((a) => a.name).join(", ") ||
                  "Unknown Artist"
                }`}
              ></iframe>
            </>
          ) : (
            <Card.Text>Select a track to play</Card.Text>
          )}
        </div>
      )}
    </div>
  );
}
