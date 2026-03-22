import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChatBox } from "@/components/chat/ChatBox";
import { SupportChatBox } from "@/components/chat/SupportChatBox";
import { ZaloButton } from "@/components/chat/ZaloButton";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://pickleballshop.com"),
  title: {
    default: "IKA Sport - Cửa hàng Pickleball chính hãng tại Việt Nam",
    template: "%s | IKA Sport",
  },
  description: "IKA Sport - Cửa hàng chuyên cung cấp vợt Pickleball, giày Pickleball, bóng và phụ kiện chính hãng. Giao hàng toàn quốc, bảo hành chính hãng. Hotline: 0824.01.01.88",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "any" },
      { url: "/img/logopickleball.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/icon.png",
    apple: "/img/logopickleball.png",
  },
  keywords: [
    "pickleball",
    "vợt pickleball",
    "giày pickleball",
    "bóng pickleball",
    "phụ kiện pickleball",
    "pickleball việt nam",
    "joola pickleball",
    "selkirk pickleball",
    "onix pickleball",
    "cửa hàng pickleball",
    "mua vợt pickleball",
  ],
  authors: [{ name: "IKA Sport" }],
  creator: "IKA Sport",
  publisher: "IKA Sport",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    siteName: "IKA Sport",
    title: "IKA Sport - Cửa hàng Pickleball chính hãng tại Việt Nam",
    description: "Cửa hàng chuyên cung cấp vợt Pickleball, giày Pickleball, bóng và phụ kiện chính hãng. Giao hàng toàn quốc, bảo hành chính hãng.",
    images: [
      {
        url: "/img/logopickleball.png",
        width: 1200,
        height: 630,
        alt: "IKA Sport - Pickleball Shop",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IKA Sport - Cửa hàng Pickleball chính hãng tại Việt Nam",
    description: "Cửa hàng chuyên cung cấp vợt Pickleball, giày Pickleball, bóng và phụ kiện chính hãng.",
    images: ["/img/logopickleball.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <ChatBox />
          <SupportChatBox />
          <ZaloButton />
          <ScrollToTop />
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}

