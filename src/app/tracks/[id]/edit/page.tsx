'use client';

import type { Track } from '@/types/track';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { TrackForm } from '@/components/tracks/track-form';
import { getTrack, updateTrack } from '@/lib/firebase/firestore';
import { uploadAudioFile, deleteAudioFile } from '@/lib/firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function EditTrackPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const trackId = params.id as string;
  const { toast } = useToast();

  const [initialData, setInitialData] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const fetchTrackData = useCallback(async () => {
    if (!user || !trackId) return;
    setIsLoading(true);
    try {
      const track = await getTrack(trackId, user.uid);
      if (track) {
        setInitialData(track);
      } else {
        toast({ title: 'Error', description: 'Track not found or access denied.', variant: 'destructive' });
        router.push('/tracks');
      }
    } catch (error) {
      console.error('Error fetching track:', error);
      toast({ title: 'Error', description: 'Failed to fetch track data.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [user, trackId, router, toast]);

  useEffect(() => {
    fetchTrackData();
  }, [fetchTrackData]);

  const handleSubmit = async (data: any, audioFileToUpload?: File | null, existingAudioFilePath?: string | null) => {
    if (!user || !trackId || !initialData) return;
    setIsSubmitting(true);
    setUploadProgress(null);

    try {
      let audioUrl = initialData.audioUrl;
      let audioFileName = initialData.audioFileName; // Use existing storage path by default

      // If a new audio file is provided, upload it and delete the old one
      if (audioFileToUpload) {
        // Delete old file first, if it exists
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
        audioFileName = filePath; // Update to new storage path
        setUploadProgress(100);
      }

      const trackUpdateData: Partial<Omit<Track, 'id' | 'userId' | 'createdAt'>> = {
        title: data.title,
        artist: data.artist,
        album: data.album || '',
        duration: data.duration || 0,
        bpm: data.bpm || 0,
        key: data.key || '',
        genre: data.genre || '',
        tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [],
        audioUrl: audioUrl,
        audioFileName: audioFileName, // This is the storage path
      };

      await updateTrack(trackId, user.uid, trackUpdateData);
      toast({ title: 'Success', description: 'Track updated successfully.' });
      router.push(`/tracks/${trackId}`);
    } catch (error) {
      console.error('Error updating track:', error);
      toast({ title: 'Error', description: 'Failed to update track.', variant: 'destructive' });
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
    // Error toast already shown, or redirecting. Could show a message here too.
    return <div className="text-center py-10">Track not found.</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold text-primary font-headline mb-6">Edit Track</h1>
      <TrackForm initialData={initialData} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
       {uploadProgress !== null && uploadProgress < 100 && (
        <div className="fixed bottom-4 right-4 bg-card p-4 rounded-lg shadow-lg w-64">
            <p className="text-sm font-medium">Uploading audio...</p>
            <Progress value={uploadProgress} className="w-full mt-2" />
        </div>
      )}
    </div>
  );
}
