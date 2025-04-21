// lib/DesignContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Room, Furniture, Design, BackgroundImage } from "./types";

interface DesignContextType {
  room: Room;
  furniture: Furniture[];
  selectedFurniture: Furniture | null;
  backgroundImages: BackgroundImage[];
  updateRoom: (room: Partial<Room>) => void;
  addFurniture: (furniture: Omit<Furniture, "position" | "rotation">) => void;
  updateFurniture: (furniture: Furniture) => void;
  removeFurniture: (id: number) => void;
  selectFurniture: (furniture: Furniture | null) => void;
  saveDesign: (name: string, thumbnail?: string | null) => void;
  loadDesign: (design: Design) => void;
  deleteDesign: (id: string) => void;
  addBackgroundImage: (image: BackgroundImage) => void;
  removeBackgroundImage: (id: string) => void;
  setActiveBackground: (id: string | null) => void;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export function DesignProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<Room>({
    width: 5,
    length: 5,
    height: 3,
    shape: "rectangular",
    wallColor: "#F5F5F5",
    floorColor: "#D2B48C",
  });

  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [selectedFurniture, setSelectedFurniture] = useState<Furniture | null>(
    null
  );
  const [nextId, setNextId] = useState(1);
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>(
    []
  );

  // Load background images from localStorage on initial load
  useEffect(() => {
    const savedBackgrounds = localStorage.getItem("backgroundImages");
    if (savedBackgrounds) {
      try {
        setBackgroundImages(JSON.parse(savedBackgrounds));
      } catch (error) {
        console.error("Error loading background images:", error);
      }
    }
  }, []);

  // Save background images to localStorage when changed
  useEffect(() => {
    if (backgroundImages.length > 0) {
      localStorage.setItem(
        "backgroundImages",
        JSON.stringify(backgroundImages)
      );
    }
  }, [backgroundImages]);

  const addBackgroundImage = (image: BackgroundImage) => {
    setBackgroundImages([...backgroundImages, image]);
    // Automatically set as active
    setActiveBackground(image.id);
  };

  const removeBackgroundImage = (id: string) => {
    setBackgroundImages(backgroundImages.filter((image) => image.id !== id));

    // If active background is removed, set to null
    if (room.activeBackgroundId === id) {
      setActiveBackground(null);
    }
  };

  const setActiveBackground = (id: string | null) => {
    setRoom({ ...room, activeBackgroundId: id });
  };

  const updateRoom = (newRoomData: Partial<Room>) => {
    // Immediately update the room with new data
    setRoom(prev => ({ ...prev, ...newRoomData }));
    
    // Only check for significant changes if dimensions or shape are changing
    const hasDimensionalChanges = 
      newRoomData.width !== undefined || 
      newRoomData.length !== undefined || 
      newRoomData.height !== undefined ||
      newRoomData.shape !== undefined;
    
    // Skip this check for color changes
    if (!hasDimensionalChanges) {
      return;
    }
    
    // If dimensions are changed significantly, handle furniture positioning
    const significantChange = 
      (newRoomData.width && Math.abs(newRoomData.width - room.width) > 1) ||
      (newRoomData.length && Math.abs(newRoomData.length - room.length) > 1) ||
      (newRoomData.shape !== undefined && newRoomData.shape !== room.shape);
    
    if (significantChange && furniture.length > 0) {
      // Either reposition furniture or clear it
      if (confirm('Changing room dimensions significantly. Would you like to keep furniture and reposition it?')) {
        // Reposition furniture to fit in new room
        const updatedFurniture = furniture.map(item => {
          if (!item.position) return item;
          
          // Get new room dimensions (using new or current values)
          const newWidth = newRoomData.width || room.width;
          const newLength = newRoomData.length || room.length;
          
          // Calculate scaling factors
          const widthRatio = newWidth / room.width;
          const lengthRatio = newLength / room.length;
          
          // Scale position proportionally
          return {
            ...item,
            position: {
              x: Math.min(newWidth - item.width/2, Math.max(item.width/2, item.position.x * widthRatio)),
              y: item.position.y,
              z: Math.min(newLength - item.depth/2, Math.max(item.depth/2, item.position.z * lengthRatio))
            }
          };
        });
        
        setFurniture(updatedFurniture);
      } else {
        // Clear furniture
        setFurniture([]);
        setSelectedFurniture(null);
      }
    }
  };

  const updateFurniturePosition = (furniture: Furniture) => {
    updateFurniture(furniture);
  };

  const addFurniture = (item: Omit<Furniture, "position" | "rotation">) => {
    const newFurniture: Furniture = {
      ...item,
      id: nextId,
      position: { x: room.width / 2, y: 0, z: room.length / 2 },
      rotation: 0,
    };

    setFurniture([...furniture, newFurniture]);
    setSelectedFurniture(newFurniture);
    setNextId(nextId + 1);
  };

  const updateFurniture = (updatedFurniture: Furniture) => {
    setFurniture(
      furniture.map((item) =>
        item.id === updatedFurniture.id ? updatedFurniture : item
      )
    );

    if (selectedFurniture?.id === updatedFurniture.id) {
      setSelectedFurniture(updatedFurniture);
    }
  };

  const removeFurniture = (id: number) => {
    setFurniture(furniture.filter((item) => item.id !== id));

    if (selectedFurniture?.id === id) {
      setSelectedFurniture(null);
    }
  };

  const selectFurniture = (item: Furniture | null) => {
    setSelectedFurniture(item);
  };

  const saveDesign = (name: string, thumbnail?: string | null) => {
    const design: Design = {
      id: crypto.randomUUID(),
      name,
      timestamp: new Date().toISOString(),
      room,
      furniture,
      thumbnail: thumbnail || undefined,
    };

    // Only add thumbnail if it's a non-null string
    if (thumbnail) {
      design.thumbnail = thumbnail;
    }

    // Get existing designs
    const savedDesignsJson = localStorage.getItem("savedDesigns");
    let savedDesigns: Design[] = [];

    if (savedDesignsJson) {
      try {
        savedDesigns = JSON.parse(savedDesignsJson);
      } catch (error) {
        console.error("Error parsing saved designs:", error);
      }
    }

    // Add new design
    savedDesigns.push(design);

    // Save updated list
    localStorage.setItem("savedDesigns", JSON.stringify(savedDesigns));
    alert("Design saved successfully!");
  };

  const loadDesign = (design: Design) => {
    setRoom(design.room);
    setFurniture(design.furniture);
    setSelectedFurniture(null);
  };

  const deleteDesign = (id: string) => {
    const savedDesignsJson = localStorage.getItem("savedDesigns");
    if (!savedDesignsJson) return;

    try {
      const savedDesigns: Design[] = JSON.parse(savedDesignsJson);
      const updatedDesigns = savedDesigns.filter((design) => design.id !== id);
      localStorage.setItem("savedDesigns", JSON.stringify(updatedDesigns));
    } catch (error) {
      console.error("Error deleting design:", error);
    }
  };

  return (
    <DesignContext.Provider
      value={{
        room,
        furniture,
        selectedFurniture,
        backgroundImages,
        updateRoom,
        addFurniture,
        updateFurniture,
        removeFurniture,
        selectFurniture,
        saveDesign,
        loadDesign,
        deleteDesign,
        addBackgroundImage,
        removeBackgroundImage,
        setActiveBackground,
      }}
    >
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const context = useContext(DesignContext);

  if (context === undefined) {
    throw new Error("useDesign must be used within a DesignProvider");
  }

  return context;
}
