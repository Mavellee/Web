import { useNavigate, useParams } from "react-router-dom";
import { AppPage } from "../../components/app/PageHeader";
import { SafetyMenu } from "../../components/app/SafetyActions";
import { useConnectionActions } from "../../components/app/MatchDialog";
import { ProfileDetail, type DetailedProfile } from "../../components/profile/ProfileDetail";
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
  const { data, error, loading, reload } = useResource<DetailedProfile>(`/profiles/${id}`);
  const matches = useResource<MatchEntry[]>("/matches");
  const match = matches.data?.find((m) => m.profile.id === id);
  const { act, busy, dialog } = useConnectionActions(() => void matches.reload());
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
            They may have paused their profile, or it may no longer be on Knot.
          </EmptyState>
        )}
      </AppPage>
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
      {isMe && <p className="mb-6 rounded-2xl bg-lavender-soft px-4 py-3 text-sm text-plum-700">This is how your profile appears to other members.</p>}
      <ProfileDetail profile={data} />
      {!isMe && (
        <div className="mt-10 flex flex-wrap gap-3 border-t hairline pt-6 lg:ml-[calc(24rem+3rem)]">
          {match?.conversationId ? (
            <ButtonLink to={`/app/messages/${match.conversationId}`} size="lg">
              Message {data.displayName}
            </ButtonLink>
          ) : (
            <>
              <Button size="lg" onClick={() => act(data, "like")} loading={busy === `${data.id}:like`} icon={<Icon name="heart" />}>
                Like
              </Button>
              <Button size="lg" variant="secondary" onClick={async () => (await act(data, "pass")) && navigate("/app/discover")} disabled={!!busy}>
                Pass
              </Button>
            </>
          )}
        </div>
      )}
      {dialog}
    </AppPage>
  );
}
