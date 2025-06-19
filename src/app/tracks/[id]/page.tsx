
'use client';

import type { Multimedia } from '@/types/multimedia'; // Changed from Track
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { getMultimediaItem } from '@/lib/firebase/firestore'; // Changed from getTrack
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit, Music, CalendarDays, Tag, BarChart, KeyRound, Clock, UserCircle, Album, ListMusic } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { format } from 'date-fns'; 

export default function MultimediaItemDetailPageFromTracks() { // Renamed for clarity
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string; // Changed from trackId

  const [item, setItem] = useState<Multimedia | null>(null); // Changed from track, Track
  const [isLoading, setIsLoading] = useState(true);

  const fetchItemData = useCallback(async () => { // Renamed from fetchTrackData
    if (!user || !itemId) return;
    setIsLoading(true);
    try {
      const fetchedItem = await getMultimediaItem(itemId, user.uid); // Changed from getTrack
      if (fetchedItem) {
        setItem(fetchedItem);
      } else {
        notFound(); 
      }
    } catch (error) {
      console.error('Error fetching multimedia item:', error);
      notFound();
    } finally {
      setIsLoading(false);
    }
  }, [user, itemId]);

  useEffect(() => {
    fetchItemData();
  }, [fetchItemData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return <div className="text-center py-10">Multimedia item not found. (from /tracks)</div>;
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
              <CardTitle className="text-3xl font-bold text-primary font-headline mb-1">{item.title}</CardTitle>
              <CardDescription className="text-lg text-muted-foreground flex items-center">
                <UserCircle className="h-5 w-5 mr-2" /> {item.artist}
              </CardDescription>
            </div>
            {/* Link still points to /tracks/... which is an old path, but correcting its immediate error */}
            <Link href={`/tracks/${item.id}/edit`} passHref> 
              <Button variant="outline" className="mt-4 sm:mt-0">
                <Edit className="mr-2 h-4 w-4" /> Edit Item
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {item.audioUrl && (
            <div className="my-4">
              <audio controls src={item.audioUrl} className="w-full rounded-md shadow">
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailItem icon={Album} label="Album" value={item.album} />
            <DetailItem icon={ListMusic} label="Genre" value={item.genre} />
            <DetailItem icon={BarChart} label="BPM" value={item.bpm} />
            <DetailItem icon={KeyRound} label="Key" value={item.key} />
            <DetailItem icon={Clock} label="Duration" value={item.duration ? formatDuration(item.duration) : '-'} />
             <DetailItem 
              icon={CalendarDays} 
              label="Created At" 
              value={item.createdAt ? format(item.createdAt.toDate(), 'PPP p') : '-'} 
            />
          </div>
          
          {item.tags && item.tags.length > 0 && (
            <div>
               <div className="flex items-center mb-2">
                <Tag className="h-5 w-5 text-primary mr-3" />
                <p className="text-sm text-muted-foreground">Tags</p>
               </div>
              <div className="flex flex-wrap gap-2">
                {item.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

        </CardContent>
         <CardFooter className="mt-4">
            <p className="text-xs text-muted-foreground">
              Last updated: {item.updatedAt ? format(item.updatedAt.toDate(), 'PPP p') : '-'}
            </p>
          </CardFooter>
      </Card>
    </div>
  );
}
