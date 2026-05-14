import { NextRequest, NextResponse } from 'next/server'

interface FinancingRequest {
  financingNeed: number
  selectedSources: string[]
  selectedAmounts?: Record<string, number>
  loanParams?: {
    amount: number
    annualRate: number
    durationMonths: number
  }
}

interface AmortizationRow {
  month: number
  monthlyPayment: number
  principal: number
  interest: number
  remainingCapital: number
}

// In-memory store for financing plans keyed by userId
const financingStore: Record<string, {
  totalNeed: number
  selectedSources: Record<string, number>
  planItems: Array<{ label: string; amount: number; status: string }>
}> = {}

function generateAmortization(amount: number, annualRate: number, durationMonths: number): AmortizationRow[] {
  const monthlyRate = annualRate / 100 / 12
  const monthlyPayment =
    monthlyRate > 0
      ? (amount * monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) /
        (Math.pow(1 + monthlyRate, durationMonths) - 1)
      : amount / durationMonths

  const rows: AmortizationRow[] = []
  let remaining = amount

  for (let m = 1; m <= durationMonths; m++) {
    const interestPart = remaining * monthlyRate
    const principalPart = monthlyPayment - interestPart
    remaining = Math.max(0, remaining - principalPart)
    rows.push({
      month: m,
      monthlyPayment: +monthlyPayment.toFixed(2),
      principal: +principalPart.toFixed(2),
      interest: +interestPart.toFixed(2),
      remainingCapital: +remaining.toFixed(2),
    })
    if (durationMonths > 24 && m < durationMonths && m % 12 !== 0) {
      rows.pop()
    }
  }
  return rows
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const plan = financingStore[userId] || null
    return NextResponse.json({ userId, plan })
  } catch (error) {
    console.error('Fetch financing error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: FinancingRequest = await request.json()

    const { financingNeed, selectedSources, selectedAmounts, loanParams } = body

    // Coverage estimation per source
    const sourceRates: Record<string, number> = {
      banque: 0.45,
      investisseur: 0.25,
      subvention: 0.15,
      autofinancement: 0.15,
    }

    const effectiveSources = selectedAmounts
      ? selectedSources.filter((s) => (selectedAmounts[s] || 0) > 0)
      : selectedSources

    const totalCoverage = selectedAmounts
      ? Object.values(selectedAmounts).reduce((sum, a) => sum + a, 0)
      : effectiveSources.reduce(
          (sum, source) => sum + financingNeed * (sourceRates[source] || 0),
          0
        )
    const coveragePercent = financingNeed > 0 ? +((totalCoverage / financingNeed) * 100).toFixed(1) : 0
    const gap = Math.max(0, financingNeed - totalCoverage)

    // Loan simulation
    let amortization: AmortizationRow[] = []
    let monthlyPayment = 0
    let totalCost = 0

    if (loanParams) {
      amortization = generateAmortization(loanParams.amount, loanParams.annualRate, loanParams.durationMonths)
      monthlyPayment = amortization[0]?.monthlyPayment ?? 0
      totalCost = amortization.reduce((s, r) => s + r.interest, 0)
    }

    return NextResponse.json({
      financingNeed,
      coverage: {
        totalCoverage: +totalCoverage.toFixed(0),
        coveragePercent,
        gap: +gap.toFixed(0),
        sources: selectedAmounts
          ? Object.entries(selectedAmounts).filter(([, a]) => a > 0).map(([name, amount]) => ({
              name,
              amount: +amount.toFixed(0),
              percent: financingNeed > 0 ? +((amount / financingNeed) * 100).toFixed(0) : 0,
            }))
          : effectiveSources.map((s) => ({
              name: s,
              amount: +(financingNeed * (sourceRates[s] || 0)).toFixed(0),
              percent: +((sourceRates[s] || 0) * 100).toFixed(0),
            })),
      },
      loan: loanParams
        ? {
            amount: loanParams.amount,
            annualRate: loanParams.annualRate,
            durationMonths: loanParams.durationMonths,
            monthlyPayment,
            totalInterest: +totalCost.toFixed(2),
          }
        : null,
      amortization,
      advice:
        coveragePercent < 60
          ? 'Couverture insuffisante. Envisagez d\'élargir vos sources de financement.'
          : coveragePercent < 85
            ? 'Couverture correcte. Complétez par un apport personnel ou des subventions.'
            : 'Excellent plan de financement. Vos sources couvrent la quasi-totalité du besoin.',
    })
  } catch (error) {
    console.error('Financing calculation error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
