import { useEffect, useState, type ReactNode } from 'react';
import {
  BrowserAuthError,
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AccountInfo,
  type IPublicClientApplication
} from '@azure/msal-browser';
import { MsalProvider, useMsal } from '@azure/msal-react';

type AuthMode = 'demo' | 'entra';
type EntraSession = {
  instance: IPublicClientApplication;
  account: AccountInfo;
};

const configuredMode = import.meta.env.VITE_AUTH_MODE ?? 'demo';
if (configuredMode !== 'demo' && configuredMode !== 'entra') {
  throw new Error('VITE_AUTH_MODE must be demo or entra');
}

export const AUTH_MODE: AuthMode = configuredMode;

const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID?.trim();
const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID?.trim();
const scopes = clientId ? [`api://${clientId}/access_as_user`] : [];
const redirectGuard = 'leave-tracker-entra-redirecting';
let entraSession: EntraSession | undefined;

function configurationError() {
  if (AUTH_MODE !== 'entra') return undefined;
  if (!clientId) return 'VITE_ENTRA_CLIENT_ID is required in Entra mode.';
  if (!tenantId) return 'VITE_ENTRA_TENANT_ID is required in Entra mode.';
  return undefined;
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('Silent token acquisition timed out')), milliseconds);
    promise.then(
      (value) => { window.clearTimeout(timer); resolve(value); },
      (error) => { window.clearTimeout(timer); reject(error); }
    );
  });
}

function needsInteraction(error: unknown) {
  return error instanceof InteractionRequiredAuthError
    || (error instanceof BrowserAuthError && error.errorCode === 'monitor_window_timeout')
    || (error instanceof Error && error.message === 'Silent token acquisition timed out');
}

export async function redirectForInteraction(): Promise<never> {
  if (!entraSession) throw new Error('Entra session is not ready');
  if (sessionStorage.getItem(redirectGuard) === 'true') {
    throw new Error('Sign-in redirect is already in progress');
  }
  sessionStorage.setItem(redirectGuard, 'true');
  await entraSession.instance.acquireTokenRedirect({
    account: entraSession.account,
    scopes,
    redirectUri: window.location.origin
  });
  throw new Error('Sign-in redirect did not navigate');
}

export async function getAccessToken(forceRefresh = false): Promise<string> {
  if (!entraSession) throw new Error('Entra session is not ready');
  try {
    const result = await withTimeout(
      entraSession.instance.acquireTokenSilent({
        account: entraSession.account,
        scopes,
        forceRefresh,
        redirectUri: window.location.origin
      }),
      12_000
    );
    sessionStorage.removeItem(redirectGuard);
    return result.accessToken;
  } catch (error) {
    if (needsInteraction(error)) return redirectForInteraction();
    throw error;
  }
}

export async function signOut() {
  if (!entraSession) return;
  sessionStorage.removeItem(redirectGuard);
  await entraSession.instance.logoutRedirect({
    account: entraSession.account,
    postLogoutRedirectUri: window.location.origin
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (AUTH_MODE === 'demo') return children;
  return <EntraProvider>{children}</EntraProvider>;
}

function EntraProvider({ children }: { children: ReactNode }) {
  const error = configurationError();
  const [instance] = useState(() => error ? undefined : new PublicClientApplication({
    auth: {
      clientId: clientId!,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: window.location.origin
    },
    cache: { cacheLocation: 'sessionStorage' }
  }));
  const [ready, setReady] = useState(false);
  const [initializationError, setInitializationError] = useState<string>();

  useEffect(() => {
    if (!instance) return;
    void instance.initialize().then(
      () => setReady(true),
      (cause: unknown) => setInitializationError(cause instanceof Error ? cause.message : String(cause))
    );
  }, [instance]);

  if (error || initializationError) {
    return <AuthMessage title="Authentication configuration error" detail={error ?? initializationError!} />;
  }
  if (!instance || !ready) return <AuthMessage title="Loading sign-in" detail="Initializing Microsoft identity..." />;
  return <MsalProvider instance={instance}>{children}</MsalProvider>;
}

export function AuthGate({ children }: { children: ReactNode }) {
  if (AUTH_MODE === 'demo') return children;
  return <EntraGate>{children}</EntraGate>;
}

function EntraGate({ children }: { children: ReactNode }) {
  const { instance, accounts, inProgress } = useMsal();
  const account = instance.getActiveAccount() ?? accounts[0];
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!account) {
      entraSession = undefined;
      setReady(false);
      return;
    }
    instance.setActiveAccount(account);
    entraSession = { instance, account };
    setError(undefined);
    void getAccessToken(true).then(
      () => setReady(true),
      (cause: unknown) => setError(cause instanceof Error ? cause.message : String(cause))
    );

    const refreshOnFocus = () => {
      void getAccessToken(true).catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : String(cause));
      });
    };
    window.addEventListener('focus', refreshOnFocus);
    return () => window.removeEventListener('focus', refreshOnFocus);
  }, [account, instance]);

  if (!account) {
    return (
      <AuthMessage title="Sign in to Leave Tracker" detail="Use your organization account to continue.">
        <button
          onClick={() => void instance.loginRedirect({ scopes, redirectUri: window.location.origin })}
          disabled={inProgress !== 'none'}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {inProgress === 'none' ? 'Sign in with Microsoft' : 'Completing sign-in...'}
        </button>
      </AuthMessage>
    );
  }
  if (error) return <AuthMessage title="Sign-in failed" detail={error} />;
  if (!ready) return <AuthMessage title="Loading sign-in" detail="Refreshing your session..." />;
  return children;
}

function AuthMessage({ title, detail, children }: { title: string; detail: string; children?: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center p-6">
      <section className="w-full rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="my-4 text-sm text-neutral-600">{detail}</p>
        {children}
      </section>
    </main>
  );
}
