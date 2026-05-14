import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authenticated, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { id } = await params

    // Fetch counselor with their user profile
    const counselor = await db.counselor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
        assignedUsers: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                role: true,
                isActive: true,
              },
            },
          },
          where: { status: 'ACTIVE' },
          orderBy: { assignedAt: 'desc' },
        },
      },
    })

    if (!counselor) {
      return NextResponse.json(
        { error: 'Counselor not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Fetch AI conversations for this counselor
    const aiConversations = await db.aiConversation.findMany({
      where: { counselorId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        messages: {
          select: {
            id: true,
            role: true,
            content: true,
            messageType: true,
            suggestionType: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Fetch livrables for this counselor
    const livrables = await db.livrable.findMany({
      where: { counselorId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { generatedAt: 'desc' },
    })

    // Enrich assigned users with their diagnostic status
    const assignedUsersWithDiagnostics = await Promise.all(
      counselor.assignedUsers.map(async (assignment) => {
        const latestDiagnosis = await db.diagnosisSession.findFirst({
          where: { userId: assignment.userId },
          orderBy: { startedAt: 'desc' },
        })

        return {
          ...assignment,
          latestDiagnosis: latestDiagnosis
            ? {
                id: latestDiagnosis.id,
                type: latestDiagnosis.type,
                status: latestDiagnosis.status,
                goNoGoDecision: latestDiagnosis.goNoGoDecision,
                score: latestDiagnosis.score,
                startedAt: latestDiagnosis.startedAt,
                completedAt: latestDiagnosis.completedAt,
              }
            : null,
        }
      })
    )

    return NextResponse.json(
      {
        counselor: {
          ...counselor,
          assignedUsers: assignedUsersWithDiagnostics,
          aiConversations,
          livrables,
        },
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Fetch counselor dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
