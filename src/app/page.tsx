'use client';

import {useState, useEffect, useRef} from 'react';
import {Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
  Plus,
  Copy,
  Edit,
  Trash2,
  RefreshCw,
  Camera,
  Image as ImageIcon,
  Download,
  Upload,
} from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {Textarea} from '@/components/ui/textarea';
import {useToast} from '@/hooks/use-toast';
import {cn, parseOtpAuthUri} from '@/lib/utils';
import jsQR from 'jsqr';
import {authenticator, totp} from 'otplib';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {ButtonGroup} from '@/components/ui/button-group';

/**
 * Generates a One-Time Password (OTP) based on the provided secret key.
 * Optionally adds prefix and postfix text to the generated token.
 * 
 * @param secret - The secret key used to generate the OTP
 * @param prefix - Optional text to add before the OTP (default: '')
 * @param postfix - Optional text to add after the OTP (default: '')
 * @returns The generated OTP with optional prefix and postfix
 */
function generateOTP(secret: string, prefix: string = '', postfix: string = '') {
  const token = authenticator.generate(secret);
  return `${prefix}${token}${postfix}`;
}

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
 * Main component for the OTP Manager Pro application.
 * Handles the display and management of OTP configurations, including adding,
 * editing, deleting, and generating OTP codes.
 * 
 * @returns The rendered OTP Manager Pro application
 */
