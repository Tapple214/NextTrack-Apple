import Item from "./ItemDisplay.js";

export default function PredefinedTracklist({
  setShow,
  setInfoMessage,
  sampleTracks,
  handlePlayTrack,
}) {
  const showInfo = () => {
    setShow(true);
    setInfoMessage(
      <>
        <h4>Sample Tracks</h4>
        <p>
          Use the current top tracks from spoitfy as your inspiration/to get
          started!
        </p>
      </>
    );
  };

  const renderTrackItem = (track) => (
    <Item
      action="listen"
      key={track.id}
      trackId={track.id}
      title={`https://open.spotify.com/embed/track/${track.id}`}
      onPlayTrack={handlePlayTrack}
      displayTitle={
        <div>
          <b>{track.name}</b>
          <br />
          <p className="m-0" style={{ fontSize: "12px" }}>
            {track.artists?.map((a) => a.name).join(", ") || "Unknown Artist"}
          </p>
        </div>
      }
      metrics={track}
      hideInfoIcon={true}
    />
  );

  return (
    <>
      <div className="d-none d-sm-block sections w-50 overflow-auto mt-2 mb-4 ms-4 me-2 rounded-4">
        <div className="d-flex justify-content-between align-items-center">
          <p className="fw-bold mt-3 ms-3 mb-3">
            Here are some tracks to get you started!
          </p>

          <i
            onClick={showInfo}
            style={{ cursor: "pointer" }}
            className="bi bi-info-circle-fill me-3"
          ></i>
        </div>
        {sampleTracks.map(renderTrackItem)}
      </div>

      <div className="d-sm-none">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="fw-bold my-2">Sample Tracks</h5>
          <i
            onClick={showInfo}
            style={{ cursor: "pointer" }}
            className="bi bi-info-circle-fill"
          ></i>
        </div>
        <div>{sampleTracks.map(renderTrackItem)}</div>
      </div>
    </>
  );
}
