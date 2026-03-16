// src/app/layout.js
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/Providers";
import "./globals.css";
import Script from 'next/script';

export const metadata = {
  title: "TUK Tracking System",
  description: "Comprehensive Student Tracking System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <Script 
          src="https://upload-widget.cloudinary.com/global/all.js" 
          strategy="lazyOnload" 
        />
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}