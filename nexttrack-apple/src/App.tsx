import React from "react";
import "./App.css";

function App() {
  return (
    <div
      className="d-flex flex-column"
      style={{ height: "100vh", width: "100vw" }}
    >
      <div className="d-flex col-6" style={{ height: "50%", width: "100vw" }}>
        <div
          className="d-flex flex-column flex-grow-1"
          style={{ maxWidth: "50%" }}
        >
          {/* Tools */}
          <div
            className="bg-primary flex-grow-1 d-flex justify-content-around align-items-center"
            style={{ height: "10%", fontSize: "30px" }}
          >
            <i className="bi bi-magic"></i>
          </div>
          {/* Preview */}
          <div
            className="bg-secondary flex-grow-1 d-flex justify-content-center align-items-center"
            style={{ height: "80%" }}
          >
            <iframe
              width="500"
              height="350"
              src="https://www.youtube.com/embed/tgbNymZ7vqY?playlist=tgbNymZ7vqY&loop=1"
            ></iframe>
          </div>
        </div>
        {/* Recommendation Results */}
        <div className="bg-success flex-grow-1" style={{ maxWidth: "50%" }}>
          3
        </div>
      </div>

      <div className="d-flex col-6" style={{ height: "50%", width: "100vw" }}>
        {/* Ready-made Track List */}
        <div className="bg-danger flex-grow-1" style={{ maxWidth: "50%" }}>
          4
        </div>
        {/*  Custom Track List */}
        <div
          className="bg-warning flex-grow-1"
          style={{ maxWidth: "50%" }}
        ></div>
      </div>
    </div>
  );
}

export default App;
