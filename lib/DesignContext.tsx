// lib/DesignContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Room, Furniture, Design, BackgroundImage, FurnitureModel } from "./types";

interface DesignContextType {
  room: Room;
  furniture: Furniture[];
  selectedFurniture: Furniture | null;
  furnitureModels: FurnitureModel[];
  addCustomFurnitureModel: (model: FurnitureModel) => void;
  removeFurnitureModel: (id: string) => void;
  addFurnitureWithModel: (modelId: string) => void;
  getFurnitureModel: (id: string) => Promise<FurnitureModel | null>;
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

// Initialize IndexedDB for models
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FurniVisionDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('models')) {
        db.createObjectStore('models', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Function to save model to IndexedDB
const saveModelToDB = async (model: FurnitureModel) => {
  try {
    const db = await initDB() as IDBDatabase;
    const transaction = db.transaction(['models'], 'readwrite');
    const store = transaction.objectStore('models');
    return new Promise((resolve, reject) => {
      const request = store.put(model);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error saving model to IndexedDB:', error);
    throw error;
  }
};

// Function to get model from IndexedDB
const getModelFromDB = async (id: string): Promise<FurnitureModel | null> => {
  try {
    const db = await initDB() as IDBDatabase;
    const transaction = db.transaction(['models'], 'readonly');
    const store = transaction.objectStore('models');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting model from IndexedDB:', error);
    return null;
  }
};

// Function to delete model from IndexedDB
const deleteModelFromDB = async (id: string) => {
  try {
    const db = await initDB() as IDBDatabase;
    const transaction = db.transaction(['models'], 'readwrite');
    const store = transaction.objectStore('models');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error deleting model from IndexedDB:', error);
    throw error;
  }
};

// Function to get all models from IndexedDB
const getAllModelsFromDB = async (): Promise<FurnitureModel[]> => {
  try {
    const db = await initDB() as IDBDatabase;
    const transaction = db.transaction(['models'], 'readonly');
    const store = transaction.objectStore('models');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting all models from IndexedDB:', error);
    return [];
  }
};

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

  const [furnitureModels, setFurnitureModels] = useState<FurnitureModel[]>([]);
  // Load furniture models from IndexedDB on initial load
  useEffect(() => {
    const loadModels = async () => {
      try {
        const models = await getAllModelsFromDB();
        setFurnitureModels(models);
      } catch (error) {
        console.error("Error loading furniture models:", error);
      }
    };
    
    loadModels();
  }, []);

  // Add a custom furniture model
  const addCustomFurnitureModel = async (model: FurnitureModel) => {
    try {
      // Save model to IndexedDB
      await saveModelToDB(model);
      
      // Update state with metadata only (no url)
      const metadataModel = {
        ...model,
        url: '', // Don't store the URL in state to save memory
      };
      
      setFurnitureModels(prev => [...prev, metadataModel]);
    } catch (error) {
      console.error('Error adding model:', error);
      alert('Failed to add model. The file might be too large.');
    }
  };

  // Remove a furniture model
  const removeFurnitureModel = async (id: string) => {
    try {
      // Delete from IndexedDB
      await deleteModelFromDB(id);
      
      // Update state
      setFurnitureModels(prev => prev.filter(model => model.id !== id));
    } catch (error) {
      console.error('Error removing model:', error);
    }
  };

  // Function to get a furniture model with full data
  const getFurnitureModel = async (id: string): Promise<FurnitureModel | null> => {
    return await getModelFromDB(id);
  };

  // Add furniture with a 3D model
  const addFurnitureWithModel = (modelId: string) => {
    const model = furnitureModels.find((m) => m.id === modelId);
    if (!model) return;

    const newFurniture: Furniture = {
      id: nextId,
      type: model.type,
      name: model.name,
      width: model.dimensions.width,
      depth: model.dimensions.depth,
      height: model.dimensions.height,
      color: "#CCCCCC", // Default color
      position: { x: room.width / 2, y: 0, z: room.length / 2 },
      rotation: 0,
      modelId: model.id, // Reference to the model
    };

    setFurniture([...furniture, newFurniture]);
    setSelectedFurniture(newFurniture);
    setNextId(nextId + 1);
  };

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
        furnitureModels,
        addCustomFurnitureModel,
        removeFurnitureModel,
        addFurnitureWithModel,
        getFurnitureModel,
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
