"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddBathroomPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [type, setType] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch("/api/bathrooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        building,
        floor: Number(floor),
        latitude: 34.0689,    // temporary hardcoded
        longitude: -118.4452, // temporary hardcoded
        type,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Error adding bathroom");
      return;
    }

    alert("Bathroom added!");
    router.push("/dashboard");
  };

  return (
    <div>
      <h1>Add Bathroom</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Building:</label>
          <input
            type="text"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Floor:</label>
          <input
            type="number"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Type:</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          >
            <option value="">Select type</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="gender-neutral">Gender Neutral</option>
            <option value="accessible">Accessible</option>
          </select>
        </div>

        <button type="submit">Add Bathroom</button>
      </form>
    </div>
  );
}