import React from "react";
import { act } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AiChatWidget } from "@/src/components/ai/AiChatWidget";
import { aiService } from "@/src/services/aiService";

jest.mock("next/navigation", () => ({
  usePathname: () => "/discover",
}));

jest.mock("@/src/services/aiService", () => ({
  aiService: {
    chat: jest.fn(),
  },
}));

const mockChat = aiService.chat as jest.Mock;

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

function openWidget() {
  render(<AiChatWidget />);
  fireEvent.click(screen.getByLabelText("Open IQA3 Assistant"));
}

async function sendMessage(text: string) {
  const input = screen.getByPlaceholderText("Ask me anything...");
  await act(async () => {
    fireEvent.change(input, { target: { value: text } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
  });
}

describe("AiChatWidget pending context", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("stores pending context from clarification and sends it with the next reply", async () => {
    mockChat
      .mockResolvedValueOnce({
        reply: "What would you like to name the playlist?",
        provider: "mock",
        intent: "create_playlist_from_genre",
        actionsTaken: [],
        needsConfirmation: true,
        pendingContext: {
          pendingIntent: "create_playlist_from_genre",
          pendingGenre: "sha3by",
          pendingLimit: 10,
        },
      })
      .mockResolvedValueOnce({
        reply: 'Created "testt" with 5 sha3by tracks.',
        provider: "mock",
        intent: "create_playlist_from_genre",
        actionsTaken: ["created playlist"],
        needsConfirmation: false,
        pendingContext: null,
      });

    openWidget();

    await sendMessage("Create a Sha3by playlist");
    await screen.findByText("What would you like to name the playlist?");
    await waitFor(() => expect(mockChat).toHaveBeenCalledTimes(1));
    expect(mockChat).toHaveBeenNthCalledWith(
      1,
      "Create a Sha3by playlist",
      expect.objectContaining({ currentPage: "/discover" }),
    );

    await sendMessage("testt");
    await screen.findByText('Created "testt" with 5 sha3by tracks.');
    await waitFor(() => expect(mockChat).toHaveBeenCalledTimes(2));
    expect(mockChat).toHaveBeenNthCalledWith(
      2,
      "testt",
      expect.objectContaining({
        currentPage: "/discover",
        pendingIntent: "create_playlist_from_genre",
        pendingGenre: "sha3by",
        pendingLimit: 10,
      }),
    );
  });

  it("clears pending context after cancel", async () => {
    mockChat
      .mockResolvedValueOnce({
        reply: "What would you like to name the playlist?",
        provider: "mock",
        intent: "create_playlist_from_genre",
        actionsTaken: [],
        needsConfirmation: true,
        pendingContext: {
          pendingIntent: "create_playlist_from_genre",
          pendingGenre: "sha3by",
          pendingLimit: 10,
        },
      })
      .mockResolvedValueOnce({
        reply: "Okay, I cleared that pending action.",
        provider: "mock",
        intent: "cancel_pending_action",
        actionsTaken: [],
        pendingContext: null,
      })
      .mockResolvedValueOnce({
        reply: "Here are trending tracks.",
        provider: "mock",
        intent: "get_trending_tracks",
        actionsTaken: [],
      });

    openWidget();

    await sendMessage("Create a Sha3by playlist");
    await screen.findByText("What would you like to name the playlist?");
    await waitFor(() => expect(mockChat).toHaveBeenCalledTimes(1));

    await sendMessage("cancel");
    await screen.findByText("Okay, I cleared that pending action.");
    await waitFor(() => expect(mockChat).toHaveBeenCalledTimes(2));
    expect(mockChat).toHaveBeenNthCalledWith(
      2,
      "cancel",
      expect.objectContaining({ pendingIntent: "create_playlist_from_genre" }),
    );

    await sendMessage("show trending tracks");
    await screen.findByText("Here are trending tracks.");
    await waitFor(() => expect(mockChat).toHaveBeenCalledTimes(3));
    expect(mockChat).toHaveBeenNthCalledWith(
      3,
      "show trending tracks",
      expect.not.objectContaining({ pendingIntent: "create_playlist_from_genre" }),
    );
  });
});
