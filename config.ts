const config = {
  appName: "Encanto App",
  appDescription:
    "Encanto App es una herramienta para comunicar los padres con la institución",
  domainName:
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://app.encantojardinmusical.com.co",
};

export default config;
