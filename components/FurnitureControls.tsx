// components/FurnitureControls.tsx
'use client';

import { useDesign } from '../lib/DesignContext';

export default function FurnitureControls() {
  const { selectedFurniture, updateFurniture, removeFurniture } = useDesign();

  if (!selectedFurniture || !selectedFurniture.position) {
    return null;
  }

  const moveLeft = () => {
    if (!selectedFurniture.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        x: selectedFurniture.position.x - 0.1
      }
    });
  };

  const moveRight = () => {
    if (!selectedFurniture.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        x: selectedFurniture.position.x + 0.1
      }
    });
  };

  const moveUp = () => {
    if (!selectedFurniture.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        z: selectedFurniture.position.z - 0.1
      }
    });
  };

  const moveDown = () => {
    if (!selectedFurniture.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        z: selectedFurniture.position.z + 0.1
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
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-2">
      <div className="text-sm font-medium mb-2 text-gray-700">
        {selectedFurniture.name}
      </div>
      <div className="grid grid-cols-3 gap-1">
        <button className="p-2 hover:bg-gray-100 rounded" onClick={moveLeft}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <button className="p-2 hover:bg-gray-100 rounded" onClick={moveUp}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <button className="p-2 hover:bg-gray-100 rounded" onClick={moveRight}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <button className="p-2 hover:bg-gray-100 rounded" onClick={rotate}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
        <button className="p-2 hover:bg-gray-100 rounded" onClick={moveDown}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 15.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <button className="p-2 hover:bg-red-100 text-red-600 rounded" onClick={handleDelete}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}