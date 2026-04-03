import { create } from "zustand";

interface Metadata {
  title: string;
  genre: string;
  tags: string[];
  releaseDate: string;
  visibility: "PUBLIC" | "PRIVATE";
}
interface UploadStore {
  files: File[];
  metadata: Metadata | null;
  setFiles: (files: File[]) => void; // Function to set the entire files array
  addFile: (file: File) => void; // Function to add a single file to the array
  removeFile: (index: number) => void; // Function to remove a file by its index
  setMetadata: (metadata: Metadata) => void; // Function to set the metadata for the track
}

export const useUploadStore = create<UploadStore>((set) => ({
  files: [], // Initial state: empty array of files
  metadata: null, // Initial state: no metadata

  setFiles: (files) => set({ files }), // Replace the entire files array

  addFile: (file) => // Add a single file to the existing array of files
    set((state) => ({ files: [...state.files, file] })), 
    
  removeFile: (index) => // Remove a file by its index in the array
    set((state) => ({
      files: state.files.filter((_, i) => i !== index),
    })),
    
  setMetadata: (metadata) => set({ metadata }), // Set the metadata for the track
}));