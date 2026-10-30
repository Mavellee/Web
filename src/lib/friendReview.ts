export type Verdict = "GOOD_FEELING" | "ASK_MORE" | "NOT_SURE";
export type MyReview = { id: string; status: "PENDING" | "ALLOWED" | "DECLINED" | "REVIEWED"; linkLive: boolean; expiresAt: string | null; friendName: string | null; verdict: Verdict | null; comment: string | null; createdAt: string };
export type ReviewOfMe = { id: string; status: "PENDING" | "ALLOWED" | "REVIEWED"; linkLive: boolean; expiresAt: string | null; createdAt: string };
export type FriendReviews = { mine: MyReview[]; aboutMe: ReviewOfMe[] };

export const VERDICTS: { value: Verdict; label: string; hint: string }[] = [
  { value: "GOOD_FEELING", label: "Good feeling", hint: "Seems worth getting to know" },
  { value: "ASK_MORE", label: "Ask more first", hint: "A few things to find out" },
  { value: "NOT_SURE", label: "Not sure", hint: "Take it slowly" },
];
export const verdictLabel = (v: Verdict | null) => VERDICTS.find((x) => x.value === v)?.label ?? "";

/** The token sits in the URL fragment, which browsers never send to any server or put in a Referer. */
export const friendLink = (token: string) => `${window.location.origin}/friend#${token}`;
