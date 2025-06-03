import React, { useState } from "react";
import "./App.css";
import Item from "./components/item";

function App() {
  const [trackId, setTrackId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleRecommendationFormSubmit = async () => {
    setError("");
    setResult(null);

    if (!trackId) {
      setError("Please enter a track ID");
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackId }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setResult(data);
      }
    } catch (error: any) {
      setError(error.message || "Network error");
    }
  };

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
            <i className="bi bi-film"></i>
            <i className="bi bi-info-circle-fill"></i>
          </div>
          {/* Preview */}
          <div
            className="bg-secondary flex-grow-1 d-flex justify-content-center align-items-center"
            style={{ height: "80%" }}
          >
            {/* Recommendation Form */}
            <input
              type="text"
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
            />

            <button onClick={handleRecommendationFormSubmit}>Get Rec</button>
            {/* Video Preview */}
            {/* <iframe
              src="https://open.spotify.com/embed/track/07WEDHF2YwVgYuBugi2ECO"
              width="495"
              height="350"
              frameBorder="0"
              allow="encrypted-media"
            ></iframe> */}
            {/* <iframe
              width="495"
              height="350"
              src="https://www.youtube.com/embed/tgbNymZ7vqY?playlist=tgbNymZ7vqY&loop=1"
            ></iframe> */}
          </div>
        </div>
        {/* Recommendation Results */}
        <div className="bg-success flex-grow-1" style={{ maxWidth: "50%" }}>
          {error && <p>{error}</p>}

          {result && (
            <div>
              <h3>Track Info</h3>
              <pre>{JSON.stringify(result.track, null, 2)}</pre>
              <h3>Recs</h3>
              <pre>{JSON.stringify(result.recommendations, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      <div className="d-flex col-6" style={{ height: "50%", width: "100vw" }}>
        {/* Ready-made Track List */}
        <div
          className="bg-danger flex-grow-1 px-3 pt-3"
          style={{ maxWidth: "50%" }}
        >
          <Item title="hello" />
        </div>
        {/*  Custom Track List */}
        <div className="bg-warning flex-grow-1" style={{ maxWidth: "50%" }}>
          5
        </div>
      </div>
    </div>
  );
}

export default App;
