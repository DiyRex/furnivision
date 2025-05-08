// components/FurnitureControls.tsx
'use client';

import { useState, useEffect } from 'react';
import { useDesign } from '../lib/DesignContext';

export default function FurnitureControls() {
  const { room, selectedFurniture, updateFurniture, removeFurniture } = useDesign();
  const [isOpen, setIsOpen] = useState(true);

  // Reset open state when furniture selection changes
  useEffect(() => {
    if (selectedFurniture) {
      setIsOpen(true);
    }
  }, [selectedFurniture?.id]);

  if (!selectedFurniture || !selectedFurniture.position) {
    return null;
  }

  // Calculate movement limits based on room and furniture dimensions
  const minX = selectedFurniture.width / 2;
  const maxX = room.width - selectedFurniture.width / 2;
  const minY = 0;
  const maxY = room.height - selectedFurniture.height;
  const minZ = selectedFurniture.depth / 2;
  const maxZ = room.length - selectedFurniture.depth / 2;

  // Movement control functions
  const moveLeft = () => {
    if (!selectedFurniture.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        x: Math.max(minX, selectedFurniture.position.x - 0.1)
      }
    });
  };

  const moveRight = () => {
    if (!selectedFurniture.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        x: Math.min(maxX, selectedFurniture.position.x + 0.1)
      }
    });
  };

  const moveUp = () => {
    if (!selectedFurniture.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        y: Math.max(minY, selectedFurniture.position.y - 0.1)
      }
    });
  };

  const moveDown = () => {
    if (!selectedFurniture.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        y: Math.min(maxY, selectedFurniture.position.y + 0.1)
      }
    });
  };

  const moveForward = () => {
    if (!selectedFurniture.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        z: Math.max(minZ, selectedFurniture.position.z - 0.1)
      }
    });
  };

  const moveBackward = () => {
    if (!selectedFurniture.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        z: Math.min(maxZ, selectedFurniture.position.z + 0.1)
      }
    });
  };

  const rotate = () => {
    updateFurniture({
      ...selectedFurniture,
      rotation: (selectedFurniture.rotation || 0) + Math.PI / 4
    });
  };

  const handleDelete = () => {
    removeFurniture(selectedFurniture.id);
  };

  return (
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md z-10 text-center">
      <div className="flex justify-center items-center p-2 border-b cursor-pointer text-center" onClick={() => setIsOpen(!isOpen)}>
        <div className="text-sm font-medium text-gray-700 flex justify-center align-center text-center">
          {selectedFurniture.name}
        </div>
      </div>
      
      {isOpen && (
        <div className="p-3">
          {/* Cross-shaped movement controls */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {/* Top row */}
            <div></div>
            <button 
              className="p-2 hover:bg-gray-100 rounded flex items-center justify-center" 
              onClick={moveUp}
              title="Move Up"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div></div>
            
            {/* Middle row */}
            <button 
              className="p-2 hover:bg-gray-100 rounded flex items-center justify-center" 
              onClick={moveLeft}
              title="Move Left"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
              className="p-2 hover:bg-gray-100 rounded flex items-center justify-center" 
              onClick={rotate}
              title="Rotate"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
              className="p-2 hover:bg-gray-100 rounded flex items-center justify-center" 
              onClick={moveRight}
              title="Move Right"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Bottom row */}
            <div></div>
            <button 
              className="p-2 hover:bg-gray-100 rounded flex items-center justify-center" 
              onClick={moveDown}
              title="Move Down"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div></div>
          </div>
          
          {/* Depth controls */}
          <div className="flex justify-between items-center mb-3 px-1">
            <div className="text-xs font-medium text-gray-500">Depth:</div>
            <div className="flex space-x-2">
              <button 
                className="p-2 hover:bg-gray-100 rounded flex items-center justify-center" 
                onClick={moveForward}
                title="Move Forward"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
              </button>
              <button 
                className="p-2 hover:bg-gray-100 rounded flex items-center justify-center" 
                onClick={moveBackward}
                title="Move Backward"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Delete button */}
          <div className="flex justify-center border-t pt-2">
            <button 
              className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-md flex items-center"
              onClick={handleDelete}
              title="Delete Furniture"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Delete
            </button>
          </div>
          
          {/* Position information */}
          <div className="mt-2 text-xs text-gray-500 text-center border-t pt-2">
            Position: {selectedFurniture.position.x.toFixed(1)}m × {selectedFurniture.position.y.toFixed(1)}m × {selectedFurniture.position.z.toFixed(1)}m
          </div>
        </div>
      )}
    </div>
  );
}