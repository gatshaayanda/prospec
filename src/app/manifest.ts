import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Prospec Group | Pitbulls of Branding",
    short_name: "Prospec",
    description: "Marketing, procurement, NFC digital identity and printing from Prospec Group, Botswana.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f5f0",
    theme_color: "#00B9C7",
    orientation: "portrait-primary",
    lang: "en",
    categories: ["business", "productivity"],
    prefer_related_applications: false,
    icons: [
      { src: "/prospec-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/prospec-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/prospec-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/prospec-icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      
      { src: "/prospec-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ],
    shortcuts: [
      {
        name: "Browse services",
        short_name: "Services",
        description: "Explore Prospec divisions and send an enquiry",
        url: "/",
        icons: [{ src: "/prospec-icon.svg", sizes: "any", type: "image/svg+xml" }]
      },
      {
        name: "My account",
        short_name: "Account",
        description: "Review your Prospec enquiries",
        url: "/?view=account",
        icons: [{ src: "/prospec-icon.svg", sizes: "any", type: "image/svg+xml" }]
      },
      {
        name: "Owner Briefcase",
        short_name: "Admin",
        description: "Open the private owner workspace",
        url: "/#admin",
        icons: [{ src: "/prospec-icon.svg", sizes: "any", type: "image/svg+xml" }]
      }
    ]
  };
}
