
'use client';

import type { Multimedia } from '@/types/multimedia';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { MultimediaForm } from '@/components/multimedia/multimedia-form';
import { addMultimediaItem } from '@/lib/firebase/firestore';
import { uploadAudioFile } from '@/lib/firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export default function AddMultimediaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleSubmit = async (data: any, audioFileToUpload?: File | null) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to add a multimedia item.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    setUploadProgress(null);

    try {
      let audioUrl: string | undefined = undefined;
      let audioFileName: string | undefined = undefined;

      if (audioFileToUpload) {
        const { downloadURL, filePath } = await uploadAudioFile(user.uid, audioFileToUpload, (progress) => {
          setUploadProgress(progress);
        });
        audioUrl = downloadURL;
        audioFileName = filePath; 
      }
      
      setUploadProgress(100); 

      const multimediaData: Omit<Multimedia, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
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

      await addMultimediaItem(multimediaData);
      toast({ title: 'Success', description: 'Multimedia item added successfully.' });
      router.push('/multimedia');
    } catch (error) {
      console.error('Error adding multimedia item:', error);
      toast({ title: 'Error', description: 'Failed to add multimedia item. Please try again.', variant: 'destructive' });
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold text-primary font-headline mb-6">Add New Multimedia Item</h1>
      <MultimediaForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      {uploadProgress !== null && uploadProgress < 100 && (
        <div className="fixed bottom-4 right-4 bg-card p-4 rounded-lg shadow-lg w-64">
            <p className="text-sm font-medium">Uploading audio...</p>
            <Progress value={uploadProgress} className="w-full mt-2" />
        </div>
      )}
    </div>
  );
}
