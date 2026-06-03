'use client';

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { ClerkProvider, SignIn, SignUp, SignedIn, SignedOut, useClerk, useUser } from "@clerk/nextjs";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MapPin, Phone, ShieldCheck, UserRound, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const clerkProxyUrl = process.env.NEXT_PUBLIC_CLERK_PROXY_URL ?? "";
const basePath = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");

type Role = "admin" | "applicant" | "employer";

const ROLE_ROUTES: Record<Role, string> = {
  admin: "/admin",
  applicant: "/applicant",
  employer: "/employer",
};

const ROLE_SESSION_KEY = "jobserve_pending_role";

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const ROLES: { value: Role; label: string; icon: ReactNode; desc: string }[] = [
  {
    value: "admin",
    label: "Admin",
    icon: <ShieldCheck className="w-6 h-6" />,
    desc: "Barangay staff & moderators",
  },
  {
    value: "applicant",
    label: "Applicant",
    icon: <UserRound className="w-6 h-6" />,
    desc: "Residents looking for work",
  },
  {
    value: "employer",
    label: "Employer",
    icon: <Briefcase className="w-6 h-6" />,
    desc: "Businesses posting jobs",
  },
];

function RoleSelector({
  selected,
  onSelect,
  roles = ROLES,
}: {
  selected: Role | null;
  onSelect: (r: Role) => void;
  roles?: typeof ROLES;
}) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {roles.map((role) => (
        <button
          key={role.value}
          onClick={() => onSelect(role.value)}
          className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
            selected === role.value
              ? "border-[#1a237e] bg-[#1a237e]/5 text-[#1a237e]"
              : "border-gray-200 hover:border-[#1a237e]/40 text-gray-700"
          }`}
        >
          <span
            className={`flex-shrink-0 ${
              selected === role.value ? "text-[#1a237e]" : "text-gray-400"
            }`}
          >
            {role.icon}
          </span>
          <div>
            <div className="font-semibold text-sm">{role.label}</div>
            <div className="text-xs text-gray-400">{role.desc}</div>
          </div>
          <div
            className={`ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 ${
              selected === role.value
                ? "border-[#1a237e] bg-[#1a237e]"
                : "border-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const SIGNUP_ROLES = ROLES.filter((r) => r.value !== "admin");

function HomePage() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [loginRole, setLoginRole] = useState<Role | null>(null);
  const [signupRole, setSignupRole] = useState<Role | null>(null);
  const [, setLocation] = useLocation();

  function switchTab(newTab: "login" | "signup") {
    setActiveTab(newTab);
    if (newTab === "signup" && signupRole === "admin") {
      setSignupRole(null);
    }
  }

  function handleLogin() {
    if (!loginRole) return;
    sessionStorage.setItem(ROLE_SESSION_KEY, loginRole);
    setLocation("/sign-in");
  }

  function handleSignUp() {
    if (!signupRole) return;
    sessionStorage.setItem(ROLE_SESSION_KEY, signupRole);
    setLocation("/sign-up");
  }

  return (
    <div
      className="min-h-[100dvh] w-full relative flex flex-col md:flex-row"
      style={{
        backgroundImage: `url(${process.env.NEXT_PUBLIC_BASE_URL ?? ""}bg-barangay.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="absolute inset-0 z-0"
        style={{ backgroundColor: "rgba(26, 35, 126, 0.75)" }}
      />

      <div className="relative z-10 flex flex-col md:flex-row w-full max-w-7xl mx-auto p-6 md:p-12 lg:p-24 gap-12 lg:gap-24 items-center">
        <div className="flex-1 flex flex-col justify-center text-white h-full max-w-xl pt-12 md:pt-0">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold italic tracking-tight mb-6 leading-tight">
            Barangay 634 JobServe
          </h1>

          <p className="text-xl md:text-2xl text-gray-200 mb-12 font-medium">
            Isang komunidad na nagkakaisa para sa trabaho at kabuhayan ng bawat mamamayan.
          </p>

          <blockquote className="text-lg md:text-xl italic text-gray-100 border-l-4 border-white/30 pl-6 py-2 mb-auto">
            &ldquo;Ang bawat residente ng Barangay 634 ay may karapatang magkaroon ng maayos na kabuhayan. Sama-sama tayo sa pag-unlad.&rdquo;
          </blockquote>

          <div className="mt-16 flex flex-col gap-4 text-sm md:text-base text-gray-200">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-white" />
              <span>Zone 64, Sampaloc, Manila</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-white" />
              <span>(02) 8123-4567</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden self-center mb-12 md:mb-0">
          <div className="p-8">
            <div className="flex border-b border-gray-100 mb-8">
              <button
                className={`flex-1 pb-4 text-center font-semibold text-lg transition-colors ${
                  activeTab === "login"
                    ? "text-[#1a237e] border-b-2 border-[#1a237e]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                onClick={() => switchTab("login")}
              >
                Log In
              </button>
              <button
                className={`flex-1 pb-4 text-center font-semibold text-lg transition-colors ${
                  activeTab === "signup"
                    ? "text-[#1a237e] border-b-2 border-[#1a237e]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                onClick={() => switchTab("signup")}
              >
                Sign Up
              </button>
            </div>

            {activeTab === "login" ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-gray-600 text-sm font-medium">Select your account type:</p>
                <RoleSelector selected={loginRole} onSelect={setLoginRole} />
                <Button
                  className="w-full h-12 text-base font-semibold bg-[#1a237e] hover:bg-[#1a237e]/90 text-white rounded-xl shadow-lg shadow-[#1a237e]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleLogin}
                  disabled={!loginRole}
                >
                  Login to Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-gray-600 text-sm font-medium">Select your account type:</p>
                <RoleSelector selected={signupRole} onSelect={setSignupRole} roles={SIGNUP_ROLES} />
                <Button
                  className="w-full h-12 text-base font-semibold bg-[#1a237e] hover:bg-[#1a237e]/90 text-white rounded-xl shadow-lg shadow-[#1a237e]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSignUp}
                  disabled={!signupRole}
                >
                  Create Account
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleRedirect() {
  const { user, isLoaded } = useUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoaded || !user) return;

    async function resolveRole() {
      if (!user) return;
      const existingRole = (user.unsafeMetadata?.role as Role | undefined) ||
        (user.publicMetadata?.role as Role | undefined);

      if (existingRole && ROLE_ROUTES[existingRole]) {
        setLocation(ROLE_ROUTES[existingRole]);
        return;
      }

      const pendingRole = sessionStorage.getItem(ROLE_SESSION_KEY) as Role | null;
      if (pendingRole && ROLE_ROUTES[pendingRole]) {
        sessionStorage.removeItem(ROLE_SESSION_KEY);
        await user.update({ unsafeMetadata: { role: pendingRole } });
        setLocation(ROLE_ROUTES[pendingRole]);
        return;
      }

      setLocation("/applicant");
    }

    resolveRole();
  }, [isLoaded, user, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-500 text-sm">Redirecting...</div>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <SignedIn>
        <RoleRedirect />
      </SignedIn>
      <SignedOut>
        <HomePage />
      </SignedOut>
    </>
  );
}

function AuthPageWrapper({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{
        backgroundImage: `url(${process.env.NEXT_PUBLIC_BASE_URL ?? ""}bg-barangay.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(26, 35, 126, 0.75)" }} />
      <div className="relative z-10 w-full flex flex-col items-center gap-4 px-4">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors self-start max-w-md w-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back to Homepage
        </button>
        {children}
      </div>
    </div>
  );
}

function SignInPage() {
  return (
    <AuthPageWrapper>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </AuthPageWrapper>
  );
}

function SignUpPage() {
  return (
    <AuthPageWrapper>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </AuthPageWrapper>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
