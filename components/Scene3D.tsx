// components/Scene3D.tsx
"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useDesign } from "../lib/DesignContext";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { Furniture } from "../lib/types";

export default function Scene3D() {
  // DOM refs
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const floorRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  
  // Drag state
  const isDraggingRef = useRef(false);
  const draggedObjectRef = useRef<THREE.Object3D | null>(null);
  const draggedFurnitureIdRef = useRef<number | null>(null);
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  
  // Store for 3D objects
  const furnitureObjectsRef = useRef(new Map<number, THREE.Object3D>());
  
  // State to track furniture changes and force re-renders
  const [furnitureVersion, setFurnitureVersion] = useState(0);
  
  // Get design context
  const {
    room,
    furniture,
    selectedFurniture,
    selectFurniture,
    updateFurniture,
    removeFurniture,
    backgroundImages,
    getFurnitureModel
  } = useDesign();

  // Force re-render function
  const forceRender = useCallback(() => {
    setFurnitureVersion(prev => prev + 1);
  }, []);

  // Function to create a 3D object from furniture data
  const createFurnitureObject = useCallback(async (item: Furniture): Promise<THREE.Object3D | null> => {
    if (!item.position) return null;
    
    if (item.modelId) {
      // This is a 3D model
      const model = await getFurnitureModel(item.modelId);
      if (!model) return null;
      
      try {
        // Choose loader based on format
        if (model.format === 'glb' || model.format === 'gltf') {
          const loader = new GLTFLoader();
          const gltf = await new Promise<any>((resolve, reject) => {
            loader.load(model.url, resolve, undefined, reject);
          });
          
          const object = gltf.scene;
          
          // Scale to match furniture dimensions
          const bbox = new THREE.Box3().setFromObject(object);
          const size = new THREE.Vector3();
          bbox.getSize(size);
          
          // Check if dimensions are valid
          if (size.x === 0 || size.y === 0 || size.z === 0) {
            console.warn("Model has zero dimensions, using default sizes");
            object.scale.set(
              item.width, 
              item.height, 
              item.depth
            );
          } else {
            const scaleX = item.width / size.x;
            const scaleY = item.height / size.y;
            const scaleZ = item.depth / size.z;
            object.scale.set(scaleX, scaleY, scaleZ);
          }
          
          // Add shadows and highlight if selected
          object.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              // Apply material
              child.material = new THREE.MeshStandardMaterial({
                color: item.color,
                emissive: item.id === selectedFurniture?.id ? 0x555555 : 0x000000,
                emissiveIntensity: item.id === selectedFurniture?.id ? 0.5 : 0
              });
            }
          });
          
          // Calculate position to place bottom at floor level
          const updatedBox = new THREE.Box3().setFromObject(object);
          const bottomY = -updatedBox.min.y; // Offset to place bottom at Y=0
          
          // Position and set userData
          object.position.set(item.position.x, bottomY, item.position.z);
          object.userData.furnitureId = item.id;
          object.userData.originalY = bottomY; // Store for later repositioning
          
          // Rotation
          if (item.rotation !== undefined) {
            object.rotation.y = item.rotation;
          }
          
          return object;
        } else if (model.format === 'obj') {
          const loader = new OBJLoader();
          const object = await new Promise<THREE.Group>((resolve, reject) => {
            loader.load(model.url, resolve, undefined, reject);
          });
          
          // Scale to match furniture dimensions
          const bbox = new THREE.Box3().setFromObject(object);
          const size = new THREE.Vector3();
          bbox.getSize(size);
          
          // Check if dimensions are valid
          if (size.x === 0 || size.y === 0 || size.z === 0) {
            console.warn("Model has zero dimensions, using default sizes");
            object.scale.set(
              item.width, 
              item.height, 
              item.depth
            );
          } else {
            const scaleX = item.width / size.x;
            const scaleY = item.height / size.y;
            const scaleZ = item.depth / size.z;
            object.scale.set(scaleX, scaleY, scaleZ);
          }
          
          // Add shadows and highlight if selected
          object.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              // Apply material
              child.material = new THREE.MeshStandardMaterial({
                color: item.color,
                emissive: item.id === selectedFurniture?.id ? 0x555555 : 0x000000,
                emissiveIntensity: item.id === selectedFurniture?.id ? 0.5 : 0
              });
            }
          });
          
          // Calculate position to place bottom at floor level
          const updatedBox = new THREE.Box3().setFromObject(object);
          const bottomY = -updatedBox.min.y; // Offset to place bottom at Y=0
          
          // Position and set userData
          object.position.set(item.position.x, bottomY, item.position.z);
          object.userData.furnitureId = item.id;
          object.userData.originalY = bottomY; // Store for later repositioning
          
          // Rotation
          if (item.rotation !== undefined) {
            object.rotation.y = item.rotation;
          }
          
          return object;
        }
      } catch (error) {
        console.error(`Error loading ${model.format} model:`, error);
      }
    }
    
    // Fall back to basic box for non-model furniture or if model loading failed
    const geometry = new THREE.BoxGeometry(item.width, item.height, item.depth);
    const material = new THREE.MeshStandardMaterial({
      color: item.color,
      emissive: item.id === selectedFurniture?.id ? 0x555555 : 0x000000,
      emissiveIntensity: item.id === selectedFurniture?.id ? 0.5 : 0
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Position center of box at floor level + half height
    mesh.position.set(
      item.position.x,
      item.height / 2,
      item.position.z
    );
    
    // Rotation
    if (item.rotation) {
      mesh.rotation.y = item.rotation;
    }
    
    // Store furniture ID
    mesh.userData.furnitureId = item.id;
    mesh.userData.originalY = item.height / 2; // Store for later repositioning
    
    return mesh;
  }, [getFurnitureModel, selectedFurniture]);

  // Update or create furniture 3D objects
  const updateFurnitureObjects = useCallback(async () => {
    if (!sceneRef.current) return;
    
    const scene = sceneRef.current;
    const currentIds = new Set(furniture.map(item => item.id));
    
    console.log("Updating furniture objects:", furniture.length);
    
    // STEP 1: Remove objects that are no longer in the furniture list
    const objectsToRemove: number[] = [];
    furnitureObjectsRef.current.forEach((object, id) => {
      if (!currentIds.has(id)) {
        objectsToRemove.push(id);
        scene.remove(object);
      }
    });
    
    // Remove from our map
    for (const id of objectsToRemove) {
      furnitureObjectsRef.current.delete(id);
    }
    
    // STEP 2: Process each furniture item
    for (const item of furniture) {
      if (!item.position) continue;
      
      // Check if we already have this object
      const existingObject = furnitureObjectsRef.current.get(item.id);
      
      if (existingObject) {
        // Update existing object position and rotation
        existingObject.position.x = item.position.x;
        existingObject.position.z = item.position.z;
        
        // Keep the original Y position
        if (existingObject.userData.originalY !== undefined) {
          existingObject.position.y = existingObject.userData.originalY;
        }
        
        // Update rotation
        if (item.rotation !== undefined) {
          existingObject.rotation.y = item.rotation;
        }
        
        // Update material for selection state
        existingObject.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: item.color,
              emissive: item.id === selectedFurniture?.id ? 0x555555 : 0x000000,
              emissiveIntensity: item.id === selectedFurniture?.id ? 0.5 : 0
            });
          }
        });
      } else {
        // Create new object for this furniture item
        console.log(`Creating new 3D object for furniture ${item.id}`);
        const newObject = await createFurnitureObject(item);
        if (newObject) {
          scene.add(newObject);
          furnitureObjectsRef.current.set(item.id, newObject);
        }
      }
    }
  }, [furniture, selectedFurniture, createFurnitureObject]);

  // Initial setup of scene, camera, renderer, controls
  useEffect(() => {
    if (!containerRef.current) return;
    
    console.log("Setting up Scene3D with room:", room);

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(room.width * 1.5, room.height * 1.5, room.length * 1.5);
    camera.lookAt(room.width / 2, 0, room.length / 2);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.minPolarAngle = 0.1;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(room.width, room.height * 2, room.length);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Active background image
    const activeBackground = room.activeBackgroundId
      ? backgroundImages.find((bg) => bg.id === room.activeBackgroundId)
      : null;

    // Floor
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: room.floorColor,
      side: THREE.DoubleSide,
    });
    const floorGeometry = new THREE.PlaneGeometry(room.width, room.length);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(room.width / 2, 0, room.length / 2);
    floor.receiveShadow = true;
    floor.userData.isFloor = true;
    scene.add(floor);
    floorRef.current = floor;

    // Walls
    let wallMaterial;
    if (activeBackground) {
      const textureLoader = new THREE.TextureLoader();
      const texture = textureLoader.load(activeBackground.url);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      wallMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
      });
    } else {
      wallMaterial = new THREE.MeshStandardMaterial({
        color: room.wallColor,
        side: THREE.DoubleSide,
      });
    }

    // Back wall
    const backWallGeometry = new THREE.PlaneGeometry(room.width, room.height);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(room.width / 2, room.height / 2, 0);
    scene.add(backWall);

    // Left wall
    const leftWallGeometry = new THREE.PlaneGeometry(room.length, room.height);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(0, room.height / 2, room.length / 2);
    scene.add(leftWall);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      console.log("Cleaning up Scene3D");
      
      // Reset drag state
      isDraggingRef.current = false;
      draggedObjectRef.current = null;
      draggedFurnitureIdRef.current = null;
      
      // Clean up event listeners
      window.removeEventListener('resize', handleResize);
      
      // Remove renderer from DOM if it exists
      if (rendererRef.current && rendererRef.current.domElement.parentNode) {
        rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose of all geometries and materials
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            } else if (Array.isArray(object.material)) {
              object.material.forEach((material: THREE.Material) => material.dispose());
            }
          }
        });
      }
      
      // Clear furniture map
      furnitureObjectsRef.current.clear();
      
      // Dispose of renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [room, backgroundImages]); // Only re-setup for room or background changes

  // Setup event handlers after the scene is created
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !controlsRef.current) return;
    
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const controls = controlsRef.current;
    
    // --- EVENT HANDLERS ---
    
    // Mouse down handler
    const handleMouseDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(scene.children, true);
      
      if (intersects.length > 0) {
        // Find the clicked object
        let hitObject = intersects[0].object;
        
        // If it's the floor, deselect current object
        if (hitObject.userData.isFloor) {
          selectFurniture(null);
          return;
        }
        
        // Find the top-level object with furniture ID
        let targetObject: THREE.Object3D | null = hitObject;
        while (targetObject && targetObject.parent && !targetObject.userData.furnitureId && targetObject !== scene) {
          targetObject = targetObject.parent;
        }
        
        // If we found a furniture object
        if (targetObject && targetObject.userData.furnitureId !== undefined) {
          // Disable orbit controls during drag
          controls.enabled = false;
          
          // Find the furniture data
          const furnitureId = targetObject.userData.furnitureId as number;
          const clickedFurniture = furniture.find(item => item.id === furnitureId);
          
          // Select this furniture
          if (clickedFurniture) {
            selectFurniture(clickedFurniture);
          }
          
          // Setup drag operation
          isDraggingRef.current = true;
          draggedObjectRef.current = targetObject;
          draggedFurnitureIdRef.current = furnitureId;
          
          // Create a horizontal drag plane at the object's height
          dragPlaneRef.current.setFromNormalAndCoplanarPoint(
            new THREE.Vector3(0, 1, 0),
            targetObject.position
          );
        } else {
          // Clicked on something else (like a wall)
          selectFurniture(null);
        }
      } else {
        // Clicked on empty space
        selectFurniture(null);
      }
    };
    
    // Mouse move handler
    const handleMouseMove = (event: MouseEvent) => {
      // Only do something if we're dragging
      if (!isDraggingRef.current || !draggedObjectRef.current) return;
      
      // Calculate mouse position
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Cast ray from camera through mouse
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      
      // Find intersection with drag plane
      const intersection = new THREE.Vector3();
      if (raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, intersection)) {
        // Find the furniture item being dragged
        const furnitureId = draggedFurnitureIdRef.current;
        const item = furniture.find(item => item.id === furnitureId);
        
        if (item && item.position) {
          // Keep the same Y position
          const originalY = draggedObjectRef.current.position.y;
          
          // Limit to room boundaries
          const halfWidth = item.width / 2;
          const halfDepth = item.depth / 2;
          
          const newX = Math.max(halfWidth, Math.min(room.width - halfWidth, intersection.x));
          const newZ = Math.max(halfDepth, Math.min(room.length - halfDepth, intersection.z));
          
          // Update the 3D object
          draggedObjectRef.current.position.set(newX, originalY, newZ);
          
          // Update the furniture data
          updateFurniture({
            ...item,
            position: {
              ...item.position,
              x: newX,
              z: newZ
            }
          });
        }
      }
    };
    
    // Mouse up handler
    const handleMouseUp = () => {
      // End drag operation
      isDraggingRef.current = false;
      draggedObjectRef.current = null;
      draggedFurnitureIdRef.current = null;
      
      // Re-enable orbit controls
      controls.enabled = true;
    };
    
    // Add event listeners
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mouseleave', handleMouseUp);
    
    // Cleanup function
    return () => {
      // Remove event listeners
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [furniture, selectFurniture, updateFurniture, room]); // Re-setup when furniture or handlers change

  // Update furniture objects whenever the furniture list changes
  useEffect(() => {
    // Only run if the scene is set up
    if (sceneRef.current) {
      updateFurnitureObjects();
    }
  }, [furniture, selectedFurniture, furnitureVersion, updateFurnitureObjects]);

  // Control panel handlers
  const handleToggleControls = () => {
    const controlsDiv = document.querySelector('.furniture-controls');
    if (controlsDiv) {
      controlsDiv.classList.toggle('controls-open');
    }
  };

  const moveLeft = () => {
    if (!selectedFurniture?.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        x: Math.max(selectedFurniture.width / 2, selectedFurniture.position.x - 0.1)
      }
    });
  };

  const moveRight = () => {
    if (!selectedFurniture?.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        x: Math.min(room.width - selectedFurniture.width / 2, selectedFurniture.position.x + 0.1)
      }
    });
  };

  const moveForward = () => {
    if (!selectedFurniture?.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        z: Math.max(selectedFurniture.depth / 2, selectedFurniture.position.z - 0.1)
      }
    });
  };

  const moveBackward = () => {
    if (!selectedFurniture?.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        z: Math.min(room.length - selectedFurniture.depth / 2, selectedFurniture.position.z + 0.1)
      }
    });
  };

  const rotate = () => {
    if (!selectedFurniture) return;
    updateFurniture({
      ...selectedFurniture,
      rotation: (selectedFurniture.rotation || 0) + Math.PI / 4
    });
  };

  const handleDelete = () => {
    if (!selectedFurniture) return;
    const idToRemove = selectedFurniture.id;
    
    // First clear the selection
    selectFurniture(null);
    
    // Then remove the furniture item
    removeFurniture(idToRemove);
    
    // Force update
    forceRender();
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full"></div>
      
      {/* Controls Panel */}
      {selectedFurniture && (
        <div className="furniture-controls controls-open absolute bottom-4 left-4 bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center p-2 border-b cursor-pointer" onClick={handleToggleControls}>
            <div className="text-sm font-medium text-gray-700">
              {selectedFurniture.name}
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-full">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 transition-transform duration-200 transform rotate-180" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="controls-content p-2">
            <div className="grid grid-cols-3 gap-1">
              {/* Move left */}
              <button className="p-2 hover:bg-gray-100 rounded" onClick={moveLeft}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Move forward */}
              <button className="p-2 hover:bg-gray-100 rounded" onClick={moveForward}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Move right */}
              <button className="p-2 hover:bg-gray-100 rounded" onClick={moveRight}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Rotate */}
              <button className="p-2 hover:bg-gray-100 rounded" onClick={rotate}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Move backward */}
              <button className="p-2 hover:bg-gray-100 rounded" onClick={moveBackward}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 15.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Delete */}
              <button className="p-2 hover:bg-red-100 text-red-600 rounded" onClick={handleDelete}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Instructions when nothing selected */}
      {!selectedFurniture && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-70 rounded-lg p-3 text-sm">
          Click on furniture to select and drag it, or use controls to move precisely
        </div>
      )}
    </div>
  );
}