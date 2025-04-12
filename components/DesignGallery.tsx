// components/DesignGallery.tsx
'use client';

import { useState, useEffect } from 'react';
import { useDesign } from '../lib/DesignContext';
import { Design } from '../lib/types';

export default function DesignGallery() {
  const { loadDesign, deleteDesign } = useDesign();
  const [designs, setDesigns] = useState<Design[]>([]);
  
  // Load designs from storage
  useEffect(() => {
    const loadDesigns = () => {
      const savedDesignsJson = localStorage.getItem('savedDesigns');
      if (savedDesignsJson) {
        try {
          const savedDesigns = JSON.parse(savedDesignsJson);
          setDesigns(savedDesigns);
        } catch (error) {
          console.error('Error loading designs:', error);
        }
      }
    };
    
    loadDesigns();
    
    // Listen for storage changes (in case design is saved from another tab)
    window.addEventListener('storage', loadDesigns);
    
    return () => {
      window.removeEventListener('storage', loadDesigns);
    };
  }, []);
  
  if (designs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No designs saved yet</h3>
        <p className="text-gray-500">Your saved designs will appear here</p>
      </div>
    );
  }
  
  const handleLoadDesign = (design: Design) => {
    if (confirm(`Load design "${design.name}"? Unsaved changes will be lost.`)) {
      loadDesign(design);
    }
  };
  
  const handleDeleteDesign = (e: React.MouseEvent, designId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this design?')) {
      deleteDesign(designId);
      setDesigns(designs.filter(d => d.id !== designId));
    }
  };

return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {designs.map((design) => (
        <div
          key={design.id}
          className="border rounded-lg overflow-hidden hover:shadow-md cursor-pointer transition-shadow"
          onClick={() => handleLoadDesign(design)}
        >
          <div className="bg-gray-100 h-32 flex items-center justify-center">
            {design.thumbnail ? (
              <img 
                src={design.thumbnail} 
                alt={design.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )}
          </div>
          <div className="p-3 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-medium text-gray-900">{design.name}</h4>
              <p className="text-xs text-gray-500">
                {new Date(design.timestamp).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={(e) => handleDeleteDesign(e, design.id)}
              className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}