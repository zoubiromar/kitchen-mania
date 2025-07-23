'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateImageWithDebug } from '@/utils/debugImageGeneration';

export default function TestImageStoragePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [storageTest, setStorageTest] = useState<any>(null);

  const testImageGeneration = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const data = await generateImageWithDebug('Test Recipe', ['ingredient1', 'ingredient2']);
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testStorageAccess = async () => {
    setLoading(true);
    setStorageTest(null);
    
    try {
      const response = await fetch('/api/test-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      const data = await response.json();
      console.log('Storage test result:', data);
      setStorageTest(data);
    } catch (error) {
      setStorageTest({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Image Storage Debug Page</h1>
      
      <div className="space-y-6">
        {/* Storage Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test 1: Storage Access</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testStorageAccess} disabled={loading}>
              Test Storage Access
            </Button>
            
            {storageTest && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(storageTest, null, 2)}
                </pre>
                {storageTest.success && (
                  <p className="mt-2 text-green-600 font-semibold">
                    ✅ Storage is working! Check the recipe-images bucket for the test file.
                  </p>
                )}
                {storageTest.error && (
                  <p className="mt-2 text-red-600 font-semibold">
                    ❌ Storage error: {storageTest.error}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Generation Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test 2: Image Generation & Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testImageGeneration} disabled={loading}>
              Generate Test Image
            </Button>
            
            {result && (
              <div className="mt-4 space-y-4">
                {/* Status */}
                <div className={`p-4 rounded ${result.isStored ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <p className="font-semibold">
                    {result.isStored 
                      ? '✅ Image stored in Supabase!' 
                      : '⚠️ Image NOT stored - using temporary URL'}
                  </p>
                </div>

                {/* Image Preview */}
                {result.imageUrl && (
                  <div>
                    <p className="font-semibold mb-2">Generated Image:</p>
                    <img 
                      src={result.imageUrl} 
                      alt="Test" 
                      className="w-64 h-64 object-cover rounded"
                    />
                  </div>
                )}

                {/* Debug Info */}
                <div className="p-4 bg-gray-100 rounded">
                  <p className="font-semibold mb-2">Debug Information:</p>
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify({
                      isStored: result.isStored,
                      imageUrl: result.imageUrl?.substring(0, 80) + '...',
                      debug: result.debug,
                      warning: result.warning,
                      storageError: result.storageError,
                      error: result.error
                    }, null, 2)}
                  </pre>
                </div>

                {/* Storage Error Details */}
                {result.storageError && (
                  <div className="p-4 bg-red-100 rounded">
                    <p className="font-semibold text-red-800">Storage Error:</p>
                    <p className="text-red-700">{result.storageError}</p>
                    {result.storageDetails && (
                      <pre className="mt-2 text-sm text-red-600">
                        {JSON.stringify(result.storageDetails, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>What to Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>1. Open browser console (F12) to see detailed logs</p>
            <p>2. Check if images appear in Supabase Storage → recipe-images bucket</p>
            <p>3. Look for error messages in the debug output above</p>
            <p>4. Common issues:</p>
            <ul className="list-disc ml-6">
              <li>Bucket doesn't exist</li>
              <li>Missing storage policies</li>
              <li>Environment variables not set</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 