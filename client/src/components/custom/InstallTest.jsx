import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, AlertCircle, Smartphone, Monitor } from 'lucide-react';

const InstallTest = () => {
  const [pwaSupport, setPwaSupport] = useState({
    serviceWorker: false,
    beforeInstallPrompt: false,
    manifest: false,
    isInstalled: false,
    isMobile: false,
    userAgent: '',
    displayMode: ''
  });

  useEffect(() => {
    const checkPWASupport = () => {
      const ua = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInApp = window.navigator.standalone === true;
      
      setPwaSupport({
        serviceWorker: 'serviceWorker' in navigator,
        beforeInstallPrompt: 'onbeforeinstallprompt' in window,
        manifest: !!document.querySelector('link[rel="manifest"]'),
        isInstalled: isStandalone || isInApp,
        isMobile,
        userAgent: ua,
        displayMode: isStandalone ? 'standalone' : isInApp ? 'in-app' : 'browser'
      });
    };

    checkPWASupport();
  }, []);

  const getStatusIcon = (status) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getBrowserName = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            PWA Installation Test
          </CardTitle>
          <CardDescription>
            Check if your device and browser support PWA installation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Device Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Device Information</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {pwaSupport.isMobile ? (
                    <Smartphone className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Monitor className="h-4 w-4 text-gray-500" />
                  )}
                  <span>Device: {pwaSupport.isMobile ? 'Mobile' : 'Desktop'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Browser: {getBrowserName()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Display Mode: </span>
                  <Badge variant={pwaSupport.isInstalled ? 'default' : 'secondary'}>
                    {pwaSupport.displayMode}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">PWA Support Status</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span>Service Worker</span>
                  {getStatusIcon(pwaSupport.serviceWorker)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Install Prompt</span>
                  {getStatusIcon(pwaSupport.beforeInstallPrompt)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Manifest</span>
                  {getStatusIcon(pwaSupport.manifest)}
                </div>
                <div className="flex items-center justify-between">
                  <span>App Installed</span>
                  {getStatusIcon(pwaSupport.isInstalled)}
                </div>
              </div>
            </div>
          </div>

          {/* Installation Instructions */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Installation Instructions</h3>
            {pwaSupport.isInstalled ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">App is already installed!</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  You're currently using the installed version of the app.
                </p>
              </div>
            ) : pwaSupport.beforeInstallPrompt ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">Ready to Install</span>
                </div>
                <p className="text-blue-700 text-sm">
                  Your browser supports one-click installation. Look for the install button in the navbar.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800 mb-2">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">Manual Installation Required</span>
                </div>
                <div className="text-yellow-700 text-sm space-y-2">
                  <p>Your browser doesn't support automatic installation. Try these steps:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Look for "Add to Home Screen" in your browser menu</li>
                    <li>Or try "Install App" option if available</li>
                    <li>On mobile: Use the share button and select "Add to Home Screen"</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Debug Information */}
          <details className="mt-6">
            <summary className="cursor-pointer font-semibold text-sm">
              Debug Information
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono">
              <div>User Agent: {pwaSupport.userAgent}</div>
              <div>Display Mode: {pwaSupport.displayMode}</div>
              <div>Is Mobile: {pwaSupport.isMobile.toString()}</div>
              <div>Service Worker Support: {pwaSupport.serviceWorker.toString()}</div>
              <div>Before Install Prompt: {pwaSupport.beforeInstallPrompt.toString()}</div>
              <div>Manifest Present: {pwaSupport.manifest.toString()}</div>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallTest;
