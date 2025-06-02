import React from "react";
import "./App.css";

function App() {
  return (
    <div className="row mx-2" style={{ height: "100vh" }}>
      <div className="row m-0 col-12">
        <div className="bg-primary col-2">1</div>
        <div className="bg-secondary col-5">2</div>
        <div className="bg-success col-5">3</div>
      </div>
      <div className="row m-0">
        <div className="bg-danger col-6">4</div>
        <div className="bg-warning col-6">5</div>
      </div>
    </div>
  );
}

export default App;
