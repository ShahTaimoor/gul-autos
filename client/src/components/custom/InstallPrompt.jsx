import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Download, Smartphone, Monitor, ExternalLink, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const InstallPrompt = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [userAgent, setUserAgent] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setUserAgent(ua);
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua));

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInApp = window.navigator.standalone === true;
    setIsInstalled(isStandalone || isInApp);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success('App installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          toast.success('Installing app...');
        } else {
          toast.info('Installation cancelled');
        }
      } catch (error) {
        console.error('Error showing install prompt:', error);
        toast.error('Installation failed');
      }
      setDeferredPrompt(null);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getBrowserInstructions = () => {
    if (userAgent.includes('Chrome')) {
      return {
        name: 'Chrome',
        steps: [
          'Tap the menu button (three dots) in the top right',
          'Look for "Install app" or "Add to Home screen"',
          'Tap it and follow the prompts'
        ]
      };
    } else if (userAgent.includes('Safari')) {
      return {
        name: 'Safari',
        steps: [
          'Tap the Share button (square with arrow)',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to confirm'
        ]
      };
    } else if (userAgent.includes('Firefox')) {
      return {
        name: 'Firefox',
        steps: [
          'Tap the menu button (three dots)',
          'Look for "Install" or "Add to Home screen"',
          'Follow the installation prompts'
        ]
      };
    } else if (userAgent.includes('Edge')) {
      return {
        name: 'Edge',
        steps: [
          'Tap the menu button (three dots)',
          'Look for "Apps" then "Install this site as an app"',
          'Follow the installation prompts'
        ]
      };
    } else {
      return {
        name: 'Your Browser',
        steps: [
          'Look for an install option in your browser menu',
          'Or try adding this page to your home screen',
          'The exact steps may vary by browser'
        ]
      };
    }
  };

  const browserInstructions = getBrowserInstructions();

  if (isInstalled) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              App Already Installed
            </DialogTitle>
            <DialogDescription>
              The Gul Autos app is already installed on your device.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Install Gul Autos App
          </DialogTitle>
          <DialogDescription>
            Get the best experience by installing our app on your device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* PWA Install Button */}
          {deferredPrompt && (
            <div className="p-4 border rounded-lg bg-green-50 border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">Quick Install</h3>
              <p className="text-sm text-green-700 mb-3">
                Your browser supports one-click installation.
              </p>
              <Button onClick={handleInstall} className="w-full bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Install Now
              </Button>
            </div>
          )}

          {/* Manual Installation Instructions */}
          <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Manual Installation for {browserInstructions.name}
            </h3>
            <ol className="text-sm text-blue-700 space-y-1">
              {browserInstructions.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Alternative Options */}
          <div className="p-4 border rounded-lg bg-gray-50 border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Alternative Options
            </h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyUrl}
                className="w-full justify-start"
              >
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'URL Copied!' : 'Copy Link to Share'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(window.location.href, '_blank')}
                className="w-full justify-start"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>

          {/* Device-specific instructions */}
          {isMobile && (
            <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">Mobile Tips</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Make sure you're using a modern browser</li>
                <li>• Ensure you have a stable internet connection</li>
                <li>• Try refreshing the page if installation doesn't work</li>
                <li>• Some browsers may require you to visit the site multiple times</li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          {deferredPrompt && (
            <Button onClick={handleInstall}>
              Install App
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallPrompt;
