import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { type ReactNode } from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GitGuild",
  description: "Local demo of repository tokens and pull request prediction markets",
};

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        {props.children}
      </body>
    </html>
  );
}
