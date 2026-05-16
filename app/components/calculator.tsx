"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js"
import { Doughnut } from "react-chartjs-2"

ChartJS.register(ArcElement, Tooltip, Legend)

export interface CalculatorResult {
  preco: number
  unidades: number
  fat: number
  vTaxa: number
  vImp: number
  vParc: number
  vReemb: number
  vProd: number
  vAfiliados: number
  vCoprod: number
  ads: number
  fixos: number
  totalCusto: number
  lucroTotal: number
  lucroReal: number
  margem: number
  margemReal: number
  lucroUn: number
  lucroRealUn: number
  roas: number
  roi: number
  roiReal: number
  cac: number
  ltv: number
  ltvReal: number
  cpc: number
  cliques: number
  convPct: number
  vendasEst: number
  custoVenda: number
  breakeven: number
  taxaPct: number
  impostoPct: number
  impostoBase: string
  parcelPct: number
  afiliadosPct: number
  coproducaoPct: number
  reembolsoPct: number
}

interface CalculatorProps {
  onCalculate: (data: CalculatorResult | null) => void
}

// Helpers
function maskCurrency(value: string): string {
  let v = value.replace(/\D/g, "")
  if (!v) return ""
  const num = (parseInt(v) / 100).toFixed(2)
  return num.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

function parseCurrency(s: string): number {
  if (!s) return 0
  return parseFloat(String(s).replace(/\./g, "").replace(",", ".")) || 0
}

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtPct(v: number): string {
  return v.toFixed(1) + "%"
}

function fmtNum(v: number): string {
  return Math.round(v).toLocaleString("pt-BR")
}

function fmtX(v: number): string {
  return v.toFixed(2) + "x"
}

const STORAGE_KEY = "calc_v3_data"

export function Calculator({ onCalculate }: CalculatorProps) {
  // Form state
  const [preco, setPreco] = useState("")
  const [unidades, setUnidades] = useState("")
  const [taxaPlataforma, setTaxaPlataforma] = useState("")
  const [impostos, setImpostos] = useState("")
  const [impostoBase, setImpostoBase] = useState("bruto")
  const [taxaParcelamento, setTaxaParcelamento] = useState("")
  const [custoProduto, setCustoProduto] = useState("")
  const [comissaoAfiliados, setComissaoAfiliados] = useState("")
  const [coproducao, setCoproducao] = useState("")
  const [taxaReembolso, setTaxaReembolso] = useState("")
  const [investimentoAds, setInvestimentoAds] = useState("")
  const [cpc, setCpc] = useState("")
  const [taxaConversao, setTaxaConversao] = useState("")
  const [custosFixos, setCustosFixos] = useState("")
  const [metaLucro, setMetaLucro] = useState("")

  // Result state
  const [result, setResult] = useState<CalculatorResult | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null)

  // Simulation state
  const [simResult, setSimResult] = useState<{
    ads: number
    cliques: number
    vendas: number
    fat: number
  } | null>(null)

  const resultsRef = useRef<HTMLDivElement>(null)

  // Auto-save
  const autoSave = useCallback(() => {
    const data = {
      preco,
      unidades,
      taxaPlataforma,
      impostos,
      impostoBase,
      taxaParcelamento,
      custoProduto,
      comissaoAfiliados,
      coproducao,
      taxaReembolso,
      investimentoAds,
      cpc,
      taxaConversao,
      custosFixos,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      // ignore
    }
  }, [
    preco,
    unidades,
    taxaPlataforma,
    impostos,
    impostoBase,
    taxaParcelamento,
    custoProduto,
    comissaoAfiliados,
    coproducao,
    taxaReembolso,
    investimentoAds,
    cpc,
    taxaConversao,
    custosFixos,
  ])

  // Auto-load
  useEffect(() => {
    try {
      const r = localStorage.getItem(STORAGE_KEY)
      if (!r) return
      const d = JSON.parse(r)
      if (d.preco) setPreco(d.preco)
      if (d.unidades) setUnidades(d.unidades)
      if (d.taxaPlataforma) setTaxaPlataforma(d.taxaPlataforma)
      if (d.impostos) setImpostos(d.impostos)
      if (d.impostoBase) setImpostoBase(d.impostoBase)
      if (d.taxaParcelamento) setTaxaParcelamento(d.taxaParcelamento)
      if (d.custoProduto) setCustoProduto(d.custoProduto)
      if (d.comissaoAfiliados) setComissaoAfiliados(d.comissaoAfiliados)
      if (d.coproducao) setCoproducao(d.coproducao)
      if (d.taxaReembolso) setTaxaReembolso(d.taxaReembolso)
      if (d.investimentoAds) setInvestimentoAds(d.investimentoAds)
      if (d.cpc) setCpc(d.cpc)
      if (d.taxaConversao) setTaxaConversao(d.taxaConversao)
      if (d.custosFixos) setCustosFixos(d.custosFixos)
    } catch (e) {
      // ignore
    }
  }, [])

  // Compute result
  const compute = useCallback(() => {
    const precoVal = parseCurrency(preco)
    const unidadesVal = parseFloat(unidades) || 0
    const taxaPct = parseFloat(taxaPlataforma) || 0
    const impostoPct = parseFloat(impostos) || 0
    const parcelPct = parseFloat(taxaParcelamento) || 0
    const custoProd = parseCurrency(custoProduto)
    const afiliadosPct = parseFloat(comissaoAfiliados) || 0
    const coproducaoPct = parseFloat(coproducao) || 0
    const reembolsoPct = parseFloat(taxaReembolso) || 0
    const adsVal = parseCurrency(investimentoAds)
    const cpcVal = parseCurrency(cpc)
    const convPctVal = parseFloat(taxaConversao) || 0
    const fixosVal = parseCurrency(custosFixos)

    const fat = precoVal * unidadesVal
    const vTaxa = fat * (taxaPct / 100)
    const liquidoPlat = fat - vTaxa
    const vImp = impostoBase === "liquido" ? liquidoPlat * (impostoPct / 100) : fat * (impostoPct / 100)
    const vParc = fat * (parcelPct / 100)
    const vReemb = fat * (reembolsoPct / 100)
    const vProd = custoProd * unidadesVal
    const vAfiliados = fat * (afiliadosPct / 100)
    const totalCusto = vTaxa + vImp + vParc + vReemb + vProd + vAfiliados + adsVal + fixosVal
    const lucroTotal = fat - totalCusto
    const margem = fat > 0 ? (lucroTotal / fat) * 100 : 0
    const lucroUn = unidadesVal > 0 ? lucroTotal / unidadesVal : 0

    const lucroPos = lucroTotal > 0 ? lucroTotal : 0
    const vCoprod = lucroPos * (coproducaoPct / 100)
    const lucroReal = lucroPos - vCoprod
    const margemReal = fat > 0 ? (lucroReal / fat) * 100 : 0

    const roas = adsVal > 0 ? fat / adsVal : 0
    const roi = totalCusto > 0 ? (lucroTotal / totalCusto) * 100 : 0
    const roiReal = totalCusto > 0 ? (lucroReal / totalCusto) * 100 : 0
    const cac = unidadesVal > 0 ? adsVal / unidadesVal : 0
    const ltv = lucroUn > 0 ? lucroUn * 3 : 0

    const cliques = cpcVal > 0 && adsVal > 0 ? adsVal / cpcVal : 0
    const convRate = convPctVal / 100
    const vendasEst = cliques > 0 && convRate > 0 ? Math.floor(cliques * convRate) : unidadesVal
    const custoVenda = vendasEst > 0 ? adsVal / vendasEst : 0

    const custoVarUn = precoVal * ((taxaPct + impostoPct + parcelPct + reembolsoPct + afiliadosPct) / 100) + custoProd
    const contribUn = precoVal - custoVarUn
    const breakeven = contribUn > 0 ? Math.ceil((adsVal + fixosVal) / contribUn) : 0

    const lucroRealUn = unidadesVal > 0 ? lucroReal / unidadesVal : 0
    const ltvReal = lucroRealUn * 3

    return {
      preco: precoVal,
      unidades: unidadesVal,
      fat,
      vTaxa,
      vImp,
      vParc,
      vReemb,
      vProd,
      vAfiliados,
      vCoprod,
      ads: adsVal,
      fixos: fixosVal,
      totalCusto,
      lucroTotal,
      lucroReal,
      margem,
      margemReal,
      lucroUn,
      lucroRealUn,
      roas,
      roi,
      roiReal,
      cac,
      ltv,
      ltvReal,
      cpc: cpcVal,
      cliques,
      convPct: convPctVal,
      vendasEst,
      custoVenda,
      breakeven,
      taxaPct,
      impostoPct,
      impostoBase,
      parcelPct,
      afiliadosPct,
      coproducaoPct,
      reembolsoPct,
    }
  }, [
    preco,
    unidades,
    taxaPlataforma,
    impostos,
    impostoBase,
    taxaParcelamento,
    custoProduto,
    comissaoAfiliados,
    coproducao,
    taxaReembolso,
    investimentoAds,
    cpc,
    taxaConversao,
    custosFixos,
  ])

  // Auto calculate
  const calcAuto = useCallback(() => {
    const precoVal = parseCurrency(preco)
    const unidadesVal = parseFloat(unidades) || 0
    if (precoVal > 0 && unidadesVal > 0) {
      const res = compute()
      setResult(res)
      onCalculate(res)
      autoSave()
    }
  }, [preco, unidades, compute, onCalculate, autoSave])

  // Handle calculate button
  const handleCalculate = () => {
    const precoVal = parseCurrency(preco)
    const unidadesVal = parseFloat(unidades) || 0
    if (precoVal <= 0 || unidadesVal <= 0) {
      showToast("Preencha pelo menos Preco e Unidades!", "warn")
      return
    }
    const res = compute()
    setResult(res)
    onCalculate(res)
    setShowResults(true)
    autoSave()
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  // Handle clear
  const handleClear = () => {
    setPreco("")
    setUnidades("")
    setTaxaPlataforma("")
    setImpostos("")
    setImpostoBase("bruto")
    setTaxaParcelamento("")
    setCustoProduto("")
    setComissaoAfiliados("")
    setCoproducao("")
    setTaxaReembolso("")
    setInvestimentoAds("")
    setCpc("")
    setTaxaConversao("")
    setCustosFixos("")
    setMetaLucro("")
    setResult(null)
    setSimResult(null)
    onCalculate(null)
    localStorage.removeItem(STORAGE_KEY)
    showToast("Campos limpos!", "info")
  }

  // Handle restore
  const handleRestore = () => {
    try {
      const r = localStorage.getItem(STORAGE_KEY)
      if (!r) {
        showToast("Nenhum dado guardado encontrado", "warn")
        return
      }
      const d = JSON.parse(r)
      if (d.preco) setPreco(d.preco)
      if (d.unidades) setUnidades(d.unidades)
      if (d.taxaPlataforma) setTaxaPlataforma(d.taxaPlataforma)
      if (d.impostos) setImpostos(d.impostos)
      if (d.impostoBase) setImpostoBase(d.impostoBase)
      if (d.taxaParcelamento) setTaxaParcelamento(d.taxaParcelamento)
      if (d.custoProduto) setCustoProduto(d.custoProduto)
      if (d.comissaoAfiliados) setComissaoAfiliados(d.comissaoAfiliados)
      if (d.coproducao) setCoproducao(d.coproducao)
      if (d.taxaReembolso) setTaxaReembolso(d.taxaReembolso)
      if (d.investimentoAds) setInvestimentoAds(d.investimentoAds)
      if (d.cpc) setCpc(d.cpc)
      if (d.taxaConversao) setTaxaConversao(d.taxaConversao)
      if (d.custosFixos) setCustosFixos(d.custosFixos)
      showToast("Dados restaurados!", "success")
      setTimeout(() => calcAuto(), 100)
    } catch (e) {
      showToast("Erro ao restaurar dados", "danger")
    }
  }

  // Simulate scale
  const handleSimulate = () => {
    const meta = parseCurrency(metaLucro)
    if (meta <= 0) {
      showToast("Define uma meta de lucro valida!", "warn")
      return
    }
    const precoVal = parseCurrency(preco)
    if (precoVal <= 0) {
      showToast("Precisa definir o preco do produto!", "warn")
      return
    }

    const taxaPct = parseFloat(taxaPlataforma) || 0
    const impostoPct = parseFloat(impostos) || 0
    const parcelPct = parseFloat(taxaParcelamento) || 0
    const custoProd = parseCurrency(custoProduto)
    const afiliadosPct = parseFloat(comissaoAfiliados) || 0
    const reembolsoPct = parseFloat(taxaReembolso) || 0
    const convPctVal = parseFloat(taxaConversao) || 0
    const cpcVal = parseCurrency(cpc)
    const fixosVal = parseCurrency(custosFixos)

    const vVarPerUnit = precoVal * ((taxaPct + parcelPct + reembolsoPct + afiliadosPct) / 100) + custoProd
    const vImpPerUnit =
      impostoBase === "liquido"
        ? precoVal * (1 - taxaPct / 100) * (impostoPct / 100)
        : precoVal * (impostoPct / 100)

    const contribUnit = precoVal - vVarPerUnit - vImpPerUnit
    const adsPerUnit = convPctVal > 0 && cpcVal > 0 ? cpcVal / (convPctVal / 100) : 0
    const netPerUnit = contribUnit - adsPerUnit

    if (netPerUnit <= 0) {
      setSimResult({ ads: -1, cliques: 0, vendas: 0, fat: 0 })
      showToast("Margem por unidade negativa. Nao e possivel atingir essa meta!", "danger")
      return
    }

    const unidadesNecessarias = Math.ceil((meta + fixosVal) / netPerUnit)
    const investimentoNecessario = unidadesNecessarias * adsPerUnit
    const cliquesNecessarios = convPctVal > 0 ? Math.ceil(unidadesNecessarias / (convPctVal / 100)) : 0
    const fatNecessario = unidadesNecessarias * precoVal

    setSimResult({
      ads: investimentoNecessario,
      cliques: cliquesNecessarios,
      vendas: unidadesNecessarias,
      fat: fatNecessario,
    })
  }

  // Toast
  const showToast = (message: string, type: string) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3200)
  }

  // Chart data
  const chartData = result
    ? {
        labels: [
          result.lucroTotal > 0 ? "Lucro Liquido" : null,
          result.vImp > 0 ? "Impostos" : null,
          result.vTaxa > 0 ? "Taxa Plataforma" : null,
          result.vParc > 0 ? "Parcelamento" : null,
          result.vReemb > 0 ? "Reembolsos" : null,
          result.vAfiliados > 0 ? "Comissao Afiliados" : null,
          result.ads > 0 ? "Ads / Trafego" : null,
          result.fixos > 0 ? "Custos Fixos" : null,
          result.vProd > 0 ? "Custo Producao" : null,
          result.lucroTotal < 0 ? "Prejuizo" : null,
        ].filter(Boolean),
        datasets: [
          {
            data: [
              result.lucroTotal > 0 ? result.lucroTotal : null,
              result.vImp > 0 ? result.vImp : null,
              result.vTaxa > 0 ? result.vTaxa : null,
              result.vParc > 0 ? result.vParc : null,
              result.vReemb > 0 ? result.vReemb : null,
              result.vAfiliados > 0 ? result.vAfiliados : null,
              result.ads > 0 ? result.ads : null,
              result.fixos > 0 ? result.fixos : null,
              result.vProd > 0 ? result.vProd : null,
              result.lucroTotal < 0 ? Math.abs(result.lucroTotal) : null,
            ].filter((v) => v !== null),
            backgroundColor: [
              result.lucroTotal > 0 ? "rgba(0,184,148,0.7)" : null,
              result.vImp > 0 ? "rgba(232,67,147,0.6)" : null,
              result.vTaxa > 0 ? "rgba(253,203,110,0.65)" : null,
              result.vParc > 0 ? "rgba(162,155,254,0.6)" : null,
              result.vReemb > 0 ? "rgba(225,112,85,0.6)" : null,
              result.vAfiliados > 0 ? "rgba(116,185,255,0.6)" : null,
              result.ads > 0 ? "rgba(116,185,255,0.4)" : null,
              result.fixos > 0 ? "rgba(99,110,114,0.7)" : null,
              result.vProd > 0 ? "rgba(214,48,49,0.6)" : null,
              result.lucroTotal < 0 ? "rgba(232,67,147,0.4)" : null,
            ].filter(Boolean),
            borderWidth: 1.5,
            hoverOffset: 10,
          },
        ],
      }
    : null

  const hasSplit = result && (result.afiliadosPct > 0 || result.coproducaoPct > 0)

  return (
    <div className="relative z-[1] max-w-[1160px] mx-auto px-5 py-10 pb-24">
      {/* Header */}
      <header className="text-center mb-13">
        <div
          className="inline-flex items-center gap-[7px] px-[14px] py-[5px] rounded-full mb-[22px] text-[10.5px] font-semibold tracking-[0.13em] uppercase"
          style={{
            background: "rgba(108,92,231,0.13)",
            border: "1px solid rgba(108,92,231,0.28)",
            color: "var(--accent-light)",
          }}
        >
          <span
            className="w-[6px] h-[6px] rounded-full"
            style={{ background: "var(--accent-light)" }}
          />
          Calculadora Profissional · v3.0
        </div>
        <h1
          className="text-[clamp(30px,5.5vw,56px)] font-extrabold tracking-[-0.025em] leading-[1.08] mb-[14px]"
          style={{
            fontFamily: "var(--font-syne)",
            background: "linear-gradient(130deg,#fff 25%,var(--accent-light) 60%,var(--teal) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Calculadora de Lucro
          <br />
          para Infoprodutos
        </h1>
        <p className="text-[15px] font-light max-w-[520px] mx-auto leading-[1.65]" style={{ color: "var(--text2)" }}>
          Imposto flexivel, afiliados, coproducao, CPC, conversao, simulador de escala, CSV e persistencia automatica.
        </p>
      </header>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[22px] items-start">
        {/* Inputs Column */}
        <div className="flex flex-col gap-[18px]">
          {/* Produto */}
          <Card>
            <SectionLabel icon="📦">Produto</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[13px]">
              <Field label="Preco do Produto">
                <InputWithPrefix
                  prefix="R$"
                  value={preco}
                  onChange={(e) => {
                    setPreco(maskCurrency(e.target.value))
                    setTimeout(calcAuto, 0)
                  }}
                  placeholder="0,00"
                />
              </Field>
              <Field label="Unidades Vendidas">
                <Input
                  type="number"
                  value={unidades}
                  onChange={(e) => {
                    setUnidades(e.target.value)
                    setTimeout(calcAuto, 0)
                  }}
                  placeholder="0"
                  min="0"
                />
              </Field>
            </div>
          </Card>

          {/* Taxas & Impostos */}
          <Card>
            <SectionLabel icon="💳">Taxas & Impostos</SectionLabel>
            <Field label="Imposto calculado sobre">
              <Select
                value={impostoBase}
                onChange={(e) => {
                  setImpostoBase(e.target.value)
                  setTimeout(calcAuto, 0)
                }}
              >
                <option value="bruto">Faturamento Bruto</option>
                <option value="liquido">Liquido da Plataforma</option>
              </Select>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[13px] mt-4">
              <Field label="Taxa da Plataforma (%)" hint="Hotmart, Kiwify, Eduzz...">
                <InputWithSuffix
                  suffix="%"
                  type="number"
                  value={taxaPlataforma}
                  onChange={(e) => {
                    setTaxaPlataforma(e.target.value)
                    setTimeout(calcAuto, 0)
                  }}
                  placeholder="Ex: 9.9"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </Field>
              <Field label="Impostos (%)" hint="Simples, MEI, PJ...">
                <InputWithSuffix
                  suffix="%"
                  type="number"
                  value={impostos}
                  onChange={(e) => {
                    setImpostos(e.target.value)
                    setTimeout(calcAuto, 0)
                  }}
                  placeholder="Ex: 6"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </Field>
              <Field label="Parcelamento / Antecipacao (%)" hint="Taxa media de parcelamento">
                <InputWithSuffix
                  suffix="%"
                  type="number"
                  value={taxaParcelamento}
                  onChange={(e) => {
                    setTaxaParcelamento(e.target.value)
                    setTimeout(calcAuto, 0)
                  }}
                  placeholder="Ex: 2.5"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </Field>
              <Field label="Custo de Producao (R$)" hint="Por unidade vendida">
                <InputWithPrefix
                  prefix="R$"
                  value={custoProduto}
                  onChange={(e) => {
                    setCustoProduto(maskCurrency(e.target.value))
                    setTimeout(calcAuto, 0)
                  }}
                  placeholder="0,00"
                />
              </Field>
            </div>
          </Card>

          {/* Divisao de Lucros */}
          <Card>
            <SectionLabel icon="🤝">Divisao de Lucros</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[13px]">
              <Field label="Comissao de Afiliados (%)" hint="% sobre o preco pago ao afiliado">
                <InputWithSuffix
                  suffix="%"
                  type="number"
                  value={comissaoAfiliados}
                  onChange={(e) => {
                    setComissaoAfiliados(e.target.value)
                    setTimeout(calcAuto, 0)
                  }}
                  placeholder="Ex: 50"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </Field>
              <Field label="Comissao de Coproducao (%)" hint="% do lucro liquido para coprodutor">
                <InputWithSuffix
                  suffix="%"
                  type="number"
                  value={coproducao}
                  onChange={(e) => {
                    setCoproducao(e.target.value)
                    setTimeout(calcAuto, 0)
                  }}
                  placeholder="Ex: 20"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </Field>
            </div>
          </Card>

          {/* Marketing, Reembolso & Custos Fixos */}
          <Card>
            <SectionLabel icon="📣">Marketing, Reembolso & Custos Fixos</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[13px]">
              <Field label="Taxa de Reembolso (%)" hint="% devolvido - impacta o lucro">
                <InputWithSuffix
                  suffix="%"
                  type="number"
                  value={taxaReembolso}
                  onChange={(e) => {
                    setTaxaReembolso(e.target.value)
                    setTimeout(calcAuto, 0)
                  }}
                  placeholder="Ex: 5"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </Field>
              <Field label="Investimento em Trafego (Ads)">
                <InputWithPrefix
                  prefix="R$"
                  value={investimentoAds}
                  onChange={(e) => {
                    setInvestimentoAds(maskCurrency(e.target.value))
                    setTimeout(calcAuto, 0)
                  }}
                  placeholder="0,00"
                />
              </Field>
              <Field label="CPC Medio (R$)" hint="Custo por clique nos Ads">
                <InputWithPrefix
                  prefix="R$"
                  value={cpc}
                  onChange={(e) => {
                    setCpc(maskCurrency(e.target.value))
                    setTimeout(calcAuto, 0)
                  }}
                  placeholder="0,00"
                />
              </Field>
              <Field label="Taxa de Conversao (%)" hint="Cliques → Vendas">
                <InputWithSuffix
                  suffix="%"
                  type="number"
                  value={taxaConversao}
                  onChange={(e) => {
                    setTaxaConversao(e.target.value)
                    setTimeout(calcAuto, 0)
                  }}
                  placeholder="Ex: 2"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </Field>
              <Field label="Custos Fixos Mensais" hint="Ferramentas, equipe...">
                <InputWithPrefix
                  prefix="R$"
                  value={custosFixos}
                  onChange={(e) => {
                    setCustosFixos(maskCurrency(e.target.value))
                    setTimeout(calcAuto, 0)
                  }}
                  placeholder="0,00"
                />
              </Field>
            </div>
          </Card>

          {/* Simulador de Escala */}
          <Card className="!p-[18px_22px]">
            <div
              className="p-4 rounded-lg"
              style={{
                background: "rgba(0,206,201,0.04)",
                border: "1px dashed rgba(0,206,201,0.2)",
              }}
            >
              <div
                className="flex items-center gap-2 text-[13px] font-bold mb-3"
                style={{ fontFamily: "var(--font-syne)", color: "var(--teal)" }}
              >
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                Simulador de Escala
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[13px] mb-2">
                <Field label="Meta de Lucro (R$)">
                  <InputWithPrefix
                    prefix="R$"
                    value={metaLucro}
                    onChange={(e) => setMetaLucro(maskCurrency(e.target.value))}
                    placeholder="10.000,00"
                  />
                </Field>
                <div className="flex items-end">
                  <Button variant="teal" className="w-full" onClick={handleSimulate}>
                    Simular Escala →
                  </Button>
                </div>
              </div>
              {simResult && (
                <div
                  className="p-[13px] mt-3 rounded-lg text-[13px] leading-[1.8]"
                  style={{ background: "rgba(0,0,0,0.25)" }}
                >
                  <div>
                    <span className="text-[11px]" style={{ color: "var(--text3)" }}>
                      Investimento em Ads necessario:{" "}
                    </span>
                    <span
                      className="text-[16px] font-bold"
                      style={{ fontFamily: "var(--font-syne)", color: "var(--teal)" }}
                    >
                      {simResult.ads < 0 ? "Nao viavel" : fmtBRL(simResult.ads)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px]" style={{ color: "var(--text3)" }}>
                      Cliques estimados:{" "}
                    </span>
                    <span
                      className="text-[16px] font-bold"
                      style={{ fontFamily: "var(--font-syne)", color: "var(--teal)" }}
                    >
                      {simResult.ads < 0 ? "—" : fmtNum(simResult.cliques)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px]" style={{ color: "var(--text3)" }}>
                      Vendas estimadas:{" "}
                    </span>
                    <span
                      className="text-[16px] font-bold"
                      style={{ fontFamily: "var(--font-syne)", color: "var(--teal)" }}
                    >
                      {simResult.ads < 0 ? "—" : fmtNum(simResult.vendas) + " unidades"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px]" style={{ color: "var(--text3)" }}>
                      Faturamento bruto:{" "}
                    </span>
                    <span
                      className="text-[16px] font-bold"
                      style={{ fontFamily: "var(--font-syne)", color: "var(--teal)" }}
                    >
                      {simResult.ads < 0 ? "—" : fmtBRL(simResult.fat)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-[10px]">
            <Button variant="primary" className="w-full text-[15px] py-[14px]" onClick={handleCalculate}>
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Calcular Lucro
            </Button>
            <div className="grid grid-cols-2 gap-[10px]">
              <Button variant="ghost" onClick={handleClear}>
                Limpar Campos
              </Button>
              <Button variant="ghost" onClick={handleRestore}>
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Restaurar Dados
              </Button>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="flex flex-col gap-[18px]" ref={resultsRef}>
          {/* Alerts */}
          {result && result.roi < 0 && (
            <Alert variant="danger">
              <strong>Operacao em Risco</strong>
              <br />O ROI esta em {fmtPct(result.roi)}. Voce esta gastando mais do que arrecada. Reveja custos, preco ou
              estrategia de trafego.
            </Alert>
          )}
          {result && result.reembolsoPct > 10 && (
            <Alert variant="warn">
              <strong>Atencao</strong>
              <br />
              Taxa de reembolso de {fmtPct(result.reembolsoPct)} esta acima de 10%. Isso pode sinalizar insatisfacao ou
              problema na pagina de vendas.
            </Alert>
          )}
          {result && result.margem > 0 && result.margem < 20 && result.reembolsoPct <= 10 && (
            <Alert variant="warn">
              <strong>Atencao</strong>
              <br />
              Margem de {fmtPct(result.margem)} — abaixo de 20%. Pouca margem para erros ou escalas em Ads.
            </Alert>
          )}

          {/* KPIs */}
          <Card variant="accent">
            <div className="grid grid-cols-2 gap-[11px]">
              <KPI
                variant={result && result.lucroTotal >= 0 ? "green" : "red"}
                hero
                label="Lucro Liquido"
                value={result ? fmtBRL(hasSplit ? result.lucroReal : result.lucroTotal) : "—"}
                sub={
                  result
                    ? `Margem${hasSplit ? " real" : ""}: ${fmtPct(hasSplit ? result.margemReal : result.margem)}${
                        result.lucroTotal >= 0 ? " ✓" : " ⚠"
                      }`
                    : "Preencha os dados ao lado"
                }
              />
              <KPI label="Faturamento Bruto" value={result ? fmtBRL(result.fat) : "—"} />
              <KPI label="Total de Custos" value={result ? fmtBRL(result.totalCusto) : "—"} />
              <KPI variant="amber" label="Lucro por Unidade" value={result ? fmtBRL(result.lucroUn) : "—"} />
              <KPI
                variant="blue"
                label="Break-even"
                value={result && result.breakeven > 0 ? fmtNum(result.breakeven) : "—"}
                sub="unidades p/ empatar"
              />
            </div>

            {/* Dual Profit */}
            {result && hasSplit && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div
                  className="p-[14px] rounded-lg text-center"
                  style={{
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    className="text-[9.5px] font-bold tracking-[0.1em] uppercase mb-[6px]"
                    style={{ color: "var(--text3)" }}
                  >
                    Lucro Liquido Total
                  </div>
                  <div
                    className="text-[24px] font-extrabold"
                    style={{
                      fontFamily: "var(--font-syne)",
                      color: result.lucroTotal >= 0 ? "var(--green-bright)" : "var(--red)",
                    }}
                  >
                    {fmtBRL(result.lucroTotal)}
                  </div>
                  <div className="text-[10.5px] mt-[3px]" style={{ color: "var(--text3)" }}>
                    Antes da divisao
                  </div>
                </div>
                <div
                  className="p-[14px] rounded-lg text-center"
                  style={{
                    background: "rgba(108,92,231,0.1)",
                    border: "1px solid rgba(108,92,231,0.3)",
                  }}
                >
                  <div
                    className="text-[9.5px] font-bold tracking-[0.1em] uppercase mb-[6px]"
                    style={{ color: "var(--text3)" }}
                  >
                    Teu Lucro Real
                  </div>
                  <div
                    className="text-[28px] font-extrabold"
                    style={{ fontFamily: "var(--font-syne)", color: "var(--accent-light)" }}
                  >
                    {fmtBRL(result.lucroReal)}
                  </div>
                  <div className="text-[10.5px] mt-[3px]" style={{ color: "var(--text3)" }}>
                    Apos {fmtPct(result.coproducaoPct)} coproducao
                  </div>
                </div>
              </div>
            )}

            {/* Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-[11.5px] mb-[6px]" style={{ color: "var(--text3)" }}>
                <span>Distribuicao do Faturamento</span>
                <span>
                  {result && result.fat > 0
                    ? fmtPct(Math.max(0, Math.min(100, (result.lucroTotal / result.fat) * 100)))
                    : "—"}{" "}
                  lucro
                </span>
              </div>
              <div
                className="h-[7px] rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-600"
                  style={{
                    width:
                      result && result.fat > 0
                        ? `${Math.max(0, Math.min(100, (result.lucroTotal / result.fat) * 100))}%`
                        : "0%",
                    background: "linear-gradient(90deg,var(--accent),var(--teal))",
                  }}
                />
              </div>
              <div className="flex gap-4 mt-2 flex-wrap">
                <div className="flex items-center gap-[5px] text-[11px]" style={{ color: "var(--text3)" }}>
                  <div
                    className="w-[9px] h-[9px] rounded-full"
                    style={{ background: "linear-gradient(90deg,var(--accent),var(--teal))" }}
                  />
                  Lucro
                </div>
                <div className="flex items-center gap-[5px] text-[11px]" style={{ color: "var(--text3)" }}>
                  <div className="w-[9px] h-[9px] rounded-full" style={{ background: "var(--red)" }} />
                  Custos
                </div>
              </div>
            </div>
          </Card>

          {/* Marketing Metrics */}
          <Card>
            <SectionLabel icon="📊">Metricas de Marketing & Ads</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[10px]">
              <MetricPill variant="teal" label="ROAS" value={result && result.ads > 0 ? fmtX(result.roas) : "N/A"} />
              <MetricPill
                variant="green"
                label="ROI"
                value={result ? fmtPct(hasSplit ? result.roiReal : result.roi) : "—"}
              />
              <MetricPill
                variant="amber"
                label="CAC"
                value={result && result.unidades > 0 && result.ads > 0 ? fmtBRL(result.cac) : "N/A"}
              />
              <MetricPill
                label="LTV Estimado"
                value={
                  result
                    ? hasSplit && result.ltvReal > 0
                      ? fmtBRL(result.ltvReal)
                      : result.ltv > 0
                        ? fmtBRL(result.ltv)
                        : "—"
                    : "—"
                }
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[10px] mt-[10px]">
              <MetricPill label="CPC Medio" value={result && result.cpc > 0 ? fmtBRL(result.cpc) : "—"} />
              <MetricPill
                variant="teal"
                label="Cliques Est."
                value={result && result.cliques > 0 ? fmtNum(result.cliques) : "—"}
              />
              <MetricPill
                variant="green"
                label="Conv. Est."
                value={result && result.convPct > 0 ? fmtPct(result.convPct) : "—"}
              />
              <MetricPill
                variant="amber"
                label="Custo/Venda"
                value={result && result.custoVenda > 0 ? fmtBRL(result.custoVenda) : "—"}
              />
            </div>
            <div
              className="mt-[14px] p-[10px_12px] rounded-lg text-[11.5px] leading-[1.65]"
              style={{
                background: "rgba(0,0,0,0.2)",
                color: "var(--text3)",
              }}
            >
              <strong style={{ color: "var(--text2)" }}>ROAS</strong> = Fat. ÷ Ads ·{" "}
              <strong style={{ color: "var(--text2)" }}>ROI</strong> = (Lucro ÷ Custos) × 100 ·{" "}
              <strong style={{ color: "var(--text2)" }}>CAC</strong> = Ads ÷ Unid. ·{" "}
              <strong style={{ color: "var(--text2)" }}>CPC</strong> = Custo/Clique ·{" "}
              <strong style={{ color: "var(--text2)" }}>Conv.</strong> = Cliques → Vendas
            </div>
          </Card>

          {/* Breakdown */}
          <Card>
            <SectionLabel icon="🧾">Detalhamento Financeiro</SectionLabel>
            <table className="w-full border-collapse">
              <tbody>
                <BreakdownRow
                  label="Faturamento Bruto"
                  value={result ? "+ " + fmtBRL(result.fat) : "—"}
                  color="var(--green-bright)"
                />
                <BreakdownRow
                  label="Taxa da Plataforma"
                  value={result ? "- " + fmtBRL(result.vTaxa) : "—"}
                  color="var(--red)"
                />
                <BreakdownRow
                  label={`Impostos${result?.impostoBase === "liquido" ? " (sobre liquido)" : ""} (${result?.impostoPct || 0}%)`}
                  value={result ? "- " + fmtBRL(result.vImp) : "—"}
                  color="var(--red)"
                />
                <BreakdownRow
                  label="Parcelamento"
                  value={result ? "- " + fmtBRL(result.vParc) : "—"}
                  color="var(--red)"
                />
                <BreakdownRow
                  label="Reembolsos"
                  value={result ? "- " + fmtBRL(result.vReemb) : "—"}
                  color="var(--red)"
                />
                <BreakdownRow
                  label="Custo de Producao"
                  value={result ? "- " + fmtBRL(result.vProd) : "—"}
                  color="var(--red)"
                />
                <BreakdownRow
                  label="Comissao Afiliados"
                  value={result && result.afiliadosPct > 0 ? "- " + fmtBRL(result.vAfiliados) : "—"}
                  color="var(--red)"
                />
                <BreakdownRow
                  label="Investimento em Ads"
                  value={result ? "- " + fmtBRL(result.ads) : "—"}
                  color="var(--red)"
                />
                <BreakdownRow
                  label="Custos Fixos"
                  value={result ? "- " + fmtBRL(result.fixos) : "—"}
                  color="var(--red)"
                />
                <tr>
                  <td
                    colSpan={2}
                    className="pt-2 text-[10.5px] font-bold tracking-[0.08em] uppercase"
                    style={{ color: "var(--accent-light)" }}
                  >
                    ── Divisao de Lucros ──
                  </td>
                </tr>
                <BreakdownRow
                  label="Lucro Liquido Total"
                  value={result ? fmtBRL(result.lucroTotal) : "—"}
                  color={result && result.lucroTotal >= 0 ? "var(--accent-light)" : "var(--red)"}
                />
                <BreakdownRow
                  label="- Coproducao"
                  value={result && result.coproducaoPct > 0 ? "- " + fmtBRL(result.vCoprod) : "—"}
                  color="var(--orange)"
                  labelColor="var(--orange)"
                />
                <tr style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <td className="pt-[14px] text-[14px] font-semibold" style={{ color: "var(--text)" }}>
                    Teu Lucro Real
                  </td>
                  <td
                    className="pt-[14px] text-right text-[16px] font-semibold"
                    style={{
                      color:
                        result && (hasSplit ? result.lucroReal : result.lucroTotal) >= 0
                          ? "var(--green-bright)"
                          : "var(--red)",
                    }}
                  >
                    {result ? fmtBRL(result.lucroReal) : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* Chart */}
          <Card>
            <SectionLabel icon="🥧">Composicao do Faturamento</SectionLabel>
            <div className="relative h-[240px] mt-2">
              {chartData && chartData.labels.length > 0 ? (
                <Doughnut
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "62%",
                    plugins: {
                      legend: {
                        position: "right" as const,
                        labels: {
                          color: "rgba(238,238,248,0.65)",
                          font: { family: "DM Sans", size: 11 },
                          padding: 14,
                          boxWidth: 11,
                        },
                      },
                      tooltip: {
                        backgroundColor: "rgba(8,8,18,0.9)",
                        titleColor: "#eeeef8",
                        bodyColor: "rgba(238,238,248,0.7)",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderWidth: 1,
                        padding: 10,
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-[13px]" style={{ color: "var(--text3)" }}>
                  Calcule para ver o grafico
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-7 left-1/2 -translate-x-1/2 py-[11px] px-[22px] rounded-full text-[13.5px] font-medium z-[9999] backdrop-blur-[20px] whitespace-nowrap transition-transform ${
            toast ? "translate-y-0" : "translate-y-20"
          }`}
          style={{
            background:
              toast.type === "success"
                ? "rgba(0,184,148,0.18)"
                : toast.type === "info"
                  ? "rgba(108,92,231,0.18)"
                  : toast.type === "warn"
                    ? "rgba(253,203,110,0.18)"
                    : "rgba(232,67,147,0.18)",
            border: `1px solid ${
              toast.type === "success"
                ? "rgba(0,184,148,0.4)"
                : toast.type === "info"
                  ? "rgba(108,92,231,0.4)"
                  : toast.type === "warn"
                    ? "rgba(253,203,110,0.4)"
                    : "rgba(232,67,147,0.4)"
            }`,
            color:
              toast.type === "success"
                ? "var(--green-bright)"
                : toast.type === "info"
                  ? "var(--accent-light)"
                  : toast.type === "warn"
                    ? "var(--amber)"
                    : "var(--red)",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Footer */}
      <footer className="text-center pt-6 pb-10 mt-10">
        <p className="text-[11.5px]" style={{ color: "var(--text3)" }}>
          © 2026 Calculadora de Lucro para Infoprodutos · v3.0 Profissional · Todos os direitos reservados.
        </p>
      </footer>
    </div>
  )
}

// --- UI Components ---

function Card({
  children,
  className = "",
  variant,
}: {
  children: React.ReactNode
  className?: string
  variant?: "accent"
}) {
  return (
    <div
      className={`p-[24px_26px] rounded-[20px] backdrop-blur-[24px] transition-[border-color] duration-300 hover:border-[var(--glass-border-hover)] ${className}`}
      style={{
        background:
          variant === "accent"
            ? "linear-gradient(135deg,rgba(108,92,231,0.09) 0%,rgba(0,206,201,0.05) 100%)"
            : "var(--glass)",
        border: `1px solid ${variant === "accent" ? "rgba(108,92,231,0.2)" : "var(--glass-border)"}`,
      }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children, icon }: { children: React.ReactNode; icon: string }) {
  return (
    <div
      className="flex items-center gap-[9px] text-[11px] font-semibold tracking-[0.11em] uppercase mb-5"
      style={{ fontFamily: "var(--font-syne)", color: "var(--text3)" }}
    >
      <span
        className="w-5 h-5 rounded-md flex items-center justify-center text-[10px]"
        style={{ background: "var(--glass-md)" }}
      >
        {icon}
      </span>
      {children}
    </div>
  )
}

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="mb-[15px] last:mb-0">
      <label className="block text-[12px] font-medium mb-[7px] tracking-[0.02em]" style={{ color: "var(--text2)" }}>
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] mt-1" style={{ color: "var(--text3)" }}>
          {hint}
        </p>
      )}
    </div>
  )
}

function Input({
  type = "text",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className="w-full py-[11px] px-[13px] rounded-[9px] text-[15px] font-medium outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)]"
      style={{
        background: "rgba(0,0,0,0.28)",
        border: "1px solid var(--border-md)",
        color: "var(--text)",
        fontFamily: "var(--font-dm-sans)",
      }}
      {...props}
    />
  )
}

function InputWithPrefix({
  prefix,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { prefix: string }) {
  return (
    <div className="relative flex items-center">
      <span
        className="absolute left-[13px] text-[13px] font-medium pointer-events-none z-[1]"
        style={{ color: "var(--text3)" }}
      >
        {prefix}
      </span>
      <input
        type="text"
        className="w-full py-[11px] pr-[13px] pl-[34px] rounded-[9px] text-[15px] font-medium outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)]"
        style={{
          background: "rgba(0,0,0,0.28)",
          border: "1px solid var(--border-md)",
          color: "var(--text)",
          fontFamily: "var(--font-dm-sans)",
        }}
        {...props}
      />
    </div>
  )
}

function InputWithSuffix({
  suffix,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { suffix: string }) {
  return (
    <div className="relative flex items-center">
      <input
        type="text"
        className="w-full py-[11px] pl-[13px] pr-[34px] rounded-[9px] text-[15px] font-medium outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)]"
        style={{
          background: "rgba(0,0,0,0.28)",
          border: "1px solid var(--border-md)",
          color: "var(--text)",
          fontFamily: "var(--font-dm-sans)",
        }}
        {...props}
      />
      <span
        className="absolute right-[13px] text-[13px] font-medium pointer-events-none z-[1]"
        style={{ color: "var(--text3)" }}
      >
        {suffix}
      </span>
    </div>
  )
}

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="w-full py-[11px] px-[13px] rounded-[9px] text-[15px] font-medium cursor-pointer outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] appearance-none"
      style={{
        background: "rgba(0,0,0,0.28)",
        border: "1px solid var(--border-md)",
        color: "var(--text)",
        fontFamily: "var(--font-dm-sans)",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='rgba(238,238,248,0.4)' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 13px center",
      }}
      {...props}
    >
      {children}
    </select>
  )
}

function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "teal" | "danger" | "amber"
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: "var(--accent)",
      borderColor: "var(--accent)",
      color: "#fff",
      boxShadow: "0 4px 20px rgba(108,92,231,0.35)",
    },
    ghost: {
      background: "transparent",
      borderColor: "var(--border-md)",
      color: "var(--text2)",
    },
    teal: {
      background: "var(--teal-dim)",
      borderColor: "rgba(0,206,201,0.3)",
      color: "var(--teal)",
    },
    danger: {
      background: "var(--red-dim)",
      borderColor: "rgba(232,67,147,0.3)",
      color: "var(--red)",
    },
    amber: {
      background: "var(--amber-dim)",
      borderColor: "rgba(253,203,110,0.3)",
      color: "var(--amber)",
    },
  }

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 py-3 px-5 rounded-[9px] cursor-pointer text-[13.5px] font-medium border outline-none transition-all hover:translate-y-[-1px] ${className}`}
      style={styles[variant]}
      {...props}
    >
      {children}
    </button>
  )
}

function KPI({
  label,
  value,
  sub,
  variant,
  hero,
}: {
  label: string
  value: string
  sub?: string
  variant?: "green" | "red" | "amber" | "teal" | "blue" | "accent" | "orange"
  hero?: boolean
}) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    green: { bg: "var(--green-dim)", border: "rgba(0,184,148,0.3)", text: "var(--green-bright)" },
    red: { bg: "var(--red-dim)", border: "rgba(232,67,147,0.3)", text: "var(--red)" },
    amber: { bg: "var(--amber-dim)", border: "rgba(253,203,110,0.3)", text: "var(--amber)" },
    teal: { bg: "var(--teal-dim)", border: "rgba(0,206,201,0.3)", text: "var(--teal)" },
    blue: { bg: "var(--blue-dim)", border: "rgba(116,185,255,0.3)", text: "var(--blue)" },
    accent: { bg: "rgba(108,92,231,0.1)", border: "rgba(108,92,231,0.28)", text: "var(--accent-light)" },
    orange: { bg: "var(--orange-dim)", border: "rgba(225,112,85,0.3)", text: "var(--orange)" },
  }

  const style = variant ? colors[variant] : null

  return (
    <div
      className={`p-[15px_14px] rounded-[9px] ${hero ? "col-span-2 text-center p-[22px]" : ""}`}
      style={{
        background: style?.bg || "rgba(0,0,0,0.25)",
        border: `1px solid ${style?.border || "var(--border)"}`,
      }}
    >
      <div
        className={`text-[10.5px] font-semibold tracking-[0.09em] uppercase mb-[6px] ${hero ? "text-[12px] mb-[8px]" : ""}`}
        style={{ color: "var(--text3)" }}
      >
        {label}
      </div>
      <div
        className={`font-bold leading-[1.1] ${hero ? "text-[38px]" : "text-[21px]"}`}
        style={{ fontFamily: "var(--font-syne)", color: style?.text || "var(--text)" }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[11px] mt-[3px]" style={{ color: "var(--text3)" }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function MetricPill({
  label,
  value,
  variant,
}: {
  label: string
  value: string
  variant?: "teal" | "green" | "amber"
}) {
  const colors: Record<string, string> = {
    teal: "var(--teal)",
    green: "var(--green-bright)",
    amber: "var(--amber)",
  }

  return (
    <div
      className="p-[13px_11px] rounded-[9px] text-center transition-all duration-300 hover:border-[var(--border-md)] hover:-translate-y-0.5"
      style={{
        background: "rgba(0,0,0,0.25)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-[5px]" style={{ color: "var(--text3)" }}>
        {label}
      </div>
      <div
        className="text-[17px] font-bold"
        style={{ fontFamily: "var(--font-syne)", color: variant ? colors[variant] : "var(--accent-light)" }}
      >
        {value}
      </div>
    </div>
  )
}

function BreakdownRow({
  label,
  value,
  color,
  labelColor,
}: {
  label: string
  value: string
  color: string
  labelColor?: string
}) {
  return (
    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <td className="py-[10px] px-[2px] text-[13.5px]" style={{ color: labelColor || "var(--text2)" }}>
        {label}
      </td>
      <td className="py-[10px] px-[2px] text-[13.5px] text-right font-semibold" style={{ color }}>
        {value}
      </td>
    </tr>
  )
}

function Alert({
  children,
  variant,
}: {
  children: React.ReactNode
  variant: "danger" | "warn" | "info"
}) {
  const styles: Record<string, { bg: string; border: string; color: string }> = {
    danger: { bg: "var(--red-dim)", border: "rgba(232,67,147,0.35)", color: "var(--red)" },
    warn: { bg: "var(--amber-dim)", border: "rgba(253,203,110,0.35)", color: "var(--amber)" },
    info: { bg: "rgba(108,92,231,0.1)", border: "rgba(108,92,231,0.3)", color: "var(--accent-light)" },
  }

  const style = styles[variant]

  return (
    <div
      className="flex items-start gap-[10px] p-[14px_16px] rounded-[9px] text-[13px] leading-[1.5]"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
      }}
    >
      <svg
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        className="flex-shrink-0 mt-[1px]"
      >
        {variant === "danger" ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        )}
      </svg>
      <div>{children}</div>
    </div>
  )
}
