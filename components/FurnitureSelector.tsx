// components/FurnitureSelector.tsx
'use client';

import { useState } from 'react';

// Sample furniture data
const furnitureItems = [
  { id: 1, type: 'chair', name: 'Dining Chair', width: 0.5, depth: 0.5, height: 0.9, color: '#8B4513' },
  { id: 2, type: 'chair', name: 'Armchair', width: 0.8, depth: 0.9, height: 1.0, color: '#A0522D' },
  { id: 3, type: 'table', name: 'Dining Table', width: 1.6, depth: 0.9, height: 0.75, color: '#D2B48C' },
  { id: 4, type: 'table', name: 'Coffee Table', width: 1.2, depth: 0.6, height: 0.45, color: '#DEB887' },
  { id: 5, type: 'table', name: 'Side Table', width: 0.5, depth: 0.5, height: 0.6, color: '#F5DEB3' },
  { id: 6, type: 'sofa', name: '3-Seater Sofa', width: 2.2, depth: 0.95, height: 0.9, color: '#708090' },
];

export default function FurnitureSelector() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  const filteredItems = selectedType 
    ? furnitureItems.filter(item => item.type === selectedType) 
    : furnitureItems;

  const handleAddFurniture = (item: typeof furnitureItems[0]) => {
    // This will be connected to state management in a future step
    console.log('Adding furniture:', item);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Furniture</h3>
      
      {/* Furniture type filter */}
      <div className="flex space-x-2 pb-2 border-b">
        <button
          className={`px-3 py-1 text-sm rounded-full ${
            selectedType === null ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => setSelectedType(null)}
        >
          All
        </button>
        <button
          className={`px-3 py-1 text-sm rounded-full ${
            selectedType === 'chair' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => setSelectedType('chair')}
        >
          Chairs
        </button>
        <button
          className={`px-3 py-1 text-sm rounded-full ${
            selectedType === 'table' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => setSelectedType('table')}
        >
          Tables
        </button>
        <button
          className={`px-3 py-1 text-sm rounded-full ${
            selectedType === 'sofa' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => setSelectedType('sofa')}
        >
          Sofas
        </button>
      </div>
      
      {/* Furniture items list */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <div 
            key={item.id} 
            className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
            onClick={() => handleAddFurniture(item)}
          >
            <div className="flex items-center">
              <div 
                className="w-12 h-12 rounded-md flex items-center justify-center"
                style={{ backgroundColor: item.color }}
              >
                {item.type === 'chair' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                    <path d="M6 19v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"></path>
                    <circle cx="12" cy="9" r="4"></circle>
                  </svg>
                )}
                {item.type === 'table' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                    <rect x="3" y="10" width="18" height="2"></rect>
                    <line x1="6" y1="12" x2="6" y2="19"></line>
                    <line x1="18" y1="12" x2="18" y2="19"></line>
                  </svg>
                )}
                {item.type === 'sofa' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                    <rect x="3" y="9" width="18" height="10" rx="2"></rect>
                    <path d="M5 19v2M19 19v2M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"></path>
                  </svg>
                )}
              </div>
              
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                <p className="text-xs text-gray-500">
                  {item.width}m × {item.depth}m × {item.height}m
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}