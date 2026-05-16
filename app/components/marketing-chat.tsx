"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { CalculatorResult } from "./calculator"

interface MarketingChatProps {
  calculatorData: CalculatorResult | null
}

function getUIMessageText(msg: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ""
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("")
}

export function MarketingChat({ calculatorData }: MarketingChatProps) {
  const [input, setInput] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          id,
          messages,
          calculatorData,
        },
      }),
    }),
  })

  const isLoading = status === "streaming" || status === "submitted"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput("")
  }

  const suggestedQuestions = [
    "Como melhorar minha margem de lucro?",
    "Qual CPC ideal para meu produto?",
    "Como reduzir meu CAC?",
    "Estratégias para escalar minhas vendas",
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105"
          style={{
            background: "linear-gradient(135deg, var(--accent) 0%, var(--teal) 100%)",
            boxShadow: "0 8px 32px rgba(108,92,231,0.4)",
          }}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="font-semibold text-white">Consultor de Marketing</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{
            width: "400px",
            height: "600px",
            maxHeight: "80vh",
            background: "var(--bg2)",
            border: "1px solid var(--glass-border)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{
              background: "linear-gradient(135deg, rgba(108,92,231,0.2) 0%, rgba(0,206,201,0.1) 100%)",
              borderBottom: "1px solid var(--glass-border)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--teal) 100%)" }}
              >
                <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold" style={{ fontFamily: "var(--font-syne)", color: "var(--text)" }}>
                  Consultor IA
                </h3>
                <p className="text-xs" style={{ color: "var(--text3)" }}>
                  Especialista em Infoprodutos
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "var(--text2)" }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: "var(--accent-glow)" }}
                >
                  <svg width="32" height="32" fill="none" stroke="var(--accent-light)" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2" style={{ fontFamily: "var(--font-syne)", color: "var(--text)" }}>
                  {calculatorData ? "Pronto para analisar!" : "Preencha a calculadora"}
                </h4>
                <p className="text-sm mb-6" style={{ color: "var(--text3)" }}>
                  {calculatorData
                    ? "Tenho seus dados. Pergunte sobre estratégias de marketing, otimização de custos ou escala."
                    : "Preencha os dados da calculadora para uma análise personalizada."}
                </p>

                {/* Suggested Questions */}
                <div className="space-y-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        sendMessage({ text: question })
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all hover:translate-x-1"
                      style={{
                        background: "var(--glass)",
                        border: "1px solid var(--glass-border)",
                        color: "var(--text2)",
                      }}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => {
              const text = getUIMessageText(message)
              const isUser = message.role === "user"

              return (
                <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl ${isUser ? "rounded-br-md" : "rounded-bl-md"}`}
                    style={{
                      background: isUser
                        ? "linear-gradient(135deg, var(--accent) 0%, rgba(108,92,231,0.8) 100%)"
                        : "var(--glass-md)",
                      border: isUser ? "none" : "1px solid var(--glass-border)",
                      color: "var(--text)",
                    }}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
                  </div>
                </div>
              )
            })}

            {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-3 rounded-2xl rounded-bl-md"
                  style={{
                    background: "var(--glass-md)",
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ background: "var(--accent-light)", animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ background: "var(--accent-light)", animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ background: "var(--accent-light)", animationDelay: "300ms" }}
                      />
                    </div>
                    <span className="text-xs" style={{ color: "var(--text3)" }}>
                      Analisando...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-4"
            style={{ borderTop: "1px solid var(--glass-border)" }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte sobre marketing..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "rgba(0,0,0,0.28)",
                  border: "1px solid var(--border-md)",
                  color: "var(--text)",
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-3 rounded-xl transition-all disabled:opacity-50"
                style={{
                  background: "var(--accent)",
                  color: "white",
                }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
