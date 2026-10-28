import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useForm, type FieldValues, type Path, type UseFormSetError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Logo } from "../../components/ui/Logo";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Checkbox, Input } from "../../components/ui/Field";
import { Spinner } from "../../components/ui/Spinner";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { Account } from "../../lib/types";

function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Logo />
        <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10 animate-rise">
          <h1 className="text-4xl sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-3 text-ink-soft">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-sm text-ink-soft">{footer}</div>}
        </main>
      </div>
      <div className="relative hidden overflow-hidden lg:block">
        <img src="/images/evening.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-plum-800/80 via-plum/20 to-transparent" />
        <p className="absolute bottom-12 left-12 right-12 font-serif text-4xl leading-tight text-ivory">Find your kind of connection.</p>
      </div>
    </div>
  );
}

/** Copies server-side field errors onto the form so they show next to the right input. */
function applyServerErrors<T extends FieldValues>(e: unknown, setError: UseFormSetError<T>, setFormError: (m: string) => void) {
  if (e instanceof ApiError) {
    if (e.details) {
      for (const [k, v] of Object.entries(e.details)) if (Array.isArray(v) && v[0]) setError(k as Path<T>, { message: v[0] });
    }
    setFormError(e.message);
  } else setFormError("Something went wrong. Please try again.");
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-5 rounded-2xl bg-rose-soft px-4 py-3 text-sm text-rose-ink">
      {message}
    </p>
  );
}

const passwordRule = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128)
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Include at least one letter and one number.");

