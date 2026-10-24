import React, { useRef, useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { RefreshCw, Check, X, AlertCircle } from 'lucide-react';

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoDataUrl: string) => void;
  title: string;
  subtitle?: string;
  facingMode?: 'user' | 'environment';
}

export const LiveCameraModal: React.FC<LiveCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title,
  subtitle,
  facingMode = 'environment',
}) => {
  const { t, language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>(facingMode);
  const [isStarting, setIsStarting] = useState(false);

  // Sync facingMode prop whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentFacingMode(facingMode);
      setCapturedPhoto(null);
      setCameraError(null);
      startCamera(facingMode);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (mode: 'user' | 'environment') => {
    setIsStarting(true);
    setCameraError(null);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        language === 'hi'
          ? 'आपके ब्राउज़र में कैमरा सपोर्ट उपलब्ध नहीं है। कृपया Chrome या Safari में खोलें।'
          : 'Camera API is not supported in this browser. Please use Chrome or Safari.'
      );
      setIsStarting(false);
      return;
    }

    try {
      // Direct request with exact preferred facingMode first
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('[Camera] Ideal facingMode error, attempting strict fallback:', err);
      // If permission was denied specifically, show clear permission error
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          language === 'hi'
            ? 'कैमरा अनुमति अस्वीकृत (Permission Denied)। कृपया ब्राउज़र सेटिंग्स में कैमरा की अनुमति दें।'
            : 'Camera permission denied. Please allow camera access in your browser settings.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError(
          language === 'hi'
            ? `${mode === 'user' ? 'फ्रंट' : 'बैक'} कैमरा डिवाइस नहीं मिला।`
            : `${mode === 'user' ? 'Front' : 'Rear'} camera not found on this device.`
        );
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        // The requested camera direction (user/environment) cannot be satisfied by this device/browser
        setCameraError(
          language === 'hi'
            ? `उपकरण द्वारा ${mode === 'user' ? 'फ्रंट (Selfie)' : 'रियर (Rear)'} कैमरा अनुरोध समर्थित नहीं है। कृपया सही कैमरा वाले उपकरण का उपयोग करें।`
            : `Requested ${mode === 'user' ? 'front (selfie)' : 'rear (environment)'} camera is not supported on this device/browser.`
        );
      } else {
        setCameraError(
          language === 'hi'
            ? 'कैमरा शुरू करने में असमर्थ। कृपया जांचें कि अन्य ऐप कैमरा का उपयोग नहीं कर रहा है।'
            : 'Unable to start camera. Please verify camera permissions and ensure no other app is using it.'
        );
      }
    } finally {
      setIsStarting(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, mirror image
    if (currentFacingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera(currentFacingMode);
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      onClose();
    }
  };

  const toggleFacingMode = () => {
    setCurrentFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm">
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-slate-900 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />
              <h3 className="font-semibold text-white">{title}</h3>
            </div>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label={t.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewfinder / Preview */}
        <div className="relative aspect-4/3 w-full overflow-hidden bg-black">
          {cameraError ? (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="mb-2 h-10 w-10 text-amber-400" />
              <p className="text-sm text-slate-300">{cameraError}</p>
              <button
                onClick={() => startCamera(currentFacingMode)}
                className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700"
              >
                {t.common.retry}
              </button>
            </div>
          ) : capturedPhoto ? (
            <img
              src={capturedPhoto}
              alt="Captured"
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${currentFacingMode === 'user' ? '-scale-x-100' : ''}`}
              />
              {/* Camera Grid Lines */}
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/20">
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div />
              </div>

              {/* Notice Banner */}
              <div className="absolute top-2 left-2 right-2 rounded-md bg-black/60 px-3 py-1.5 text-center text-xs text-rose-300 backdrop-blur-xs font-medium">
                {language === 'hi'
                  ? '🔴 LIVE CAMERA ONLY — गैलरी चयन उपलब्ध नहीं है'
                  : '🔴 LIVE CAMERA ONLY — Gallery upload is not available'}
              </div>
            </>
          )}

          {/* Hidden Canvas */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 p-4">
          {capturedPhoto ? (
            <div className="flex w-full items-center justify-between gap-3">
              <button
                onClick={handleRetake}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-sm font-medium text-slate-200 hover:bg-slate-700"
              >
                <RefreshCw className="h-4 w-4" />
                {t.camera.retakeBtn}
              </button>
              <button
                onClick={handleConfirm}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500"
              >
                <Check className="h-4 w-4" />
                {t.camera.confirmBtn}
              </button>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between">
              <button
                onClick={toggleFacingMode}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700"
                title={t.camera.switchCamera}
              >
                <RefreshCw className="h-4 w-4" />
                <span>{t.camera.switchCamera}</span>
              </button>

              <button
                onClick={handleCapture}
                disabled={isStarting || !!cameraError}
                className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-rose-500 bg-white shadow-lg transition active:scale-95 disabled:opacity-50"
                aria-label={t.camera.captureBtn}
              >
                <div className="h-12 w-12 rounded-full bg-rose-600" />
              </button>

              <div className="w-20 text-right text-xs text-slate-400">
                {currentFacingMode === 'user'
                  ? language === 'hi'
                    ? 'फ्रंट कैमरा'
                    : 'Front Camera'
                  : language === 'hi'
                  ? 'बैक कैमरा'
                  : 'Back Camera'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
