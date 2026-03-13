import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TUK Student Tracking System",
  description: "Comprehensive student management platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* The Toaster handles our success/error popups */}
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}