import { Redirect } from 'expo-router';

import { useApp } from '../state/AppState';

// Entry point: new people see onboarding, signed-in people go straight to their week.
export default function Index() {
  const { signedIn, authReady } = useApp();
  // Wait for a saved session to be restored before choosing, so signed-in people don't flash the welcome screen.
  if (!authReady) return null;
  return <Redirect href={signedIn ? '/week' : '/welcome'} />;
}
