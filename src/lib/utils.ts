import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;
  return `${minutes}:${formattedSeconds}`;
}

export function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

// Allowed audio types and max size
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/flac'];
export const MAX_AUDIO_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const validateAudioFile = (file: File | null | undefined): string | null => {
  if (!file) {
    return "Audio file is required.";
  }
  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
    return "Invalid file type. Allowed types: MP3, WAV, M4A, FLAC.";
  }
  if (file.size > MAX_AUDIO_FILE_SIZE) {
    return `File size exceeds limit of ${MAX_AUDIO_FILE_SIZE / (1024*1024)}MB.`;
  }
  return null;
};
