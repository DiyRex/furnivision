// lib/DesignContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Room, Furniture, Design } from './types';

interface DesignContextType {
  room: Room;
  furniture: Furniture[];
  selectedFurniture: Furniture | null;
  updateRoom: (room: Partial<Room>) => void;
  addFurniture: (furniture: Omit<Furniture, 'position' | 'rotation'>) => void;
  updateFurniture: (furniture: Furniture) => void;
  removeFurniture: (id: number) => void;
  selectFurniture: (furniture: Furniture | null) => void;
  saveDesign: (name: string, thumbnail?: string | null) => void;
  loadDesign: (design: Design) => void;
  deleteDesign: (id: string) => void;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export function DesignProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<Room>({
    width: 5,
    length: 5,
    height: 3,
    shape: 'rectangular',
    wallColor: '#F5F5F5',
    floorColor: '#D2B48C'
  });

  
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [selectedFurniture, setSelectedFurniture] = useState<Furniture | null>(null);
  const [nextId, setNextId] = useState(1);
  
  const updateRoom = (newRoomData: Partial<Room>) => {
    setRoom({ ...room, ...newRoomData });
  };
  
  const addFurniture = (item: Omit<Furniture, 'position' | 'rotation'>) => {
    const newFurniture: Furniture = {
      ...item,
      id: nextId,
      position: { x: room.width / 2, y: 0, z: room.length / 2 },
      rotation: 0
    };
    
    setFurniture([...furniture, newFurniture]);
    setSelectedFurniture(newFurniture);
    setNextId(nextId + 1);
  };
  
  const updateFurniture = (updatedFurniture: Furniture) => {
    setFurniture(furniture.map(item => 
      item.id === updatedFurniture.id ? updatedFurniture : item
    ));
    
    if (selectedFurniture?.id === updatedFurniture.id) {
      setSelectedFurniture(updatedFurniture);
    }
  };
  
  const removeFurniture = (id: number) => {
    setFurniture(furniture.filter(item => item.id !== id));
    
    if (selectedFurniture?.id === id) {
      setSelectedFurniture(null);
    }
  };
  
  const selectFurniture = (item: Furniture | null) => {
    setSelectedFurniture(item);
  };
  
  const saveDesign = (name: string, thumbnail: string | null = null) => {
    const design: Design = {
      id: crypto.randomUUID(),
      name,
      timestamp: new Date().toISOString(),
      room,
      furniture,
    };

  // Only add thumbnail if it's a non-null string
  if (thumbnail) {
    design.thumbnail = thumbnail;
  }
  
  // Get existing designs
  const savedDesignsJson = localStorage.getItem('savedDesigns');
  let savedDesigns: Design[] = [];
  
  if (savedDesignsJson) {
    try {
      savedDesigns = JSON.parse(savedDesignsJson);
    } catch (error) {
      console.error('Error parsing saved designs:', error);
    }
  }
  
  // Add new design
  savedDesigns.push(design);
  
  // Save updated list
  localStorage.setItem('savedDesigns', JSON.stringify(savedDesigns));
  alert('Design saved successfully!');
  };

  const loadDesign = (design: Design) => {
    setRoom(design.room);
    setFurniture(design.furniture);
    setSelectedFurniture(null);
  };

  const deleteDesign = (id: string) => {
    const savedDesignsJson = localStorage.getItem('savedDesigns');
    if (!savedDesignsJson) return;
    
    try {
      const savedDesigns: Design[] = JSON.parse(savedDesignsJson);
      const updatedDesigns = savedDesigns.filter(design => design.id !== id);
      localStorage.setItem('savedDesigns', JSON.stringify(updatedDesigns));
    } catch (error) {
      console.error('Error deleting design:', error);
    }
  };
  
  return (
    <DesignContext.Provider
      value={{
        room,
        furniture,
        selectedFurniture,
        updateRoom,
        addFurniture,
        updateFurniture,
        removeFurniture,
        selectFurniture,
        saveDesign,
        loadDesign,
        deleteDesign
      }}
    >
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const context = useContext(DesignContext);
  
  if (context === undefined) {
    throw new Error('useDesign must be used within a DesignProvider');
  }
  
  return context;
}