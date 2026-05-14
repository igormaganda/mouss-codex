import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

interface RegimeConfig {
  id: string
  name: string
  cotisationsSociales: number  // % of revenue/benefit
  impotSurRevenu: number       // % marginal rate
  tva: { taux: number; seuil: number; obligatoire: boolean }
  plafondCA?: number           // annual revenue cap
  chargesDeductibles: number   // % of revenue deductible as expenses
  protectionPatrimoine: boolean
  capitalMinimum: number
  nbAssociésMax: number
  avantages: string[]
  inconvenients: string[]
}

const REGIMES: Record<string, RegimeConfig> = {
  'auto-entrepreneur': {
    id: 'auto-entrepreneur',
    name: 'Auto-entrepreneur',
    cotisationsSociales: 21.2,  // ~21.2% for services
    impotSurRevenu: 0,          // optional flat tax (versement libératoire)
    tva: { taux: 20, seuil: 47700, obligatoire: false },
    plafondCA: 77700,           // 2024 services limit
    chargesDeductibles: 0,      // no deduction, taxed on revenue
    protectionPatrimoine: false,
    capitalMinimum: 0,
    nbAssociésMax: 1,
    avantages: ['Simple et rapide à créer', 'Charges sociales réduites (~21%)', 'Comptabilité ultra-simplifiée', 'Pas de capital minimum', 'Option versement libératoire IR'],
    inconvenients: ['Plafond de CA annuel', 'Pas de déduction des charges réelles', 'Pas de protection du patrimoine', 'Crédit bancaire difficile', 'Statut social limité (pas de chômage)'],
  },
  'sar': {
    id: 'sar',
    name: 'SARL / EURL',
    cotisationsSociales: 45,    // ~45% on salary
    impotSurRevenu: 0,          // progressive, but we'll use flat for comparison
    tva: { taux: 20, seuil: 85800, obligatoire: true },
    plafondCA: undefined,
    chargesDeductibles: 40,     // ~40% of revenue deductible
    protectionPatrimoine: true,
    capitalMinimum: 1,
    nbAssociésMax: 100,
    avantages: ['Protection du patrimoine personnel', 'Crédibilité auprès des banques', 'Flexibilité de répartition des parts', 'Déduction des charges réelles', 'Rémunération du gérant déductible'],
    inconvenients: ['Charges sociales élevées (~45%)', 'Formalités de création complexes', 'Rédaction des statuts obligatoire', 'Comptabilité rigoureuse requise', 'AG obligatoires périodiques'],
  },
  'sas': {
    id: 'sas',
    name: 'SAS / SASU',
    cotisationsSociales: 50,    // ~50% on salary (assimilé salarié)
    impotSurRevenu: 0,
    tva: { taux: 20, seuil: 85800, obligatoire: true },
    plafondCA: undefined,
    chargesDeductibles: 35,     // ~35% deductible
    protectionPatrimoine: true,
    capitalMinimum: 1,
    nbAssociésMax: Infinity,
    avantages: ['Statut assimilé-salarié (sécurité sociale)', 'Grande flexibilité statutaire', 'Facilité de levée de fonds', 'Rémunération par dividendes avantageuse', 'Pas de plafond d\'associés'],
    inconvenients: ['Charges sociales les plus élevées (~50-55%)', 'Formalités de création lourdes', 'Expert-comptable indispensable', 'Statuts nécessitant un avocat', 'Coût de gestion élevé'],
  },
  'association': {
    id: 'association',
    name: 'Association (loi 1901)',
    cotisationsSociales: 15,    // very low, only on salaried workers
    impotSurRevenu: 0,
    tva: { taux: 20, seuil: 52500, obligatoire: false },
    plafondCA: undefined,
    chargesDeductibles: 0,
    protectionPatrimoine: true,
    capitalMinimum: 0,
    nbAssociésMax: Infinity,
    avantages: ['But non lucratif exonéré', 'Subventions publiques possibles', 'Agréments et habilitations', 'Pas de capital social', 'Fiscalité avantageuse'],
    inconvenients: ['Pas de partage des bénéfices', 'Gouvernance démocratique obligatoire', 'Comptabilité spécifique', 'Activité commerciale limitée', 'Difficulté de rémunération des dirigeants'],
  },
}

