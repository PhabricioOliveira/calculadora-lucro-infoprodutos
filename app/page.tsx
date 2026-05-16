"use client"

import { useState } from "react"
import { Calculator, CalculatorResult } from "./components/calculator"
import { MarketingChat } from "./components/marketing-chat"

export default function Home() {
  const [calculatorData, setCalculatorData] = useState<CalculatorResult | null>(null)

  return (
    <>
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute rounded-full blur-[80px]"
          style={{
            width: "600px",
            height: "500px",
            top: "-15%",
            left: "-10%",
            background: "radial-gradient(circle,rgba(108,92,231,0.18) 0%,transparent 65%)",
            animation: "drift 18s ease-in-out infinite alternate",
          }}
        />
        <div
          className="absolute rounded-full blur-[80px]"
          style={{
            width: "500px",
            height: "400px",
            top: "50%",
            right: "-5%",
            background: "radial-gradient(circle,rgba(0,206,201,0.1) 0%,transparent 65%)",
            animation: "drift 18s ease-in-out infinite alternate",
            animationDelay: "-6s",
          }}
        />
        <div
          className="absolute rounded-full blur-[80px]"
          style={{
            width: "400px",
            height: "350px",
            bottom: "-10%",
            left: "30%",
            background: "radial-gradient(circle,rgba(0,184,148,0.08) 0%,transparent 65%)",
            animation: "drift 18s ease-in-out infinite alternate",
            animationDelay: "-12s",
          }}
        />
      </div>

      {/* Main Content */}
      <Calculator onCalculate={setCalculatorData} />

      {/* Marketing Chat */}
      <MarketingChat calculatorData={calculatorData} />
    </>
  )
}
