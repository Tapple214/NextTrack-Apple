import React from "react";
import "./App.css";

function App() {
  return (
    <div
      className="d-flex flex-column"
      style={{ height: "100vh", width: "100vw" }}
    >
      <div className="d-flex col-6" style={{ height: "50%", width: "100vw" }}>
        <div className="d-flex flex-column flex-grow-1">
          <div className="bg-primary flex-grow-1" style={{ height: "10%" }}>
            1
          </div>
          <div className="bg-secondary flex-grow-1" style={{ height: "80%" }}>
            2
          </div>
        </div>
        <div className="bg-success flex-grow-1">3</div>
      </div>

      <div className="d-flex col-6" style={{ height: "50%", width: "100vw" }}>
        <div className="bg-danger flex-grow-1">4</div>
        <div className="bg-warning flex-grow-1">5</div>
      </div>
    </div>
  );
}

export default App;
