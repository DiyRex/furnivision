// components/ModelLibrary.tsx
'use client';

import { useState } from 'react';
import { useDesign } from '../lib/DesignContext';
import { FurnitureModel } from '../lib/types';

export default function ModelLibrary() {
  const { furnitureModels, addFurnitureWithModel, removeFurnitureModel } = useDesign();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  const filteredModels = selectedType 
    ? furnitureModels.filter(model => model.type === selectedType) 
    : furnitureModels;

  if (furnitureModels.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">No 3D models uploaded yet.</p>
        <p className="text-sm text-gray-400 mt-1">Use the uploader to add custom furniture.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">3D Model Library</h3>
      
      {/* Model type filter */}
      <div className="flex space-x-2 pb-2 border-b overflow-x-auto">
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
        <button
          className={`px-3 py-1 text-sm rounded-full ${
            selectedType === 'storage' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => setSelectedType('storage')}
        >
          Storage
        </button>
        <button
          className={`px-3 py-1 text-sm rounded-full ${
            selectedType === 'decoration' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => setSelectedType('decoration')}
        >
          Decor
        </button>
      </div>
      
      {/* Models list */}
      <div className="space-y-3">
        {filteredModels.map((model) => (
          <div 
            key={model.id} 
            className="p-3 border rounded-md hover:bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <div 
                className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center mr-3 cursor-pointer"
                onClick={() => addFurnitureWithModel(model.id)}
              >
                {model.thumbnail ? (
                  <img src={model.thumbnail} alt={model.name} className="w-full h-full object-cover rounded-md" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </div>
              
              <div className="flex-1 ml-2" onClick={() => addFurnitureWithModel(model.id)}>
                <h4 className="text-sm font-medium text-gray-900 cursor-pointer">{model.name}</h4>
                <p className="text-xs text-gray-500">
                  {model.dimensions.width}m × {model.dimensions.depth}m × {model.dimensions.height}m
                </p>
              </div>
              
              <button
                onClick={() => {
                  if (confirm('Delete this model?')) {
                    removeFurnitureModel(model.id);
                  }
                }}
                className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}