import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./components/layout/PublicLayout";
import { AppShell, RequireAuth } from "./components/layout/AppShell";
import { Landing } from "./pages/public/Landing";
import { About, Contact, Guidelines, HowItWorks, Intentions, NotFound, Privacy, Safety, Terms } from "./pages/public/ContentPages";
import { ForgotPassword, Login, ResetPassword, Signup, VerifyEmail } from "./pages/auth/AuthPages";
import { useAuth } from "./lib/auth";
import { Spinner } from "./components/ui/Spinner";

// The signed-in app is split from the public site so visitors download less.
const named = <T, K extends keyof T>(load: () => Promise<T>, name: K) => lazy(() => load().then((m) => ({ default: m[name] as React.ComponentType })));
const Onboarding = named(() => import("./pages/auth/Onboarding"), "Onboarding");
const Discover = named(() => import("./pages/app/Discover"), "Discover");
const Likes = named(() => import("./pages/app/Likes"), "Likes");
const Matches = named(() => import("./pages/app/Matches"), "Matches");
const PersonProfile = named(() => import("./pages/app/PersonProfile"), "PersonProfile");
const Messages = named(() => import("./pages/app/Messages"), "Messages");
const Compatibility = named(() => import("./pages/app/Compatibility"), "Compatibility");
const Experts = named(() => import("./pages/app/Experts"), "Experts");
const Games = named(() => import("./pages/app/Games"), "Games");
const GameSession = named(() => import("./pages/app/GameSession"), "GameSession");
const KnotAstro = named(() => import("./pages/app/KnotAstro"), "KnotAstro");
const MyProfile = named(() => import("./pages/app/MyProfile"), "MyProfile");
const Notifications = named(() => import("./pages/app/Notifications"), "Notifications");
const Settings = named(() => import("./pages/app/Settings"), "Settings");
const Admin = named(() => import("./pages/app/Admin"), "Admin");
const ExpertWorkspace = named(() => import("./pages/app/ExpertWorkspace"), "ExpertWorkspace");

function PageLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-primary">
      <Spinner label="Loading" className="h-7 w-7" />
    </div>
  );
}

function StaffOnly({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { account } = useAuth();
  return account && roles.includes(account.role) ? <>{children}</> : <Navigate to="/app/discover" replace />;
}

export function App() {
  return (
    <Suspense fallback={<PageLoading />}>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Landing />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="intentions" element={<Intentions />} />
        <Route path="safety" element={<Safety />} />
        <Route path="about" element={<About />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="guidelines" element={<Guidelines />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="signup" element={<Signup />} />
      <Route path="login" element={<Login />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route path="verify-email" element={<VerifyEmail />} />
      <Route
        path="onboarding"
        element={
          <RequireAuth allowNotOnboarded>
            <Onboarding />
          </RequireAuth>
        }
      />
      <Route
        path="app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="discover" replace />} />
        <Route path="discover" element={<Discover />} />
        <Route path="likes" element={<Likes />} />
        <Route path="matches" element={<Matches />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:id" element={<Messages />} />
        <Route path="people/:id" element={<PersonProfile />} />
        <Route path="compatibility" element={<Compatibility />} />
        <Route path="games" element={<Games />} />
        <Route path="games/:id" element={<GameSession />} />
        <Route path="astro/:matchId" element={<KnotAstro />} />
        <Route path="experts" element={<Experts />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="notifications" element={<Notifications />} />
        <Route
          path="expert-workspace"
          element={
            <StaffOnly roles={["EXPERT"]}>
              <ExpertWorkspace />
            </StaffOnly>
          }
        />
        <Route
          path="admin"
          element={
            <StaffOnly roles={["ADMIN", "MODERATOR"]}>
              <Admin />
            </StaffOnly>
          }
        />
      </Route>
    </Routes>
    </Suspense>
  );
}
