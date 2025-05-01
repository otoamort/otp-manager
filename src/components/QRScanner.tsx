'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import jsQR from 'jsqr';

/**
 * Props for the QRScanner component
 */
interface QRScannerProps {
  /** Function called when a QR code is successfully scanned */
  onCodeDetected: (data: string) => void;
  /** Whether the scanner is currently active */
  isScanning: boolean;
  /** Function to set the scanning state */
  setIsScanning: (isScanning: boolean) => void;
}

/**
 * Component that handles QR code scanning using the device camera.
 * Provides UI for camera access and processes video frames to detect QR codes.
 * 
 * @param props - The component props
 * @returns The rendered QR scanner component
 */
export function QRScanner({ onCodeDetected, isScanning, setIsScanning }: QRScannerProps) {
  /** Reference to the video element for camera feed */
  const videoRef = useRef<HTMLVideoElement>(null);
  /** Reference to the canvas element for processing video frames */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Indicates whether the user has granted camera access permission */
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  /** Hook for displaying toast notifications */
  const { toast } = useToast();

  /**
   * Requests camera permission from the user and sets up the video stream.
   * Updates state based on whether permission was granted or denied.
   */
  const getCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description:
          'Please enable camera permissions in your browser settings to use this feature.',
      });
    }
  };

  /**
   * Handles the process of scanning a QR code using the device camera.
   * First ensures camera permission is granted, then continuously analyzes
   * video frames to detect QR codes containing OTP configuration data.
   */
  const handleScanQRCode = async () => {
    if (!hasCameraPermission) {
      await getCameraPermission();
      return;
    }

    setIsScanning(true);
  };

  /**
   * Effect hook to process video frames when scanning is active.
   * Continuously checks for QR codes in the camera feed.
   */
  useEffect(() => {
    if (!isScanning || !hasCameraPermission) return;

    let animationFrameId: number;

    /**
     * Recursive function that processes video frames to detect QR codes.
     * Continues until a QR code is found or scanning is stopped.
     */
    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!canvas) {
          setIsScanning(false);
          return;
        }
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;

        const context = canvas.getContext('2d');
        if (!context) {
          setIsScanning(false);
          return;
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          onCodeDetected(code.data);
          setIsScanning(false);
          // Stop the camera stream
          if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
          }
          return;
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    // Cleanup function to cancel animation frame and stop camera when component unmounts
    // or when scanning is stopped
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isScanning, hasCameraPermission, onCodeDetected, setIsScanning]);

  return (
    <div className="flex flex-col space-y-4">
      {isScanning ? (
        <>
          <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
          <canvas ref={canvasRef} className="hidden" />
          {!hasCameraPermission && (
            <Alert variant="destructive">
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera access to use this feature.
              </AlertDescription>
            </Alert>
          )}
          <Button variant="secondary" onClick={() => setIsScanning(false)}>
            Cancel Scanning
          </Button>
        </>
      ) : (
        <Button variant="secondary" onClick={handleScanQRCode}>
          <Camera className="mr-2 h-4 w-4" />
          Scan QR Code
        </Button>
      )}
    </div>
  );
}