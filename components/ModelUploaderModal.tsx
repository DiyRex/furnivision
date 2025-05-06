// components/ModelUploaderModal.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useDesign } from '../lib/DesignContext';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

interface ModelUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModelUploaderModal({ isOpen, onClose }: ModelUploaderModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [modelName, setModelName] = useState('');
  const [modelType, setModelType] = useState('chair');
  const [modelWidth, setModelWidth] = useState('0.5');
  const [modelDepth, setModelDepth] = useState('0.5');
  const [modelHeight, setModelHeight] = useState('0.8');
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const offscreenRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  
  const { addCustomFurnitureModel } = useDesign();

  // Setup offscreen renderer for thumbnails with larger size
  useEffect(() => {
    if (!offscreenRendererRef.current) {
      // Create an offscreen renderer for generating high-quality thumbnails
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true
      });
      // Higher resolution for better quality
      renderer.setSize(600, 600);
      offscreenRendererRef.current = renderer;
    }
    
    return () => {
      if (offscreenRendererRef.current) {
        offscreenRendererRef.current.dispose();
        offscreenRendererRef.current = null;
      }
    };
  }, []);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setModelName('');
      setModelType('chair');
      setModelWidth('0.5');
      setModelDepth('0.5');
      setModelHeight('0.8');
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  // Close modal with escape key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Generate front view thumbnail from 3D model - fixed to create proper quality image
  const generateFrontViewImage = async (
    fileData: string, 
    fileFormat: string,
    width: number,
    height: number,
    depth: number
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Create a scene for rendering the model
        const scene = new THREE.Scene();
        scene.background = null; // Transparent background
        
        // Add lights for better visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        // Front light
        const frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
        frontLight.position.set(0, 0, 10);
        scene.add(frontLight);
        
        // Top light
        const topLight = new THREE.DirectionalLight(0xffffff, 0.5);
        topLight.position.set(0, 10, 0);
        scene.add(topLight);
        
        // Side light for depth
        const sideLight = new THREE.DirectionalLight(0xffffff, 0.3);
        sideLight.position.set(10, 0, 0);
        scene.add(sideLight);
        
        // Create camera - use consistent camera setup with proper framing
        const camera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 1000);
        camera.position.set(0, 0, 5);
        camera.lookAt(0, 0, 0);
        
        // Get renderer
        const renderer = offscreenRendererRef.current;
        if (!renderer) {
          reject(new Error("Renderer not initialized"));
          return;
        }
        
        // Set clear color to transparent
        renderer.setClearColor(0x000000, 0);
        
        // Load the model
        const loadModel = () => {
          if (fileFormat === 'glb' || fileFormat === 'gltf') {
            const loader = new GLTFLoader();
            loader.load(fileData, (gltf) => {
              const model = gltf.scene;
              
              // Center and normalize the model
              const box = new THREE.Box3().setFromObject(model);
              const size = box.getSize(new THREE.Vector3());
              const center = box.getCenter(new THREE.Vector3());
              
              // Reset position to center
              model.position.set(-center.x, -center.y, -center.z);
              
              // Move bottom to ground
              model.position.y += box.min.y;
              
              // Scale to fit view - preserve aspect ratio
              const maxDim = Math.max(size.x, size.y, size.z);
              const scale = 3.5 / maxDim;
              model.scale.set(scale, scale, scale);
              
              // Apply consistent material for better visibility
              model.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                  if (Array.isArray(child.material)) {
                    child.material.forEach((mat, index) => {
                      child.material[index] = new THREE.MeshStandardMaterial({
                        color: 0x999999,
                        roughness: 0.7,
                        metalness: 0.2
                      });
                    });
                  } else {
                    child.material = new THREE.MeshStandardMaterial({
                      color: 0x999999,
                      roughness: 0.7,
                      metalness: 0.2
                    });
                  }
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });
              
              // Add model to scene
              scene.add(model);
              
              // Render front view
              renderer.render(scene, camera);
              
              // Get image data
              const frontViewDataUrl = renderer.domElement.toDataURL('image/png');
              resolve(frontViewDataUrl);
              
              // Clean up
              scene.remove(model);
              model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  if (child.geometry) child.geometry.dispose();
                  if (child.material) {
                    if (Array.isArray(child.material)) {
                      child.material.forEach(material => material.dispose());
                    } else {
                      child.material.dispose();
                    }
                  }
                }
              });
            }, undefined, (error) => {
              console.error('Error loading model:', error);
              reject(error);
            });
          } else if (fileFormat === 'obj') {
            const loader = new OBJLoader();
            loader.load(fileData, (obj) => {
              // Center and normalize the model
              const box = new THREE.Box3().setFromObject(obj);
              const size = box.getSize(new THREE.Vector3());
              const center = box.getCenter(new THREE.Vector3());
              
              // Reset position to center
              obj.position.set(-center.x, -center.y, -center.z);
              
              // Move bottom to ground
              obj.position.y += box.min.y;
              
              // Scale to fit view - preserve aspect ratio
              const maxDim = Math.max(size.x, size.y, size.z);
              const scale = 3.5 / maxDim;
              obj.scale.set(scale, scale, scale);
              
              // Apply consistent material for better visibility
              obj.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                  if (Array.isArray(child.material)) {
                    child.material.forEach((mat, index) => {
                      child.material[index] = new THREE.MeshStandardMaterial({
                        color: 0x999999,
                        roughness: 0.7,
                        metalness: 0.2
                      });
                    });
                  } else {
                    child.material = new THREE.MeshStandardMaterial({
                      color: 0x999999,
                      roughness: 0.7,
                      metalness: 0.2
                    });
                  }
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });
              
              // Add model to scene
              scene.add(obj);
              
              // Render front view
              renderer.render(scene, camera);
              
              // Get image data
              const frontViewDataUrl = renderer.domElement.toDataURL('image/png');
              resolve(frontViewDataUrl);
              
              // Clean up
              scene.remove(obj);
              obj.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  if (child.geometry) child.geometry.dispose();
                  if (child.material) {
                    if (Array.isArray(child.material)) {
                      child.material.forEach(material => material.dispose());
                    } else {
                      child.material.dispose();
                    }
                  }
                }
              });
            }, undefined, (error) => {
              console.error('Error loading model:', error);
              reject(error);
            });
          } else {
            // For unsupported formats, create a basic shape
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshStandardMaterial({
              color: 0x999999,
              roughness: 0.7,
              metalness: 0.2
            });
            const mesh = new THREE.Mesh(geometry, material);
            
            // Place bottom at ground level
            mesh.position.y = height / 2;
            
            // Add to scene and render
            scene.add(mesh);
            renderer.render(scene, camera);
            
            // Get image data
            const frontViewDataUrl = renderer.domElement.toDataURL('image/png');
            resolve(frontViewDataUrl);
            
            // Clean up
            scene.remove(mesh);
            geometry.dispose();
            material.dispose();
          }
        };
        
        // Execute model loading
        loadModel();
        
      } catch (error) {
        console.error('Error generating front view:', error);
        reject(error);
      }
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);

    try {
      // Read the file as data URL
      const fileReader = new FileReader();
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as string);
        fileReader.onerror = reject;
        fileReader.readAsDataURL(file);
      });
      
      // Get dimensions
      const width = parseFloat(modelWidth);
      const height = parseFloat(modelHeight);
      const depth = parseFloat(modelDepth);
      
      // Get file format
      const format = file.name.split('.').pop()?.toLowerCase() || 'unknown';
      
      // Generate front view thumbnail
      const frontViewImage = await generateFrontViewImage(
        fileDataUrl, 
        format,
        width,
        height,
        depth
      );
      
      // Add the model to our collection with the front view image
      addCustomFurnitureModel({
        id: Date.now().toString(),
        name: modelName || file.name.split('.')[0],
        type: modelType,
        url: fileDataUrl,
        format,
        dimensions: {
          width,
          depth,
          height
        },
        frontView: frontViewImage
      });

      // Reset form and close modal
      setIsUploading(false);
      onClose();
    } catch (error) {
      console.error('Error processing file:', error);
      setIsUploading(false);
      alert('Failed to process the 3D model. Please try again.');
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onDragEnter={handleDrag}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Upload 3D Model</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Supported formats: GLB, GLTF, OBJ</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="My Furniture"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="chair">Chair</option>
                <option value="table">Table</option>
                <option value="sofa">Sofa</option>
                <option value="storage">Storage</option>
                <option value="decoration">Decoration</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Width (m)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={modelWidth}
                  onChange={(e) => setModelWidth(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Depth (m)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={modelDepth}
                  onChange={(e) => setModelDepth(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Height (m)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={modelHeight}
                  onChange={(e) => setModelHeight(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div 
              className={`mt-4 p-6 border-2 border-dashed rounded-lg text-center cursor-pointer ${
                dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              
              <p className="mt-2 text-sm text-gray-600">
                {dragActive ? 'Drop the file here' : 'Drag & drop your 3D model here or click to browse'}
              </p>
              
              <input
                id="model-upload"
                type="file"
                ref={fileInputRef}
                accept=".glb,.gltf,.obj"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                disabled={isUploading}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex items-center"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload Model
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}