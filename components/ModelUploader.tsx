// components/ModelUploader.tsx
'use client';

import { useState, useRef } from 'react';
import { useDesign } from '../lib/DesignContext';

export default function ModelUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [modelName, setModelName] = useState('');
  const [modelType, setModelType] = useState('chair');
  const [modelWidth, setModelWidth] = useState('0.5');
  const [modelDepth, setModelDepth] = useState('0.5');
  const [modelHeight, setModelHeight] = useState('0.8');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // We'll need to extend the context with a new function
  const { addCustomFurnitureModel } = useDesign();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // Read the file as array buffer
    const reader = new FileReader();
    reader.onload = (e) => {
      const modelDataUrl = e.target?.result as string;
      
      // Add the model to our collection
      addCustomFurnitureModel({
        id: Date.now().toString(),
        name: modelName || file.name,
        type: modelType,
        url: modelDataUrl,
        format: file.name.split('.').pop()?.toLowerCase() || 'unknown',
        dimensions: {
          width: parseFloat(modelWidth),
          depth: parseFloat(modelDepth),
          height: parseFloat(modelHeight)
        }
      });

      // Reset form
      setModelName('');
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      console.error('Error reading file');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Upload 3D Model</h3>
      <p className="text-sm text-gray-500">Supported formats: GLB, GLTF</p>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="My Furniture"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="chair">Chair</option>
            <option value="table">Table</option>
            <option value="sofa">Sofa</option>
            <option value="storage">Storage</option>
            <option value="decoration">Decoration</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Width (m)
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={modelWidth}
              onChange={(e) => setModelWidth(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Depth (m)
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={modelDepth}
              onChange={(e) => setModelDepth(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Height (m)
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={modelHeight}
              onChange={(e) => setModelHeight(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="pt-2">
          <label
            htmlFor="model-upload"
            className="flex justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            {isUploading ? "Uploading..." : "Upload 3D Model"}
            <input
              id="model-upload"
              type="file"
              ref={fileInputRef}
              accept=".glb,.gltf,.obj"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>
    </div>
  );
}