import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SolarBuilders.ng — Nigeria's Solar Marketplace",
  description:
    "Find trusted solar installers, compare systems, and size your setup. Nigeria's #1 solar marketplace.",
  keywords: ["solar Nigeria", "solar installer Nigeria", "solar calculator Nigeria", "buy solar panels Nigeria"],
  openGraph: {
    title: "SolarBuilders.ng",
    description: "Nigeria's #1 Solar Marketplace",
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
      <body className={geist.className}>{children}</body>
    </html>
  );
}
