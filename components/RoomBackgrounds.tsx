// components/RoomBackgrounds.tsx
"use client";

import { useState, useRef } from "react";
import { useDesign } from "../lib/DesignContext";

export default function RoomBackgrounds() {
  const {
    room,
    backgroundImages,
    addBackgroundImage,
    removeBackgroundImage,
    setActiveBackground,
  } = useDesign();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // Read the file as a data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;

      // Add the image to our collection
      addBackgroundImage({
        id: Date.now().toString(),
        name: file.name,
        url: imageDataUrl,
      });

      setIsUploading(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    reader.onerror = () => {
      console.error("Error reading file");
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Room Backgrounds</h3>

        {/* Button with embedded file upload logic */}
        <label
          htmlFor="background-upload"
          className="relative flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors cursor-pointer overflow-hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          {isUploading ? "Uploading..." : "Add"}

          {/* Invisible file input layered into the button */}
          <input
            id="background-upload"
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setActiveBackground(null)}
          className={`w-full p-3 flex items-center border rounded-md ${
            !room.activeBackgroundId
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-300"
          }`}
        >
          <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center mr-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900">Default</h4>
            <p className="text-xs text-gray-500">Solid color background</p>
          </div>
        </button>

        {backgroundImages.map((image) => (
          <div
            key={image.id}
            onClick={() => setActiveBackground(image.id)}
            className={`w-full p-3 flex items-center border rounded-md cursor-pointer ${
              room.activeBackgroundId === image.id
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-300"
            }`}
          >
            <div className="w-12 h-12 rounded-md overflow-hidden mr-3">
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {image.name}
              </h4>
              <p className="text-xs text-gray-500">Custom background</p>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Delete this background?")) {
                  removeBackgroundImage(image.id);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  if (confirm("Delete this background?")) {
                    removeBackgroundImage(image.id);
                  }
                }
              }}
              className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
              aria-label="Delete background"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* <div className="pt-4">
        <label
          htmlFor="background-upload"
          className="flex justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
        >
          {isUploading ? "Uploading..." : "Upload New Background"}
          <input
            id="background-upload"
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div> */}
    </div>
  );
}
