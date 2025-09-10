import React, { useState, useEffect } from 'react';
import { useOverallPerformance } from '../../hooks/usePerformanceMonitor';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';

const PerformanceDashboard = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const performance = useOverallPerformance();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getFPSColor = (fps) => {
    if (fps >= 55) return 'bg-green-500';
    if (fps >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getFPSStatus = (fps) => {
    if (fps >= 55) return 'Excellent';
    if (fps >= 30) return 'Good';
    return 'Poor';
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Performance Dashboard"
      >
        📊
      </button>

      {/* Dashboard */}
      {isVisible && (
        <div className="fixed bottom-16 left-4 z-50 w-80 max-h-96 overflow-y-auto">
          <Card className="bg-white/95 backdrop-blur-sm border shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">Performance Monitor</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs"
                >
                  {showDetails ? 'Hide' : 'Show'} Details
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* FPS Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">FPS:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getFPSColor(performance.fps)}`}></div>
                  <span className="text-sm font-bold">{performance.fps}</span>
                  <Badge variant={performance.fps >= 55 ? 'default' : 'destructive'} className="text-xs">
                    {getFPSStatus(performance.fps)}
                  </Badge>
                </div>
              </div>

              {/* Frame Time */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Frame Time:</span>
                <span className="text-sm">{performance.frameTime.toFixed(2)}ms</span>
              </div>

              {/* Memory Usage */}
              {performance.memoryUsage && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Memory:</span>
                  <span className="text-sm">{performance.memoryUsage.used}MB</span>
                </div>
              )}

              {/* Scroll FPS */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Scroll FPS:</span>
                <span className="text-sm">{performance.scrollFPS}</span>
              </div>

              {/* 60fps Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">60fps Ready:</span>
                <Badge variant={performance.is60FPS ? 'default' : 'destructive'} className="text-xs">
                  {performance.is60FPS ? 'Yes' : 'No'}
                </Badge>
              </div>

              {/* Detailed Metrics */}
              {showDetails && (
                <div className="pt-2 border-t space-y-2">
                  <div className="text-xs text-gray-600">
                    <div>Animation FPS: {performance.animationFPS}</div>
                    <div>Memory Limit: {performance.memoryUsage?.limit || 0}MB</div>
                    <div>Memory Total: {performance.memoryUsage?.total || 0}MB</div>
                  </div>
                  
                  {/* Recommendations */}
                  <div className="text-xs">
                    <div className="font-medium text-gray-700 mb-1">Recommendations:</div>
                    {performance.recommendations.map((rec, index) => (
                      <div key={index} className="text-gray-600 mb-1">{rec}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => performance.startMonitoring()}
                  className="text-xs flex-1"
                >
                  Start
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => performance.stopMonitoring()}
                  className="text-xs flex-1"
                >
                  Stop
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default PerformanceDashboard;
