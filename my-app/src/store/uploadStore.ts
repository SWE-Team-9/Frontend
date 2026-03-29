import { create } from "zustand";

interface UploadState {
  files: File[];
  setFiles: (files: File[]) => void;
  addFile: (file: File) => void;
  removeFile: (index: number) => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  files: [],
  setFiles: (files) => set({ files }),
  addFile: (file) =>
    set((state) => ({ files: [...state.files, file] })),
  removeFile: (index) =>
    set((state) => ({
      files: state.files.filter((_, i) => i !== index),
    })),
}));