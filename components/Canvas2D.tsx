// components/Canvas2D.tsx
'use client';

import { useRef, useEffect } from 'react';
import { useDesign } from '../lib/DesignContext';
import { Furniture } from '../lib/types';

export default function Canvas2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { room, furniture, selectedFurniture, selectFurniture } = useDesign();
  
  // Scale factor (pixels per meter)
  const scale = 50;
  
  // Render the canvas when room or furniture changes
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate offset to center the room
    const offsetX = (canvas.width - room.width * scale) / 2;
    const offsetY = (canvas.height - room.length * scale) / 2;
    
    // Draw room
    ctx.fillStyle = room.floorColor;
    ctx.fillRect(offsetX, offsetY, room.width * scale, room.length * scale);
    
    // Draw walls
    ctx.strokeStyle = room.wallColor;
    ctx.lineWidth = 5;
    ctx.strokeRect(offsetX, offsetY, room.width * scale, room.length * scale);
    
    // Draw furniture
    furniture.forEach(item => {
      if (!item.position) return;
      
      ctx.save();
      
      // Translate to item position
      ctx.translate(
        offsetX + item.position.x * scale,
        offsetY + item.position.z * scale
      );
      
      // Rotate if needed
      if (item.rotation) {
        ctx.rotate(item.rotation);
      }
      
      // Draw item
      ctx.fillStyle = item.color;
      ctx.fillRect(
        -item.width * scale / 2,
        -item.depth * scale / 2,
        item.width * scale,
        item.depth * scale
      );
      
      // Draw outline (highlight if selected)
      ctx.strokeStyle = item.id === selectedFurniture?.id ? '#3B82F6' : '#000';
      ctx.lineWidth = item.id === selectedFurniture?.id ? 2 : 1;
      ctx.strokeRect(
        -item.width * scale / 2,
        -item.depth * scale / 2,
        item.width * scale,
        item.depth * scale
      );
      
      // Draw label
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        item.name,
        0,
        0
      );
      
      ctx.restore();
    });
    
  }, [room, furniture, selectedFurniture]);
  
  // Handle canvas click to select furniture
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate room coordinates
    const offsetX = (canvas.width - room.width * scale) / 2;
    const offsetY = (canvas.height - room.length * scale) / 2;
    const roomX = (x - offsetX) / scale;
    const roomY = (y - offsetY) / scale;
    
    // Check if clicked on furniture (in reverse order to get top items first)
    let clickedItem: Furniture | null = null;
    
    for (let i = furniture.length - 1; i >= 0; i--) {
      const item = furniture[i];
      if (!item.position) continue;
      
      // Simple bounding box check
      const left = item.position.x - item.width / 2;
      const right = item.position.x + item.width / 2;
      const top = item.position.z - item.depth / 2;
      const bottom = item.position.z + item.depth / 2;
      
      if (roomX >= left && roomX <= right && roomY >= top && roomY <= bottom) {
        clickedItem = item;
        break;
      }
    }
    
    selectFurniture(clickedItem);
  };
  
  // Resize canvas when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      
      const container = canvasRef.current.parentElement;
      if (!container) return;
      
      canvasRef.current.width = container.clientWidth;
      canvasRef.current.height = container.clientHeight;
      
      // Trigger re-render
      const event = new Event('resize');
      window.dispatchEvent(event);
    };
    
    // Initial size
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="w-full h-full"
    />
  );
}