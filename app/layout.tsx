import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChatBox } from "@/components/chat/ChatBox";
import { ZaloButton } from "@/components/chat/ZaloButton";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PickleBall Shop",
  description: "E-commerce website for PickleBall products",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <ChatBox />
          <ZaloButton />
          <ScrollToTop />
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}

