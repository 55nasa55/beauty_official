import { supabase } from './supabase/client';

interface UploadImageResult {
  publicUrl: string | null;
  error: Error | null;
}

export async function uploadImage(
  file: File,
  folder: string = ''
): Promise<UploadImageResult> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = folder
      ? `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      : `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase
      .from('admin_images')
      .insert({
        bucket: 'product-images',
        path: fileName,
        bytes: file.size,
        mime_type: file.type,
      });

    if (dbError) {
      console.error('Failed to index image in database:', dbError);
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return {
      publicUrl: urlData.publicUrl,
      error: null,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      publicUrl: null,
      error: error instanceof Error ? error : new Error('Upload failed'),
    };
  }
}
