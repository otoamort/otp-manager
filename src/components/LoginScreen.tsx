'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Fingerprint, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * Component that displays a login screen for the application.
 * Provides interfaces for setting a password and logging in with a password or biometrics.
 * 
 * @returns The rendered login screen component
 */
export function LoginScreen() {
  /** Authentication context */
  const { isAuthenticated, isPasswordSet, isLoading, setPassword, login, loginWithBiometrics } = useAuth();
  
  /** Password input value */
  const [password, setPasswordValue] = useState('');
  /** Confirm password input value */
  const [confirmPassword, setConfirmPassword] = useState('');
  /** Whether to show the password */
  const [showPassword, setShowPassword] = useState(false);
  /** Whether to remember the user's authentication */
  const [rememberMe, setRememberMe] = useState(false);
  /** Error message */
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Handles the password setup form submission.
   * 
   * @param e - The form submit event
   */
  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate password
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    try {
      await setPassword(password);
      setPasswordValue('');
      setConfirmPassword('');
    } catch (error) {
      // Error is already handled in the context
    }
  };
  
  /**
   * Handles the login form submission.
   * 
   * @param e - The form submit event
   */
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    
    try {
      const success = await login(password, { rememberMe });
      if (success) {
        setPasswordValue('');
      }
    } catch (error) {
      // Error is already handled in the context
    }
  };
  
  /**
   * Handles biometric authentication.
   */
  const handleBiometricLogin = async () => {
    setError(null);
    
    try {
      await loginWithBiometrics({ rememberMe });
    } catch (error) {
      // Error is already handled in the context
    }
  };
  
  // If the user is already authenticated, don't show the login screen
  if (isAuthenticated) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <Card className="w-[400px] max-w-[90vw]">
        <CardHeader>
          <CardTitle>OTP Manager Pro</CardTitle>
          <CardDescription>
            {isPasswordSet
              ? 'Enter your password to access your OTP codes'
              : 'Set up a password to protect your OTP codes'}
          </CardDescription>
        </CardHeader>
        
        {isPasswordSet ? (
          <CardContent>
            <form onSubmit={handleLoginSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label htmlFor="rememberMe">Remember me</Label>
                </div>
                
                {error && <p className="text-sm text-destructive">{error}</p>}
                
                <div className="flex flex-col space-y-2">
                  <Button type="submit" disabled={isLoading}>
                    <Lock className="mr-2 h-4 w-4" />
                    Login with Password
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBiometricLogin}
                    disabled={isLoading}
                  >
                    <Fingerprint className="mr-2 h-4 w-4" />
                    Login with Biometrics
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        ) : (
          <CardContent>
            <form onSubmit={handleSetupSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                {error && <p className="text-sm text-destructive">{error}</p>}
                
                <Button type="submit" disabled={isLoading}>
                  <Lock className="mr-2 h-4 w-4" />
                  Set Password
                </Button>
              </div>
            </form>
          </CardContent>
        )}
        
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          Your OTP secrets are stored securely on your device.
        </CardFooter>
      </Card>
    </div>
  );
}