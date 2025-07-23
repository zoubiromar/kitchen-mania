import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(_request: NextRequest) {
  try {
    // Test 1: Check if we can access storage
    const testFileName = `test_${Date.now()}.txt`;
    const testContent = new Blob(['Test file content'], { type: 'text/plain' });
    
    console.log('Testing storage upload...');
    
    // Try to upload a test file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({
        success: false,
        error: uploadError.message,
        details: uploadError,
        bucket: 'recipe-images',
        test: 'upload'
      });
    }

    console.log('Upload successful:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(uploadData.path);

    // Try to delete the test file
    const { error: deleteError } = await supabase.storage
      .from('recipe-images')
      .remove([uploadData.path]);

    return NextResponse.json({
      success: true,
      uploadPath: uploadData.path,
      publicUrl: urlData.publicUrl,
      deleted: !deleteError,
      deleteError: deleteError?.message,
      bucket: 'recipe-images',
      test: 'complete'
    });

  } catch (error: any) {
    console.error('Test storage error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack,
      test: 'failed'
    });
  }
} 