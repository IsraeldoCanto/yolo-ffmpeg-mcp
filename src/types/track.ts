import type { Timestamp } from 'firebase/firestore';

export interface Track {
  id?: string;
  userId: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number; // in seconds
  bpm?: number;
  key?: string;
  genre?: string;
  tags?: string[];
  audioUrl?: string;
  audioFileName?: string; // To store original file name
  coverArtUrl?: string; // Optional cover art
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
