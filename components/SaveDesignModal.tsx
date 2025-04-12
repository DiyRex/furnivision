// components/SaveDesignModal.tsx
'use client';

import { useState, useRef } from 'react';
import { useDesign } from '../lib/DesignContext';


interface SaveDesignModalProps {
    isOpen: boolean;
    onClose: () => void;
    captureScreenshot: () => string | null;
  }

export default function SaveDesignModal({ isOpen, onClose, captureScreenshot }: SaveDesignModalProps) {
  const { room, furniture, saveDesign } = useDesign();
  const [designName, setDesignName] = useState('');
  
  if (!isOpen) return null;
  
  const handleSave = () => {
    if (!designName.trim()) {
      alert('Please enter a design name');
      return;
    }
    const thumbnail = captureScreenshot();
    saveDesign(designName, thumbnail);
    setDesignName('');
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Save Design</h3>
        
        <div className="mb-4">
          <label htmlFor="design-name" className="block text-sm font-medium text-gray-700 mb-1">
            Design Name
          </label>
          <input
            type="text"
            id="design-name"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            placeholder="Living Room Concept"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}