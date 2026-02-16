import type { Metadata } from "next";
import "./globals.css";
import PasswordGate from "@/components/PasswordGate";

export const metadata: Metadata = {
  title: "E.ON Solar Live-Experience",
  description:
    "Erlebe in Echtzeit, wie viel Energie dein Dach produzieren würde – mit Live-Daten und smartem Forecast.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="antialiased">
        <PasswordGate>{children}</PasswordGate>
      </body>
    </html>
  );
}
