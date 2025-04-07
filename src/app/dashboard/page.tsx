// app/dashboard/page.tsx (update)
'use client';

import { useState } from 'react';
import RoomSettings from '../../../components/RoomSettings';
import ColorPicker from '../../../components/ColorPicker';
import FurnitureSelector from '../../../components/FurnitureSelector';

export default function Dashboard() {
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [activeTab, setActiveTab] = useState('room'); // 'room', 'furniture', or 'colors'

  return (
    <div className="flex h-screen flex-col">
      {/* Navbar - unchanged */}
      <div className="bg-white shadow-sm h-16 flex items-center px-6">
        <h1 className="text-xl font-bold text-indigo-600">Furniture Design Studio</h1>
        <div className="ml-auto flex items-center space-x-4">
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-800 font-medium">DS</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - update tabs to use state */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px" aria-label="Tabs">
              <button 
                onClick={() => setActiveTab('room')}
                className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'room'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Room
              </button>
              <button 
                onClick={() => setActiveTab('furniture')}
                className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'furniture'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Furniture
              </button>
              <button 
                onClick={() => setActiveTab('colors')}
                className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'colors'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Colors
              </button>
            </nav>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'room' && <RoomSettings />}
            {activeTab === 'furniture' && <FurnitureSelector />}
            {activeTab === 'colors' && <ColorPicker />}
            </div>
        </div>
        
        {/* Main workspace - unchanged */}
        <div className="flex-1 overflow-hidden bg-gray-50 p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold text-gray-800">Room Designer</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setView('2d')}
                className={`px-4 py-2 rounded ${
                  view === '2d' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border'
                }`}
              >
                2D View
              </button>
              <button
                onClick={() => setView('3d')}
                className={`px-4 py-2 rounded ${
                  view === '3d' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border'
                }`}
              >
                3D View
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm h-full flex items-center justify-center">
            <p className="text-gray-500">{view === '2d' ? '2D' : '3D'} workspace will render here</p>
          </div>
        </div>
      </div>
    </div>
  );
}