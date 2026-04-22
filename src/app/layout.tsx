import type { Metadata } from "next";
import { Chakra_Petch, IBM_Plex_Mono } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const fontSans = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "HealthTrack SG",
  description:
    "Personal health and nutrition tracker with food logging, activity, sleep, and BMI calculator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} ht-font-serif-var h-full`}
    >
      <body
        className="font-sans min-h-full flex flex-col antialiased"
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
