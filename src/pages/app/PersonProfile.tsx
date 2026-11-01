import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppPage } from "../../components/app/PageHeader";
import { AstroChapter } from "../../components/astro/AstroChapter";
import { SafetyMenu } from "../../components/app/SafetyActions";
import { FriendReviewPanel } from "../../components/friendreview/FriendReviewPanel";
import { useConnectionActions } from "../../components/app/MatchDialog";
import { EditorialProfile, type EditorialData } from "../../components/story/EditorialProfile";
import { DetailComposer, type DetailTarget } from "../../components/story/DetailComposer";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { LoadingBlock } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { useAuth } from "../../lib/auth";
import { useResource } from "../../lib/useResource";

type MatchEntry = { id: string; conversationId: string | null; profile: { id: string } };

export function PersonProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account } = useAuth();
  const { data, error, loading, reload } = useResource<EditorialData>(`/profiles/${id}`);
  const matches = useResource<MatchEntry[]>("/matches");
  const match = matches.data?.find((m) => m.profile.id === id);
  const [liked, setLiked] = useState(false);
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const { act, busy, dialog } = useConnectionActions((_id, kind) => {
    if (kind === "like") setLiked(true);
    void matches.reload();
  });
  const isMe = account?.id === id;

  if (loading)
    return (
      <AppPage wide>
        <LoadingBlock label="Loading profile" />
      </AppPage>
    );
  if (error || !data)
    return (
      <AppPage>
        {error && error.status !== 404 ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : (
          <EmptyState title="This profile isn't available" action={<ButtonLink to="/app/discover">Back to Discover</ButtonLink>}>
            They may have paused their profile, or it may no longer be on Mavelle.
          </EmptyState>
        )}
      </AppPage>
    );

  const canAct = !isMe && !match && !liked;
  const cta = isMe ? null : match?.conversationId ? (
    <ButtonLink to={`/app/messages/${match.conversationId}`} size="lg">
      Message {data.displayName}
    </ButtonLink>
  ) : liked ? (
    <p className="text-sm font-semibold text-success">You liked {data.displayName}. If they like you too, you'll match.</p>
  ) : (
    <div className="flex flex-wrap justify-center gap-3">
      <Button size="lg" variant="secondary" onClick={async () => (await act(data, "pass")) && navigate("/app/discover")} disabled={!!busy}>
        Pass
      </Button>
      <Button size="lg" onClick={() => act(data, "like")} loading={busy === `${data.id}:like`} icon={<Icon name="heart" />}>
        Like {data.displayName}
      </Button>
    </div>
  );

  return (
    <AppPage wide>
      <div className="mb-6 flex items-center justify-between">
        <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-ink-soft hover:text-ink">
          <Icon name="back" className="h-4 w-4" /> Back
        </button>
        {isMe ? (
          <ButtonLink to="/app/profile" variant="secondary" size="sm">
            Edit profile
          </ButtonLink>
        ) : (
          <SafetyMenu userId={data.id} name={data.displayName} matchId={match?.id} onEnded={() => navigate("/app/discover")} />
        )}
      </div>
      {isMe && <p className="mb-6 rounded-2xl bg-rose-mist px-4 py-3 text-sm text-primary-700">This is how your profile appears to other members.</p>}
      <EditorialProfile profile={data} onRespond={canAct ? setDetail : undefined} actions={cta} astro={match && <AstroChapter matchId={match.id} name={data.displayName} />} />
      {match && (
        <div className="mx-auto mt-9 max-w-2xl sm:mt-12">
          <FriendReviewPanel matchId={match.id} name={data.displayName} />
        </div>
      )}

      {/* Restrained sticky actions on phones, above the app's bottom navigation. */}
      {canAct && (
        <div className="fixed inset-x-0 bottom-[4.5rem] z-20 px-4 md:hidden">
          <div className="mx-auto flex max-w-sm gap-2 rounded-full border hairline bg-parchment/95 p-1.5 shadow-lift backdrop-blur">
            <Button variant="quiet" className="flex-1" onClick={async () => (await act(data, "pass")) && navigate("/app/discover")} disabled={!!busy}>
              Pass
            </Button>
            <Button className="flex-1" onClick={() => act(data, "like")} disabled={!!busy} icon={<Icon name="heart" />}>
              Like
            </Button>
          </div>
        </div>
      )}
      {canAct && <div className="h-16 md:hidden" aria-hidden="true" />}

      <DetailComposer profile={data} detail={detail} onClose={() => setDetail(null)} onSend={(d, comment) => act(data, "like", { kind: d.kind, ref: d.ref, comment: comment || undefined })} />
      {dialog}
    </AppPage>
  );
}
