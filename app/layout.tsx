import type { Metadata } from "next";
import { Josefin_Sans, Girassol, DM_Sans } from "next/font/google";
import "./globals.css";

const josefin = Josefin_Sans({ variable: "--font-josefin", subsets: ["latin"] });
const girassol = Girassol({ variable: "--font-girassol", weight: "400", subsets: ["latin"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Authors Collective | Software, content, and design",
  description: "Authors Collective creates useful software and offers technical content writing, brand consulting, and graphic design.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${josefin.variable} ${girassol.variable} ${dmSans.variable} h-full antialiased font-dm-sans`}><body className="min-h-full flex flex-col bg-background text-foreground">{children}</body></html>;
}
