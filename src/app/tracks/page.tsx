'use client';

import type { Track } from '@/types/track';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { getTracks, deleteTrack, getUniqueGenres } from '@/lib/firebase/firestore';
import { deleteAudioFile } from '@/lib/firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit, Trash2, Eye, PlusCircle, Search, Filter, Loader2, Music, Tag, Clock, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { formatDuration } from '@/lib/utils'; // To be created

const PAGE_SIZE = 10;

export default function TracksPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('');
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [bpmRange, setBpmRange] = useState<[number, number]>([60, 180]);
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);

  const [sortBy, setSortBy] = useState<keyof Track>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [lastVisibleTrack, setLastVisibleTrack] = useState<Track | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);


  const fetchTracks = useCallback(async (loadMore = false) => {
    if (!user) return;
    if (loadMore) setIsFetchingMore(true); else setIsLoading(true);

    try {
      const result = await getTracks({
        userId: user.uid,
        searchTerm: searchTerm,
        genreFilter: genreFilter || undefined,
        bpmRangeFilter: bpmRange,
        sortBy,
        sortOrder,
        pageSize: PAGE_SIZE,
        lastVisible: loadMore ? lastVisibleTrack : null,
      });
      setTracks(prevTracks => loadMore ? [...prevTracks, ...result.tracks] : result.tracks);
      setHasMore(result.hasMore);
      setLastVisibleTrack(result.lastVisibleTrack);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      toast({ title: 'Error', description: 'Failed to fetch tracks.', variant: 'destructive' });
    } finally {
      if (loadMore) setIsFetchingMore(false); else setIsLoading(false);
    }
  }, [user, searchTerm, genreFilter, bpmRange, sortBy, sortOrder, lastVisibleTrack, toast]);

  useEffect(() => {
    fetchTracks(false); // Initial fetch or when filters change
  }, [user, searchTerm, genreFilter, bpmRange, sortBy, sortOrder]); // Removed fetchTracks from dependency array

  useEffect(() => {
    if (user) {
      getUniqueGenres(user.uid).then(setAvailableGenres);
    }
  }, [user]);

  const handleDelete = async () => {
    if (!trackToDelete || !user) return;
    setIsDeleting(trackToDelete.id!);
    try {
      if (trackToDelete.audioFileName && trackToDelete.userId) {
         // Construct filePath based on how it was stored. Assume it's stored in track.audioFilePath
         // For now, let's assume track.audioUrl contains enough info or we stored a filePath field
         // This needs to be robust. Assuming `audioFileName` is the path in storage.
         // A better way would be to store the full storage path in Firestore.
         // Let's assume audioFileName is the full path for now.
         if (trackToDelete.audioFileName) { // Assuming audioFileName is the full path.
            await deleteAudioFile(trackToDelete.audioFileName);
         }
      }
      await deleteTrack(trackToDelete.id!, user.uid);
      setTracks(tracks.filter(t => t.id !== trackToDelete.id));
      toast({ title: 'Success', description: 'Track deleted successfully.' });
    } catch (error) {
      console.error('Error deleting track:', error);
      toast({ title: 'Error', description: 'Failed to delete track.', variant: 'destructive' });
    } finally {
      setIsDeleting(null);
      setDeleteDialogOpen(false);
      setTrackToDelete(null);
    }
  };

  const openDeleteDialog = (track: Track) => {
    setTrackToDelete(track);
    setDeleteDialogOpen(true);
  };
  
  const handleSort = (column: keyof Track) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
     setLastVisibleTrack(null); // Reset pagination on sort
  };

  const SortableHeader = ({ label, column }: { label: string; column: keyof Track }) => (
    <TableHead onClick={() => handleSort(column)} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center gap-2">
        {label}
        {sortBy === column && <ArrowUpDown className="h-4 w-4" />}
      </div>
    </TableHead>
  );

  const debouncedSetSearchTerm = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSearchTerm(value);
        setLastVisibleTrack(null); // Reset pagination on new search
      }, 500);
    };
  }, []);


  if (isLoading && tracks.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary font-headline">My Tracks</h1>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          <Link href="/tracks/new" passHref>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Track
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by title, artist, tags..."
            onChange={(e) => debouncedSetSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>
      
      {showFilters && (
        <div className="mb-6 p-4 border rounded-lg bg-card shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="genreFilter" className="block text-sm font-medium text-foreground mb-1">Genre</label>
              <Select value={genreFilter} onValueChange={(value) => {setGenreFilter(value); setLastVisibleTrack(null);}}>
                <SelectTrigger id="genreFilter">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Genres</SelectItem>
                  {availableGenres.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">BPM Range: {bpmRange[0]} - {bpmRange[1]}</label>
              <Slider
                defaultValue={[60, 180]}
                min={0}
                max={300}
                step={1}
                value={bpmRange}
                onValueChange={(value) => setBpmRange(value as [number, number])}
                onValueCommit={() => setLastVisibleTrack(null) } // Fetch on slider release
                className="mt-2"
              />
            </div>
          </div>
        </div>
      )}

      {tracks.length === 0 && !isLoading ? (
        <div className="text-center py-10">
          <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No tracks found</h3>
          <p className="text-muted-foreground">Get started by adding your first track.</p>
          <Link href="/tracks/new" passHref className="mt-4 inline-block">
            <Button><PlusCircle className="mr-2 h-4 w-4" />Add New Track</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-card rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader label="Title" column="title" />
                <SortableHeader label="Artist" column="artist" />
                <TableHead>Album</TableHead>
                <SortableHeader label="Genre" column="genre" />
                <SortableHeader label="BPM" column="bpm" />
                <TableHead>Key</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tracks.map(track => (
                <TableRow key={track.id} className={isDeleting === track.id ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{track.title}</TableCell>
                  <TableCell>{track.artist}</TableCell>
                  <TableCell>{track.album || '-'}</TableCell>
                  <TableCell>{track.genre || '-'}</TableCell>
                  <TableCell>{track.bpm || '-'}</TableCell>
                  <TableCell>{track.key || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {track.tags && track.tags.length > 0 ? track.tags.join(', ') : '-'}
                  </TableCell>
                  <TableCell>{track.duration ? formatDuration(track.duration) : '-'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/tracks/${track.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/tracks/${track.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(track)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {hasMore && !isLoading && tracks.length > 0 && (
        <div className="mt-6 text-center">
          <Button onClick={() => fetchTracks(true)} disabled={isFetchingMore}>
            {isFetchingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Load More
          </Button>
        </div>
      )}
      {isLoading && tracks.length > 0 && <Progress value={100} className="w-full mt-4 h-1 animate-pulse" />}


      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the track
              "{trackToDelete?.title}" and its associated audio file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTrackToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
