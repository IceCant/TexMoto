import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TexMoto Motorcycle Shop",
    short_name: "TexMoto",
    description: "Manage motorcycles, customers, sales, receipts, and your public storefront.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f7fb",
    theme_color: "#2563eb",
    orientation: "portrait-primary",
    categories: ["business", "shopping", "productivity"],
    icons: [
      {
        src: "/pwa/icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon/512?maskable=1",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Open the TexMoto dashboard",
        url: "/admin",
      },
      {
        name: "Add motorcycle",
        short_name: "Add moto",
        description: "Create a new motorcycle listing",
        url: "/admin/motorcycles/new",
      },
    ],
  };
}
