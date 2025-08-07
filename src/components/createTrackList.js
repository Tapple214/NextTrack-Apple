import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import Item from "./ItemDisplay.js";
import recommenderAPI from "../utils/RecommenderAPI.js";

export default function CreateTrackList({ setShow, setInfoMessage }) {
  const [trackUrl, setTrackUrl] = useState("");
  const [trackList, setTrackList] = useState([]);
  const [tracklistName, setTracklistName] = useState("");

  // Extract track ID from Spotify URL
  const extractTrackId = (url) => {
    if (!url) return null;
    const match = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const handleAddTrack = async () => {
    if (!trackUrl) return;

    const trackId = extractTrackId(trackUrl);
    if (!trackId) {
      alert("Please enter a valid Spotify track URL");
      return;
    }

    try {
      const track = await recommenderAPI.getTrackFeatures(trackId);
      setTrackList((prev) => [track, ...prev]);
      setTrackUrl("");
    } catch (error) {
      alert("Error adding track. Please check the URL and try again.");
    }
  };

  const handleDeleteTrack = (trackId) => {
    setTrackList((prev) => prev.filter((track) => track.id !== trackId));
  };

  const handleDownload = () => {
    if (trackList.length === 0) {
      alert("No tracks to download!");
      return;
    }

    if (!tracklistName.trim()) {
      alert("Please enter a name for your tracklist!");
      return;
    }

    const tracklistData = {
      name: tracklistName,
      tracks: trackList,
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
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      alert("Please upload a JSON file!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.tracks || !Array.isArray(data.tracks)) {
          alert("Invalid tracklist file format.");
          return;
        }

        setTracklistName(data.name || "");
        setTrackList(data.tracks);
        alert(
          `Loaded: ${data.name || "Untitled"} (${data.tracks.length} tracks)`
        );
      } catch (error) {
        alert("Error reading the JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <>
      {/* Desktop Layout */}
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
                placeholder={"Name your tracklist!" || tracklistName}
                className="no-input-outline input custom-placeholder ms-2 bg-transparent border-0"
                style={{ color: "#312c51" }}
                value={tracklistName}
                onChange={(e) => setTracklistName(e.target.value)}
                required
              />
            </Form.Group>
          </Form>

          <i
            onClick={() => {
              setShow(true);
              setInfoMessage(
                <>
                  <h4>Create Tracklist</h4>
                  <p>
                    Add tracks by pasting Spotify URLs, then download or upload
                    your tracklists.
                  </p>
                </>
              );
            }}
            style={{ cursor: "pointer" }}
            className="bi bi-info-circle-fill"
          ></i>
        </div>

        {trackList.map((track) => (
          <Item
            key={track.id}
            action="create"
            onDeleteTrack={handleDeleteTrack}
            title={`https://open.spotify.com/embed/track/${track.id}`}
            trackId={track.id}
            displayTitle={
              <div>
                <b>{track.name}</b>
                <br />
                <p className="m-0" style={{ fontSize: "12px" }}>
                  {track.artists?.map((a) => a.name).join(", ") ||
                    "Unknown Artist"}
                </p>
              </div>
            }
            metrics={track}
          />
        ))}

        {/* Quick Actions */}
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
                        placeholder="Add track URL!"
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

                      {trackList.length > 0 ? (
                        <Button
                          id="icon-btn"
                          onClick={handleDownload}
                          title="Download tracklist"
                        >
                          <i className="bi bi-download"></i>
                        </Button>
                      ) : (
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
                              e.target
                                .closest("div")
                                .querySelector('input[type="file"]')
                                .click();
                            }}
                          >
                            <i className="bi bi-upload"></i>
                          </Button>
                        </div>
                      )}
                    </div>
                  </Form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="d-sm-none mobile-create-content">
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
            onClick={() => {
              setShow(true);
              setInfoMessage(
                <>
                  <h4>Create Tracklist</h4>
                  <p>
                    Add tracks by pasting Spotify URLs, then download or upload
                    your tracklists.
                  </p>
                </>
              );
            }}
            style={{ cursor: "pointer" }}
            className="bi bi-info-circle-fill"
          ></i>
        </div>

        <div className="mobile-tracklist-items mb-3">
          {trackList.map((track) => (
            <Item
              key={track.id}
              action="create"
              onDeleteTrack={handleDeleteTrack}
              title={`https://open.spotify.com/embed/track/${track.id}`}
              trackId={track.id}
              displayTitle={
                <div>
                  <b>{track.name}</b>
                  <br />
                  <p className="m-0" style={{ fontSize: "12px" }}>
                    {track.artists?.map((a) => a.name).join(", ") ||
                      "Unknown Artist"}
                  </p>
                </div>
              }
              metrics={track}
            />
          ))}
        </div>

        {/* Mobile Quick Actions */}
        <div className=" d-flex justify-content-center gap-2">
          <div
            className="quick-actions position-fixed rounded-3 pe-2"
            style={{ bottom: 22 }}
          >
            <Form className="d-flex align-items-center gap-2">
              <Form.Control
                value={trackUrl}
                onChange={(e) => setTrackUrl(e.target.value)}
                type="text"
                placeholder="Add track URL!"
                className="no-input-outline bg-transparent border-0 text-white flex-grow-1"
                onKeyPress={(e) => e.key === "Enter" && handleAddTrack()}
              />
              <Button id="icon-btn" onClick={handleAddTrack} title="Add track">
                <i className="bi bi-check-lg"></i>
              </Button>
              {trackList.length > 0 ? (
                <Button
                  id="icon-btn"
                  onClick={handleDownload}
                  title="Download tracklist"
                >
                  <i className="bi bi-download"></i>
                </Button>
              ) : (
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
                      e.target
                        .closest("div")
                        .querySelector('input[type="file"]')
                        .click();
                    }}
                  >
                    <i className="bi bi-upload"></i>
                  </Button>
                </div>
              )}
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}
