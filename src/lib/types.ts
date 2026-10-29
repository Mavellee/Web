export type Intention = "SINGLE" | "SITUATIONSHIP" | "MARRIAGE";
export type Gender = "WOMAN" | "MAN" | "NON_BINARY" | "TRANSGENDER_WOMAN" | "TRANSGENDER_MAN" | "GENDERQUEER" | "OTHER";
export type Role = "USER" | "EXPERT" | "MODERATOR" | "ADMIN";

export interface Account {
  id: string;
  email: string;
  role: Role;
  status: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "BANNED" | "PENDING_DELETION";
  emailVerified: boolean;
  age: number | null;
  onboarded: boolean;
  displayName: string | null;
  profilePublished: boolean;
  discoveryPaused: boolean;
  avatarPhotoId: string | null;
  expertStatus: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | null;
  settings: Settings | null;
}

export interface Settings {
  aiEnabled: boolean;
  readReceipts: boolean;
  typingIndicators: boolean;
  emailNotifications: boolean;
  showDistance: boolean;
}

export interface CompatSummary {
  score: number | null;
  confidence: "not_enough_information" | "limited" | "moderate" | "good";
  highlights: string[];
  dealbreakerConflicts: number;
}

export interface CompatItem {
  key: string;
  label: string;
  dimension: string;
  status: "aligned" | "partly_aligned" | "different" | "missing_you" | "missing_them" | "missing_both";
  dealbreaker?: "yours" | "theirs";
}

export interface CompatResult {
  version: string;
  score: number | null;
  confidence: CompatSummary["confidence"];
  dimensions: { dimension: string; score: number | null; weight: number; compared: number; missing: number }[];
  items: CompatItem[];
  dealbreakerConflicts: number;
  sharedInterests: number;
}

export interface PublicProfile {
  id: string;
  displayName: string;
  age: number | null;
  gender: Gender;
  city: string | null;
  distance: string | null;
  bio: string | null;
  languages: string[];
  intentions: Intention[];
  interests: { slug: string; name: string; shared: boolean }[];
  sharedInterestCount: number;
  photoIds: string[];
  photos?: PhotoRef[];
  media?: MediaItem[];
  prompts?: PromptAnswer[];
  isDemo?: boolean;
  isApprovedExpert: boolean;
  compatibility?: CompatSummary | CompatResult | null;
}

export interface PhotoRef {
  id: string;
  focusX: number;
  focusY: number;
  caption?: string | null;
}

/** One gallery item: a photo or a short video, with its own optional caption. */
export interface MediaItem {
  id: string;
  kind: "IMAGE" | "VIDEO";
  caption: string | null;
  isPrimary: boolean;
  focusX: number;
  focusY: number;
  durationMs: number | null;
  hasPoster: boolean;
}

/** The owner's view of an item, including moderation state and position. */
export interface OwnMediaItem extends MediaItem {
  position: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface MediaLimits {
  maxPhotos: number;
  maxVideos: number;
  captionMax: number;
  videoMaxSeconds: number;
  videoMaxBytes: number;
  photoMaxBytes: number;
}

export interface PromptAnswer {
  key: string;
  text: string;
  answer: string;
}

export interface PromptDef {
  key: string;
  text: string;
  ideas: string[];
}

export interface LikeDetail {
  kind: "PROMPT" | "INTEREST" | "MEDIA";
  ref: string;
  label: string;
  quote: string;
  mediaId?: string;
  mediaKind?: "IMAGE" | "VIDEO";
}

export interface OwnProfile {
  age: number | null;
  displayName: string;
  gender: Gender | null;
  interestedIn: Gender[];
  bio: string;
  city: string | null;
  hasApproxLocation: boolean;
  languages: string[];
  interests: string[];
  intentions: Intention[];
  soughtIntentions: Intention[];
  ageMin: number;
  ageMax: number;
  maxDistanceKm: number | null;
  isPublished: boolean;
  isDiscoverable: boolean;
  discoveryPaused: boolean;
  /** Images only, primary first. */
  photos: OwnMediaItem[];
  /** The whole gallery (photos and videos) in display order. */
  media: OwnMediaItem[];
  mediaLimits: MediaLimits;
  prompts: PromptAnswer[];
  dateOfBirth: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string | null;
  kind: "TEXT" | "IMAGE" | "SYSTEM" | "GAME";
  gameSessionId?: string | null;
  metadata?: Record<string, unknown> | null;
  body: string | null;
  hasAttachment: boolean;
  clientId: string | null;
  createdAt: string;
  pending?: boolean;
  failed?: boolean;
}

export interface ConversationSummary {
  id: string;
  matchId: string;
  other: PublicProfile;
  lastMessage: { body: string | null; senderId: string | null; createdAt: string } | null;
  unread: number;
  createdAt: string;
}

export interface Suggestion {
  source: "ai" | "curated";
  label: string;
  suggestions: string[];
  note?: string;
}