export default function Home() {
  /** State for storing all OTP configurations */
  const [otpConfigs, setOtpConfigs] = useState<OTPConfig[]>([]);
  /** Controls the visibility of the add/edit dialog */
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  /** Stores the account name for the current configuration being added/edited */
  const [accountName, setAccountName] = useState('');
  /** Stores the secret key for the current configuration being added/edited */
  const [secretKey, setSecretKey] = useState('');
  /** Stores the prefix for the current configuration being added/edited */
  const [prefix, setPrefix] = useState('');
  /** Stores the postfix for the current configuration being added/edited */
  const [postfix, setPostfix] = useState('');
  /** ID of the configuration being edited, or null when adding a new configuration */
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  /** Hook for displaying toast notifications */
  const {toast} = useToast();

  /** Controls whether the QR code scanner is active */
  const [isScanning, setIsScanning] = useState(false);
  /** Reference to the video element used for QR code scanning */
  const videoRef = useRef<HTMLVideoElement>(null);
  /** Reference to the canvas element used for processing video frames */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Indicates whether the user has granted camera access permission */
  const [hasCameraPermission, setHasCameraPermission] = useState(false);

  /**
   * Effect hook to load OTP configurations from local storage when the component mounts.
   * This ensures that user configurations persist between sessions.
   */
  useEffect(() => {
    // Load configurations from local storage on component mount
    const storedConfigs = localStorage.getItem('otpConfigs');
    if (storedConfigs) {
      setOtpConfigs(JSON.parse(storedConfigs));
    }
  }, []);

  /**
   * Effect hook to save OTP configurations to local storage whenever they change.
   * This ensures that user configurations are always up-to-date in storage.
   */
  useEffect(() => {
    // Save configurations to local storage whenever otpConfigs changes
    localStorage.setItem('otpConfigs', JSON.stringify(otpConfigs));
  }, [otpConfigs]);

  /**
   * Handles the action of adding a new OTP configuration.
   * Opens the dialog and resets all form fields.
   */
  const handleAddConfig = () => {
    setIsDialogOpen(true);
    setSelectedConfigId(null); // Reset selected config for adding new config
    setAccountName('');
    setSecretKey('');
    setPrefix('');
    setPostfix('');
  };

  /**
   * Handles the action of editing an existing OTP configuration.
   * Opens the dialog and populates form fields with the selected configuration's data.
   * 
   * @param config - The OTP configuration to edit
   */
  const handleEditConfig = (config: OTPConfig) => {
    setIsDialogOpen(true);
    setSelectedConfigId(config.id);
    setAccountName(config.accountName);
    setSecretKey(config.secretKey);
    setPrefix(config.prefix);
    setPostfix(config.postfix);
  };

  /**
   * Handles saving a new or updated OTP configuration.
   * Validates required fields, creates or updates the configuration,
   * and displays a success or error message.
   */
  const handleSaveConfig = () => {
    if (!accountName || !secretKey) {
      toast({
        title: 'Error',
        description: 'Account Name and Secret Key cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    const newConfig = {
      id: selectedConfigId || Math.random().toString(36).substring(7),
      accountName,
      secretKey,
      prefix,
      postfix,
    };

    setOtpConfigs((prevConfigs) => {
      const updatedConfigs = selectedConfigId
        ? prevConfigs.map((config) =>
            config.id === selectedConfigId ? newConfig : config
          )
        : [...prevConfigs, newConfig];
      return updatedConfigs;
    });

    setIsDialogOpen(false);
    toast({
      title: 'Success',
      description: `Configuration ${selectedConfigId ? 'updated' : 'added'} successfully.`,
    });
  };

  /**
   * Handles the deletion of an OTP configuration.
   * Removes the configuration with the specified ID and displays a success message.
   * 
   * @param id - The ID of the configuration to delete
   */
  const handleDeleteConfig = (id: string) => {
    setOtpConfigs((prevConfigs) =>
      prevConfigs.filter((config) => config.id !== id)
    );
    toast({
      title: 'Success',
      description: 'Configuration deleted successfully.',
    });
  };

  /**
   * Handles copying an OTP code to the clipboard.
   * Generates the OTP using the provided secret, prefix, and postfix,
   * copies it to the clipboard, and displays a success message.
   * 
   * @param secret - The secret key used to generate the OTP
   * @param prefix - Text to add before the OTP
   * @param postfix - Text to add after the OTP
   */
  const handleCopyOTP = (secret: string, prefix: string, postfix: string) => {
    const otp = generateOTP(secret, prefix, postfix);
    navigator.clipboard.writeText(otp);
    toast({
      title: 'OTP Copied',
      description: 'OTP copied to clipboard.',
    });
  };

  /** 
   * State to track the remaining time (in seconds) for each OTP before it expires
   * Keys are configuration IDs, values are seconds remaining
   */
  const [remainingTimes, setRemainingTimes] = useState<{
    [key: string]: number;
  }>({});

  /**
   * Calculates the remaining time for each OTP configuration before it expires.
   * TOTP codes typically change every 30 seconds, so this calculates how many
   * seconds are left in the current period.
   */
  const calculateRemainingTime = () => {
    const newRemainingTimes: {[key: string]: number} = {};
    otpConfigs.forEach((config) => {
      newRemainingTimes[config.id] = 30 - (Math.floor(Date.now() / 1000) % 30);
    });
    setRemainingTimes(newRemainingTimes);
  };

  /**
   * Effect hook to update the remaining time for each OTP every second.
   * Sets up an interval that runs every second and cleans it up when the component unmounts.
   */
  useEffect(() => {
    calculateRemainingTime();
    const intervalId = setInterval(calculateRemainingTime, 1000);
    return () => clearInterval(intervalId);
  }, [otpConfigs]);

  /**
   * Handles refreshing and copying an OTP code.
   * Generates a new OTP, copies it to the clipboard, and displays a success message.
   * 
   * @param secret - The secret key used to generate the OTP
   * @param prefix - Text to add before the OTP
   * @param postfix - Text to add after the OTP
   */
  const handleRefreshOTP = (secret: string, prefix: string, postfix: string) => {
    // For simplicity, directly copy the new OTP without waiting for the timer
    const otp = generateOTP(secret, prefix, postfix);
    navigator.clipboard.writeText(otp);
    toast({
      title: 'OTP Refreshed and Copied',
      description: 'New OTP copied to clipboard.',
    });
  };

  /** Controls whether OTP codes are visible or masked (for security) */
  const [isOtpVisible, setIsOtpVisible] = useState(false);

  /**
   * Toggles the visibility of OTP codes between shown and hidden.
   * This allows users to see the actual OTP code when needed while keeping it
   * hidden from shoulder surfers by default.
   */
  const toggleOtpVisibility = () => {
    setIsOtpVisible(!isOtpVisible);
  };

  /**
   * Requests camera permission from the user and sets up the video stream.
   * Updates state based on whether permission was granted or denied.
   */
  const getCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video: true});
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
          'Please enable camera permissions in your browser settings to use this app.',
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
    /**
     * Recursive function that processes video frames to detect QR codes.
     * Continues until a QR code is found or scanning is stopped.
     */
    const tick = async () => {
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
          setSecretKey(code.data);
          setIsScanning(false);
          setIsDialogOpen(true);
        } else {
          requestAnimationFrame(tick);
        }
      } else {
        requestAnimationFrame(tick);
      }
    };

    tick();
  };

  /**
   * Handles the upload of an image containing a QR code.
   * Processes the image to extract OTP configuration data from the QR code.
   * 
   * @param event - The change event from the file input element
   */
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const imageData = ctx?.getImageData(0, 0, img.width, img.height);
        if (imageData) {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            const otpAuthData = parseOtpAuthUri(code.data);
            setSecretKey(otpAuthData?.parameters?.secret || '');
            setAccountName(otpAuthData?.label?.account || '');
            setIsDialogOpen(true);
          } else {
            toast({
              title: 'Error',
              description: 'No QR code found in the image.',
              variant: 'destructive',
            });
          }
        }
      };
      if (e.target) {
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handles exporting all OTP configurations to a JSON file.
   * Creates a downloadable file containing all the user's OTP configurations.
   */
  const handleExportConfig = () => {
    const jsonString = JSON.stringify(otpConfigs);
    const blob = new Blob([jsonString], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'otpConfigs.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Handles importing OTP configurations from a JSON file.
   * Reads the file, parses the JSON, and updates the application state with the imported configurations.
   * 
   * @param event - The change event from the file input element
   */
  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const importedConfigs = JSON.parse(jsonString) as OTPConfig[];
        setOtpConfigs(importedConfigs);
        toast({
          title: 'Success',
          description: 'Configurations imported successfully.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to import configurations. Invalid JSON file.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">OTP Manager Pro</h1>
        <div>
          <Button onClick={handleAddConfig} className="mr-2">
            <Plus className="mr-2 h-4 w-4" />
            Add Configuration
          </Button>
          <ButtonGroup>
            <Button variant="secondary" onClick={handleExportConfig}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Input
              type="file"
              id="importConfig"
              accept=".json"
              className="hidden"
              onChange={handleImportConfig}
            />
            <Label htmlFor="importConfig">
              <Button variant="secondary">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </Label>
          </ButtonGroup>
        </div>
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {otpConfigs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <CardTitle>{config.accountName}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-2">
              <div className="text-lg font-bold text-center">
                <Input
                  type={isOtpVisible ? 'text' : 'password'}
                  value={generateOTP(config.secretKey, config.prefix, config.postfix)}
                  readOnly
                  className="text-lg font-bold text-center"
                />
              </div>
              <div className="text-center">
                <Button variant="ghost" size="sm" onClick={toggleOtpVisibility}>
                  {isOtpVisible ? 'Hide' : 'Show'} OTP
                </Button>
              </div>
              {remainingTimes[config.id] !== undefined && (
                <div className="text-sm text-muted-foreground text-center">
                  Expires in {remainingTimes[config.id]} seconds
                </div>
              )}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    handleCopyOTP(config.secretKey, config.prefix, config.postfix)
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    handleRefreshOTP(config.secretKey, config.prefix, config.postfix)
                  }
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => handleEditConfig(config)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteConfig(config.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="hidden">
            {/* This button is hidden, the add button triggers the dialog */}
            Open Dialog
          </Button>
        </DialogTrigger>
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
                  onClick={handleScanQRCode}
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
                  onChange={handleImageUpload}
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
            <Button type="submit" onClick={handleSaveConfig}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
