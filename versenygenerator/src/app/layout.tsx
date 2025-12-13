import "@/styles/globals.css";
import Header from "../components/header";
import { Toaster } from "@/components/ui/sonner"

export const metadata = {
  title: "Verseny generátor",
  description: "Verseny generátor alkalmazás",
  icons: {
    icon: "/trophy.png",
  },
};

import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Header />  
        {children}
        <Toaster/>
        <footer>
        <p className="text-sm text-gray-500 mt-4">
          robert.trazer@gmail.com</p>
        </footer>
      </body>
    </html>
  );
}