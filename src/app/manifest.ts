import { MetadataRoute } from "next";
import config from "../../config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: config.appName,
    short_name: "Encanto",
    description: config.appDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f7",
    theme_color: "#f7f7f7",
    icons: [
      {
        src: "icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
