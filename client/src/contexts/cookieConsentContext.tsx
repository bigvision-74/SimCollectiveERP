import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loadGoogleAnalytics, revokeGoogleAnalytics } from "@/utils/googleAnalytics";

const STORAGE_KEY = "mxr_cookie_consent";
const CONSENT_VERSION = 1;

interface OptionalConsent {
  analytics: boolean;
  functionality: boolean;
  targeting: boolean;
}

interface StoredConsent extends OptionalConsent {
  version: number;
  decidedAt: string;
}

const DEFAULT_OPTIONAL_CONSENT: OptionalConsent = {
  analytics: false,
  functionality: false,
  targeting: false,
};

function readStoredConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

interface CookieConsentContextType {
  consent: OptionalConsent;
  hasDecided: boolean;
  isPreferenceCenterOpen: boolean;
  acceptAll: () => void;
  rejectOptional: () => void;
  savePreferences: (preferences: OptionalConsent) => void;
  openPreferences: () => void;
  closePreferences: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(
  undefined
);

export const CookieConsentProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const stored = readStoredConsent();
  const [consent, setConsent] = useState<OptionalConsent>(
    stored
      ? {
          analytics: stored.analytics,
          functionality: stored.functionality,
          targeting: stored.targeting,
        }
      : DEFAULT_OPTIONAL_CONSENT
  );
  const [hasDecided, setHasDecided] = useState(!!stored);
  const [isPreferenceCenterOpen, setIsPreferenceCenterOpen] = useState(false);

  useEffect(() => {
    if (consent.analytics) {
      loadGoogleAnalytics();
    } else {
      revokeGoogleAnalytics();
    }
  }, [consent.analytics]);

  const persist = useCallback((preferences: OptionalConsent) => {
    const record: StoredConsent = {
      ...preferences,
      version: CONSENT_VERSION,
      decidedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    setConsent(preferences);
    setHasDecided(true);
    setIsPreferenceCenterOpen(false);
  }, []);

  const acceptAll = useCallback(() => {
    persist({ analytics: true, functionality: true, targeting: true });
  }, [persist]);

  const rejectOptional = useCallback(() => {
    persist({ ...DEFAULT_OPTIONAL_CONSENT });
  }, [persist]);

  const savePreferences = useCallback(
    (preferences: OptionalConsent) => {
      persist(preferences);
    },
    [persist]
  );

  const openPreferences = useCallback(() => setIsPreferenceCenterOpen(true), []);
  const closePreferences = useCallback(() => setIsPreferenceCenterOpen(false), []);

  const value = useMemo(
    () => ({
      consent,
      hasDecided,
      isPreferenceCenterOpen,
      acceptAll,
      rejectOptional,
      savePreferences,
      openPreferences,
      closePreferences,
    }),
    [
      consent,
      hasDecided,
      isPreferenceCenterOpen,
      acceptAll,
      rejectOptional,
      savePreferences,
      openPreferences,
      closePreferences,
    ]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = (): CookieConsentContextType => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error(
      "useCookieConsent must be used within a CookieConsentProvider"
    );
  }
  return context;
};
