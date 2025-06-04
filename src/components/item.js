import React from "react";

function Item({ title }) {
  return (
    <div className="p-3">
      <div>
        <p className="m-0">{title}</p>
      </div>

      <div>
        <i class="bi bi-link"></i>
        <i class="bi bi-play-fill"></i>
        <i class="bi bi-info-circle-fill"></i>
      </div>
    </div>
  );
}

export default Item;
