
'use client';

import type { Multimedia } from '@/types/multimedia';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, FileAudio } from 'lucide-react';
import { fileToDataUri, validateAudioFile } from '@/lib/utils';
import { suggestMultimediaMetadata } from '@/ai/flows/suggest-multimedia-metadata'; 
import { useRouter } from 'next/navigation';

const multimediaFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  artist: z.string().min(1, 'Artist is required'),
  album: z.string().optional(),
  duration: z.coerce.number().positive().optional(),
  bpm: z.coerce.number().positive().optional(),
  key: z.string().optional(),
  genre: z.string().optional(),
  tags: z.string().optional(), 
  audioFile: z.custom<File | null>(file => file === null || file instanceof File, "Invalid file").optional().nullable(),
});

type MultimediaFormValues = z.infer<typeof multimediaFormSchema>;

interface MultimediaFormProps {
  initialData?: Multimedia | null;
  onSubmit: (data: MultimediaFormValues, audioFileToUpload?: File | null, existingAudioFilePath?: string | null) => Promise<void>;
  isSubmitting: boolean;
}

export function MultimediaForm({ initialData, onSubmit, isSubmitting }: MultimediaFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(initialData?.audioUrl || null);
  const [isSuggestingMetadata, setIsSuggestingMetadata] = useState(false);
  
  const { control, handleSubmit, register, setValue, watch, formState: { errors } } = useForm<MultimediaFormValues>({
    resolver: zodResolver(multimediaFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      artist: initialData?.artist || '',
      album: initialData?.album || '',
      duration: initialData?.duration || undefined,
      bpm: initialData?.bpm || undefined,
      key: initialData?.key || '',
      genre: initialData?.genre || '',
      tags: initialData?.tags?.join(', ') || '',
      audioFile: null,
    },
  });

  const currentAudioFile = watch('audioFile');

  useEffect(() => {
    if (initialData?.audioUrl) {
      setAudioPreview(initialData.audioUrl);
    }
  }, [initialData]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validationError = validateAudioFile(file);
      if (validationError) {
        toast({ title: 'Invalid File', description: validationError, variant: 'destructive' });
        event.target.value = ''; 
        setAudioFile(null);
        setValue('audioFile', null);
        setAudioPreview(initialData?.audioUrl || null);
        return;
      }
      setAudioFile(file);
      setValue('audioFile', file);
      setAudioPreview(URL.createObjectURL(file));
    } else {
      setAudioFile(null);
      setValue('audioFile', null);
      setAudioPreview(initialData?.audioUrl || null);
    }
  };

  const handleSuggestMetadata = async () => {
    const fileToAnalyze = audioFile;

    if (!fileToAnalyze) {
      toast({ title: 'No New Audio File', description: 'Please select a new audio file to suggest metadata. Suggestion for existing remote files is not currently supported in this form.', variant: 'default' });
      return;
    }
    
    setIsSuggestingMetadata(true);
    try {
      let dataUri;
      if (audioFile) { 
         dataUri = await fileToDataUri(audioFile);
      } else {
        toast({ title: 'Feature Limitation', description: 'Metadata suggestion is currently available for newly selected audio files only.', variant: 'default' });
        setIsSuggestingMetadata(false);
        return;
      }

      const result = await suggestMultimediaMetadata({ audioDataUri: dataUri });
      if (result.bpm) setValue('bpm', result.bpm);
      if (result.key) setValue('key', result.key);
      toast({ title: 'Success', description: 'Metadata suggestions applied.' });
    } catch (error) {
      console.error('Error suggesting metadata:', error);
      toast({ title: 'AI Error', description: 'Failed to suggest metadata. Please try again.', variant: 'destructive' });
    } finally {
      setIsSuggestingMetadata(false);
    }
  };

  const processSubmit = (data: MultimediaFormValues) => {
    onSubmit(data, audioFile, initialData?.audioFileName);
  };
  
  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Multimedia Information</CardTitle>
            <CardDescription>Basic details about the multimedia item.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} aria-invalid={errors.title ? "true" : "false"} />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <Label htmlFor="artist">Artist</Label>
              <Input id="artist" {...register('artist')} aria-invalid={errors.artist ? "true" : "false"} />
              {errors.artist && <p className="text-sm text-destructive mt-1">{errors.artist.message}</p>}
            </div>
            <div>
              <Label htmlFor="album">Album</Label>
              <Input id="album" {...register('album')} />
            </div>
             <div>
              <Label htmlFor="genre">Genre</Label>
              <Input id="genre" {...register('genre')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audio & Metadata</CardTitle>
             <CardDescription>Upload audio file and specify technical details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="audioFile">Audio File</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input id="audioFile" type="file" accept={".mp3,.wav,.m4a,.flac"} onChange={handleFileChange} className="flex-grow" />
                 { (audioFile) && // Only show for newly selected files
                    <Button type="button" onClick={handleSuggestMetadata} disabled={isSuggestingMetadata || isSubmitting || !currentAudioFile} variant="outline" size="sm">
                        {isSuggestingMetadata ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                        Suggest AI
                    </Button>
                 }
              </div>
              {errors.audioFile && <p className="text-sm text-destructive mt-1">{errors.audioFile.message}</p>}
              {audioPreview && (
                <div className="mt-2 p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                  <FileAudio className="h-5 w-5 text-primary"/>
                  <span className="text-sm truncate">{audioFile?.name || initialData?.audioFileName || 'Current Audio'}</span>
                </div>
              )}
              {audioPreview && <audio src={audioPreview} controls className="mt-2 w-full" />}
            </div>
           
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bpm">BPM</Label>
                <Input id="bpm" type="number" {...register('bpm')} />
                {errors.bpm && <p className="text-sm text-destructive mt-1">{errors.bpm.message}</p>}
              </div>
              <div>
                <Label htmlFor="key">Key</Label>
                <Input id="key" {...register('key')} />
                 {errors.key && <p className="text-sm text-destructive mt-1">{errors.key.message}</p>}
              </div>
            </div>
             <div>
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input id="duration" type="number" {...register('duration')} />
                {errors.duration && <p className="text-sm text-destructive mt-1">{errors.duration.message}</p>}
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Textarea id="tags" {...register('tags')} placeholder="e.g. electronic, upbeat, instrumental" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <CardFooter className="flex justify-end gap-2 px-0 pt-6">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isSuggestingMetadata}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (initialData ? 'Update' : 'Add')} Multimedia Item
        </Button>
      </CardFooter>
    </form>
  );
}
