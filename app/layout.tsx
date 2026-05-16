import type { Metadata } from "next"
import { DM_Sans, Syne } from "next/font/google"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
})

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Calculadora de Lucro Pro — Infoprodutos v3.0",
  description: "Imposto flexível, afiliados, coprodução, CPC, conversão, simulador de escala, CSV e persistência automática.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${syne.variable} bg-background`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
