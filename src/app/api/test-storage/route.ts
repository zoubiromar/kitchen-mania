import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(_request: NextRequest) {
  try {
    // Test 1: Check if we can access storage
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      return NextResponse.json({
        success: false,
        error: 'Cannot access storage',
        details: bucketsError,
        test: 'list-buckets'
      });
    }

    const recipeImagesBucket = buckets?.find(b => b.name === 'recipe-images');
    if (!recipeImagesBucket) {
      return NextResponse.json({
        success: false,
        error: 'recipe-images bucket not found',
        availableBuckets: buckets?.map(b => b.name),
        test: 'bucket-exists'
      });
    }

    // Test 2: Try to upload a small test image (1x1 transparent PNG)
    const testFileName = `test-${Date.now()}.png`;
    
    // Create a minimal 1x1 transparent PNG
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0B, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x78, 0x9C, 0x62, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, // IEND chunk
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    
    const blob = new Blob([pngData], { type: 'image/png' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(testFileName, blob, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      return NextResponse.json({
        success: false,
        error: uploadError.message,
        details: uploadError,
        bucket: 'recipe-images',
        test: 'upload'
      });
    }

    // Test 3: Try to get public URL
    const { data: urlData } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(testFileName);

    // Test 4: Try to delete the test file
    const { error: deleteError } = await supabase.storage
      .from('recipe-images')
      .remove([testFileName]);

    return NextResponse.json({
      success: true,
      uploadedFile: testFileName,
      publicUrl: urlData.publicUrl,
      deleted: !deleteError,
      deleteError: deleteError?.message,
      test: 'complete'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      test: 'exception'
    });
  }
} 