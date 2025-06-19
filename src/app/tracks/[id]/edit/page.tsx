
'use client';

import type { Multimedia } from '@/types/multimedia'; // Changed from Track
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { MultimediaForm } from '@/components/multimedia/multimedia-form'; // Changed from TrackForm
import { getMultimediaItem, updateMultimediaItem } from '@/lib/firebase/firestore'; // Changed from getTrack, updateTrack
import { uploadAudioFile, deleteAudioFile } from '@/lib/firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function EditMultimediaItemFromTracksPage() { // Renamed for clarity
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string; // Changed from trackId
  const { toast } = useToast();

  const [initialData, setInitialData] = useState<Multimedia | null>(null); // Changed from Track
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const fetchItemData = useCallback(async () => { // Renamed from fetchTrackData
    if (!user || !itemId) return;
    setIsLoading(true);
    try {
      const item = await getMultimediaItem(itemId, user.uid); // Changed from getTrack
      if (item) {
        setInitialData(item);
      } else {
        toast({ title: 'Error', description: 'Multimedia item not found or access denied.', variant: 'destructive' });
        router.push('/multimedia'); // Should ideally be /multimedia
      }
    } catch (error) {
      console.error('Error fetching multimedia item:', error);
      toast({ title: 'Error', description: 'Failed to fetch multimedia item data.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [user, itemId, router, toast]);

  useEffect(() => {
    fetchItemData();
  }, [fetchItemData]);

  const handleSubmit = async (data: any, audioFileToUpload?: File | null, existingAudioFilePath?: string | null) => {
    if (!user || !itemId || !initialData) return;
    setIsSubmitting(true);
    setUploadProgress(null);

    try {
      let audioUrl = initialData.audioUrl;
      let audioFileName = initialData.audioFileName; 

      if (audioFileToUpload) {
        if (existingAudioFilePath) {
          try {
            await deleteAudioFile(existingAudioFilePath);
          } catch (deleteError) {
             console.warn("Could not delete old audio file, it might not exist or there was an error:", deleteError);
          }
        }
        
        const { downloadURL, filePath } = await uploadAudioFile(user.uid, audioFileToUpload, (progress) => {
          setUploadProgress(progress);
        });
        audioUrl = downloadURL;
        audioFileName = filePath; 
        setUploadProgress(100);
      }

      const itemUpdateData: Partial<Omit<Multimedia, 'id' | 'userId' | 'createdAt'>> = { // Changed from Track
        title: data.title,
        artist: data.artist,
        album: data.album || '',
        duration: data.duration || 0,
        bpm: data.bpm || 0,
        key: data.key || '',
        genre: data.genre || '',
        tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [],
        audioUrl: audioUrl,
        audioFileName: audioFileName,
      };

      await updateMultimediaItem(itemId, user.uid, itemUpdateData); // Changed from updateTrack
      toast({ title: 'Success', description: 'Multimedia item updated successfully.' });
      router.push(`/multimedia/${itemId}`); // Should ideally be /multimedia
    } catch (error) {
      console.error('Error updating multimedia item:', error);
      toast({ title: 'Error', description: 'Failed to update multimedia item.', variant: 'destructive' });
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!initialData) {
    return <div className="text-center py-10">Multimedia item not found. (from /tracks)</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold text-primary font-headline mb-6">Edit Multimedia Item (from /tracks)</h1>
      <MultimediaForm initialData={initialData} onSubmit={handleSubmit} isSubmitting={isSubmitting} /> 
       {uploadProgress !== null && uploadProgress < 100 && (
        <div className="fixed bottom-4 right-4 bg-card p-4 rounded-lg shadow-lg w-64">
            <p className="text-sm font-medium">Uploading audio...</p>
            <Progress value={uploadProgress} className="w-full mt-2" />
        </div>
      )}
    </div>
  );
}
