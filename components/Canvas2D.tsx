// components/Canvas2D.tsx
"use client";

import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { useDesign } from "../lib/DesignContext";
import { Furniture } from "../lib/types";
import FurnitureControls from "./FurnitureControls";

// Define the imperative handle type
export interface Canvas2DHandle {
  captureImage: () => string | null;
}

const Canvas2D = forwardRef<Canvas2DHandle, {}>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    room,
    furniture,
    selectedFurniture,
    selectFurniture,
    updateFurniture,
    backgroundImages,
    furnitureModels,
    getFurnitureModel,
  } = useDesign();

  // State to track dragging and zooming
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(2); // Start with larger zoom

  // Force re-render on view change
  const [forceRender, setForceRender] = useState(0);

  // Cache for model front view images
  const [frontViewCache, setFrontViewCache] = useState<Map<string, HTMLImageElement>>(new Map());
  const [frontViewsLoaded, setFrontViewsLoaded] = useState(false);

  // Expose the captureImage method to parent components
  useImperativeHandle(ref, () => ({
    captureImage: () => {
      if (!canvasRef.current) return null;
      return canvasRef.current.toDataURL("image/png");
    },
  }));

  // Base scale factor (pixels per meter)
  const baseScale = 70; // Increased for larger room
  // Actual scale after zoom
  const scale = baseScale * zoomLevel;

  // Preload front view images for 3D models
  useEffect(() => {
    const loadFrontViews = async () => {
      const newCache = new Map<string, HTMLImageElement>();
      const modelPromises: Promise<void>[] = [];

      // First, check if any furniture item has a modelId
      const modelIds = new Set<string>();
      furniture.forEach(item => {
        if (item.modelId) {
          modelIds.add(item.modelId);
        }
      });

      // For each unique modelId, load the front view
      modelIds.forEach(modelId => {
        const promise = (async () => {
          try {
            const model = await getFurnitureModel(modelId);
            if (model && model.frontView) {
              // Create and load an image
              const img = new Image();
              await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = model.frontView || '';
              });
              newCache.set(modelId, img);
            }
          } catch (error) {
            console.error(`Failed to load front view for model ${modelId}:`, error);
          }
        })();
        modelPromises.push(promise);
      });

      // Wait for all images to load
      await Promise.all(modelPromises);
      
      setFrontViewCache(newCache);
      setFrontViewsLoaded(true);
    };

    loadFrontViews();
  }, [furniture, getFurnitureModel]);

  // Force a render when component mounts or when view changes
  useEffect(() => {
    // Force immediate render
    setForceRender(prev => prev + 1);
    
    // Also force a re-render after a short delay (for when switching views)
    const timer = setTimeout(() => {
      setForceRender(prev => prev + 1);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle zoom in
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2.0));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  // Function to generate fallback outline for various furniture types
  const generateFurnitureOutline = (item: Furniture, ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    switch(item.type) {
      case 'chair':
        // Draw chair outline
        ctx.beginPath();
        // Chair back
        ctx.moveTo(x - width/4, y);
        ctx.lineTo(x + width/4, y);
        ctx.lineTo(x + width/4, y + height * 0.6);
        ctx.lineTo(x - width/4, y + height * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Chair seat
        ctx.beginPath();
        ctx.moveTo(x - width/2, y + height * 0.6);
        ctx.lineTo(x + width/2, y + height * 0.6);
        ctx.lineTo(x + width/2, y + height * 0.7);
        ctx.lineTo(x - width/2, y + height * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Chair legs
        ctx.beginPath();
        // Front left leg
        ctx.moveTo(x - width/3, y + height * 0.7);
        ctx.lineTo(x - width/3, y + height);
        // Front right leg
        ctx.moveTo(x + width/3, y + height * 0.7);
        ctx.lineTo(x + width/3, y + height);
        ctx.stroke();
        break;
        
      case 'table':
        // Draw table outline
        // Table top
        ctx.beginPath();
        ctx.rect(x - width/2, y, width, height * 0.1);
        ctx.fill();
        ctx.stroke();
        
        // Table legs
        ctx.beginPath();
        // Left leg
        ctx.moveTo(x - width/3, y + height * 0.1);
        ctx.lineTo(x - width/3, y + height);
        // Right leg
        ctx.moveTo(x + width/3, y + height * 0.1);
        ctx.lineTo(x + width/3, y + height);
        ctx.stroke();
        break;
        
      default:
        // Default fallback - draw a simple box
        ctx.beginPath();
        ctx.rect(x - width/2, y, width, height);
        ctx.fill();
        ctx.stroke();
    }
  };

  // Render the canvas with a front-facing view (wall view)
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear any previous render
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate offset to center the room
    const offsetX = (canvas.width - room.width * scale) / 2;
    const offsetY = (canvas.height - room.height * scale) / 2;

    // Find active background if any
    const activeBackground = room.activeBackgroundId
      ? backgroundImages.find((bg) => bg.id === room.activeBackgroundId)
      : null;

    const renderRoom = () => {
      if (activeBackground) {
        // Create an image element
        const img = new Image();
        
        img.onload = () => {
          // Draw background image (stretching it to fill the wall)
          ctx.drawImage(
            img,
            offsetX,
            offsetY,
            room.width * scale,
            room.height * scale
          );

          // Add a slight overlay for better visibility of furniture
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
          ctx.fillRect(
            offsetX,
            offsetY,
            room.width * scale,
            room.height * scale
          );

          // Draw wall border
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 3;
          ctx.strokeRect(
            offsetX,
            offsetY,
            room.width * scale,
            room.height * scale
          );

          // Render furniture after background is loaded
          renderFurniture();
        };
        
        // Error handling
        img.onerror = () => {
          console.error("Failed to load image");
          // Fallback to solid color
          drawSolidColorRoom();
        };
        
        img.src = activeBackground.url;
      } else {
        drawSolidColorRoom();
      }
    };

    const drawSolidColorRoom = () => {
      // Make sure we use the correct wall color from room state, defaulting to a color if undefined
      const wallColor = room.wallColor || "#F5F5F5";
      const floorColor = room.floorColor || "#D2B48C";
      
      // Draw wall
      ctx.fillStyle = wallColor;
      ctx.fillRect(offsetX, offsetY, room.width * scale, room.height * scale);
    
      // Draw wall border
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        offsetX,
        offsetY,
        room.width * scale,
        room.height * scale
      );
    
      // Draw floor line
      ctx.strokeStyle = floorColor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + room.height * scale);
      ctx.lineTo(offsetX + room.width * scale, offsetY + room.height * scale);
      ctx.stroke();
    
      // Render furniture immediately for solid color background
      renderFurniture();
    };

    const renderFurniture = () => {
      // Draw furniture (sort by Y position to handle overlaps)
      const sortedFurniture = [...furniture].sort((a, b) => {
        if (!a.position || !b.position) return 0;
        return a.position.y - b.position.y;
      });
      
      sortedFurniture.forEach(item => {
        if (!item.position) return;
        
        ctx.save();
        
        // In front view, x is horizontal position
        const x = offsetX + item.position.x * scale;
        
        // Calculate display width and height
        const displayWidth = item.width * scale;
        const displayHeight = item.height * scale;
        
        // Perspective effect based on z position (distance from wall) - only for shadow
        const depthFactor = 1 - (item.position.z / room.length * 0.3); // Reduced perspective effect
        
        // Draw item shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(
          x, 
          offsetY + room.height * scale, 
          displayWidth/2 * depthFactor, 
          displayWidth/5 * depthFactor, 
          0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Calculate y position to be at the bottom of the room
        const y = offsetY + room.height * scale - displayHeight;
        
        // Check if this item is selected
        const isSelected = item.id === selectedFurniture?.id;
        
        // Check if this is a 3D model with a front view image
        if (item.modelId && frontViewCache.has(item.modelId)) {
          const frontViewImg = frontViewCache.get(item.modelId);
          if (frontViewImg) {
            // FIXED: Use full width for the image, no scaling based on depth
            // This ensures the model appears at the proper width
            const imgWidth = displayWidth;
            const imgHeight = displayHeight;
            
            // If selected, just draw the outline
            if (isSelected) {
              // Draw a thin outline - no fill
              ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'; // Blue but transparent
              ctx.lineWidth = 1;
              ctx.setLineDash([5, 3]); // Dashed line
              ctx.strokeRect(x - imgWidth/2, y, imgWidth, imgHeight);
              ctx.setLineDash([]); // Reset to solid line
            }
            
            // Draw the front view image directly
            ctx.drawImage(frontViewImg, x - imgWidth/2, y, imgWidth, imgHeight);
            
            // Add a '3D' indicator below the image
            ctx.fillStyle = '#3B82F6';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('3D', x, y + imgHeight + 12);
          }
        } else {
          // No front view available, use fallback outline
          ctx.fillStyle = item.color;
          
          // If selected, use a different stroke style
          if (isSelected) {
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'; // Blue but transparent
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 3]); // Dashed line
          } else {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
          }
          
          // Non-3D models still use perspective for width
          generateFurnitureOutline(
            item, 
            ctx, 
            x, 
            y, 
            displayWidth * depthFactor, 
            displayHeight
          );
          
          // Reset line style
          ctx.setLineDash([]);
          
          // Add 3D indicator if it's a 3D model
          if (item.modelId) {
            ctx.fillStyle = '#3B82F6';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('3D', x, y + displayHeight + 12);
          }
        }
        
        // Draw label
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          item.name,
          x,
          y - 5
        );
        
        ctx.restore();
      });
    };

    // Trigger room rendering
    renderRoom();

  }, [
    room, 
    furniture, 
    selectedFurniture, 
    backgroundImages, 
    scale, 
    zoomLevel, 
    forceRender, 
    frontViewCache, 
    frontViewsLoaded
  ]);

  // Handle canvas mouse down (start dragging)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate room coordinates
    const offsetX = (canvas.width - room.width * scale) / 2;
    const offsetY = (canvas.height - room.height * scale) / 2;

    // Check if clicked on furniture
    for (let i = furniture.length - 1; i >= 0; i--) {
      const item = furniture[i];
      if (!item.position) continue;

      // Calculate furniture position in canvas coordinates
      const itemX = offsetX + item.position.x * scale;
      const itemY = offsetY + room.height * scale - item.height * scale;
      
      // Use full width for 3D models with front view
      const displayWidth = item.width * scale;
      const displayHeight = item.height * scale;
      
      // Check if click is within item bounds - use full width for better click detection
      if (
        x >= itemX - displayWidth/2 && 
        x <= itemX + displayWidth/2 &&
        y >= itemY && 
        y <= itemY + displayHeight
      ) {
        selectFurniture(item);
        setIsDragging(true);
        setDragStartX(x);
        setDragStartY(y);
        return;
      }
    }

    // If no furniture was clicked, deselect
    selectFurniture(null);
  };

  // Handle canvas mouse move (drag furniture)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedFurniture || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Calculate the delta in pixels
    const deltaX = x - dragStartX;

    // Convert to meters (accounting for zoom)
    const deltaXMeters = deltaX / scale;

    // Update position (only X in wall view)
    if (selectedFurniture.position) {
      const newPosition = {
        ...selectedFurniture.position,
        x: Math.max(
          selectedFurniture.width / 2,
          Math.min(
            room.width - selectedFurniture.width / 2,
            selectedFurniture.position.x + deltaXMeters
          )
        ),
      };

      // Update the furniture
      updateFurniture({
        ...selectedFurniture,
        position: newPosition,
      });
    }

    // Reset drag start position
    setDragStartX(x);
    setDragStartY(e.clientY - rect.top);
  };

  // Handle canvas mouse up (end dragging)
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Resize canvas when window resizes or first mounting
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;

      const container = canvasRef.current.parentElement;
      if (!container) return;

      // Set canvas size to match container
      canvasRef.current.width = container.clientWidth;
      canvasRef.current.height = container.clientHeight;
      
      // Force re-render after resize
      setForceRender(prev => prev + 1);
    };

    // Initial size
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full"
      />
      <FurnitureControls />
      
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-2 flex space-x-2 mb-12">
        <button 
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 rounded"
          title="Zoom In"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 rounded"
          title="Zoom Out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button 
          onClick={() => setZoomLevel(1.2)}
          className="p-2 hover:bg-gray-100 rounded"
          title="Reset Zoom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
});

Canvas2D.displayName = "Canvas2D";

export default Canvas2D;