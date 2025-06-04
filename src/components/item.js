import React from "react";

function Item({ title }) {
  return (
    <div className="p-3">
      <p className="m-0">{title}</p>
    </div>
  );
}

export default Item;