function isAdult(dob: string) {
  const d = new Date(`${dob}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--;
  return age >= 18;
}

export const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: passwordRule,
  // The server re-checks age; this is only for a friendly early message.
  dateOfBirth: z.string().min(1, "Enter your date of birth.").refine(isAdult, "You must be 18 or older to join Knot."),
  ageConfirmed: z.literal(true, { errorMap: () => ({ message: "Please confirm you're 18 or older." }) }),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "Please accept the terms to continue." }) }),
});
type SignupValues = z.infer<typeof signupSchema>;

export function Signup() {
  const { setAccount } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });
  const { errors, isSubmitting } = formState;

  const onSubmit = async (v: SignupValues) => {
    setFormError(null);
    try {
      const account = await api.post<Account>("/auth/register", v);
      setAccount(account);
      navigate("/verify-email");
    } catch (e) {
      applyServerErrors(e, setError, setFormError);
    }
  };

  return (
    <AuthLayout
      title="Join Knot"
      subtitle="Step 1 of 5 · Your account. You'll set up your profile next — nothing is public until you choose to publish."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-plum underline-offset-4 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormError message={formError} />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Input label="Password" type="password" autoComplete="new-password" hint="At least 10 characters, with a letter and a number." error={errors.password?.message} {...register("password")} />
        <Input label="Date of birth" type="date" autoComplete="bday" hint="Kept private. Others only see your age." error={errors.dateOfBirth?.message} {...register("dateOfBirth")} />
        <div className="space-y-3 rounded-3xl bg-white/60 p-4">
          <Checkbox label="I confirm I am 18 years of age or older." error={errors.ageConfirmed?.message} {...register("ageConfirmed")} />
          <Checkbox
            label={
              <>
                I agree to the{" "}
                <Link to="/terms" target="_blank" className="text-plum underline">
                  terms
                </Link>
                ,{" "}
                <Link to="/privacy" target="_blank" className="text-plum underline">
                  privacy policy
                </Link>{" "}
                and{" "}
                <Link to="/guidelines" target="_blank" className="text-plum underline">
                  community guidelines
                </Link>
                .
              </>
            }
            error={errors.acceptTerms?.message}
            {...register("acceptTerms")}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}

const loginSchema = z.object({ email: z.string().trim().email("Enter a valid email address."), password: z.string().min(1, "Enter your password.") });
type LoginValues = z.infer<typeof loginSchema>;

export function Login() {
  const { setAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (v: LoginValues) => {
    setFormError(null);
    try {
      const account = await api.post<Account>("/auth/login", v);
      setAccount(account);
      if (account.status === "PENDING_VERIFICATION") navigate("/verify-email");
      else if (!account.onboarded && account.role !== "ADMIN" && account.role !== "MODERATOR") navigate("/onboarding");
      else navigate(location.state?.from ?? "/app/discover", { replace: true });
    } catch (e) {
      applyServerErrors(e, setError, setFormError);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      footer={
        <>
          New to Knot?{" "}
          <Link to="/signup" className="font-semibold text-plum underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormError message={formError} />
        <Input label="Email" type="email" autoComplete="email" error={formState.errors.email?.message} {...register("email")} />
        <Input label="Password" type="password" autoComplete="current-password" error={formState.errors.password?.message} {...register("password")} />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-semibold text-plum underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
}

export function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState } = useForm<{ email: string }>({ resolver: zodResolver(z.object({ email: z.string().trim().email("Enter a valid email address.") })) });
  const onSubmit = async (v: { email: string }) => {
    setFormError(null);
    try {
      await api.post("/auth/forgot-password", v);
      setSent(true);
    } catch (e) {
      applyServerErrors(e, setError, setFormError);
    }
  };
  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a link to choose a new one.">
      {sent ? (
        <div role="status" className="rounded-3xl bg-sage/70 p-6">
          <p className="font-serif text-xl">Check your inbox</p>
          <p className="mt-2 text-ink-soft">If an account exists for that email, a reset link is on its way. It expires in one hour.</p>
          <ButtonLink to="/login" variant="secondary" className="mt-5">
            Back to log in
          </ButtonLink>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <FormError message={formError} />
          <Input label="Email" type="email" autoComplete="email" error={formState.errors.email?.message} {...register("email")} />
          <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>
            Send reset link
          </Button>
          <p className="text-center text-sm">
            <Link to="/login" className="font-semibold text-plum">
              Back to log in
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = z.object({ password: passwordRule, confirm: z.string() }).refine((v) => v.password === v.confirm, { message: "Passwords don't match.", path: ["confirm"] });
  const { register, handleSubmit, setError, formState } = useForm<{ password: string; confirm: string }>({ resolver: zodResolver(schema) });
  const onSubmit = async (v: { password: string }) => {
    setFormError(null);
    try {
      await api.post("/auth/reset-password", { token, password: v.password });
      navigate("/login", { replace: true });
    } catch (e) {
      applyServerErrors(e, setError, setFormError);
    }
  };
  return (
    <AuthLayout title="Choose a new password" subtitle="You'll be signed out on all devices for safety.">
      {!token ? (
        <FormError message="This link is missing its token. Request a new reset email." />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <FormError message={formError} />
          <Input label="New password" type="password" autoComplete="new-password" error={formState.errors.password?.message} {...register("password")} />
          <Input label="Confirm password" type="password" autoComplete="new-password" error={formState.errors.confirm?.message} {...register("confirm")} />
          <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>
            Save password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const { account, refresh } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<"idle" | "verifying" | "done" | "error">(token ? "verifying" : "idle");
  const [message, setMessage] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    api
      .post("/auth/verify-email", { token })
      .then(async () => {
        setState("done");
        await refresh();
      })
      .catch((e) => {
        setState("error");
        setMessage(e instanceof ApiError ? e.message : "Verification failed.");
      });
  }, [token, refresh]);

  const resend = async () => {
    try {
      await api.post("/auth/resend-verification");
      setResent(true);
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "Couldn't resend right now.");
    }
  };

  if (state === "verifying")
    return (
      <AuthLayout title="Verifying…">
        <Spinner label="Verifying your email" className="h-8 w-8 text-plum" />
      </AuthLayout>
    );
  if (state === "done")
    return (
      <AuthLayout title="Email confirmed" subtitle="Thanks — your account is active.">
        <Button size="lg" onClick={() => navigate(account ? "/onboarding" : "/login")}>
          {account ? "Set up your profile" : "Log in to continue"}
        </Button>
      </AuthLayout>
    );

  return (
    <AuthLayout title="Check your email" subtitle={account ? <>We sent a confirmation link to <strong className="text-ink">{account.email}</strong>.</> : "Open the link we sent to confirm your address."}>
      {state === "error" && <FormError message={message} />}
      <div className="space-y-4 rounded-3xl bg-white/60 p-6">
        <p className="text-ink-soft">The link expires in 24 hours. Once confirmed, you'll set up your profile.</p>
        {account && account.status === "PENDING_VERIFICATION" && (
          <Button variant="secondary" onClick={resend} disabled={resent}>
            {resent ? "Sent — check your inbox" : "Resend email"}
          </Button>
        )}
        {account?.status === "ACTIVE" && <ButtonLink to="/onboarding">Continue</ButtonLink>}
      </div>
      {message && state !== "error" && <p className="mt-4 text-sm text-rose-ink">{message}</p>}
    </AuthLayout>
  );
}