interface SimulateRequest {
  caAnnuel: number           // annual revenue (CA)
  chargesReelles: number     // actual annual expenses
  regimeId: string           // selected regime
  versementLiberatoire?: boolean  // optional flat tax for auto-entrepreneur
}

interface SimulationResult {
  regime: RegimeConfig
  entrees: { ca: number; autres: number }
  sorties: {
    chargesSociales: number
    chargesOperatoires: number
    impotEstime: number
    totalCharges: number
  }
  resultatNet: number
  margeNette: number  // %
  chargesSocialesTauxEffectif: number // effective social charges rate
  avantagesFiscaux: string[]
  recommandation: string
  alertes: string[]
}

function simulate(request: SimulateRequest): SimulationResult {
  const config = REGIMES[request.regimeId]
  if (!config) throw new Error('Régime inconnu')

  const { caAnnuel, chargesReelles, versementLiberatoire } = request
  const ca = Math.max(caAnnuel, 0)
  const charges = Math.min(Math.max(chargesReelles, 0), ca)

  let chargesSociales: number
  let impotEstime: number
  const alertes: string[] = []

  switch (config.id) {
    case 'auto-entrepreneur': {
      // Social charges on CA (not on profit)
      chargesSociales = ca * (config.cotisationsSociales / 100)

      // Revenue subject to income tax = CA - social charges
      const baseImposable = ca - chargesSociales

      if (versementLiberatoire) {
        // Flat tax: 1% services, 1.7% liberal, 2.2% sales
        impotEstime = ca * 0.017 // using 1.7% for services
        alertes.push('Versement libératoire : IR forfaitaire à 1,7% du CA')
      } else {
        // Progressive tax estimation (simplified)
        impotEstime = baseImposable * 0.30 // rough 30% effective rate
      }

      // Check CA cap
      if (config.plafondCA && ca > config.plafondCA) {
        alertes.push(`Attention : CA projeté (${ca.toLocaleString('fr-FR')} EUR) dépasse le plafond AE (${config.plafondCA.toLocaleString('fr-FR')} EUR). Envisagez un changement de statut.`)
      }

      // No real charges deduction
      break
    }
    case 'sar': {
      // Social charges on salary (assumed 50% of profit as salary)
      const beneficeBrut = ca - charges
      const salaire = beneficeBrut * 0.5 // director takes 50% as salary
      chargesSociales = salaire * (config.cotisationsSociales / 100)

      // Corporate tax (IS) on remaining profit
      const beneficeApresSalaire = beneficeBrut - salaire
      const is = beneficeApresSalaire > 42825 ? 42825 * 0.15 + (beneficeApresSalaire - 42825) * 0.25 : beneficeApresSalaire * 0.15

      // Personal income tax on salary (simplified)
      impotEstime = salaire * 0.30 + is

      // Check CA threshold for VAT
      if (ca > config.tva.seuil) {
        alertes.push('CA supérieur au seuil TVA. Déclaration TVA obligatoire.')
      }
      break
    }
    case 'sas': {
      // Social charges on salary (assimilé salarié)
      const beneficeBrut = ca - charges
      const salaire = beneficeBrut * 0.4 // director takes 40% as salary
      chargesSociales = salaire * (config.cotisationsSociales / 100)

      // Corporate tax
      const beneficeApresSalaire = beneficeBrut - salaire
      const is = beneficeApresSalaire > 42825 ? 42825 * 0.15 + (beneficeApresSalaire - 42825) * 0.25 : beneficeApresSalaire * 0.15

      // Personal income tax on salary + dividends
      const dividendes = beneficeApresSalaire - is
      const flatTaxe = dividendes * 0.30 // PFU 30%
      impotEstime = salaire * 0.30 + is + flatTaxe

      if (ca > config.tva.seuil) {
        alertes.push('CA supérieur au seuil TVA. Déclaration TVA obligatoire.')
      }
      break
    }
    case 'association': {
      // Very low social charges (only on paid staff)
      chargesSociales = ca * 0.02 // minimal estimate
      impotEstime = 0 // exonération si but non lucratif
      alertes.push('Activité lucrative possible mais limitée. Risque de requalification.')
      break
    }
    default:
      chargesSociales = 0
      impotEstime = 0
  }

  // For SAR/SAS, total operating charges = chargesReelles + social charges
  // For AE, operating charges = social charges (already includes everything)
  let totalCharges: number
  if (config.id === 'auto-entrepreneur' || config.id === 'association') {
    totalCharges = chargesSociales + impotEstime
  } else {
    totalCharges = charges + chargesSociales + impotEstime
  }

  const resultatNet = Math.max(ca - totalCharges, 0)
  const margeNette = ca > 0 ? (resultatNet / ca) * 100 : 0
  const tauxEffectif = ca > 0 ? (chargesSociales / ca) * 100 : 0

  // Recommendations
  const recommandations: string[] = []
  if (margeNette >= 40) recommandations.push('Marge confortable. Statut viable.')
  else if (margeNette >= 25) recommandations.push('Marge correcte. Optimisation possible.')
  else recommandations.push('Marge faible. Envisagez un statut avec moins de charges.')

  if (ca > 50000 && config.id === 'auto-entrepreneur') {
    recommandations.push('Pour ce niveau de CA, une SARL ou SAS offre une meilleure optimisation fiscale.')
  }
  if (ca <= 40000 && config.id !== 'auto-entrepreneur') {
    recommandations.push('Pour un CA modeste, l\'auto-entrepreneur offre la simplicité et des charges réduites.')
  }

  return {
    regime: config,
    entrees: { ca, autres: 0 },
    sorties: {
      chargesSociales: Math.round(chargesSociales),
      chargesOperatoires: config.id === 'auto-entrepreneur' ? 0 : Math.round(charges),
      impotEstime: Math.round(impotEstime),
      totalCharges: Math.round(totalCharges),
    },
    resultatNet: Math.round(resultatNet),
    margeNette: Math.round(margeNette * 10) / 10,
    chargesSocialesTauxEffectif: Math.round(tauxEffectif * 10) / 10,
    avantagesFiscaux: recommandations,
    recommandation: recommandations[0] || '',
    alertes,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { caAnnuel, chargesReelles, regimeId, versementLiberatoire } = body

    if (!caAnnuel || !regimeId || chargesReelles === undefined) {
      return NextResponse.json(
        { error: 'CA annuel, charges réelles et régime sont requis' },
        { status: 400, headers: corsHeaders }
      )
    }

    const result = simulate({ caAnnuel, chargesReelles, regimeId, versementLiberatoire })

    // Also simulate all regimes for comparison
    const allResults = Object.keys(REGIMES).map((id) =>
      simulate({ caAnnuel, chargesReelles, regimeId: id, versementLiberatoire })
    )

    // Find best regime (highest net result)
    const best = allResults.reduce((a, b) => a.resultatNet > b.resultatNet ? a : b)

    return NextResponse.json({
      selected: result,
      comparison: allResults.map((r) => ({
        id: r.regime.id,
        name: r.regime.name,
        chargesSociales: r.sorties.chargesSociales,
        resultatNet: r.resultatNet,
        margeNette: r.margeNette,
        isBest: r.regime.id === best.regime.id,
      })),
      bestRegime: { id: best.regime.id, name: best.regime.name },
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Juridique simulation error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la simulation' },
      { status: 500, headers: corsHeaders }
    )
  }
}
