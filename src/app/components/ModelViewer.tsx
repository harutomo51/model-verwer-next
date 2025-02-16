"use client";

import { useEffect, useRef, useState } from "react";

// model-viewerの型定義
interface ModelViewerElement extends HTMLElement {
  cameraOrbit: string;
  cameraTarget: string;
  fieldOfView: string;
  jumpCameraToGoal: () => void;
  exposure: number;
  environmentImage: string;
}

// 環境マップの選択肢
const environmentOptions = [
  { value: 'neutral', label: 'Neutral', path: 'https://modelviewer.dev/shared-assets/environments/neutral.hdr' },
  { value: 'spruit-sunrise', label: 'Spruit Sunrise', path: 'https://modelviewer.dev/shared-assets/environments/spruit_sunrise_1k_HDR.hdr' },
  { value: 'aircraft-workshop', label: 'Aircraft Workshop', path: 'https://modelviewer.dev/shared-assets/environments/aircraft_workshop_01_1k.hdr' },
  { value: 'music-hall', label: 'Music Hall', path: 'https://modelviewer.dev/shared-assets/environments/music_hall_01_1k.hdr' },
  { value: 'pillars', label: 'Pillars', path: 'https://modelviewer.dev/shared-assets/environments/pillars_1k.hdr' },
  { value: 'whipple-creek', label: 'Whipple Creek', path: 'https://modelviewer.dev/shared-assets/environments/whipple_creek_regional_park_04_1k.hdr' },
];

export default function ModelViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [modelFile, setModelFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const modelViewerRef = useRef<ModelViewerElement | null>(null);
  const [exposure, setExposure] = useState(1);
  const [environment, setEnvironment] = useState('neutral');

  useEffect(() => {
    // @google/model-viewerのスクリプトを一度だけ読み込む
    if (!document.querySelector('script[src*="model-viewer.min.js"]')) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js";
      document.body.appendChild(script);
    }

    // model-viewerエレメントを作成
    const modelViewer = document.createElement("model-viewer") as ModelViewerElement;
    modelViewer.setAttribute("src", modelFile || "");
    modelViewer.setAttribute("alt", "3Dモデル");
    modelViewer.setAttribute("camera-controls", "");
    modelViewer.setAttribute("auto-rotate", "");
    modelViewer.setAttribute("ar", "");
    modelViewer.setAttribute("auto-scale", "");
    modelViewer.setAttribute("bounds", "tight");
    modelViewer.setAttribute("min-camera-orbit", "auto");
    modelViewer.setAttribute("max-camera-orbit", "auto");
    modelViewer.exposure = exposure;
    // 初期環境マップを設定
    const initialEnv = environmentOptions.find(env => env.value === environment);
    if (initialEnv) {
      modelViewer.setAttribute('environment-image', initialEnv.path);
    }
    modelViewer.style.width = "100%";
    modelViewer.style.height = "100%";
    modelViewer.style.backgroundColor = "transparent";

    // モデルの読み込み完了時にカメラを調整
    modelViewer.addEventListener('load', () => {
      // auto-rotateを一時的に無効化
      const wasAutoRotating = modelViewer.hasAttribute('auto-rotate');
      if (wasAutoRotating) {
        modelViewer.removeAttribute('auto-rotate');
      }

      // カメラを調整してモデル全体を表示
      modelViewer.cameraOrbit = "0deg 75deg auto";
      modelViewer.fieldOfView = "auto";
      modelViewer.jumpCameraToGoal();

      // auto-rotateを元に戻す
      if (wasAutoRotating) {
        setTimeout(() => {
          modelViewer.setAttribute('auto-rotate', '');
        }, 100);
      }
    });

    // 既存のmodel-viewerを削除
    const existingViewer = containerRef.current?.querySelector("model-viewer");
    if (existingViewer) {
      existingViewer.remove();
    }

    // 新しいmodel-viewerを追加
    if (containerRef.current) {
      containerRef.current.appendChild(modelViewer);
      modelViewerRef.current = modelViewer;
    }

    // クリーンアップ関数
    return () => {
      const viewer = containerRef.current?.querySelector("model-viewer");
      if (viewer) {
        viewer.remove();
      }
    };
  }, [modelFile]); // exposureを依存配列から削除

  // ドラッグ＆ドロップのイベントハンドラを設定
  useEffect(() => {
    const preventDefault = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // ページ全体のドラッグ＆ドロップをキャンセル
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);

    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.match(/\.(glb|gltf)$/i)) {
      // 既存のURLを解放
      if (modelFile) {
        URL.revokeObjectURL(modelFile);
      }
      const url = URL.createObjectURL(file);
      setModelFile(url);
    } else {
      alert("GLBまたはGLTFファイルを選択してください。");
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file && file.name.match(/\.(glb|gltf)$/i)) {
      // 既存のURLを解放
      if (modelFile) {
        URL.revokeObjectURL(modelFile);
      }
      const url = URL.createObjectURL(file);
      setModelFile(url);
    } else {
      alert("GLBまたはGLTFファイルをドロップしてください。");
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleResetCamera = () => {
    if (modelViewerRef.current) {
      const viewer = modelViewerRef.current;
      // auto-rotateを一時的に無効化
      const wasAutoRotating = viewer.hasAttribute('auto-rotate');
      if (wasAutoRotating) {
        viewer.removeAttribute('auto-rotate');
      }

      // カメラを初期位置にリセット
      viewer.cameraOrbit = "0deg 75deg auto";
      viewer.fieldOfView = "auto";
      viewer.jumpCameraToGoal();

      // auto-rotateを元に戻す
      if (wasAutoRotating) {
        setTimeout(() => {
          viewer.setAttribute('auto-rotate', '');
        }, 100);
      }
    }
  };

  const handleExposureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    setExposure(value);
    if (modelViewerRef.current) {
      modelViewerRef.current.exposure = value;
    }
  };

  const handleEnvironmentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newEnvironment = event.target.value;
    setEnvironment(newEnvironment);
    
    // 環境マップを更新
    if (modelViewerRef.current) {
      const selectedEnv = environmentOptions.find(env => env.value === newEnvironment);
      if (selectedEnv) {
        modelViewerRef.current.setAttribute('environment-image', selectedEnv.path);
      }
    }
  };

  return (
    <div 
      className="relative w-full h-full"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <div
        ref={containerRef}
        className={`w-full h-full rounded-lg transition-all duration-200 ${
          !modelFile
            ? 'border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
            : ''
        } ${isDragging ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30' : ''}`}
      />
      
      {!modelFile ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 pointer-events-none">
          <div className="flex flex-col items-center gap-4 p-8 rounded-lg">
            <div className="flex items-center gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                ここにファイルをドロップ
              </span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">または</span>
            <label className="px-4 py-2 bg-blue-500 text-white rounded-full cursor-pointer hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors pointer-events-auto">
              ファイルを選択
              <input
                type="file"
                accept=".glb,.gltf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              対応フォーマット: GLB, GLTF
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleResetCamera}
              className="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full shadow-lg transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              カメラリセット
            </button>
            <button
              onClick={() => {
                if (modelFile) {
                  URL.revokeObjectURL(modelFile);
                }
                setModelFile(null);
              }}
              className="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full shadow-lg transition-colors"
            >
              モデルを変更
            </button>
          </div>
          <div className="absolute bottom-4 right-4 flex flex-col gap-4 bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg shadow-lg min-w-[200px]">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">環境マップ</label>
              <select
                value={environment}
                onChange={handleEnvironmentChange}
                className="w-full px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {environmentOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">露光</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">暗</span>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={exposure}
                  onChange={handleExposureChange}
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">明</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}