// lib/types.ts
export interface Room {
    width: number;
    length: number;
    height: number;
    shape: 'rectangular' | 'l-shaped';
    wallColor: string;
    floorColor: string;
  }
  
  export interface Position {
    x: number;
    y: number;
    z: number;
  }
  
  export interface Furniture {
    id: number;
    type: string;
    name: string;
    width: number;
    depth: number;
    height: number;
    color: string;
    position?: Position;
    rotation?: number;
    modelId?: string;
  }

export interface Design {
  id: string;
  name: string;
  timestamp: string;
  room: Room;
  furniture: Furniture[];
  thumbnail?: string; // We could add thumbnails later
}

export interface BackgroundImage {
  id: string;
  name: string;
  url: string;
}

export interface Room {
  width: number;
  length: number;
  height: number;
  shape: 'rectangular' | 'l-shaped';
  wallColor: string;
  floorColor: string;
  activeBackgroundId?: string | null; // ID of the active background image
}

export interface ModelDimensions {
  width: number;
  depth: number;
  height: number;
}

export interface FurnitureModel {
  id: string;
  name: string;
  type: string;
  url: string;
  format: string;
  dimensions: ModelDimensions;
  thumbnail?: string;
}