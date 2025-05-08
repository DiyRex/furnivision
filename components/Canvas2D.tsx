// components/Canvas2D.tsx
"use client";

import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
} from "react";
import { useDesign } from "../lib/DesignContext";
import { Furniture } from "../lib/types";
import FurnitureControls from "./FurnitureControls";

// Define the imperative handle type
export interface Canvas2DHandle {
  captureImage: () => string | null;
}

// Interface for 2D display scale
interface DisplayScale {
  x: number;
  y: number;
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
    getFurnitureModel,
  } = useDesign();

  // State for interaction and view management
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragStartY, setDragStartY] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [forceRender, setForceRender] = useState<number>(0);
  
  // Background image cache to prevent flickering
  const [cachedBackground, setCachedBackground] = useState<HTMLImageElement | null>(null);
  const [cachedBgUrl, setCachedBgUrl] = useState<string>("");
  
  // Front view images for 3D models
  const [modelFrontViews, setModelFrontViews] = useState<Map<string, HTMLImageElement>>(new Map());
  const [frontViewsLoaded, setFrontViewsLoaded] = useState<boolean>(false);
  
  // 2D-only display scales (doesn't affect 3D models)
  const [displayScales, setDisplayScales] = useState<Map<number, DisplayScale>>(new Map());

  // Scale factors
  const baseScale = 180; // Pixels per meter
  const scale = baseScale * zoomLevel;

  // Expose the captureImage method to parent components
  useImperativeHandle(ref, () => ({
    captureImage: () => {
      if (!canvasRef.current) return null;
      return canvasRef.current.toDataURL("image/png");
    },
  }));

  // Get display scale for a specific furniture item
  const getDisplayScale = useCallback((furnitureId: number): DisplayScale => {
    return displayScales.get(furnitureId) || { x: 1, y: 1 };
  }, [displayScales]);

  // Update 2D display scale (doesn't affect actual furniture dimensions)
  const updateDisplayScale = useCallback((furnitureId: number, newScale: DisplayScale): void => {
    setDisplayScales(prev => {
      const newMap = new Map(prev);
      newMap.set(furnitureId, newScale);
      return newMap;
    });
  }, []);

  // Load front view images for 3D models
  useEffect(() => {
    const loadFrontViews = async () => {
      const newCache = new Map<string, HTMLImageElement>();
      const modelPromises: Promise<void>[] = [];

      // Get all unique model IDs
      const modelIds = new Set<string>();
      furniture.forEach(item => {
        if (item.modelId) modelIds.add(item.modelId);
      });

      // Load front views for each model
      modelIds.forEach(modelId => {
        const promise = (async () => {
          try {
            const model = await getFurnitureModel(modelId);
            if (model && model.frontView) {
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

      await Promise.all(modelPromises);
      setModelFrontViews(newCache);
      setFrontViewsLoaded(true);
    };

    loadFrontViews();
  }, [furniture, getFurnitureModel]);

  // Force initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceRender(prev => prev + 1);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback((): void => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2.0));
  }, []);

  const handleZoomOut = useCallback((): void => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleResetZoom = useCallback((): void => {
    setZoomLevel(1.0);
  }, []);

  // Draw furniture shapes
  // Draw chair
  const drawChair = (
    ctx: CanvasRenderingContext2D,
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    color: string,
    isSelected: boolean
  ): void => {
    ctx.save();

    // Set styles
    ctx.fillStyle = color;
    ctx.strokeStyle = isSelected ? '#3B82F6' : '#000';
    ctx.lineWidth = isSelected ? 2 : 1;

    // Chair dimensions
    const backHeight = height * 0.65;
    const seatDepth = height * 0.35;
    const legWidth = width * 0.08;

    // Draw chair back
    ctx.beginPath();
    ctx.rect(x - width/2, y, width, backHeight);
    ctx.fill();
    ctx.stroke();

    // Draw seat
    ctx.beginPath();
    ctx.rect(x - width/2, y + backHeight, width, seatDepth * 0.3);
    ctx.fill();
    ctx.stroke();

    // Draw legs
    ctx.beginPath();
    // Left front leg
    ctx.rect(x - width/2, y + backHeight + seatDepth * 0.3, legWidth, seatDepth * 0.7);
    // Right front leg
    ctx.rect(x + width/2 - legWidth, y + backHeight + seatDepth * 0.3, legWidth, seatDepth * 0.7);
    ctx.fill();
    ctx.stroke();

    // Chair details - decorative back
    ctx.beginPath();
    const barCount = 3;
    const barSpacing = backHeight / (barCount + 1);
    const barWidth = width * 0.8;
    const barHeight = backHeight * 0.05;
    
    for (let i = 0; i < barCount; i++) {
      ctx.rect(
        x - barWidth/2,
        y + (i + 1) * barSpacing,
        barWidth,
        barHeight
      );
    }
    
    // Use a slightly darker color for details
    const darkerColor = adjustColor(color, -20);
    ctx.fillStyle = darkerColor;
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  // Draw table
  const drawTable = (
    ctx: CanvasRenderingContext2D,
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    color: string,
    isSelected: boolean
  ): void => {
    ctx.save();

    // Set styles
    ctx.fillStyle = color;
    ctx.strokeStyle = isSelected ? '#3B82F6' : '#000';
    ctx.lineWidth = isSelected ? 2 : 1;

    // Table dimensions
    const topThickness = height * 0.08;
    const legWidth = width * 0.08;

    // Draw table top
    ctx.beginPath();
    ctx.rect(x - width/2, y, width, topThickness);
    ctx.fill();
    ctx.stroke();

    // Draw legs
    ctx.beginPath();
    // Left leg
    ctx.rect(x - width/2 + legWidth, y + topThickness, legWidth, height - topThickness);
    // Right leg
    ctx.rect(x + width/2 - legWidth * 2, y + topThickness, legWidth, height - topThickness);
    ctx.fill();
    ctx.stroke();

    // Draw support beam
    ctx.beginPath();
    ctx.rect(
      x - width/3,
      y + height * 0.6,
      width * 2/3,
      height * 0.05
    );
    
    // Use a slightly darker color for details
    const darkerColor = adjustColor(color, -20);
    ctx.fillStyle = darkerColor;
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  // Draw sofa
  const drawSofa = (
    ctx: CanvasRenderingContext2D,
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    color: string,
    isSelected: boolean
  ): void => {
    ctx.save();

    // Set styles
    ctx.fillStyle = color;
    ctx.strokeStyle = isSelected ? '#3B82F6' : '#000';
    ctx.lineWidth = isSelected ? 2 : 1;

    // Sofa dimensions
    const backHeight = height * 0.6;
    const seatHeight = height - backHeight;
    const armWidth = width * 0.15;
    const cushionSpacing = width * 0.05;

    // Draw sofa back
    ctx.beginPath();
    ctx.rect(x - width/2, y, width, backHeight);
    ctx.fill();
    ctx.stroke();

    // Draw sofa seat
    ctx.beginPath();
    ctx.rect(x - width/2, y + backHeight, width, seatHeight * 0.6);
    ctx.fill();
    ctx.stroke();

    // Draw armrests
    ctx.beginPath();
    // Left armrest
    ctx.rect(x - width/2, y, armWidth, backHeight + seatHeight * 0.3);
    // Right armrest
    ctx.rect(x + width/2 - armWidth, y, armWidth, backHeight + seatHeight * 0.3);
    
    // Darker color for armrests
    const darkerColor = adjustColor(color, -30);
    ctx.fillStyle = darkerColor;
    ctx.fill();
    ctx.stroke();

    // Draw legs
    ctx.beginPath();
    const legWidth = width * 0.05;
    const legHeight = height * 0.1;
    
    // Left front leg
    ctx.rect(x - width/2 + armWidth/2 - legWidth/2, y + height - legHeight, legWidth, legHeight);
    // Right front leg
    ctx.rect(x + width/2 - armWidth/2 - legWidth/2, y + height - legHeight, legWidth, legHeight);
    
    // Brown color for legs
    ctx.fillStyle = '#5C4033';
    ctx.fill();
    ctx.stroke();

    // Draw cushions
    ctx.beginPath();
    const cushionCount = width > 1.2 ? 3 : 2;
    const cushionWidth = (width - 2 * armWidth - (cushionCount + 1) * cushionSpacing) / cushionCount;
    
    for (let i = 0; i < cushionCount; i++) {
      const cushionX = x - width/2 + armWidth + cushionSpacing + (cushionWidth + cushionSpacing) * i;
      
      // Seat cushion
      ctx.rect(
        cushionX,
        y + backHeight + seatHeight * 0.1,
        cushionWidth,
        seatHeight * 0.4
      );
    }
    
    // Lighter color for cushions
    const lighterColor = adjustColor(color, 20);
    ctx.fillStyle = lighterColor;
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  // Helper function to adjust color brightness
  const adjustColor = (color: string, amount: number): string => {
    // Convert hex to RGB
    let r = parseInt(color.substring(1, 3), 16);
    let g = parseInt(color.substring(3, 5), 16);
    let b = parseInt(color.substring(5, 7), 16);
    
    // Adjust values
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Draw furniture based on type
  const drawFurniture = useCallback((
    ctx: CanvasRenderingContext2D,
    item: Furniture,
    x: number,
    y: number,
    width: number,
    height: number,
    isSelected: boolean
  ): void => {
    if (!ctx) return;
    
    switch(item.type.toLowerCase()) {
      case 'chair':
        drawChair(ctx, x, y, width, height, item.color, isSelected);
        break;
      case 'table':
        drawTable(ctx, x, y, width, height, item.color, isSelected);
        break;
      case 'sofa':
        drawSofa(ctx, x, y, width, height, item.color, isSelected);
        break;
      default:
        // Default box for other furniture types
        ctx.save();
        ctx.fillStyle = item.color;
        ctx.strokeStyle = isSelected ? '#3B82F6' : '#000';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.beginPath();
        ctx.rect(x - width/2, y, width, height);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    
    // Draw resize handle if selected
    if (isSelected) {
      ctx.save();
      ctx.fillStyle = '#3B82F6';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(x + width/2 - 6, y + height - 6, 6, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }, []);

  // Render the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate room positioning
    const offsetX = (canvas.width - room.width * scale) / 2;
    const offsetY = (canvas.height - room.height * scale) / 2;
    
    // Find active background
    const activeBackground = room.activeBackgroundId
      ? backgroundImages.find((bg) => bg.id === room.activeBackgroundId)
      : null;
    
    // Draw room background
    const drawBackground = () => {
      if (!activeBackground) {
        // Draw solid color background
        ctx.fillStyle = room.wallColor || "#F5F5F5";
        ctx.fillRect(offsetX, offsetY, room.width * scale, room.height * scale);
        
        // Draw wall border
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.strokeRect(offsetX, offsetY, room.width * scale, room.height * scale);
        
        // Draw floor line
        ctx.strokeStyle = room.floorColor || "#D2B48C";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + room.height * scale);
        ctx.lineTo(offsetX + room.width * scale, offsetY + room.height * scale);
        ctx.stroke();
        return;
      }
      
      // Use cached image if available
      if (cachedBackground && cachedBgUrl === activeBackground.url) {
        // Draw cached image
        ctx.drawImage(
          cachedBackground,
          offsetX,
          offsetY,
          room.width * scale,
          room.height * scale
        );
        
        // Draw overlay and border
        addBackgroundOverlayAndBorder();
      } else {
        // Load new image
        const img = new Image();
        
        img.onload = () => {
          // Cache the image
          setCachedBackground(img);
          setCachedBgUrl(activeBackground.url);
          
          // Draw the image
          ctx.drawImage(
            img,
            offsetX,
            offsetY,
            room.width * scale,
            room.height * scale
          );
          
          // Draw overlay and border
          addBackgroundOverlayAndBorder();
          
          // Redraw furniture since image loading is async
          drawFurnitureItems();
        };
        
        img.onerror = () => {
          // Fallback to solid color
          ctx.fillStyle = room.wallColor || "#F5F5F5";
          ctx.fillRect(offsetX, offsetY, room.width * scale, room.height * scale);
          
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 2;
          ctx.strokeRect(offsetX, offsetY, room.width * scale, room.height * scale);
          
          // Draw floor line
          ctx.strokeStyle = room.floorColor || "#D2B48C";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(offsetX, offsetY + room.height * scale);
          ctx.lineTo(offsetX + room.width * scale, offsetY + room.height * scale);
          ctx.stroke();
          
          // Redraw furniture
          drawFurnitureItems();
        };
        
        img.src = activeBackground.url;
      }
    };
    
    // Add overlay and border to background
    const addBackgroundOverlayAndBorder = () => {
      // Light overlay for better furniture visibility
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fillRect(offsetX, offsetY, room.width * scale, room.height * scale);
      
      // Room border
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.strokeRect(offsetX, offsetY, room.width * scale, room.height * scale);
    };
    
    // Draw all furniture items
    const drawFurnitureItems = () => {
      // Sort furniture by Y position for proper depth
      const sortedFurniture = [...furniture].sort((a, b) => {
        if (!a.position || !b.position) return 0;
        return a.position.y - b.position.y;
      });
      
      // Draw each furniture item
      sortedFurniture.forEach(item => {
        if (!item.position) return;
        
        // Get display scale (2D only)
        const displayScale = getDisplayScale(item.id);
        
        // Calculate position and dimensions
        const x = offsetX + item.position.x * scale;
        const y = offsetY + item.position.y * scale;
        const width = item.width * scale * displayScale.x;
        const height = item.height * scale * displayScale.y;
        const isSelected = item.id === selectedFurniture?.id;
        
        // Check if this is a 3D model with front view
        if (item.modelId && modelFrontViews.has(item.modelId)) {
          const frontViewImg = modelFrontViews.get(item.modelId);
          if (frontViewImg) {
            // Draw 3D model front view
            ctx.save();
            
            // Selection outline
            if (isSelected) {
              ctx.strokeStyle = '#3B82F6';
              ctx.lineWidth = 2;
              ctx.strokeRect(x - width/2, y, width, height);
              
              // Resize handle
              ctx.fillStyle = '#3B82F6';
              ctx.beginPath();
              ctx.rect(x + width/2 - 6, y + height - 6, 6, 6);
              ctx.fill();
              ctx.stroke();
            }
            
            // Draw front view image
            ctx.drawImage(frontViewImg, x - width/2, y, width, height);
            
            // 3D indicator
            ctx.fillStyle = '#3B82F6';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('3D', x, y + height + 12);
            
            ctx.restore();
          }
        } else {
          // Draw regular furniture
          drawFurniture(ctx, item, x, y, width, height, isSelected);
        }
        
        // Draw label above furniture
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.name, x, y - 5);
      });
    };
    
    // Draw everything
    drawBackground();
    drawFurnitureItems();
    
  }, [
    room, 
    furniture, 
    selectedFurniture, 
    backgroundImages, 
    scale, 
    zoomLevel, 
    forceRender,
    cachedBackground,
    cachedBgUrl,
    modelFrontViews,
    frontViewsLoaded,
    getDisplayScale,
    drawFurniture
  ]);

  // Handle mouse down (start dragging or resizing)
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate room offset
    const offsetX = (canvas.width - room.width * scale) / 2;
    const offsetY = (canvas.height - room.height * scale) / 2;
    
    // Check if clicking on selected furniture's resize handle
    if (selectedFurniture && selectedFurniture.position) {
      const displayScale = getDisplayScale(selectedFurniture.id);
      const x = offsetX + selectedFurniture.position.x * scale;
      const y = offsetY + selectedFurniture.position.y * scale;
      const width = selectedFurniture.width * scale * displayScale.x;
      const height = selectedFurniture.height * scale * displayScale.y;
      
      // Check if mouse is on resize handle (bottom-right)
      const handleX = x + width/2 - 3;
      const handleY = y + height - 3;
      const handleSize = 8; // Slightly larger than visual size for easier targeting
      
      if (
        mouseX >= handleX - handleSize/2 &&
        mouseX <= handleX + handleSize/2 &&
        mouseY >= handleY - handleSize/2 &&
        mouseY <= handleY + handleSize/2
      ) {
        // Start resizing (2D only)
        setIsResizing(true);
        setDragStartX(mouseX);
        setDragStartY(mouseY);
        return;
      }
    }
    
    // Check if clicking on any furniture
    for (let i = furniture.length - 1; i >= 0; i--) {
      const item = furniture[i];
      if (!item.position) continue;
      
      const displayScale = getDisplayScale(item.id);
      const x = offsetX + item.position.x * scale;
      const y = offsetY + item.position.y * scale;
      const width = item.width * scale * displayScale.x;
      const height = item.height * scale * displayScale.y;
      
      // Check if mouse is within furniture bounds
      if (
        mouseX >= x - width/2 &&
        mouseX <= x + width/2 &&
        mouseY >= y &&
        mouseY <= y + height
      ) {
        // Select and start dragging
        selectFurniture(item);
        setIsDragging(true);
        setDragStartX(mouseX);
        setDragStartY(mouseY);
        return;
      }
    }
    
    // If clicked elsewhere, deselect
    selectFurniture(null);
  }, [room, scale, furniture, selectedFurniture, selectFurniture, getDisplayScale]);

  // Handle mouse move (drag or resize)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || (!isDragging && !isResizing) || !selectedFurniture) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate deltas
    const deltaX = mouseX - dragStartX;
    const deltaY = mouseY - dragStartY;
    
    // Handle resizing (2D display only)
    if (isResizing) {
      const currentScale = getDisplayScale(selectedFurniture.id);
      
      // Calculate proportional change
      const scaleRatioX = deltaX / (selectedFurniture.width * scale * currentScale.x);
      const scaleRatioY = deltaY / (selectedFurniture.height * scale * currentScale.y);
      
      // Apply to display scale (minimum 0.5)
      const newScaleX = Math.max(0.5, currentScale.x + scaleRatioX * 2);
      const newScaleY = Math.max(0.5, currentScale.y + scaleRatioY * 2);
      
      // Update 2D display scale
      updateDisplayScale(selectedFurniture.id, { x: newScaleX, y: newScaleY });
      
      // Reset drag start position
      setDragStartX(mouseX);
      setDragStartY(mouseY);
      return;
    }
    
    // Handle dragging
    if (isDragging && selectedFurniture.position) {
      // Convert delta to meters
      const deltaXMeters = deltaX / scale;
      const deltaYMeters = deltaY / scale;
      
      // Calculate new position with boundary constraints
      // Use display scale for visual boundaries
      const displayScale = getDisplayScale(selectedFurniture.id);
      const visualWidth = selectedFurniture.width * displayScale.x;
      const visualHeight = selectedFurniture.height * displayScale.y;
      
      const newX = Math.max(
        visualWidth / 2,
        Math.min(
          room.width - visualWidth / 2,
          selectedFurniture.position.x + deltaXMeters
        )
      );
      
      const newY = Math.max(
        0,
        Math.min(
          room.height - visualHeight,
          selectedFurniture.position.y + deltaYMeters
        )
      );
      
      // Update furniture position
      updateFurniture({
        ...selectedFurniture,
        position: {
          ...selectedFurniture.position,
          x: newX,
          y: newY
        }
      });
      
      // Reset drag start position
      setDragStartX(mouseX);
      setDragStartY(mouseY);
    }
  }, [
    isDragging,
    isResizing,
    selectedFurniture,
    scale,
    dragStartX,
    dragStartY,
    getDisplayScale,
    updateDisplayScale,
    updateFurniture,
    room.width,
    room.height
  ]);

  // Handle mouse up (end dragging or resizing)
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      
      const container = canvasRef.current.parentElement;
      if (!container) return;
      
      // Resize canvas to match container
      canvasRef.current.width = container.clientWidth;
      canvasRef.current.height = container.clientHeight;
      
      // Force re-render
      setForceRender(prev => prev + 1);
    };
    
    // Initial size
    handleResize();
    
    // Listen for window resize
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Set cursor based on interaction
  const getCursorStyle = (): string => {
    if (isResizing) return 'nwse-resize';
    if (isDragging) return 'move';
    return 'default';
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full"
        style={{ cursor: getCursorStyle() }}
      />
      
      <FurnitureControls />
      
      {/* Information tooltip */}
      {selectedFurniture && (
        <div className="absolute top-4 right-4 bg-white bg-opacity-80 rounded-lg p-2 text-xs text-gray-700 shadow-sm">
          <p>Drag the blue handle to resize (2D view only)</p>
        </div>
      )}
      
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-2 mb-12 flex space-x-2">
        <button 
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 rounded flex items-center justify-center"
          title="Zoom In"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 rounded flex items-center justify-center"
          title="Zoom Out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button 
          onClick={handleResetZoom}
          className="p-2 hover:bg-gray-100 rounded flex items-center justify-center"
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