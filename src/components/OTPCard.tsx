'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, RefreshCw, Edit, Trash2 } from 'lucide-react';
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
 * Props for the OTPCard component
 */
interface OTPCardProps {
  /** The OTP configuration to display */
  config: OTPConfig;
  /** Current OTP code for this configuration */
  otpCode: string;
  /** Whether the OTP code is visible or masked */
  isOtpVisible: boolean;
  /** Remaining time in seconds before the OTP code expires */
  remainingTime: number;
  /** Function to handle copying the OTP code to clipboard */
  onCopy: (secret: string, prefix: string, postfix: string) => void;
  /** Function to handle refreshing the OTP code */
  onRefresh: (secret: string, prefix: string, postfix: string) => void;
  /** Function to handle editing the OTP configuration */
  onEdit: (config: OTPConfig) => void;
  /** Function to handle deleting the OTP configuration */
  onDelete: (id: string) => void;
  /** Function to toggle the visibility of the OTP code */
  onToggleVisibility: () => void;
}

/**
 * Component that displays a single OTP configuration as a card.
 * Shows the account name, OTP code, and provides buttons for various actions.
 * 
 * @param props - The component props
 * @returns The rendered OTP card component
 */
export function OTPCard({
  config,
  otpCode,
  isOtpVisible,
  remainingTime,
  onCopy,
  onRefresh,
  onEdit,
  onDelete,
  onToggleVisibility
}: OTPCardProps) {
  const { toast } = useToast();

  /**
   * Handles the copy button click.
   * Calls the onCopy function and shows a toast notification.
   */
  const handleCopy = () => {
    onCopy(config.secretKey, config.prefix, config.postfix);
    toast({
      title: 'OTP Copied',
      description: 'OTP copied to clipboard.',
    });
  };

  /**
   * Handles the refresh button click.
   * Calls the onRefresh function and shows a toast notification.
   */
  const handleRefresh = () => {
    onRefresh(config.secretKey, config.prefix, config.postfix);
    toast({
      title: 'OTP Refreshed and Copied',
      description: 'New OTP copied to clipboard.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{config.accountName}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-2">
        <div className="text-lg font-bold text-center">
          <Input
            type={isOtpVisible ? 'text' : 'password'}
            value={otpCode}
            readOnly
            className="text-lg font-bold text-center"
          />
        </div>
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={onToggleVisibility}>
            {isOtpVisible ? 'Hide' : 'Show'} OTP
          </Button>
        </div>
        {remainingTime !== undefined && (
          <div className="text-sm text-muted-foreground text-center">
            Expires in {remainingTime} seconds
          </div>
        )}
        <div className="flex justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => onEdit(config)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => onDelete(config.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}