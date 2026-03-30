import { create } from "zustand";

interface UploadState {
  files: File[]; // Array of uploaded files
  setFiles: (files: File[]) => void; // Function to set the entire files array
  addFile: (file: File) => void; // Function to add a single file to the array
  removeFile: (index: number) => void; // Function to remove a file by its index
}

export const useUploadStore = create<UploadState>((set) => ({
  files: [], // Initial state: empty array of files

  setFiles: (files) => set({ files }), // Replace the entire files array

  addFile: (file) => // Add a single file to the existing array of files
    set((state) => ({ files: [...state.files, file] })), 
    
  removeFile: (index) => // Remove a file by its index in the array
    set((state) => ({
      files: state.files.filter((_, i) => i !== index),
    })),
}));