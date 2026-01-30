export function validateEnvironment() {
  const missing: string[] = [];

  if (!import.meta.env.VITE_SUPABASE_URL) {
    missing.push('VITE_SUPABASE_URL');
  }
  if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');
  }

  if (missing.length > 0) {
    console.warn(
      `[FitCheck] Missing environment variables: ${missing.join(', ')}. ` +
      'AI scoring and Supabase features will not work. ' +
      'Create a .env file with these variables to enable full functionality.'
    );
  }
}
