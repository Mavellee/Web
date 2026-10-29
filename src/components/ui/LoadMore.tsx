import { Button } from "./Button";

export function LoadMore({ onClick, loading, hasMore, label = "Show more" }: { onClick: () => void; loading: boolean; hasMore: boolean; label?: string }) {
  if (!hasMore) return null;
  return (
    <div className="flex justify-center pt-6">
      <Button variant="secondary" onClick={onClick} loading={loading}>
        {label}
      </Button>
    </div>
  );
}
