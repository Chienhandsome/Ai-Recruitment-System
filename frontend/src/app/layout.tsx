import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BackendHelloLogger } from "@/components/common/backend-hello-logger";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartRecruit AI",
  description: "Nền tảng tuyển dụng và tìm việc thông minh với AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BackendHelloLogger />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
