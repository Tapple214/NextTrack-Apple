import React from "react";

function TrackDisplay({ track, recommendations }) {
  return (
    <div className="p-3">
      <h2>Current Track</h2>
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">{track.name}</h5>
          <p className="card-text">{track.artist}</p>
        </div>
      </div>

      <h3>Recommendations</h3>
      <div className="list-group">
        {recommendations.map((rec) => (
          <div key={rec.id} className="list-group-item">
            <h5>{rec.name}</h5>
            <p className="mb-0">{rec.artist}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrackDisplay;
