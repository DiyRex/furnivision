// lib/firebaseAuth.ts
export function getCurrentUser(): { email?: string; uid?: string } | null {
    try {
      if (typeof window === "undefined") return null; // SSR safety
  
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith("firebase:authUser")
      );
      if (!keys.length) return null;
  
      const authDataRaw = localStorage.getItem(keys[0]);
      if (!authDataRaw) return null;
  
      const authData = JSON.parse(authDataRaw);
      const tokenManager = authData?.stsTokenManager;
      const isTokenValid = tokenManager?.expirationTime > Date.now();
  
      if (!isTokenValid) return null;
  
      return {
        email: authData.email,
        uid: authData.uid,
      };
    } catch (e) {
      console.error("Failed to get Firebase user", e);
      return null;
    }
  }
  