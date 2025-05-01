'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

/**
 * Interface representing an OTP configuration.
 * Contains all the information needed to generate and identify an OTP.
 */
interface OTPConfig {
  /** Unique identifier for the configuration */
  id: string;
  /** Name of the account associated with this OTP */
  accountName: string;
  /** Secret key used to generate the OTP */
  secretKey: string;
  /** Optional text to add before the OTP */
  prefix: string;
  /** Optional text to add after the OTP */
  postfix: string;
}

/**
 * Props for the AddEditDialog component
 */
interface AddEditDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Function to call when the dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** ID of the configuration being edited, or null when adding a new configuration */
  selectedConfigId: string | null;
  /** Current account name value */
  accountName: string;
  /** Function to update the account name */
  setAccountName: (value: string) => void;
  /** Current secret key value */
  secretKey: string;
  /** Function to update the secret key */
  setSecretKey: (value: string) => void;
  /** Current prefix value */
  prefix: string;
  /** Function to update the prefix */
  setPrefix: (value: string) => void;
  /** Current postfix value */
  postfix: string;
  /** Function to update the postfix */
  setPostfix: (value: string) => void;
  /** Function to save the configuration */
  onSave: () => void;
  /** Function to handle scanning a QR code */
  onScanQRCode: () => void;
  /** Function to handle uploading a QR code image */
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Whether QR code scanning is active */
  isScanning: boolean;
  /** Whether camera permission has been granted */
  hasCameraPermission: boolean;
  /** Reference to the video element for QR code scanning */
  videoRef: React.RefObject<HTMLVideoElement>;
  /** Reference to the canvas element for QR code scanning */
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

/**
 * Component that displays a dialog for adding or editing OTP configurations.
 * Includes fields for account name, secret key, prefix, and postfix.
 * Also provides options for scanning QR codes or uploading QR code images.
 * 
 * @param props - The component props
 * @returns The rendered dialog component
 */
export function AddEditDialog({
  isOpen,
  onOpenChange,
  selectedConfigId,
  accountName,
  setAccountName,
  secretKey,
  setSecretKey,
  prefix,
  setPrefix,
  postfix,
  setPostfix,
  onSave,
  onScanQRCode,
  onImageUpload,
  isScanning,
  hasCameraPermission,
  videoRef,
  canvasRef
}: AddEditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selectedConfigId ? 'Edit' : 'Add'} OTP Configuration</DialogTitle>
          <DialogDescription>
            Enter the details for the OTP configuration.
          </DialogDescription>
        </DialogHeader>

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
          </>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountName" className="text-right">
                Account Name
              </Label>
              <Input
                type="text"
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="secretKey" className="text-right">
                Secret Key
              </Label>
              <Textarea
                id="secretKey"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prefix" className="text-right">
                Prefix
              </Label>
              <Input
                type="text"
                id="prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="postfix" className="text-right">
                Postfix
              </Label>
              <Input
                type="text"
                id="postfix"
                value={postfix}
                onChange={(e) => setPostfix(e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={onScanQRCode}
                disabled={isScanning}
              >
                <Camera className="mr-2 h-4 w-4" />
                Scan QR Code
              </Button>
              <Input
                type="file"
                id="imageUpload"
                accept="image/*"
                className="hidden"
                onChange={onImageUpload}
              />
              <Label htmlFor="imageUpload" className="cursor-pointer">
                <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  <span>Upload QR Code</span>
                </span>
              </Label>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button type="submit" onClick={onSave}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}