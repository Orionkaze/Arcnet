import React from "react";

const happenings = [
  "Rockstar announces the delay of GTA 6",
  "Arcavon released Trailer for their highly anticipated sci-fi game 'Reboot the Dawn'",
  "Unity releases new shader toolkit for 2025",
  "Epic Games announces new indie fund",
];

export default function RightPanel() {
  return (
    <aside className="right-panel">
      <div className="happenings-card">
        <h3 className="happenings-title">Recent Happenings</h3>
        <ul className="happenings-list">
          {happenings.map((item, i) => (
            <li key={i} className="happenings-item">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
