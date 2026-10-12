import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "adfree - your videos, no ads",
  description: "play your own videos and courses in the browser. resumes where you stopped, speed control, subtitles. nothing is uploaded.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
