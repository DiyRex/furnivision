// components/RoomSettings.tsx
'use client';

import { useState, useEffect } from 'react';
import { useDesign } from '../lib/DesignContext';

export default function RoomSettings() {
  const { room, updateRoom } = useDesign();
  const [roomWidth, setRoomWidth] = useState(room.width.toString());
  const [roomLength, setRoomLength] = useState(room.length.toString());
  const [roomHeight, setRoomHeight] = useState(room.height.toString());
  
  // Update local state when room data changes
  useEffect(() => {
    setRoomWidth(room.width.toString());
    setRoomLength(room.length.toString());
    setRoomHeight(room.height.toString());
  }, [room]);
  
  // Immediately update room when input values change
  const handleDimensionChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    
    if (field === 'width') {
      updateRoom({ width: numValue > 0 ? numValue : 1 });
    } else if (field === 'length') {
      updateRoom({ length: numValue > 0 ? numValue : 1 });
    } else if (field === 'height') {
      updateRoom({ height: numValue > 0 ? numValue : 1 });
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Room Size</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="room-width" className="block text-sm font-medium text-gray-700">
            Width (m)
          </label>
          <div className="mt-1">
            <input
              type="number"
              id="room-width"
              min="1"
              max="20"
              step="0.1"
              value={roomWidth}
              onChange={(e) => {
                setRoomWidth(e.target.value);
                // Update room immediately on change
                handleDimensionChange('width', e.target.value);
              }}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="room-length" className="block text-sm font-medium text-gray-700">
            Length (m)
          </label>
          <div className="mt-1">
            <input
              type="number"
              id="room-length"
              min="1"
              max="20"
              step="0.1"
              value={roomLength}
              onChange={(e) => {
                setRoomLength(e.target.value);
                // Update room immediately on change
                handleDimensionChange('length', e.target.value);
              }}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="room-height" className="block text-sm font-medium text-gray-700">
            Height (m)
          </label>
          <div className="mt-1">
            <input
              type="number"
              id="room-height"
              min="2"
              max="5"
              step="0.1"
              value={roomHeight}
              onChange={(e) => {
                setRoomHeight(e.target.value);
                // Update room immediately on change
                handleDimensionChange('height', e.target.value);
              }}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            />
          </div>
        </div>
      </div>

      <h3 className="text-lg font-medium text-gray-900">Room Shape</h3>
      <div className="grid grid-cols-2 gap-4">
        <button 
          className={`p-4 border rounded-md flex items-center justify-center ${
            room.shape === 'rectangular' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
          }`}
          onClick={() => updateRoom({ shape: 'rectangular' })}
        >
          <div className="w-12 h-12 bg-gray-200 rounded-sm"></div>
          <span className="ml-2 text-sm">Rectangular</span>
        </button>
        
        <button 
          className={`p-4 border rounded-md flex items-center justify-center ${
            room.shape === 'l-shaped' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
          }`}
          onClick={() => updateRoom({ shape: 'l-shaped' })}
        >
          <div className="w-12 h-12 bg-gray-200 flex items-end">
            <div className="w-8 h-8 bg-gray-200"></div>
            <div className="w-4 h-4 bg-gray-200"></div>
          </div>
          <span className="ml-2 text-sm">L-Shaped</span>
        </button>
      </div>
    </div>
  );
}