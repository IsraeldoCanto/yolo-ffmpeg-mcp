'use client';

import type { Track } from '@/types/track';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { getTrack } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit, Music, CalendarDays, Tag, BarChart, KeyRound, Clock, UserCircle, Album, ListMusic } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { format } from 'date-fns'; // For formatting Firestore Timestamps

export default function TrackDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const trackId = params.id as string;

  const [track, setTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrackData = useCallback(async () => {
    if (!user || !trackId) return;
    setIsLoading(true);
    try {
      const fetchedTrack = await getTrack(trackId, user.uid);
      if (fetchedTrack) {
        setTrack(fetchedTrack);
      } else {
        notFound(); // Or redirect with toast
      }
    } catch (error) {
      console.error('Error fetching track:', error);
      // Consider showing a toast message here
      notFound();
    } finally {
      setIsLoading(false);
    }
  }, [user, trackId]);

  useEffect(() => {
    fetchTrackData();
  }, [fetchTrackData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!track) {
    // This case should be handled by notFound() or could be a specific "Track not found" component
    return <div className="text-center py-10">Track not found.</div>;
  }

  const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
    <div className="flex items-start">
      <Icon className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-md font-medium text-foreground">{value || '-'}</p>
      </div>
    </div>
  );


  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <CardTitle className="text-3xl font-bold text-primary font-headline mb-1">{track.title}</CardTitle>
              <CardDescription className="text-lg text-muted-foreground flex items-center">
                <UserCircle className="h-5 w-5 mr-2" /> {track.artist}
              </CardDescription>
            </div>
            <Link href={`/tracks/${track.id}/edit`} passHref>
              <Button variant="outline" className="mt-4 sm:mt-0">
                <Edit className="mr-2 h-4 w-4" /> Edit Track
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {track.audioUrl && (
            <div className="my-4">
              <audio controls src={track.audioUrl} className="w-full rounded-md shadow">
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailItem icon={Album} label="Album" value={track.album} />
            <DetailItem icon={ListMusic} label="Genre" value={track.genre} />
            <DetailItem icon={BarChart} label="BPM" value={track.bpm} />
            <DetailItem icon={KeyRound} label="Key" value={track.key} />
            <DetailItem icon={Clock} label="Duration" value={track.duration ? formatDuration(track.duration) : '-'} />
             <DetailItem 
              icon={CalendarDays} 
              label="Created At" 
              value={track.createdAt ? format(track.createdAt.toDate(), 'PPP p') : '-'} 
            />
          </div>
          
          {track.tags && track.tags.length > 0 && (
            <div>
               <div className="flex items-center mb-2">
                <Tag className="h-5 w-5 text-primary mr-3" />
                <p className="text-sm text-muted-foreground">Tags</p>
               </div>
              <div className="flex flex-wrap gap-2">
                {track.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

        </CardContent>
         <CardFooter className="mt-4">
            <p className="text-xs text-muted-foreground">
              Last updated: {track.updatedAt ? format(track.updatedAt.toDate(), 'PPP p') : '-'}
            </p>
          </CardFooter>
      </Card>
    </div>
  );
}

