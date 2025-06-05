import { Button } from "react-bootstrap";

export default function Tools({ setActiveView, setCurrentTrack }) {
  return (
    <div
      className="bg-primary d-flex justify-content-around align-items-center"
      style={{ height: "10%", fontSize: "30px" }}
    >
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
      <Button
        variant="link"
        className="text-white"
        onClick={() => setActiveView("player")}
        title="Play Track"
      >
        <i className="bi bi-film"></i>
      </Button>
      <Button variant="link" className="text-white" title="Information">
        <i className="bi bi-info-circle-fill"></i>
      </Button>
    </div>
  );
}
