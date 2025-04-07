// components/ColorPicker.tsx
'use client';

import { useState } from 'react';

const colorPalettes = [
  { name: 'Neutrals', colors: ['#F5F5F5', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#212121'] },
  { name: 'Warm', colors: ['#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#C62828'] },
  { name: 'Cool', colors: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1565C0'] },
  { name: 'Earth', colors: ['#F1F8E9', '#DCEDC8', '#C5E1A5', '#AED581', '#9CCC65', '#8BC34A', '#7CB342', '#558B2F'] }
];

export default function ColorPicker() {
  const [wallColor, setWallColor] = useState('#F5F5F5');
  const [floorColor, setFloorColor] = useState('#D2B48C');
  const [selectedElement, setSelectedElement] = useState('wall'); // 'wall', 'floor', or 'furniture'

  const handleColorChange = (color: string) => {
    if (selectedElement === 'wall') {
      setWallColor(color);
    } else if (selectedElement === 'floor') {
      setFloorColor(color);
    }
    // We'll add furniture color handling in a future step
    
    console.log('Color updated:', { element: selectedElement, color });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Colors</h3>
        <p className="text-sm text-gray-500">Select an element to change its color</p>
      </div>
      
      <div className="flex space-x-4">
        <button
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            selectedElement === 'wall' 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setSelectedElement('wall')}
        >
          Walls
        </button>
        <button
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            selectedElement === 'floor' 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setSelectedElement('floor')}
        >
          Floor
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700">
            {selectedElement === 'wall' ? 'Wall Color' : 'Floor Color'}
          </h4>
          <div className="mt-2 flex items-center">
            <div 
              className="w-8 h-8 rounded-full border border-gray-300"
              style={{ backgroundColor: selectedElement === 'wall' ? wallColor : floorColor }}
            ></div>
            <input
              type="color"
              value={selectedElement === 'wall' ? wallColor : floorColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="ml-2"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Color Palettes</h4>
        
        {colorPalettes.map((palette, idx) => (
          <div key={idx} className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">{palette.name}</h5>
            <div className="flex flex-wrap gap-2">
              {palette.colors.map((color, colorIdx) => (
                <button
                  key={colorIdx}
                  className="w-8 h-8 rounded-md border border-gray-300 hover:opacity-80 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                ></button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}