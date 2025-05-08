// components/SelectedFurniturePanel.tsx
"use client";

import { useState, useEffect } from "react";
import { useDesign } from "../lib/DesignContext";

export default function SelectedFurniturePanel() {
  const { selectedFurniture, updateFurniture, removeFurniture, room } =
    useDesign();
  const [x, setX] = useState("0");
  const [z, setZ] = useState("0");
  const [rotation, setRotation] = useState("0");
  const [color, setColor] = useState("#000000");
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Update local state when selected furniture changes
  useEffect(() => {
    if (selectedFurniture && selectedFurniture.position) {
      setX(selectedFurniture.position.x.toFixed(2));
      setZ(selectedFurniture.position.z.toFixed(2));
      setRotation(
        (((selectedFurniture.rotation || 0) * 180) / Math.PI).toFixed(1)
      );
      setColor(selectedFurniture.color);
      setIsPanelOpen(true); // Automatically open panel when furniture is selected
    }
  }, [selectedFurniture]);

  if (!selectedFurniture) {
    return (
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
        <p className="text-sm text-gray-500">
          Select furniture to edit properties
        </p>
      </div>
    );
  }

  // Handle X position change immediately
  const handleXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setX(newValue);

    if (!selectedFurniture.position) return;

    const xVal = Math.max(
      selectedFurniture.width / 2,
      Math.min(
        parseFloat(newValue) || 0,
        room.width - selectedFurniture.width / 2
      )
    );

    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        x: xVal,
      },
    });
  };

  // Handle Z position change immediately
  const handleZChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setZ(newValue);

    if (!selectedFurniture.position) return;

    const zVal = Math.max(
      selectedFurniture.depth / 2,
      Math.min(
        parseFloat(newValue) || 0,
        room.length - selectedFurniture.depth / 2
      )
    );

    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        z: zVal,
      },
    });
  };

  // Handle rotation change immediately
  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setRotation(newValue);

    if (!selectedFurniture.position) return;

    // Convert degrees to radians and update
    const rotationRad = ((parseFloat(newValue) || 0) * Math.PI) / 180;

    updateFurniture({
      ...selectedFurniture,
      rotation: rotationRad,
    });
  };

  // Handle color change
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColor(newColor);

    updateFurniture({
      ...selectedFurniture,
      color: newColor,
    });
  };

  const handleDelete = () => {
    removeFurniture(selectedFurniture.id);
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      <div
        className="p-3 flex justify-between items-center cursor-pointer"
        onClick={() => setIsPanelOpen(!isPanelOpen)}
      >
        <h3 className="text-sm font-medium text-gray-900">
          {selectedFurniture.name}
        </h3>
        <button className="p-1 hover:bg-gray-200 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform duration-200 ${isPanelOpen ? "transform rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isPanelOpen && (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {selectedFurniture.type} - {selectedFurniture.width}m ×{" "}
              {selectedFurniture.depth}m × {selectedFurniture.height}m
            </div>
            <button
              onClick={handleDelete}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Delete"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                X Position
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  step="0.1"
                  value={x}
                  onChange={handleXChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Z Position
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  step="0.1"
                  value={z}
                  onChange={handleZChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rotation (degrees)
            </label>
            <div className="mt-1">
              <input
                type="number"
                step="15"
                value={rotation}
                onChange={handleRotationChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Color
            </label>
            <div className="relative w-10 h-10">
            <input
              type="color"
              value={color}
              onChange={handleColorChange}
              className="absolute outline-none inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="w-10 h-10 rounded-full border-0 shadow-inner outline-none"
              style={{ backgroundColor: color }}
            />
          </div>

          </div>
        </div>
      )}
    </div>
  );
}
