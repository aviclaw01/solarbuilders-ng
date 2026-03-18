import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolarBuilders.ng — Nigeria's Verified Solar Marketplace",
  description:
    "Find trusted solar installers, compare systems, and size your setup with our free calculator. Nigeria's #1 verified solar marketplace.",
  keywords: ["solar Nigeria", "solar installer Nigeria", "solar calculator Nigeria", "buy solar panels Nigeria", "solar Lagos", "solar Abuja"],
  openGraph: {
    title: "SolarBuilders.ng — Nigeria's Verified Solar Marketplace",
    description: "Find out exactly what you need. Then find someone you can trust to build it.",
    url: "https://solarbuilders.ng",
    siteName: "SolarBuilders.ng",
    locale: "en_NG",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
