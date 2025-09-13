const config = {
  appName: "Encanto App",
  appDescription:
    "Encanto App es una herramienta para comunicar los padres con la institución",
  domainName:
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://app.encantojardinmusical.com.co",
  posthog: {
    key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },
};

if (!config.posthog.key) {
  console.warn('PostHog key not found. Analytics will be disabled.');
}

export default config;
