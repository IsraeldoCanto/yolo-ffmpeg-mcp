import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadAudioFile(
  userId: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<{ downloadURL: string; filePath: string }> {
  const filePath = `userTracks/${userId}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, filePath);
  
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        console.error('Upload failed:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ downloadURL, filePath });
        } catch (error) {
          console.error('Failed to get download URL:', error);
          reject(error);
        }
      }
    );
  });
}

export async function deleteAudioFile(filePath: string): Promise<void> {
  if (!filePath) return;
  const storageRef = ref(storage, filePath);
  try {
    await deleteObject(storageRef);
  } catch (error) {
    // If file doesn't exist, GCS throws an error. We can often ignore this.
    if ((error as any).code === 'storage/object-not-found') {
      console.warn(`File not found, could not delete: ${filePath}`);
    } else {
      console.error('Error deleting file from storage:', error);
      throw error; // Re-throw if it's a different error
    }
  }
}
