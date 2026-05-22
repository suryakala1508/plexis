import React from "react";

const zPhotoPlaceholders = [
  { top: 10, left: 0 },
  { top: 0, left: 120 },
  { top: 90, left: 200 },
  { top: 130, left: 100 },
  { top: 170, left: 0 },
  { top: 100, left: 220 },
  { top: 210, left: 130 }
];

export default function ZShapePlaceholders() {
  const width = 110;
  const height = 75;
  return (
    <div
      style={{
        width: 350,
        height: 320,
        position: "relative",
        margin: "0 auto",
      }}
    >
      {zPhotoPlaceholders.map((pos, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            top: pos.top,
            left: pos.left,
            width: width,
            height: height,
            background: "#222",
            border: "4px solid #fff",
            borderRadius: 5,
            boxShadow: "0 6px 20px rgba(0,0,0,0.13)",
            zIndex: idx + 1
          }}
        />
      ))}
    </div>
  );
}
