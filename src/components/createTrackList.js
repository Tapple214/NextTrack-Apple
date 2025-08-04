import { useState, useEffect } from "react";
import { Button, Form } from "react-bootstrap";
import Item from "./ItemDisplay.js";
import recommenderAPI from "../utils/RecommenderAPI.js";

export default function CreateTrackList() {
  const [addTracks, setAddTracks] = useState(false);
  const [trackUrl, setTrackUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [trackList, setTrackList] = useState([]);

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

  return (
    <div
      className="sections w-50 d-flex text-center justify-content-center mt-2 ms-2 me-4 rounded-4"
      style={{ marginBottom: "45px" }}
    >
      <Form className="w-100 ps-4 pt-2 mt-1">
        <Form.Group className="d-flex align-items-center">
          <i class="bi bi-pencil-square"></i>
          <Form.Control
            type="text"
            placeholder="Name your tracklist!"
            className="no-input-outline input custom-placeholder ms-2 bg-transparent border-0"
            style={{ color: "#f1c28e" }}
          />
        </Form.Group>
      </Form>

      {trackList &&
        trackList.length > 0 &&
        trackList.map((track) => (
          <Item
            key={track.id}
            title={`https://open.spotify.com/embed/track/${track.id}`}
            // onPlayTrack={handlePlayTrack}
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
          />
        ))}

      {/* quick actions area */}
      <div className="mx-4 px-3 rounded mb-3 rounded-2 position-absolute bottom-0 w-50">
        <div className="d-flex justify-content-center">
          <div
            className="d-flex justify-content-center gap-2 rounded-3 mb-2"
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
                    <i class="bi bi-check-lg"></i>
                  </Button>

                  {trackList && trackList.length > 0 ? (
                    <Button
                      variant="link"
                      className="clickable-icon"
                      id="icon-btn"
                      // onClick={}
                      title="Copy link to clipboard"
                    >
                      <i class="bi bi-download"></i>
                    </Button>
                  ) : (
                    <Button
                      variant="link"
                      className="clickable-icon"
                      id="icon-btn"
                      // onClick={}
                      title="Copy link to clipboard"
                    >
                      <i class="bi bi-upload"></i>
                    </Button>
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
