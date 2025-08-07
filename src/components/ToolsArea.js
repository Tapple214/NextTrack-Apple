import { Button } from "react-bootstrap";

export default function ToolsArea({
  setActiveView,
  setCurrentTrack,
  setShow,
  setInfoMessage,
}) {
  return (
    <div className="tools-area-container">
      {/* Desktop Layout */}
      <div
        className="d-none d-sm-flex align-items-center position-absolute w-50 ps-4 fw-bold"
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
          <Button
            onClick={() => {
              setShow(true);
              setInfoMessage(
                <>
                  <h4>Welcome to NextTrack</h4>
                  <p>
                    The NextTrack app is a tool that helps you find the next
                    track to listen to. It uses the Spotify API to get
                    recommendations based on your listening history.
                  </p>
                </>
              );
            }}
            variant="link"
            className="btn me-3"
            id="icon-btn"
            title="Information"
          >
            <i className="bi bi-info-circle-fill"></i>
          </Button>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="d-sm-none mobile-tools-content">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">NextTrack</h3>
          <div className="d-flex gap-2">
            {/* Get Recommendations */}
            <Button
              variant="link"
              className="btn"
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
              className="btn"
              id="icon-btn"
              onClick={() => setActiveView("player")}
              title="Play Track"
            >
              <i className="bi bi-film"></i>
            </Button>
            <Button
              onClick={() => {
                setShow(true);
                setInfoMessage(
                  <>
                    <h4>Welcome to NextTrack</h4>
                    <p>
                      The NextTrack app is a tool that helps you find the next
                      track to listen to. It uses the Spotify API to get
                      recommendations based on your listening history.
                    </p>
                  </>
                );
              }}
              variant="link"
              className="btn"
              id="icon-btn"
              title="Information"
            >
              <i className="bi bi-info-circle-fill"></i>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
