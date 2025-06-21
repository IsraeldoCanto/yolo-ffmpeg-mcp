
'use client';

import type { Multimedia } from '@/types/multimedia';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { getMultimediaItems, deleteMultimediaItem, getUniqueGenres } from '@/lib/firebase/firestore';
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
import { formatDuration } from '@/lib/utils';
import { getBuildDisplayString } from '@/lib/build-info';

const PAGE_SIZE = 10;

export default function MultimediaPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<Multimedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('');
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [bpmRange, setBpmRange] = useState<[number, number]>([60, 180]);
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Multimedia | null>(null);

  const [sortBy, setSortBy] = useState<keyof Multimedia>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [lastVisibleItem, setLastVisibleItem] = useState<Multimedia | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);


  const fetchItems = useCallback(async (loadMore = false) => {
    if (!user) return;
    if (loadMore) setIsFetchingMore(true); else setIsLoading(true);

    try {
      const result = await getMultimediaItems({
        userId: user.uid,
        searchTerm: searchTerm,
        genreFilter: genreFilter || undefined,
        bpmRangeFilter: bpmRange,
        sortBy,
        sortOrder,
        pageSize: PAGE_SIZE,
        lastVisible: loadMore ? lastVisibleItem : null,
      });
      setItems(prevItems => loadMore ? [...prevItems, ...result.items] : result.items);
      setHasMore(result.hasMore);
      setLastVisibleItem(result.lastVisibleItem);
    } catch (error) {
      console.error('Error fetching multimedia items:', error);
      toast({ title: 'Error', description: 'Failed to fetch multimedia items.', variant: 'destructive' });
    } finally {
      if (loadMore) setIsFetchingMore(false); else setIsLoading(false);
    }
  }, [user, searchTerm, genreFilter, bpmRange, sortBy, sortOrder, lastVisibleItem, toast]);

  useEffect(() => {
    fetchItems(false); 
  }, [user, searchTerm, genreFilter, bpmRange, sortBy, sortOrder]); 

  useEffect(() => {
    if (user) {
      getUniqueGenres(user.uid).then(setAvailableGenres);
    }
  }, [user]);

  const handleDelete = async () => {
    if (!itemToDelete || !user) return;
    setIsDeleting(itemToDelete.id!);
    try {
      if (itemToDelete.audioFileName && itemToDelete.userId) {
         if (itemToDelete.audioFileName) { 
            await deleteAudioFile(itemToDelete.audioFileName);
         }
      }
      await deleteMultimediaItem(itemToDelete.id!, user.uid);
      setItems(items.filter(t => t.id !== itemToDelete.id));
      toast({ title: 'Success', description: 'Multimedia item deleted successfully.' });
    } catch (error) {
      console.error('Error deleting multimedia item:', error);
      toast({ title: 'Error', description: 'Failed to delete multimedia item.', variant: 'destructive' });
    } finally {
      setIsDeleting(null);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const openDeleteDialog = (item: Multimedia) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };
  
  const handleSort = (column: keyof Multimedia) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
     setLastVisibleItem(null); 
  };

  const SortableHeader = ({ label, column }: { label: string; column: keyof Multimedia }) => (
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
        setLastVisibleItem(null); 
      }, 500);
    };
  }, []);


  if (isLoading && items.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary font-headline">My Multimedia</h1>
        <div className="flex gap-2">
          <Link href="/kompostedit" passHref>
            <Button variant="outline" className="bg-green-600 hover:bg-green-700 text-white">
              🎵 KompostEdit
            </Button>
          </Link>
           <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          <Link href="/multimedia/new" passHref>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
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
              <Select value={genreFilter} onValueChange={(value) => {setGenreFilter(value); setLastVisibleItem(null);}}>
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
                onValueCommit={() => setLastVisibleItem(null) } 
                className="mt-2"
              />
            </div>
          </div>
        </div>
      )}

      {items.length === 0 && !isLoading ? (
        <div className="text-center py-10">
          <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No multimedia items found</h3>
          <p className="text-muted-foreground">Get started by adding your first multimedia item.</p>
          <Link href="/multimedia/new" passHref className="mt-4 inline-block">
            <Button><PlusCircle className="mr-2 h-4 w-4" />Add New Item</Button>
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
              {items.map(item => (
                <TableRow key={item.id} className={isDeleting === item.id ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.artist}</TableCell>
                  <TableCell>{item.album || '-'}</TableCell>
                  <TableCell>{item.genre || '-'}</TableCell>
                  <TableCell>{item.bpm || '-'}</TableCell>
                  <TableCell>{item.key || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {item.tags && item.tags.length > 0 ? item.tags.join(', ') : '-'}
                  </TableCell>
                  <TableCell>{item.duration ? formatDuration(item.duration) : '-'}</TableCell>
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
                          <Link href={`/multimedia/${item.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/multimedia/${item.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(item)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
      
      {hasMore && !isLoading && items.length > 0 && (
        <div className="mt-6 text-center">
          <Button onClick={() => fetchItems(true)} disabled={isFetchingMore}>
            {isFetchingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Load More
          </Button>
        </div>
      )}
      {isLoading && items.length > 0 && <Progress value={100} className="w-full mt-4 h-1 animate-pulse" />}


      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the multimedia item
              "{itemToDelete?.title}" and its associated audio file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
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
      
      <footer className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
        <div className="text-xs opacity-75">
          Build: {getBuildDisplayString()}
        </div>
      </footer>
    </div>
  );
}
