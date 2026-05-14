import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'

// GET: List all discussion categories
export async function GET(_request: NextRequest) {
  try {
    const categories = await db.discussionCategory.findMany({
      include: {
        _count: {
          select: { discussions: true },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Fetch categories error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST: Create a new category (ADMIN only)
export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  if (payload!.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Accès réservé aux administrateurs' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { name, slug, description, icon, order } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom de la catégorie est requis' },
        { status: 400 }
      )
    }

    if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le slug de la catégorie est requis' },
        { status: 400 }
      )
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Le slug doit être en minuscules, sans espaces, séparé par des tirets' },
        { status: 400 }
      )
    }

    const existingCategory = await db.discussionCategory.findUnique({
      where: { slug },
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Une catégorie avec ce slug existe déjà' },
        { status: 409 }
      )
    }

    const category = await db.discussionCategory.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        description: description || null,
        icon: icon || null,
        order: typeof order === 'number' ? order : 0,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
