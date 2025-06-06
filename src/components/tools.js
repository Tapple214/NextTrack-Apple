import { Button } from "react-bootstrap";

export default function Tools({ setActiveView, setCurrentTrack }) {
  return (
    <div
      className="bg-success d-flex justify-content-around align-items-center"
      style={{ height: "10%", fontSize: "30px" }}
    >
      {/* Get Recommendations */}
      <Button
        variant="link"
        className="text-white"
        onClick={() => {
          setActiveView("form");
          setCurrentTrack(null);
        }}
        title="Get Recommendations"
      >
        <i className="bi bi-magic"></i>
      </Button>

      {/* Play Track */}
      <Button
        variant="link"
        className="text-white"
        onClick={() => setActiveView("player")}
        title="Play Track"
      >
        <i className="bi bi-film"></i>
      </Button>

      {/* TODO: Onboarding Information */}
      <Button variant="link" className="text-white" title="Information">
        <i className="bi bi-info-circle-fill"></i>
      </Button>
    </div>
  );
}
