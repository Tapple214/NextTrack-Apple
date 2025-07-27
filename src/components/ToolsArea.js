import { Button } from "react-bootstrap";

export default function ToolsArea({ setActiveView, setCurrentTrack }) {
  return (
    <div
      className="d-flex align-items-center position-absolute w-50 ps-4 fw-bold"
      style={{ height: "10%" }}
    >
      <p className="ps-4 mb-0 mt-3" style={{ fontSize: "40px" }}>
        NextTrack
      </p>
      <div className="d-flex justify-content-end w-100 pe-3">
        {/* Get Recommendations */}
        <Button
          variant="link"
          className="btn me-3"
          id="icon-btn"
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
          className="btn me-3"
          id="icon-btn"
          onClick={() => setActiveView("player")}
          title="Play Track"
        >
          <i className="bi bi-film"></i>
        </Button>
        {/* TODO: Onboarding Information */}
        <Button
          variant="link"
          className="btn me-3"
          id="icon-btn"
          title="Information"
        >
          <i className="bi bi-info-circle-fill"></i>
        </Button>
      </div>
    </div>
  );
}
