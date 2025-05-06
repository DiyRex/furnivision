// app/dashboard/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import RoomSettings from "../../../components/RoomSettings";
import ColorPicker from "../../../components/ColorPicker";
import FurnitureSelector from "../../../components/FurnitureSelector";
import { DesignProvider, useDesign } from "../../../lib/DesignContext";
import Canvas2D, { Canvas2DHandle } from "../../../components/Canvas2D";
import Scene3D from "../../../components/Scene3D";
import FurnitureControls from "../../../components/FurnitureControls";
import SelectedFurniturePanel from "../../../components/SelectedFurniturePanel";
import SaveDesignModal from "../../../components/SaveDesignModal";
import DesignGallery from "../../../components/DesignGallery";
import RoomBackgrounds from "../../../components/RoomBackgrounds";
import ModelUploader from "../../../components/ModelUploader";
import ModelLibrary from "../../../components/ModelLibrary";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { app } from "../services/firebase/config";
import { UserCircle } from "lucide-react";
import { Menu } from "@headlessui/react";
import { logout } from "../services/firebase/Logout";

export default function Dashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [view, setView] = useState<"2d" | "3d">("2d");
  const [activeTab, setActiveTab] = useState("room");
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const canvas2DRef = useRef<Canvas2DHandle>(null);
  const [viewChanged, setViewChanged] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user || !user.email) {
        router.replace("/auth");
      } else {
        setUserEmail(user.email);
      }
      setAuthChecked(true); // Mark auth check complete
    });

    return () => unsubscribe();
  }, [router]);

  if (!authChecked) return null;

  const captureScreenshot = () => {
    // If we're in 2D view, capture from Canvas2D
    if (view === "2d" && canvas2DRef.current) {
      return canvas2DRef.current.captureImage();
    }

    // For 3D view, return null for now
    return null;
  };

  return (
    <DesignProvider>
      <div className="flex h-screen flex-col">
        {/* Navbar */}
        <div className="bg-white shadow-sm h-16 flex items-center px-6">
          <h1 className="text-xl font-bold text-indigo-600">FurniVision</h1>
          <div className="ml-8 flex space-x-4">
            <button
              onClick={() => setActiveTab("gallery")}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === "gallery"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Gallery
            </button>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center space-x-2 focus:outline-none">
                <UserCircle className="h-8 w-8 text-indigo-600" />
              </Menu.Button>

              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                    {userEmail}
                  </div>
                  <button
                    onClick={async () => {
                      await logout();
                      router.replace("/auth");
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </Menu.Items>
            </Menu>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("room")}
                  className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === "room"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Room
                </button>
                <button
                  onClick={() => setActiveTab("furniture")}
                  className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === "furniture"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Furniture
                </button>
                <button
                  onClick={() => setActiveTab("models")}
                  className={`w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === "models"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  3D Models
                </button>
                <button
                  onClick={() => setActiveTab("backgrounds")}
                  className={`w-1/5 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === "backgrounds"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Images
                </button>
                <button
                  onClick={() => setActiveTab("colors")}
                  className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === "colors"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Colors
                </button>
              </nav>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === "gallery" && <DesignGallery />}
              {activeTab === "room" && <RoomSettings />}
              {activeTab === "backgrounds" && <RoomBackgrounds />}
              {activeTab === "furniture" && <FurnitureSelector />}
              {activeTab === "colors" && <ColorPicker />}
              {activeTab === "models" && (
                <div className="space-y-6">
                  <ModelUploader />
                  <div className="border-t my-4"></div>
                  <ModelLibrary />
                </div>
              )}
            </div>

            {/* Only show furniture panel when not in gallery view */}
            {activeTab !== "gallery" && <SelectedFurniturePanel />}

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setIsSaveModalOpen(true)}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Design
              </button>
            </div>
          </div>

          {/* Main workspace */}
          <div className="flex-1 overflow-hidden bg-gray-50 p-4">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-semibold text-gray-800">
                Room Designer
              </h1>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setView("2d");
                    setViewChanged(true);
                    // Reset viewChanged after a short delay
                    setTimeout(() => setViewChanged(false), 200);
                  }}
                  className={`px-4 py-2 rounded ${
                    view === "2d"
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-800 border"
                  }`}
                >
                  2D View
                </button>
                <button
                  onClick={() => {
                    setView("3d");
                    setViewChanged(true);
                    // Reset viewChanged after a short delay
                    setTimeout(() => setViewChanged(false), 200);
                  }}
                  className={`px-4 py-2 rounded ${
                    view === "3d"
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-800 border"
                  }`}
                >
                  3D View
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm h-full">
              {view === "2d" ? (
                <Canvas2D
                  ref={canvas2DRef}
                  key={viewChanged ? "changed" : "static"}
                />
              ) : (
                <Scene3D key={viewChanged ? "changed" : "static"} />
              )}
            </div>
          </div>
        </div>

        <SaveDesignModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          captureScreenshot={captureScreenshot}
        />
      </div>
    </DesignProvider>
  );
}
