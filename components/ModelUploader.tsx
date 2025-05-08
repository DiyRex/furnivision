// components/ModelLibrary.tsx
'use client';

import { useState } from 'react';
import { useDesign } from '../lib/DesignContext';
import ModelUploaderModal from './ModelUploaderModal';

export default function ModelLibrary() {
  const { furnitureModels, addFurnitureWithModel, removeFurnitureModel } = useDesign();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const filteredModels = selectedType 
    ? furnitureModels.filter(model => model.type === selectedType) 
    : furnitureModels;

  // Function to render the appropriate icon based on furniture type
  const renderTypeIcon = (type: string) => {
    switch(type) {
      case 'chair':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <path d="M6 19v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"></path>
            <circle cx="12" cy="9" r="4"></circle>
          </svg>
        );
      case 'table':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <rect x="3" y="10" width="18" height="2"></rect>
            <line x1="6" y1="12" x2="6" y2="19"></line>
            <line x1="18" y1="12" x2="18" y2="19"></line>
          </svg>
        );
      case 'sofa':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <rect x="3" y="9" width="18" height="10" rx="2"></rect>
            <path d="M5 19v2M19 19v2M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"></path>
          </svg>
        );
      case 'storage':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="3" y1="15" x2="21" y2="15"></line>
            <line x1="12" y1="9" x2="12" y2="21"></line>
          </svg>
        );
      case 'decoration':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          </svg>
        );
    }
  };

  // Function to get a background color based on model type
  const getModelColor = (type: string) => {
    switch(type) {
      case 'chair': return '#8B4513';
      case 'table': return '#D2B48C';
      case 'sofa': return '#708090';
      case 'storage': return '#5F9EA0';
      case 'decoration': return '#8A2BE2';
      default: return '#777777';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Furniture Library</h3>
        
        {/* Add button that opens the modal */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add
        </button>
      </div>
      
      {/* Furniture type filter */}
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
      
      {/* Models list - similar to furniture selector */}
      {furnitureModels.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="mt-2 text-gray-500">No 3D models uploaded yet.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Add Your First Model
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredModels.map((model) => (
            <div 
              key={model.id} 
              className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
              onClick={() => addFurnitureWithModel(model.id)}
            >
              <div className="flex items-center">
                <div 
                  className="w-12 h-12 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: getModelColor(model.type) }}
                >
                  {renderTypeIcon(model.type)}
                </div>
                
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">{model.name}</h4>
                  <p className="text-xs text-gray-500">
                    {model.dimensions.width}m × {model.dimensions.depth}m × {model.dimensions.height}m
                  </p>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering parent onclick
                    if (confirm('Delete this model?')) {
                      removeFurnitureModel(model.id);
                    }
                  }}
                  className="ml-auto p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload Modal */}
      <ModelUploaderModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}