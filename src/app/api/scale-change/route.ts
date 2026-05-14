import { NextRequest, NextResponse } from 'next/server'

interface ScaleParams {
  currentProduction: number
  targetProduction: number
  unitPrice: number
  currentCost: number
  expansionCost: number
  newEmployees: number
}

interface Scenario {
  name: string
  production: number
  roi: number
  breakevenMonths: number
  margin: number
}

export async function POST(request: NextRequest) {
  try {
    const params: ScaleParams = await request.json()

    const {
      currentProduction,
      targetProduction,
      unitPrice,
      currentCost,
      expansionCost,
      newEmployees,
    } = params

    // Validate inputs
    if (targetProduction <= currentProduction) {
      return NextResponse.json(
        { error: 'La production cible doit être supérieure à la production actuelle.' },
        { status: 400 }
      )
    }

    const additionalUnits = targetProduction - currentProduction
    const monthlySalary = 2200
    const totalMonthlySalary = newEmployees * monthlySalary
    const increasedMonthlyCost = currentCost + totalMonthlySalary
    const additionalRevenue = additionalUnits * unitPrice
    const netMonthlyBenefit = additionalRevenue - increasedMonthlyCost
    const annualBenefit = netMonthlyBenefit * 12
    const roi = expansionCost > 0 ? ((annualBenefit / expansionCost) * 100) : 0
    const breakevenMonths = netMonthlyBenefit > 0 ? Math.ceil(expansionCost / netMonthlyBenefit) : Infinity
    const margin = additionalRevenue > 0 ? ((netMonthlyBenefit / additionalRevenue) * 100) : 0

    // Generate 3 scenarios
    const scenarios: Scenario[] = [
      {
        name: 'Conservateur',
        production: Math.round(currentProduction + additionalUnits * 0.6),
        roi: +(roi * 0.6).toFixed(1),
        breakevenMonths: Math.ceil(breakevenMonths * 1.4),
        margin: +(margin * 0.5).toFixed(1),
      },
      {
        name: 'Base',
        production: targetProduction,
        roi: +roi.toFixed(1),
        breakevenMonths: breakevenMonths === Infinity ? -1 : breakevenMonths,
        margin: +margin.toFixed(1),
      },
      {
        name: 'Optimiste',
        production: Math.round(targetProduction * 1.3),
        roi: +(roi * 1.5).toFixed(1),
        breakevenMonths: Math.ceil(breakevenMonths * 0.7),
        margin: +(margin * 1.4).toFixed(1),
      },
    ]

    return NextResponse.json({
      analysis: {
        additionalUnits,
        additionalRevenue,
        expansionCost,
        annualBenefit,
        roi: +roi.toFixed(1),
        breakevenMonths: breakevenMonths === Infinity ? -1 : breakevenMonths,
        margin: +margin.toFixed(1),
        totalMonthlySalary,
        newEmployees,
      },
      scenarios,
      recommendation:
        roi > 30
          ? 'Le passage à l\'échelle est financièrement viable. ROI attractif.'
          : roi > 10
            ? 'Le projet est envisageable mais nécessite une optimisation des coûts.'
            : 'Risque financier élevé. Revoyez les coûts et la production cible.',
    })
  } catch (error) {
    console.error('Scale change simulation error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
