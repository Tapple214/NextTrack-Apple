import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import Item from "./ItemDisplay.js";
import recommenderAPI from "../utils/RecommenderAPI.js";

export default function CreateTrackList({
  setShow,
  setInfoMessage,
  handlePlayTrack,
  uploadedTracks,
  setUploadedTracks,
}) {
  const [trackUrl, setTrackUrl] = useState("");
  const [tracklistName, setTracklistName] = useState("");

  const extractTrackId = (url) => {
    if (!url) return null;

    const patterns = [
      /(?:open\.)?spotify\.com\/track\/([a-zA-Z0-9]+)/,
      /spotify:track:([a-zA-Z0-9]+)/,
      /track\/([a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  };

  const handleAddTrack = async () => {
    if (!trackUrl) return;

    const trackId = extractTrackId(trackUrl);
    if (!trackId) {
      setShow(true);
      setInfoMessage(
        <>
          <h4>Invalid URL</h4>
          <p>
            Please enter a valid Spotify track URL.
            <br />
            <br />
            Valid formats:
            <br />• https://open.spotify.com/track/TRACK_ID
            <br />• https://spotify.com/track/TRACK_ID
            <br />• spotify:track:TRACK_ID
          </p>
        </>
      );
      return;
    }

    try {
      const track = await recommenderAPI.getTrackFeatures(trackId);
      setUploadedTracks((prev) => [track, ...prev]);
      setTrackUrl("");
      setShow(true);
      setInfoMessage(
        <>
          <h4>Track Added</h4>
          <p>Successfully added "{track.name}" to your playlist!</p>
        </>
      );
    } catch (error) {
      console.error("Error adding track:", error);
      setShow(true);
      setInfoMessage(
        <>
          <h4>Error Adding Track</h4>
          <p>{error.message || "Please check the URL and try again."}</p>
        </>
      );
    }
  };

  const handleDeleteTrack = (trackId) => {
    const trackToDelete = uploadedTracks.find((track) => track.id === trackId);
    setUploadedTracks((prev) => prev.filter((track) => track.id !== trackId));
    setShow(true);
    setInfoMessage(
      <>
        <h4>Track Removed</h4>
        <p>
          Successfully removed "{trackToDelete?.name || "track"}" from your
          playlist!
        </p>
      </>
    );
  };

  const handleDownload = () => {
    if (uploadedTracks.length === 0) {
      setShow(true);
      setInfoMessage(
        <>
          <h4>No Tracks to Download</h4>
          <p>Please add some tracks to your playlist before downloading.</p>
        </>
      );
      return;
    }

    if (!tracklistName.trim()) {
      setShow(true);
      setInfoMessage(
        <>
          <h4>Missing Tracklist Name</h4>
          <p>Please enter a name for your tracklist before downloading.</p>
        </>
      );
      return;
    }

    const tracklistData = {
      name: tracklistName,
      tracks: uploadedTracks,
      createdAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(tracklistData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${tracklistName.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShow(true);
    setInfoMessage(
      <>
        <h4>Tracklist Downloaded</h4>
        <p>
          Successfully downloaded "{tracklistName}" with {uploadedTracks.length}{" "}
          tracks!
        </p>
      </>
    );
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setShow(true);
      setInfoMessage(
        <>
          <h4>Invalid File Type</h4>
          <p>Please upload a JSON file!</p>
        </>
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.tracks || !Array.isArray(data.tracks)) {
          setShow(true);
          setInfoMessage(
            <>
              <h4>Invalid File Format</h4>
              <p>Invalid tracklist file format.</p>
            </>
          );
          return;
        }

        setTracklistName(data.name || "");
        setUploadedTracks(data.tracks);
        setShow(true);
        setInfoMessage(
          <>
            <h4>Tracklist Loaded</h4>
            <p>
              Successfully loaded "{data.name || "Untitled"}" with{" "}
              {data.tracks.length} tracks!
            </p>
          </>
        );
      } catch (error) {
        setShow(true);
        setInfoMessage(
          <>
            <h4>Error Reading File</h4>
            <p>Error reading the JSON file.</p>
          </>
        );
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const showInfo = () => {
    setShow(true);
    setInfoMessage(
      <>
        <h4>MakerZone</h4>
        <p>
          Add tracks by pasting Spotify URLs, then download or upload your
          tracklists.
        </p>
      </>
    );
  };

  const renderTrackItem = (track) => (
    <Item
      key={track.id}
      action="create"
      onDeleteTrack={handleDeleteTrack}
      onPlayTrack={handlePlayTrack}
      title={`https://open.spotify.com/embed/track/${track.id}`}
      trackId={track.id}
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
      disableLocalNotifications={true}
    />
  );

  const renderUploadButton = () => (
    <div style={{ position: "relative" }}>
      <input
        type="file"
        accept=".json"
        onChange={handleUpload}
        style={{
          position: "absolute",
          opacity: 0,
          width: "100%",
          height: "100%",
          cursor: "pointer",
          top: 0,
          left: 0,
        }}
      />
      <Button
        id="icon-btn"
        title="Upload tracklist"
        onClick={(e) => {
          e.preventDefault();
          e.target.closest("div").querySelector('input[type="file"]').click();
        }}
      >
        <i className="bi bi-upload"></i>
      </Button>
    </div>
  );

  return (
    <>
      <div
        className="d-none d-sm-block sections w-50 d-flex flex-column mt-2 ms-2 me-4 rounded-4 position-relative overflow-auto"
        style={{ marginBottom: "45px" }}
      >
        <div className="d-flex justify-content-between align-items-center me-3">
          <Form className="w-100 ps-4 pt-2 mt-1 mb-2">
            <Form.Group className="d-flex align-items-center">
              <i className="bi bi-pencil-square"></i>
              <Form.Control
                type="text"
                placeholder="Name your tracklist!"
                className="no-input-outline input custom-placeholder ms-2 bg-transparent border-0"
                style={{ color: "#312c51" }}
                value={tracklistName}
                onChange={(e) => setTracklistName(e.target.value)}
                required
              />
            </Form.Group>
          </Form>

          <i
            onClick={showInfo}
            style={{ cursor: "pointer" }}
            className="bi bi-info-circle-fill"
          ></i>
        </div>

        {uploadedTracks.map(renderTrackItem)}

        <div className="w-100 position-relative h-100 d-flex justify-content-center align-items-end">
          <div
            className="px-3 rounded rounded-2 w-50 position-fixed"
            style={{ bottom: 22 }}
          >
            <div className="d-flex justify-content-center">
              <div className="quick-actions d-flex justify-content-center gap-2 rounded-3">
                <div
                  className="p-1 mx-2 d-flex justify-content-between align-items-center w-100"
                  style={{ color: "#312c51" }}
                >
                  <Form className="w-100 d-flex justify-content-between">
                    <Form.Group>
                      <Form.Control
                        value={trackUrl}
                        onChange={(e) => setTrackUrl(e.target.value)}
                        type="text"
                        placeholder="Paste Spotify track URL here..."
                        className="no-input-outline bg-transparent border-0 text-white"
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleAddTrack()
                        }
                      />
                    </Form.Group>

                    <div className="d-flex">
                      <Button
                        id="icon-btn"
                        onClick={handleAddTrack}
                        title="Add track"
                      >
                        <i className="bi bi-check-lg"></i>
                      </Button>

                      {uploadedTracks.length > 0 ? (
                        <Button
                          id="icon-btn"
                          onClick={handleDownload}
                          title="Download tracklist"
                        >
                          <i className="bi bi-download"></i>
                        </Button>
                      ) : (
                        renderUploadButton()
                      )}
                    </div>
                  </Form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-sm-none mobile-create-content d-flex flex-column h-100">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Form>
            <Form.Group className="d-flex align-items-center">
              <i className="bi bi-pencil-square me-2"></i>
              <Form.Control
                type="text"
                placeholder="Name your tracklist!"
                className="no-input-outline input custom-placeholder bg-transparent border-0"
                style={{ color: "#312c51" }}
                value={tracklistName}
                onChange={(e) => setTracklistName(e.target.value)}
                required
              />
            </Form.Group>
          </Form>
          <i
            onClick={showInfo}
            style={{ cursor: "pointer" }}
            className="bi bi-info-circle-fill"
          ></i>
        </div>

        <div className="mobile-tracklist-items mb-3 flex-grow-1 overflow-auto">
          {uploadedTracks.map(renderTrackItem)}
        </div>

        <div className="mt-auto pt-3">
          <div className="d-flex justify-content-center">
            <div className="quick-actions rounded-3 pe-2 w-100">
              <Form className="d-flex align-items-center gap-2">
                <Form.Control
                  value={trackUrl}
                  onChange={(e) => setTrackUrl(e.target.value)}
                  type="text"
                  placeholder="Paste Spotify track URL here..."
                  className="no-input-outline bg-transparent border-0 text-white flex-grow-1"
                  onKeyPress={(e) => e.key === "Enter" && handleAddTrack()}
                />
                <Button
                  id="icon-btn"
                  onClick={handleAddTrack}
                  title="Add track"
                >
                  <i className="bi bi-check-lg"></i>
                </Button>
                {uploadedTracks.length > 0 ? (
                  <Button
                    id="icon-btn"
                    onClick={handleDownload}
                    title="Download tracklist"
                  >
                    <i className="bi bi-download"></i>
                  </Button>
                ) : (
                  renderUploadButton()
                )}
              </Form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
