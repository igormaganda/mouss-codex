import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET() {
  try {
    // Fetch users with completed diagnostics and GO decisions
    const results = await db.diagnosisSession.findMany({
      where: { goNoGoDecision: 'GO' },
      take: 3,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startedAt: 'desc' },
    })

    if (results.length === 0) {
      return NextResponse.json({ testimonials: [] }, { headers: corsHeaders })
    }

    const roles = ['Créateur en reconversion', 'Porteur de projet', 'Entrepreneur confirmé']

    const testimonials = results.map((r, i) => ({
      name: r.user.name || 'Porteur de projet',
      role: roles[i % roles.length],
      text: `Diagnostic complet avec décision favorable. ${r.score ? `Score de ${r.score}/100.` : 'Projet validé.'} ${r.completedAt ? `Complété le ${r.completedAt.toLocaleDateString('fr-FR')}.` : ''}`,
      rating: i === 0 ? 5 : 4,
    }))

    return NextResponse.json({ testimonials }, { headers: corsHeaders })
  } catch (error) {
    console.error('Testimonials fetch error:', error)
    return NextResponse.json({ testimonials: [] }, { status: 500, headers: corsHeaders })
  }
}
