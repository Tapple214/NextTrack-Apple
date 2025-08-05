import React from "react";
import { Button } from "react-bootstrap";

export default function InfoModal({ message, show, setShow }) {
  return (
    <>
      {show && (
        <div className="w-100 h-100 bg-black position-absolute bg-opacity-50 d-flex justify-content-center align-items-center">
          <div
            className="p-4 w-75 rounded-3 d-flex flex-column justify-content-center align-items-center"
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
