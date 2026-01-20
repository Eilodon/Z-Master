
import { useCallback } from 'react';
import { useZenStore, useUIStore } from '../store/zenStore';
import { getSharedAudioContext } from '../services/audioContext';

export function usePermissions() {
  const { 
    micStatus, cameraStatus,
    setMicStatus, setCameraStatus 
  } = useZenStore();
  
  const { setSnackbar, setInputMode } = useUIStore();

  /**
   * PRIMER: Request Audio Permission Only.
   * We delay Camera permission until the user explicitly clicks the Scan button.
   * This reduces friction and prevents "All media denied" errors on devices without cameras.
   */
  const requestInitialPermissions = useCallback(async () => {
    setMicStatus('prompting');
    
    try {
      console.log("[Permissions] Requesting Mic only...");
      // FIX: Request only audio initially.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setMicStatus('granted');
      
      // Initialize Audio Context immediately after user gesture
      const ctx = await getSharedAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      // Stop the priming stream immediately (we just needed the permission)
      stream.getTracks().forEach(t => t.stop());
      console.log("[Permissions] Mic Granted & AudioContext Resumed");

    } catch (e: any) {
      console.warn("[Permissions] Mic denied/failed", e);
      setMicStatus('denied');
      
      // Graceful Fallback: Switch to Text Mode automatically
      setSnackbar({ 
        text: "Không có quyền Micro. Đã chuyển sang chế độ Chat.", 
        kind: "info" 
      });
      setInputMode('text');
      
      // IMPORTANT: Do not throw here. 
      // Resolving allows LoadingScreen to complete and let the user enter the app in Text Mode.
    }
  }, [setMicStatus, setSnackbar, setInputMode]);

  /**
   * Camera specific request (for CameraScan component)
   */
  const requestCamera = useCallback(async (): Promise<boolean> => {
    if (cameraStatus === 'granted') return true;
    
    setCameraStatus('prompting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStatus('granted');
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch (e) {
      console.warn("Camera request failed", e);
      setCameraStatus('denied');
      return false;
    }
  }, [cameraStatus, setCameraStatus]);

  return {
    micStatus,
    cameraStatus,
    requestInitialPermissions,
    requestCamera
  };
}
