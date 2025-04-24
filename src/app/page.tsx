
'use client';

import {useState, useEffect} from 'react';
import {Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Plus, Copy, Edit, Trash2, RefreshCw} from 'lucide-react';
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
import {useToast} from "@/hooks/use-toast";
import {cn} from "@/lib/utils";

// Function to generate OTP (replace with your actual OTP generation logic)
function generateOTP(secret: string, prefix: string = '', postfix: string = '') {
  // Placeholder: replace with actual OTP generation logic
  const otp = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${prefix}${otp}${postfix}`;
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
        title: "Error",
        description: "Account Name and Secret Key cannot be empty.",
        variant: "destructive",
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
        ? prevConfigs.map((config) => (config.id === selectedConfigId ? newConfig : config))
        : [...prevConfigs, newConfig];
      return updatedConfigs;
    });

    setIsDialogOpen(false);
    toast({
      title: "Success",
      description: `Configuration ${selectedConfigId ? 'updated' : 'added'} successfully.`,
    });
  };

  const handleDeleteConfig = (id: string) => {
    setOtpConfigs((prevConfigs) => prevConfigs.filter((config) => config.id !== id));
    toast({
      title: "Success",
      description: "Configuration deleted successfully.",
    });
  };

  const handleCopyOTP = (secret: string, prefix: string, postfix: string) => {
    const otp = generateOTP(secret, prefix, postfix);
    navigator.clipboard.writeText(otp);
    toast({
      title: "OTP Copied",
      description: "OTP copied to clipboard.",
    });
  };

  const [remainingTimes, setRemainingTimes] = useState<{ [key: string]: number }>({});

  const calculateRemainingTime = () => {
    const newRemainingTimes: { [key: string]: number } = {};
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
      title: "OTP Refreshed and Copied",
      description: "New OTP copied to clipboard.",
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">OTP Manager Pro</h1>
        <Button onClick={handleAddConfig}>
          <Plus className="mr-2 h-4 w-4"/>
          Add Configuration
        </Button>
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {otpConfigs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <CardTitle>{config.accountName}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-2">
              <div className="text-lg font-bold text-center">
                {generateOTP(config.secretKey, config.prefix, config.postfix)}
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
                  onClick={() => handleCopyOTP(config.secretKey, config.prefix, config.postfix)}
                >
                  <Copy className="h-4 w-4"/>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRefreshOTP(config.secretKey, config.prefix, config.postfix)}
                >
                  <RefreshCw className="h-4 w-4"/>
                </Button>
                <Button variant="secondary" size="icon" onClick={() => handleEditConfig(config)}>
                  <Edit className="h-4 w-4"/>
                </Button>
                <Button variant="destructive" size="icon" onClick={() => handleDeleteConfig(config.id)}>
                  <Trash2 className="h-4 w-4"/>
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
          </div>
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
