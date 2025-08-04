import { useState, useEffect } from "react";
import { Button, Form } from "react-bootstrap";
import Item from "./ItemDisplay.js";
import recommenderAPI from "../utils/RecommenderAPI.js";

export default function CreateTrackList() {
  const [addTracks, setAddTracks] = useState(false);
  const [trackUrl, setTrackUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [trackList, setTrackList] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [sampleTracks, setSampleTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [activeView, setActiveView] = useState("form");
  const [tracklistName, setTracklistName] = useState("");

  // Function to extract track ID from Spotify URL
  const extractTrackId = (url) => {
    if (!url) return null;

    // Handle different Spotify URL formats
    const patterns = [
      /spotify\.com\/track\/([a-zA-Z0-9]+)/,
      /spotify\.com\/embed\/track\/([a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  };

  const handleAddTrack = async () => {
    if (!trackUrl) return;

    // Once input has been added, check to see if the url is valid
    const trackId = extractTrackId(trackUrl);
    if (!trackId) {
      console.error("Invalid Spotify track URL");
      return;
    }

    try {
      const track = await recommenderAPI.getTrackFeatures(trackId);
      setTrackList((prev) => [track, ...prev]);
      setTrackUrl("");
    } catch (error) {
      console.error("Error adding track:", error);
    }
  };

  const handleDeleteTrack = (trackId) => {
    setTrackList((prev) => prev.filter((track) => track.id !== trackId));
  };

  const handlePlayTrack = (trackId) => {
    const allTracks = [...recommendations, ...sampleTracks];
    const track = allTracks.find((t) => t.id === trackId);
    setCurrentTrack(track);
    setActiveView("player");
  };

  const handleDownloadTracklist = () => {
    if (trackList.length === 0) {
      alert("No tracks to download!");
      return;
    }

    if (!tracklistName.trim()) {
      alert("Please enter a name for your tracklist!");
      return;
    }

    // Create the tracklist data object
    const tracklistData = {
      name: tracklistName,
      tracks: trackList,
      createdAt: new Date().toISOString(),
      totalTracks: trackList.length,
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(tracklistData, null, 2);

    // Create blob and download
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement("a");
    link.href = url;
    link.download = `${tracklistName.replace(/[^a-zA-Z0-9]/g, "_")}.json`;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadTracklist = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is JSON
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      alert("Please upload a JSON file!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const tracklistData = JSON.parse(e.target.result);

        // Validate the uploaded data structure
        if (!tracklistData.tracks || !Array.isArray(tracklistData.tracks)) {
          alert(
            "Invalid tracklist file format. File must contain a 'tracks' array."
          );
          return;
        }

        // Set the tracklist name if available
        if (tracklistData.name) {
          setTracklistName(tracklistData.name);
        }

        // Set the tracks
        setTrackList(tracklistData.tracks);

        alert(
          `Successfully loaded tracklist: ${
            tracklistData.name || "Untitled"
          } (${tracklistData.tracks.length} tracks)`
        );
      } catch (error) {
        console.error("Error parsing JSON file:", error);
        alert(
          "Error reading the JSON file. Please make sure it's a valid tracklist file."
        );
      }
    };

    reader.readAsText(file);

    // Reset the file input
    event.target.value = "";
  };

  return (
    <div
      className="sections w-50 d-flex flex-column mt-2 ms-2 me-4 rounded-4 position-relative"
      style={{ marginBottom: "45px" }}
    >
      <Form className="w-100 ps-4 pt-2 mt-1 mb-2">
        <Form.Group className="d-flex align-items-center">
          <i className="bi bi-pencil-square"></i>
          <Form.Control
            type="text"
            placeholder="Name your tracklist!"
            className="no-input-outline input custom-placeholder ms-2 bg-transparent border-0"
            style={{ color: "#f1c28e" }}
            value={tracklistName}
            onChange={(e) => setTracklistName(e.target.value)}
            required
          />
        </Form.Group>
      </Form>

      {trackList &&
        trackList.length > 0 &&
        trackList.map((track, index) => (
          <Item
            key={track.id}
            action="create"
            onDeleteTrack={handleDeleteTrack}
            title={`https://open.spotify.com/embed/track/${track.id}`}
            onPlayTrack={handlePlayTrack}
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

      {/* quick actions area */}
      <div
        className="me-4 px-3 rounded rounded-2 position-absolute w-100"
        style={{ bottom: -22 }}
      >
        <div className="d-flex justify-content-center">
          <div
            className="d-flex justify-content-center gap-2 rounded-3"
            style={{ backgroundColor: "#f1c28e", width: "80%" }}
          >
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
                    className="no-input-outline bg-transparent border-0"
                  ></Form.Control>
                </Form.Group>

                <div className="d-flex">
                  <Button
                    variant="link"
                    className="clickable-icon"
                    id="icon-btn"
                    // onClick={(e) => {
                    //   e.preventDefault();
                    // }}
                    // onSubmit={handleSubmit}
                    onClick={handleAddTrack}
                    title="Copy link to clipboard"
                  >
                    <i className="bi bi-check-lg"></i>
                  </Button>

                  {trackList && trackList.length !== 0 ? (
                    <Button
                      variant="link"
                      className="clickable-icon"
                      id="icon-btn"
                      onClick={handleDownloadTracklist}
                      title="Download tracklist as JSON"
                    >
                      <i className="bi bi-download"></i>
                    </Button>
                  ) : (
                    <div style={{ position: "relative" }}>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleUploadTracklist}
                        style={{
                          position: "absolute",
                          opacity: 0,
                          width: "100%",
                          height: "100%",
                          cursor: "pointer",
                          top: 0,
                          left: 0,
                        }}
                        title="Upload tracklist JSON"
                      />
                      <Button
                        variant="link"
                        className="clickable-icon"
                        id="icon-btn"
                        title="Upload tracklist JSON"
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
  );
}
