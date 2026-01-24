
import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface Props {
  onComplete?: () => void;
  onStartInteraction?: () => Promise<void>;
}

export const LoadingScreen: React.FC<Props> = ({ onComplete, onStartInteraction }) => {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // 1. Progress Animation Phase
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsReady(true); // Wait for user interaction
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // Create CSS classes dynamically
  const progressClasses = `h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300 ease-out`;
  const progressContainerClasses = `w-full h-2 bg-stone-200 rounded-full overflow-hidden`;
  const progressWrapperClasses = `h-14 flex items-center justify-center relative w-64`;
  
  // Add inline style to document head for dynamic width
  useEffect(() => {
    const styleId = 'progress-bar-style';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = `
      .progress-bar-dynamic {
        width: ${progress}% !important;
      }
    `;
    
    return () => {
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, [progress]);

  const handleStart = async () => {
    // 1. Trigger permission request immediately while user click context is active
    if (onStartInteraction) {
      setIsRequesting(true);
      try {
        // AWAIT user action here.
        await onStartInteraction();
      } catch (e) {
        console.warn("Permission request failed, proceeding to fallback", e);
        // We assume the hook handled state (e.g. switched to text mode)
      } finally {
        // FORCE ENTRY: Always animation out after interaction
        setIsFading(true);
        setTimeout(() => {
          onComplete?.();
        }, 1000);
      }
    } else {
      // No interaction needed fallback
      setIsFading(true);
      setTimeout(() => {
        onComplete?.();
      }, 1000);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[70] bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col items-center justify-center transition-opacity duration-1000 ease-in-out ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="text-6xl mb-6 animate-pulse">🪷</div>
      <h1 className="text-3xl font-bold text-orange-600 mb-2 font-serif">Thầy.AI</h1>

      {/* Dynamic Status Text */}
      <p className="text-stone-600 mb-8 font-light italic h-6 transition-all duration-500">
        {isReady
          ? (isRequesting ? "Đang xử lý..." : "Cần cấp quyền Micro & Camera để bắt đầu")
          : "Đang kết nối với trí tuệ..."}
      </p>

      {/* Progress Bar / Start Button Swap */}
      <div className={progressWrapperClasses}>
        {!isReady ? (
          <div className={progressContainerClasses}>
            <div
              className={`${progressClasses} progress-bar-dynamic`}
            />
          </div>
        ) : (
          <button
            onClick={handleStart}
            disabled={isRequesting}
            className="group flex items-center gap-3 px-8 py-3 bg-stone-800 text-white rounded-full font-medium shadow-xl hover:bg-orange-600 transition-all duration-300 animate-[scaleIn_0.3s_ease-out] disabled:opacity-70 disabled:cursor-wait"
          >
            <span>{isRequesting ? "Đang xử lý..." : "Cấp quyền & Bắt đầu"}</span>
            {!isRequesting && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        )}
      </div>
    </div>
  );
};
