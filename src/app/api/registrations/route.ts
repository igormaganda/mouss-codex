import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'
import { Prisma } from '@prisma/client'

const PAGE_SIZE = 10

// GET: List registrations (user sees own, admin/counselor see all)
export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const status = searchParams.get('status')
    const projectSector = searchParams.get('projectSector')
    const projectStage = searchParams.get('projectStage')

    const where: Prisma.RegistrationWhereInput = {}

    if (payload!.role === 'USER') {
      where.userId = payload!.userId
    }

    if (status) {
      where.mode = status
    }

    if (projectSector) {
      where.projectSector = projectSector
    }

    if (projectStage) {
      where.projectStage = projectStage
    }

    const [registrations, total] = await Promise.all([
      db.registration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      db.registration.count({ where }),
    ])

    const totalPages = Math.ceil(total / PAGE_SIZE)

    return NextResponse.json({
      registrations,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('Fetch registrations error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST: Create a multi-step registration form submission
export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const body = await request.json()
    const {
      mode,
      firstName,
      lastName,
      email,
      phone,
      city,
      situation,
      educationLevel,
      educationField,
      experienceYears,
      skills,
      previousBusiness,
      projectName,
      projectSector,
      projectType,
      projectDescription,
      projectStage,
      motivations,
      needs,
      supportType,
      actionsTaken,
      resources,
      comments,
    } = body

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Les champs firstName, lastName et email sont requis' },
        { status: 400 }
      )
    }

    const registration = await db.registration.create({
      data: {
        userId: payload!.userId,
        projectId: null,
        mode: mode || null,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        city: city?.trim() || null,
        situation: situation || null,
        educationLevel: educationLevel || null,
        educationField: educationField?.trim() || null,
        experienceYears: experienceYears || null,
        skills: skills?.trim() || null,
        previousBusiness: previousBusiness?.trim() || null,
        projectName: projectName?.trim() || null,
        projectSector: projectSector?.trim() || null,
        projectType: projectType?.trim() || null,
        projectDescription: projectDescription?.trim() || null,
        projectStage: projectStage || null,
        motivations: motivations?.trim() || null,
        needs: Array.isArray(needs) ? needs : [],
        supportType: supportType?.trim() || null,
        actionsTaken: actionsTaken?.trim() || null,
        resources: resources?.trim() || null,
        comments: comments?.trim() || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ registration }, { status: 201 })
  } catch (error) {
    console.error('Create registration error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
