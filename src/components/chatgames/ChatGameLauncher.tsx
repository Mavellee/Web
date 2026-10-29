import { IconButton } from "../ui/IconButton";

/** Composer button. When a game is already live it jumps to that card instead of opening the catalogue. */
export function ChatGameLauncher({ onOpen, liveSessionId }: { onOpen: () => void; liveSessionId: string | null }) {
  return (
    <IconButton
      icon="games"
      label={liveSessionId ? "Go to the game in progress" : "Play a game together"}
      className="mb-0.5"
      onClick={() => {
        if (liveSessionId) document.getElementById(`game-card-${liveSessionId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        else onOpen();
      }}
    />
  );
}
