import { act } from "react";
import { useUploadStore } from "@/src/store/useuploadStore";

const mockFile = (name: string) =>
  new File(["content"], name, { type: "audio/mpeg" });

const mockMetadata = {
  title: "Test Track",
  genre: "Pop",
  tags: ["pop", "test"],
  releaseDate: "2026-03-01",
  visibility: "PUBLIC" as const,
  description: "A test description",
};

describe("useUploadStore", () => {
  beforeEach(() => {
    act(() => {
      useUploadStore.setState({ files: [], metadata: null });
    });
  });

  describe("initial state", () => {
    it("starts with an empty files array", () => {
      expect(useUploadStore.getState().files).toEqual([]);
    });

    it("starts with null metadata", () => {
      expect(useUploadStore.getState().metadata).toBeNull();
    });
  });

  describe("setFiles", () => {
    it("replaces the entire files array", () => {
      const files = [mockFile("a.mp3"), mockFile("b.mp3")];
      act(() => {
        useUploadStore.getState().setFiles(files);
      });
      expect(useUploadStore.getState().files).toEqual(files);
    });

    it("replaces existing files with new ones", () => {
      act(() => {
        useUploadStore.getState().setFiles([mockFile("old.mp3")]);
      });
      const newFiles = [mockFile("new.mp3")];
      act(() => {
        useUploadStore.getState().setFiles(newFiles);
      });
      expect(useUploadStore.getState().files).toEqual(newFiles);
    });

    it("can set files to an empty array", () => {
      act(() => {
        useUploadStore.getState().setFiles([mockFile("a.mp3")]);
        useUploadStore.getState().setFiles([]);
      });
      expect(useUploadStore.getState().files).toEqual([]);
    });
  });

  describe("addFile", () => {
    it("adds a file to an empty array", () => {
      const file = mockFile("track.mp3");
      act(() => {
        useUploadStore.getState().addFile(file);
      });
      expect(useUploadStore.getState().files).toHaveLength(1);
      expect(useUploadStore.getState().files[0]).toBe(file);
    });

    it("appends a file to existing files", () => {
      const file1 = mockFile("a.mp3");
      const file2 = mockFile("b.mp3");
      act(() => {
        useUploadStore.getState().addFile(file1);
        useUploadStore.getState().addFile(file2);
      });
      expect(useUploadStore.getState().files).toHaveLength(2);
      expect(useUploadStore.getState().files[1]).toBe(file2);
    });

    it("does not mutate existing files when adding", () => {
      const file1 = mockFile("a.mp3");
      act(() => {
        useUploadStore.getState().addFile(file1);
      });
      const snapshot = useUploadStore.getState().files;
      const file2 = mockFile("b.mp3");
      act(() => {
        useUploadStore.getState().addFile(file2);
      });
      expect(snapshot).toHaveLength(1);
    });
  });

  describe("removeFile", () => {
    it("removes a file by index", () => {
      const file1 = mockFile("a.mp3");
      const file2 = mockFile("b.mp3");
      act(() => {
        useUploadStore.getState().setFiles([file1, file2]);
        useUploadStore.getState().removeFile(0);
      });
      expect(useUploadStore.getState().files).toHaveLength(1);
      expect(useUploadStore.getState().files[0]).toBe(file2);
    });

    it("removes the last file leaving an empty array", () => {
      act(() => {
        useUploadStore.getState().setFiles([mockFile("a.mp3")]);
        useUploadStore.getState().removeFile(0);
      });
      expect(useUploadStore.getState().files).toEqual([]);
    });

    it("removes the correct file from the middle", () => {
      const files = [mockFile("a.mp3"), mockFile("b.mp3"), mockFile("c.mp3")];
      act(() => {
        useUploadStore.getState().setFiles(files);
        useUploadStore.getState().removeFile(1);
      });
      const remaining = useUploadStore.getState().files;
      expect(remaining).toHaveLength(2);
      expect(remaining[0].name).toBe("a.mp3");
      expect(remaining[1].name).toBe("c.mp3");
    });

    it("does nothing if index is out of bounds", () => {
      const files = [mockFile("a.mp3")];
      act(() => {
        useUploadStore.getState().setFiles(files);
        useUploadStore.getState().removeFile(99);
      });
      expect(useUploadStore.getState().files).toHaveLength(1);
    });
  });

  describe("setMetadata", () => {
    it("sets metadata correctly", () => {
      act(() => {
        useUploadStore.getState().setMetadata(mockMetadata);
      });
      expect(useUploadStore.getState().metadata).toEqual(mockMetadata);
    });

    it("overwrites previous metadata", () => {
      const updated = { ...mockMetadata, title: "Updated Title" };
      act(() => {
        useUploadStore.getState().setMetadata(mockMetadata);
        useUploadStore.getState().setMetadata(updated);
      });
      expect(useUploadStore.getState().metadata?.title).toBe("Updated Title");
    });

    it("stores all metadata fields correctly", () => {
      act(() => {
        useUploadStore.getState().setMetadata(mockMetadata);
      });
      const stored = useUploadStore.getState().metadata;
      expect(stored?.title).toBe("Test Track");
      expect(stored?.genre).toBe("Pop");
      expect(stored?.tags).toEqual(["pop", "test"]);
      expect(stored?.releaseDate).toBe("2026-03-01");
      expect(stored?.visibility).toBe("PUBLIC");
      expect(stored?.description).toBe("A test description");
    });
  });
});