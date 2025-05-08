// components/FurnitureControls3D.tsx
'use client';

import { useState, useEffect } from 'react';
import { useDesign } from '../lib/DesignContext';

export default function FurnitureControls3D() {
  const { room, selectedFurniture, updateFurniture, removeFurniture } = useDesign();
  const [isOpen, setIsOpen] = useState(true);
  const [mode, setMode] = useState<'move' | 'resize'>('move');

  // Reset open state when furniture selection changes
  useEffect(() => {
    if (selectedFurniture) {
      setIsOpen(true);
      setMode('move');
    }
  }, [selectedFurniture?.id]);

  if (!selectedFurniture || !selectedFurniture.position) {
    return null;
  }

  // Calculate movement limits based on room and furniture dimensions
  const minX = selectedFurniture.width / 2;
  const maxX = room.width - selectedFurniture.width / 2;
  const minZ = selectedFurniture.depth / 2;
  const maxZ = room.length - selectedFurniture.depth / 2;
  
  // Movement step size (in meters)
  const moveStep = 0.1;
  const resizeStep = 0.05;

  // Movement control functions
  const moveLeft = () => {
    if (!selectedFurniture.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        x: Math.max(minX, selectedFurniture.position.x - moveStep)
      }
    });
  };

  const moveRight = () => {
    if (!selectedFurniture.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        x: Math.min(maxX, selectedFurniture.position.x + moveStep)
      }
    });
  };

  const moveForward = () => {
    if (!selectedFurniture.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        z: Math.max(minZ, selectedFurniture.position.z - moveStep)
      }
    });
  };

  const moveBackward = () => {
    if (!selectedFurniture.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        z: Math.min(maxZ, selectedFurniture.position.z + moveStep)
      }
    });
  };

  const rotate = () => {
    updateFurniture({
      ...selectedFurniture,
      rotation: (selectedFurniture.rotation || 0) + Math.PI / 4
    });
  };

  // Resize functions
  const increaseWidth = () => {
    updateFurniture({
      ...selectedFurniture,
      width: selectedFurniture.width + resizeStep
    });
  };

  const decreaseWidth = () => {
    if (selectedFurniture.width > 0.2) { // Minimum size
      updateFurniture({
        ...selectedFurniture,
        width: selectedFurniture.width - resizeStep
      });
    }
  };

  const increaseHeight = () => {
    updateFurniture({
      ...selectedFurniture,
      height: selectedFurniture.height + resizeStep
    });
  };

  const decreaseHeight = () => {
    if (selectedFurniture.height > 0.2) { // Minimum size
      updateFurniture({
        ...selectedFurniture,
        height: selectedFurniture.height - resizeStep
      });
    }
  };

  const increaseDepth = () => {
    updateFurniture({
      ...selectedFurniture,
      depth: selectedFurniture.depth + resizeStep
    });
  };

  const decreaseDepth = () => {
    if (selectedFurniture.depth > 0.2) { // Minimum size
      updateFurniture({
        ...selectedFurniture,
        depth: selectedFurniture.depth - resizeStep
      });
    }
  };

  const handleDelete = () => {
    removeFurniture(selectedFurniture.id);
  };

  return (
    <div className="absolute left-4 bottom-4 bg-white rounded-md shadow-md w-56 z-10 overflow-hidden">
      {/* Header with furniture name */}
      <div className="flex justify-between items-center p-2 border-b cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="text-sm font-medium text-gray-700">
          {selectedFurniture.name}
        </div>
        <button className="p-1">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {isOpen && (
        <div>
          {/* Mode Toggle */}
          <div className="flex justify-center p-2">
            <div className="inline-flex rounded-md p-1 bg-gray-100">
              <button
                onClick={() => setMode('move')}
                className={`px-4 py-1 text-sm rounded-md transition-colors ${mode === 'move' ? 'bg-indigo-500 text-white' : 'text-gray-700'}`}
              >
                Move
              </button>
              <button
                onClick={() => setMode('resize')}
                className={`px-4 py-1 text-sm rounded-md transition-colors ${mode === 'resize' ? 'bg-indigo-500 text-white' : 'text-gray-700'}`}
              >
                Resize
              </button>
            </div>
          </div>
          
          {mode === 'move' ? (
            <div className="p-2 flex flex-col items-center">
              {/* Up button */}
              <button 
                className="w-10 h-10 mb-1 rounded-md hover:bg-gray-100 flex items-center justify-center" 
                onClick={moveForward}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Middle row buttons */}
              <div className="flex mb-1">
                <button 
                  className="w-10 h-10 mr-1 rounded-md hover:bg-gray-100 flex items-center justify-center" 
                  onClick={moveLeft}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <button 
                  className="w-10 h-10 mr-1 rounded-md hover:bg-gray-100 flex items-center justify-center" 
                  onClick={rotate}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <button 
                  className="w-10 h-10 rounded-md hover:bg-gray-100 flex items-center justify-center" 
                  onClick={moveRight}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {/* Down button */}
              <button 
                className="w-10 h-10 rounded-md hover:bg-gray-100 flex items-center justify-center" 
                onClick={moveBackward}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="px-3 py-2">
              {/* Width controls */}
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">Width ({selectedFurniture.width.toFixed(2)}m)</div>
                <div className="flex">
                  <button 
                    className="w-16 h-10 mr-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center"
                    onClick={decreaseWidth}
                  >
                    <span className="text-xl font-semibold">−</span>
                  </button>
                  <button 
                    className="w-16 h-10 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center"
                    onClick={increaseWidth}
                  >
                    <span className="text-xl font-semibold">+</span>
                  </button>
                </div>
              </div>
              
              {/* Height controls */}
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">Height ({selectedFurniture.height.toFixed(2)}m)</div>
                <div className="flex">
                  <button 
                    className="w-16 h-10 mr-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center"
                    onClick={decreaseHeight}
                  >
                    <span className="text-xl font-semibold">−</span>
                  </button>
                  <button 
                    className="w-16 h-10 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center"
                    onClick={increaseHeight}
                  >
                    <span className="text-xl font-semibold">+</span>
                  </button>
                </div>
              </div>
              
              {/* Depth controls */}
              <div className="mb-1">
                <div className="text-xs text-gray-500 mb-1">Depth ({selectedFurniture.depth.toFixed(2)}m)</div>
                <div className="flex">
                  <button 
                    className="w-16 h-10 mr-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center"
                    onClick={decreaseDepth}
                  >
                    <span className="text-xl font-semibold">−</span>
                  </button>
                  <button 
                    className="w-16 h-10 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center"
                    onClick={increaseDepth}
                  >
                    <span className="text-xl font-semibold">+</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete button */}
          <div className="px-4 py-2 border-t border-b">
            <button 
              className="w-full h-8 text-red-500 hover:bg-red-50 rounded-md flex items-center justify-center"
              onClick={handleDelete}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Delete
            </button>
          </div>
          
          {/* Position information */}
          <div className="px-3 py-2 text-xs text-gray-500">
            <div>Position</div>
            <div>X: {selectedFurniture.position.x.toFixed(2)}m • Z: {selectedFurniture.position.z.toFixed(2)}m</div>
            {mode === 'move' && (
              <div className="mt-1">
                <div>Dimensions</div>
                <div>W: {selectedFurniture.width.toFixed(2)}m • H: {selectedFurniture.height.toFixed(2)}m • D: {selectedFurniture.depth.toFixed(2)}m</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}