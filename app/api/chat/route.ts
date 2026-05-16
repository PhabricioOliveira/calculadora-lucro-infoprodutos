import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from "ai"

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages, calculatorData }: { messages: UIMessage[]; calculatorData: CalculatorData | null } = await req.json()

  const systemPrompt = buildSystemPrompt(calculatorData)

  const result = streamText({
    model: "openai/gpt-4o-mini",
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  })
}

interface CalculatorData {
  preco: number
  unidades: number
  fat: number
  totalCusto: number
  lucroTotal: number
  lucroReal: number
  margem: number
  margemReal: number
  roas: number
  roi: number
  cac: number
  ltv: number
  breakeven: number
  taxaPct: number
  impostoPct: number
  parcelPct: number
  afiliadosPct: number
  coproducaoPct: number
  reembolsoPct: number
  ads: number
  cpc: number
  convPct: number
  fixos: number
}

function buildSystemPrompt(data: CalculatorData | null): string {
  const basePrompt = `Você é um consultor de marketing digital especializado em infoprodutos brasileiros. Seu papel é analisar os dados financeiros do usuário e fornecer insights estratégicos para melhorar o lucro.

Você deve:
- Ser direto e prático nas recomendações
- Usar exemplos reais do mercado de infoprodutos brasileiro
- Considerar as particularidades do mercado brasileiro (plataformas como Hotmart, Kiwify, Eduzz)
- Dar dicas sobre otimização de tráfego pago (Meta Ads, Google Ads)
- Sugerir estratégias para melhorar conversão e reduzir CAC
- Alertar sobre possíveis riscos quando identificados
- Responder sempre em português brasileiro
- Manter respostas focadas e objetivas (não muito longas)

IMPORTANTE: Você é um consultor de marketing, NÃO um assistente geral. Mantenha o foco em marketing digital, vendas de infoprodutos e estratégias de crescimento.`

  if (!data) {
    return `${basePrompt}

O usuário ainda não calculou nenhum cenário. Incentive-o a preencher os dados da calculadora para que você possa fornecer uma análise personalizada. Enquanto isso, você pode responder perguntas gerais sobre marketing de infoprodutos.`
  }

  const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  const formatPct = (v: number) => v.toFixed(1) + "%"

  const isNegativeROI = data.roi < 0
  const isLowMargin = data.margem > 0 && data.margem < 20
  const highReembolso = data.reembolsoPct > 10
  const highCAC = data.cac > data.lucroReal / data.unidades

  let alerts = []
  if (isNegativeROI) alerts.push("- ALERTA: ROI negativo! A operação está dando prejuízo.")
  if (isLowMargin) alerts.push("- ATENÇÃO: Margem baixa (< 20%). Pouca margem para erros ou escala.")
  if (highReembolso) alerts.push("- ATENÇÃO: Taxa de reembolso acima de 10%. Pode indicar problemas no produto ou na promessa de vendas.")
  if (highCAC) alerts.push("- ALERTA: CAC está maior que o lucro por unidade. Ajuste urgente necessário.")

  return `${basePrompt}

DADOS ATUAIS DO CÁLCULO DO USUÁRIO:

📊 FINANCEIRO:
- Preço do Produto: ${formatBRL(data.preco)}
- Unidades Vendidas: ${data.unidades}
- Faturamento Bruto: ${formatBRL(data.fat)}
- Total de Custos: ${formatBRL(data.totalCusto)}
- Lucro Líquido Total: ${formatBRL(data.lucroTotal)}
- Lucro Real (após coprodução): ${formatBRL(data.lucroReal)}
- Margem: ${formatPct(data.margem)}
- Margem Real: ${formatPct(data.margemReal)}

📈 MARKETING & ADS:
- ROAS: ${data.roas.toFixed(2)}x
- ROI: ${formatPct(data.roi)}
- CAC: ${formatBRL(data.cac)}
- LTV Estimado: ${formatBRL(data.ltv)}
- Break-even: ${data.breakeven} unidades
- CPC Médio: ${formatBRL(data.cpc)}
- Taxa de Conversão: ${formatPct(data.convPct)}

💰 CUSTOS:
- Taxa da Plataforma: ${formatPct(data.taxaPct)}
- Impostos: ${formatPct(data.impostoPct)}
- Parcelamento: ${formatPct(data.parcelPct)}
- Comissão Afiliados: ${formatPct(data.afiliadosPct)}
- Coprodução: ${formatPct(data.coproducaoPct)}
- Taxa de Reembolso: ${formatPct(data.reembolsoPct)}
- Investimento em Ads: ${formatBRL(data.ads)}
- Custos Fixos: ${formatBRL(data.fixos)}

${alerts.length > 0 ? `\n⚠️ ALERTAS IDENTIFICADOS:\n${alerts.join("\n")}` : ""}

Use esses dados para fornecer análises e recomendações específicas para este cenário.`
}
