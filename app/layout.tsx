import type { Metadata, Viewport } from "next"
import { Pixelify_Sans, Silkscreen } from "next/font/google"

import "./globals.css"

// Body copy / form inputs / longer UI text — readable pixel font.
const pixelifySans = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

// Headers / logo / buttons — chunky bitmap font.
const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: ["400", "700"],
})

export const metadata: Metadata = {
  title: "SpiritFeed",
  description: "A tiny, private clubhouse for the group. Pick your spirit animal.",
}

export const viewport: Viewport = {
  themeColor: "#8b8c63",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${pixelifySans.variable} ${silkscreen.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
