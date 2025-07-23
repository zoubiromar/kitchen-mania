import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function POST(_request: NextRequest) {
  try {
    // Get server-side client
    const supabase = getSupabaseServer();
    
    // Test 1: Try to upload a small test image (1x1 transparent PNG) directly
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
    
    console.log('Testing upload to recipe-images bucket with server client...');
    console.log('Using service role:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Try uploading directly (like avatar upload does)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(testFileName, blob, {
        contentType: 'image/png',
        upsert: true // Like avatar upload
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({
        success: false,
        error: uploadError.message,
        details: uploadError,
        bucket: 'recipe-images',
        test: 'upload',
        usingServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hint: uploadError.message.includes('not found') 
          ? 'The bucket might not exist. Please create it in Supabase Dashboard.' 
          : uploadError.message.includes('policy')
          ? 'RLS policy error. Try adding SUPABASE_SERVICE_ROLE_KEY to environment variables.'
          : 'Unknown error - check Supabase logs'
      });
    }

    console.log('Upload successful:', uploadData);

    // Test 2: Try to get public URL
    const { data: urlData } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(testFileName);

    // Test 3: Check if we can access the avatars bucket for comparison
    const { data: avatarTest, error: avatarError } = await supabase.storage
      .from('avatars')
      .list('', { limit: 1 });

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
      test: 'complete',
      usingServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      avatarBucketAccessible: !avatarError,
      comparison: {
        recipeImages: 'Upload successful',
        avatars: avatarError ? `Cannot access: ${avatarError.message}` : 'Accessible'
      }
    });

  } catch (error: any) {
    console.error('Test storage error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      test: 'exception',
      stack: error.stack,
      usingServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });
  }
} 