// components/Scene3D.tsx
"use client";

import { useRef, useEffect } from "react";
import { useDesign } from "../lib/DesignContext";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { Furniture } from "../lib/types";

export default function Scene3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    room,
    furniture,
    selectedFurniture,
    selectFurniture,
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

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(room.width * 1.5, room.height * 1.5, room.length * 1.5);
    camera.lookAt(room.width / 2, 0, room.length / 2);

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

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

    // Create furniture
    const furnitureObjects: Map<number, THREE.Object3D> = new Map();
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
        furnitureObjects.set(item.id, object);
      }
    };

    loadAllFurniture();

    // Set up raycaster for picking and dragging
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let draggedObject: THREE.Object3D | null = null;

    const onMouseDown = (event: MouseEvent) => {
      // Calculate mouse position in normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);

      // Calculate objects intersecting with the ray
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        // Find the top level parent with furnitureId
        let pickedObject = intersects[0].object;
        let parentObject = pickedObject;

        // Traverse up to find the parent with furniture ID
        while (parentObject.parent && !parentObject.userData.furnitureId) {
          parentObject = parentObject.parent;
        }

        const furnitureId = parentObject.userData.furnitureId;

        if (furnitureId !== undefined) {
          const clickedFurniture = furniture.find(
            (item) => item.id === furnitureId
          );
          selectFurniture(clickedFurniture || null);

          // Start dragging the parent object
          isDragging = true;
          draggedObject = parentObject;
        } else if (pickedObject === floor) {
          // If clicking on floor, deselect
          selectFurniture(null);
        }
      } else {
        selectFurniture(null);
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isDragging || !draggedObject) return;

      // Calculate mouse position in normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);

      // Find intersection with the floor
      const intersects = raycaster.intersectObject(floor);

      if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point;

        // Update object position (maintaining y-position/height)
        const originalY = draggedObject.position.y;
        draggedObject.position.x = intersectionPoint.x;
        draggedObject.position.z = intersectionPoint.z;
        draggedObject.position.y = originalY;

        // Find and update the furniture item in the global state
        const furnitureId = draggedObject.userData.furnitureId;
        const item = furniture.find((item) => item.id === furnitureId);

        if (item && item.position) {
          // Update furniture position in the global state
          const updatedFurniture = {
            ...item,
            position: {
              ...item.position,
              x: intersectionPoint.x,
              z: intersectionPoint.z,
            },
          };

          // This would update the global state (needs implementation in context)
          // updateFurniturePosition(updatedFurniture);
        }
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      draggedObject = null;
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("mouseleave", onMouseUp);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;

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
      if (containerRef.current) {
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
    furniture,
    selectedFurniture,
    selectFurniture,
    backgroundImages,
    furnitureModels,
  ]);

  return <div ref={containerRef} className="w-full h-full"></div>;
}
