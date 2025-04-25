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
import {cn} from '@/lib/utils';
import jsQR from 'jsqr';
import {totp} from 'otplib';
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

// Function to generate OTP (replace with your actual OTP generation logic)
function generateOTP(secret: string, prefix: string = '', postfix: string = '') {
  const token = totp.generate(secret);
  return `${prefix}${token}${postfix}`;
}

// Configuration type
interface OTPConfig {
  id: string;
  accountName: string;
  secretKey: string;
  prefix: string;
  postfix: string;
}

export default function Home() {
  const [otpConfigs, setOtpConfigs] = useState<OTPConfig[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [prefix, setPrefix] = useState('');
  const [postfix, setPostfix] = useState('');
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const {toast} = useToast();

  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);

  useEffect(() => {
    // Load configurations from local storage on component mount
    const storedConfigs = localStorage.getItem('otpConfigs');
    if (storedConfigs) {
      setOtpConfigs(JSON.parse(storedConfigs));
    }
  }, []);

  useEffect(() => {
    // Save configurations to local storage whenever otpConfigs changes
    localStorage.setItem('otpConfigs', JSON.stringify(otpConfigs));
  }, [otpConfigs]);

  const handleAddConfig = () => {
    setIsDialogOpen(true);
    setSelectedConfigId(null); // Reset selected config for adding new config
    setAccountName('');
    setSecretKey('');
    setPrefix('');
    setPostfix('');
  };

  const handleEditConfig = (config: OTPConfig) => {
    setIsDialogOpen(true);
    setSelectedConfigId(config.id);
    setAccountName(config.accountName);
    setSecretKey(config.secretKey);
    setPrefix(config.prefix);
    setPostfix(config.postfix);
  };

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

  const handleDeleteConfig = (id: string) => {
    setOtpConfigs((prevConfigs) =>
      prevConfigs.filter((config) => config.id !== id)
    );
    toast({
      title: 'Success',
      description: 'Configuration deleted successfully.',
    });
  };

  const handleCopyOTP = (secret: string, prefix: string, postfix: string) => {
    const otp = generateOTP(secret, prefix, postfix);
    navigator.clipboard.writeText(otp);
    toast({
      title: 'OTP Copied',
      description: 'OTP copied to clipboard.',
    });
  };

  const [remainingTimes, setRemainingTimes] = useState<{
    [key: string]: number;
  }>({});

  const calculateRemainingTime = () => {
    const newRemainingTimes: {[key: string]: number} = {};
    otpConfigs.forEach((config) => {
      newRemainingTimes[config.id] = 30 - (Math.floor(Date.now() / 1000) % 30);
    });
    setRemainingTimes(newRemainingTimes);
  };

  useEffect(() => {
    calculateRemainingTime();
    const intervalId = setInterval(calculateRemainingTime, 1000);
    return () => clearInterval(intervalId);
  }, [otpConfigs]);

  const handleRefreshOTP = (secret: string, prefix: string, postfix: string) => {
    // For simplicity, directly copy the new OTP without waiting for the timer
    const otp = generateOTP(secret, prefix, postfix);
    navigator.clipboard.writeText(otp);
    toast({
      title: 'OTP Refreshed and Copied',
      description: 'New OTP copied to clipboard.',
    });
  };

  const [isOtpVisible, setIsOtpVisible] = useState(false);

  const toggleOtpVisibility = () => {
    setIsOtpVisible(!isOtpVisible);
  };

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

  const handleScanQRCode = async () => {
    if (!hasCameraPermission) {
      await getCameraPermission();
      return;
    }

    setIsScanning(true);
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
            setSecretKey(code.data);
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
      img.src = e.target.result as string;
    };
    reader.readAsDataURL(file);
  };

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
                  <Button variant="secondary">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    <span>Upload QR Code</span>
                  </Button>
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
