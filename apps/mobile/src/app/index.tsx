import { Redirect } from 'expo-router';

import { useApp } from '../state/AppState';

// Entry point: new people see onboarding, signed-in people go straight to their week.
export default function Index() {
  const { signedIn } = useApp();
  return <Redirect href={signedIn ? '/week' : '/welcome'} />;
}
