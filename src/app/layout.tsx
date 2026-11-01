import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OwnFlix+ — Personal Streaming Server",
  description:
    "OwnFlix+ self-hosted personal media server with a pure Netflix streaming experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#141414] text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
