import React from "react";
import { Button } from "react-bootstrap";

export default function InfoModal({ message, show, setShow }) {
  return (
    <>
      {show && (
        <div
          className="w-100 h-100 bg-black d-flex justify-content-center align-items-center bg-opacity-50"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 1000,
          }}
        >
          <div
            className="p-4 w-75 rounded-3 d-flex flex-column justify-content-center text-white align-items-center"
            style={{ backgroundColor: "#48426d" }}
          >
            {message}
            <Button onClick={() => setShow(false)}>Close</Button>
          </div>
        </div>
      )}
    </>
  );
}
