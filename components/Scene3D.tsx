// components/Scene3D.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { useDesign } from "../lib/DesignContext";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { Furniture } from "../lib/types";

export default function Scene3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const floorRef = useRef<THREE.Mesh | null>(null);
  const furnitureObjectsRef = useRef<Map<number, THREE.Object3D>>(new Map());
  const rotationControlRef = useRef<THREE.Group | null>(null);
  
  // State for controlling UI elements and drag operations
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const draggedObjectRef = useRef<THREE.Object3D | null>(null);
  const dragPlaneRef = useRef(new THREE.Plane());
  const rotationStartAngleRef = useRef(0);

  const {
    room,
    furniture,
    selectedFurniture,
    selectFurniture,
    updateFurniture,
    removeFurniture,
    backgroundImages,
    furnitureModels,
    getFurnitureModel,
  } = useDesign();

  // Set up and render the 3D scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(room.width * 1.5, room.height * 1.5, room.length * 1.5);
    camera.lookAt(room.width / 2, 0, room.length / 2);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    // Limit vertical rotation to prevent going below the floor
    controls.minPolarAngle = 0.1; // Slightly above horizontal
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Slightly below vertical
    controlsRef.current = controls;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(
      room.width / 2,
      room.height * 2,
      room.length / 2
    );
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Find active background if any
    const activeBackground = room.activeBackgroundId
      ? backgroundImages.find((bg) => bg.id === room.activeBackgroundId)
      : null;

    // Create floor (always use floor color)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: room.floorColor,
      side: THREE.DoubleSide,
    });

    const floorGeometry = new THREE.PlaneGeometry(room.width, room.length);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(room.width / 2, 0, room.length / 2);
    floor.receiveShadow = true;
    scene.add(floor);
    floorRef.current = floor;

    // Create walls (with background image if available)
    let wallMaterial;

    if (activeBackground) {
      // Create texture from image
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

    // Create a rotation control widget
    const createRotationControl = () => {
      const group = new THREE.Group();
      
      // Create a circular base
      const circleGeometry = new THREE.CircleGeometry(0.3, 32);
      const circleMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x3b82f6, 
        transparent: true,
        opacity: 0.5
      });
      const circle = new THREE.Mesh(circleGeometry, circleMaterial);
      circle.rotation.x = -Math.PI / 2; // Make it horizontal
      group.add(circle);
      
      // Create an arrow
      const arrowGeometry = new THREE.ConeGeometry(0.1, 0.2, 32);
      const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
      arrow.position.set(0, 0.1, -0.25);
      arrow.rotation.x = -Math.PI / 2; // Point outward
      group.add(arrow);
      
      // Add this to identify the rotation control
      group.userData.isRotationControl = true;
      
      // Hide initially
      group.visible = false;
      scene.add(group);
      
      return group;
    };
    
    // Create and store rotation control widget
    rotationControlRef.current = createRotationControl();

    // Create furniture
    const gltfLoader = new GLTFLoader();
    const objLoader = new OBJLoader();

    // Create a function to load models
    const loadModel = async (furniture: Furniture): Promise<THREE.Object3D | null> => {
      return new Promise(async (resolve) => {
        if (!furniture.modelId) {
          // If there's no model, create a simple box
          const geometry = new THREE.BoxGeometry(
            furniture.width,
            furniture.height,
            furniture.depth
          );
          const material = new THREE.MeshStandardMaterial({
            color: furniture.color,
            emissive:
              furniture.id === selectedFurniture?.id ? 0x666666 : 0x000000,
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          resolve(mesh);
          return;
        }

        // Find the model data
        const model = await getFurnitureModel(furniture.modelId);
        if (!model) {
          resolve(null);
          return;
        }

        // Determine which loader to use based on file format
        if (model.format === "glb" || model.format === "gltf") {
          gltfLoader.load(
            model.url,
            (gltf) => {
              const object = gltf.scene;

              // Scale to match the furniture dimensions
              const boundingBox = new THREE.Box3().setFromObject(object);
              const size = new THREE.Vector3();
              boundingBox.getSize(size);

              // Calculate scale factors
              const scaleX = furniture.width / size.x;
              const scaleY = furniture.height / size.y;
              const scaleZ = furniture.depth / size.z;

              // Apply the scale
              object.scale.set(scaleX, scaleY, scaleZ);

              // Set up shadows
              object.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;

                  // Apply furniture color if specified
                  if (furniture.color) {
                    child.material = new THREE.MeshStandardMaterial({
                      color: furniture.color,
                      emissive:
                        furniture.id === selectedFurniture?.id
                          ? 0x666666
                          : 0x000000,
                    });
                  }
                }
              });

              resolve(object);
            },
            undefined,
            (error) => {
              console.error("Error loading GLTF/GLB model:", error);
              resolve(null);
            }
          );
        } else if (model.format === "obj") {
          objLoader.load(
            model.url,
            (object) => {
              // Similar scaling as with GLTF
              const boundingBox = new THREE.Box3().setFromObject(object);
              const size = new THREE.Vector3();
              boundingBox.getSize(size);

              const scaleX = furniture.width / size.x;
              const scaleY = furniture.height / size.y;
              const scaleZ = furniture.depth / size.z;

              object.scale.set(scaleX, scaleY, scaleZ);

              // Add material if needed
              object.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  child.material = new THREE.MeshStandardMaterial({
                    color: furniture.color,
                    emissive:
                      furniture.id === selectedFurniture?.id
                        ? 0x666666
                        : 0x000000,
                  });
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });

              resolve(object);
            },
            undefined,
            (error) => {
              console.error("Error loading OBJ model:", error);
              resolve(null);
            }
          );
        } else {
          // Unsupported format, fall back to a box
          const geometry = new THREE.BoxGeometry(
            furniture.width,
            furniture.height,
            furniture.depth
          );
          const material = new THREE.MeshStandardMaterial({
            color: furniture.color,
            emissive:
              furniture.id === selectedFurniture?.id ? 0x666666 : 0x000000,
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          resolve(mesh);
        }
      });
    };

    // Load and add all furniture
    const loadAllFurniture = async () => {
      // Clear previous furniture objects
      furnitureObjectsRef.current.forEach((obj) => {
        scene.remove(obj);
      });
      furnitureObjectsRef.current.clear();

      for (const item of furniture) {
        if (!item.position) continue;

        const object = await loadModel(item);
        if (!object) continue;

        if (item.modelId) {
          // Get the bounding box to determine the model's actual dimensions
          const box = new THREE.Box3().setFromObject(object);
          const height = box.max.y - box.min.y;
          
          // Calculate the Y offset to place the bottom at y=0
          const yOffset = -box.min.y;
          
          // Position the model so its bottom is at the floor
          object.position.set(item.position.x, yOffset, item.position.z);
        } else {
          // For regular box furniture, use the original positioning
          object.position.set(item.position.x, item.height / 2, item.position.z);
        }

        // Apply rotation if specified
        if (item.rotation) {
          object.rotation.y = item.rotation;
        }

        // Store furniture ID in userData
        object.userData.furnitureId = item.id;

        scene.add(object);
        furnitureObjectsRef.current.set(item.id, object);
      }
    };

    loadAllFurniture();

    // Set up raycaster for picking and dragging
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const dragStartPosition = new THREE.Vector3();
    const dragPlane = new THREE.Plane();
    dragPlaneRef.current = dragPlane;

    const onMouseDown = (event: MouseEvent) => {
      // Calculate mouse position in normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);

      // First, check if we're clicking on the rotation control
      if (rotationControlRef.current && rotationControlRef.current.visible) {
        const rotationIntersects = raycaster.intersectObject(rotationControlRef.current, true);
        if (rotationIntersects.length > 0) {
          // Start rotation mode
          setIsRotating(true);
          
          // Calculate angle between mouse position and furniture center
          if (selectedFurniture && selectedFurniture.position) {
            const furniture3DObject = furnitureObjectsRef.current.get(selectedFurniture.id);
            if (furniture3DObject) {
              // Project rotation control center to screen space
              const pos = new THREE.Vector3();
              pos.setFromMatrixPosition(rotationControlRef.current.matrixWorld);
              pos.project(camera);
              
              // Calculate start angle
              rotationStartAngleRef.current = Math.atan2(mouse.y - pos.y, mouse.x - pos.x);
            }
          }
          
          if (controlsRef.current) {
            controlsRef.current.enabled = false;
          }
          return;
        }
      }

      // Calculate objects intersecting with the ray
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        // Find the top level parent with furnitureId
        let pickedObject = intersects[0].object;
        let parentObject = pickedObject;

        // Traverse up to find the parent with furniture ID
        while (parentObject.parent && !parentObject.userData.furnitureId && parentObject !== scene) {
          parentObject = parentObject.parent;
        }

        const furnitureId = parentObject.userData.furnitureId;

        if (furnitureId !== undefined) {
          // Disable controls temporarily during drag
          if (controlsRef.current) {
            controlsRef.current.enabled = false;
          }

          const clickedFurniture = furniture.find(
            (item) => item.id === furnitureId
          );
          
          selectFurniture(clickedFurniture || null);
          setIsControlsVisible(true);

          // Start dragging the parent object
          setIsDragging(true);
          draggedObjectRef.current = parentObject;
          
          // Store initial position for reference
          if (draggedObjectRef.current) {
            dragStartPosition.copy(draggedObjectRef.current.position);
            
            // Create a horizontal drag plane at the object's y position
            dragPlane.setFromNormalAndCoplanarPoint(
              new THREE.Vector3(0, 1, 0),  // Normal pointing up
              draggedObjectRef.current.position       // Point on the plane
            );
          }
        } else if (pickedObject === floor) {
          // If clicking on floor, deselect
          selectFurniture(null);
          setIsControlsVisible(false);
          
          // Hide rotation control
          if (rotationControlRef.current) {
            rotationControlRef.current.visible = false;
          }
        }
      } else {
        selectFurniture(null);
        setIsControlsVisible(false);
        
        // Hide rotation control
        if (rotationControlRef.current) {
          rotationControlRef.current.visible = false;
        }
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      // Handle rotation
      if (isRotating && selectedFurniture && rotationControlRef.current) {
        // Calculate mouse position in normalized device coordinates
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Project rotation control center to screen space
        const pos = new THREE.Vector3();
        pos.setFromMatrixPosition(rotationControlRef.current.matrixWorld);
        pos.project(camera);
        
        // Calculate current angle
        const currentAngle = Math.atan2(mouse.y - pos.y, mouse.x - pos.x);
        
        // Calculate angle difference
        const deltaAngle = currentAngle - rotationStartAngleRef.current;
        
        // Get the current rotation
        const currentRotation = selectedFurniture.rotation || 0;
        
        // Apply new rotation
        updateFurniture({
          ...selectedFurniture,
          rotation: currentRotation + deltaAngle
        });
        
        // Update start angle for next frame
        rotationStartAngleRef.current = currentAngle;
        
        return;
      }
      
      // Handle dragging
      if (!isDragging || !draggedObjectRef.current) return;

      // Calculate mouse position in normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Create a ray from the camera through the mouse position
      raycaster.setFromCamera(mouse, camera);
      
      // Find the intersection point with the horizontal drag plane
      const raycastResult = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(dragPlaneRef.current, raycastResult)) {
        // Update object position - only X and Z (horizontal)
        // Keep the same Y position to make sure we're only moving horizontally
        const originalY = draggedObjectRef.current.position.y;
        
        // Make sure furniture stays within room boundaries
        const selectedItem = furniture.find(item => item.id === draggedObjectRef.current?.userData.furnitureId);
        if (selectedItem) {
          const halfWidth = selectedItem.width / 2;
          const halfDepth = selectedItem.depth / 2;
          
          // Clamp to room boundaries
          const newX = Math.max(halfWidth, Math.min(room.width - halfWidth, raycastResult.x));
          const newZ = Math.max(halfDepth, Math.min(room.length - halfDepth, raycastResult.z));
          
          draggedObjectRef.current.position.set(newX, originalY, newZ);
          
          // Find and update the furniture item in the global state
          const furnitureId = draggedObjectRef.current.userData.furnitureId;
          const item = furniture.find((item) => item.id === furnitureId);

          if (item && item.position) {
            // Update furniture position in the global state
            const updatedFurniture = {
              ...item,
              position: {
                ...item.position,
                x: newX,
                z: newZ,
              },
            };

            // Update the global state
            updateFurniture(updatedFurniture);
          }
        }
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
      setIsRotating(false);
      draggedObjectRef.current = null;
      
      // Re-enable controls after dragging or rotating
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("mouseleave", onMouseUp);

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
      if (!containerRef.current || !camera || !renderer) return;

      camera.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      // Reset dragging state on unmount
      setIsDragging(false);
      setIsRotating(false);
      draggedObjectRef.current = null;

      if (containerRef.current && renderer.domElement.parentNode) {
        containerRef.current.removeChild(renderer.domElement);
      }

      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("mouseleave", onMouseUp);
      window.removeEventListener("resize", handleResize);

      // Dispose of geometries and materials
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();

          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          } else if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          }
        }
      });

      renderer.dispose();
    };
  }, [
    room,
    furniture.length,  // Only depend on the length to avoid too many re-renders
    backgroundImages,
    furnitureModels,
    selectedFurniture?.id, // Add dependency on selected furniture ID for proper highlighting
  ]);

  // Update selected furniture highlight and position when selection changes
  // Also update the rotation control position
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Update all furniture objects to reflect selection state
    furnitureObjectsRef.current.forEach((object, id) => {
      const isSelected = selectedFurniture?.id === id;
      
      // Update material to show selection
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Find the corresponding furniture item
          const item = furniture.find(f => f.id === id);
          if (item) {
            child.material = new THREE.MeshStandardMaterial({
              color: item.color,
              emissive: isSelected ? 0x666666 : 0x000000,
              emissiveIntensity: isSelected ? 0.5 : 0,
            });
          }
        }
      });
      
      // Also update position from furniture data
      const item = furniture.find(f => f.id === id);
      if (item && item.position) {
        if (item.modelId) {
          // For models, maintain their y offset
          const currentY = object.position.y;
          object.position.set(item.position.x, currentY, item.position.z);
        } else {
          // For regular box furniture
          object.position.set(item.position.x, item.height / 2, item.position.z);
        }
        
        // Update rotation
        if (item.rotation !== undefined) {
          object.rotation.y = item.rotation;
        }
        
        // If this is the selected furniture, update rotation control
        if (isSelected && rotationControlRef.current) {
          // Show the rotation control
          rotationControlRef.current.visible = true;
          
          // Get height of object to position control at the top
          const boundingBox = new THREE.Box3().setFromObject(object);
          const height = boundingBox.max.y;
          
          // Position the rotation control above the object
          rotationControlRef.current.position.set(
            item.position.x,
            height + 0.2,  // Slightly above the object
            item.position.z
          );
        }
      }
    });
    
    // Hide rotation control if nothing is selected
    if (!selectedFurniture && rotationControlRef.current) {
      rotationControlRef.current.visible = false;
    }
  }, [selectedFurniture, furniture]);

  // 3D Movement controls for selected furniture
  const moveLeft = () => {
    if (!selectedFurniture || !selectedFurniture.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        x: Math.max(selectedFurniture.width / 2, selectedFurniture.position.x - 0.1)
      }
    });
  };

  const moveRight = () => {
    if (!selectedFurniture || !selectedFurniture.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        x: Math.min(room.width - selectedFurniture.width / 2, selectedFurniture.position.x + 0.1)
      }
    });
  };

  const moveForward = () => {
    if (!selectedFurniture || !selectedFurniture.position) return;
    updateFurniture({
      ...selectedFurniture,
      position: {
        ...selectedFurniture.position,
        z: Math.max(selectedFurniture.depth / 2, selectedFurniture.position.z - 0.1)
      }
    });
  };

  const moveBackward = () => {
    if (!selectedFurniture || !selectedFurniture.position) return;
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
    removeFurniture(selectedFurniture.id);
    selectFurniture(null);
    setIsControlsVisible(false);
  };

  const toggleControls = () => {
    setIsControlsOpen(!isControlsOpen);
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full"></div>
      
      {/* 3D Movement Controls */}
      {selectedFurniture && isControlsVisible && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center p-2 border-b cursor-pointer" onClick={toggleControls}>
            <div className="text-sm font-medium text-gray-700">
              {selectedFurniture.name}
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-full">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 transition-transform duration-200 ${isControlsOpen ? 'transform rotate-180' : ''}`} 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {isControlsOpen && (
            <div className="p-2 mb-12">
              <div className="grid grid-cols-3 gap-1">
                {/* Move left */}
                <button className="p-2 hover:bg-gray-100 rounded" onClick={moveLeft}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Move forward (away from camera in 3D) */}
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
                
                {/* Move backward (toward camera in 3D) */}
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
          )}
        </div>
      )}
      
      {/* Instructions tooltip when nothing is selected */}
      {!selectedFurniture && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-70 rounded-lg p-3 text-sm">
          Click on furniture to select and drag it, or use controls to move precisely
        </div>
      )}
    </div>
  );
}