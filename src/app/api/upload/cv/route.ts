import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth-middleware'
import { rateLimit } from '@/lib/rate-limit'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const ANTHROPIC_API_URL = 'https://api.z.ai/api/anthropic/v1/messages'
const ANTHROPIC_API_TOKEN = '427a8edd8e6947889f71f2283438c9dd.n20AT6nXD6hcB8RV'

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for pdf-parse (CJS/ESM interop)
    const pdfModule = await import('pdf-parse')
    const pdfParse = 'default' in pdfModule ? pdfModule.default : pdfModule
    const data = await (pdfParse as (buf: Buffer) => Promise<{text: string}>)(buffer)
    return data.text || ''
  } catch (error) {
    console.error('PDF extraction error:', error)
    return ''
  }
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value || ''
  } catch (error) {
    console.error('DOCX extraction error:', error)
    return ''
  }
}

async function extractSkillsWithAI(cvText: string): Promise<string[]> {
  try {
    // Truncate if too long (Claude context limit)
    const truncatedText = cvText.length > 6000 ? cvText.substring(0, 6000) + '...' : cvText

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_TOKEN,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Tu es un expert en analyse de CV pour la création d'entreprise. Analyse ce CV et extrais les compétences clés (techniques, méthodologiques, soft skills, sectorielles) sous forme de JSON array de strings en français. Retourne UNIQUEMENT le JSON, sans explication. Si le CV est vide ou illisible, retourne [].\n\nCV:\n${truncatedText}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, await response.text())
      return []
    }

    const data = await response.json()
    const text = data.content?.[0]?.text?.trim() || '[]'

    // Try to extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return Array.isArray(parsed) ? parsed.map((s: unknown) => String(s)) : []
    }

    return []
  } catch (error) {
    console.error('AI skill extraction error:', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  const userId = payload!.userId

  // Rate limit: 10 per hour
  const limiter = rateLimit(`upload-cv:${userId}`, { maxRequests: 10, windowMs: 3600000 })
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((limiter.resetTime - Date.now()) / 1000)) },
      }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté. Utilisez PDF, DOC ou DOCX.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 })
    }

    // Determine file extension
    let ext = 'pdf'
    if (file.name.endsWith('.docx')) ext = 'docx'
    else if (file.name.endsWith('.doc')) ext = 'doc'
    else if (file.name.endsWith('.pdf')) ext = 'pdf'

    // Save file
    const uploadDir = '/home/z/my-project/upload/cv'
    await mkdir(uploadDir, { recursive: true })

    const timestamp = Date.now()
    const storedFileName = `${userId}_${timestamp}.${ext}`
    const filePath = path.join(uploadDir, storedFileName)
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, fileBuffer)

    const fileUrl = `/upload/cv/${storedFileName}`

    // Extract real text from the CV
    let cvText = ''
    if (ext === 'pdf') {
      cvText = await extractTextFromPDF(fileBuffer)
    } else if (ext === 'docx') {
      cvText = await extractTextFromDOCX(fileBuffer)
    } else if (ext === 'doc') {
      // .doc format not supported by mammoth, use AI hint
      cvText = `CV au format DOC (conversion automatique non disponible): ${file.name}`
    }

    // Fallback if extraction yielded nothing
    if (!cvText.trim()) {
      cvText = `CV uploadé: ${file.name} (${(file.size / 1024).toFixed(0)} Ko). L'extraction automatique n'a pas produit de texte lisible.`
    }

    // Use AI to extract skills from the real text
    const parsedSkills = await extractSkillsWithAI(cvText)

    // Create/update CvUpload record
    const cvUpload = await db.cvUpload.upsert({
      where: { userId },
      create: {
        userId,
        fileName: file.name,
        fileUrl,
        cvText,
        parsedSkills,
        analyzedAt: new Date(),
      },
      update: {
        fileName: file.name,
        fileUrl,
        cvText,
        parsedSkills,
        analyzedAt: new Date(),
      },
    })

    // Also ensure a CreatorSession exists and link it
    await db.creatorSession.upsert({
      where: { userId },
      create: {
        userId,
        currentStep: 1,
        cvUploadId: cvUpload.id,
      },
      update: {
        cvUploadId: cvUpload.id,
      },
    })

    return NextResponse.json({
      success: true,
      fileName: file.name,
      cvTextLength: cvText.length,
      skillsFound: parsedSkills.length,
      analysisId: cvUpload.id,
    })
  } catch (err) {
    console.error('CV upload error:', err)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { authenticated, payload, error } = authenticateRequest(request)
  if (!authenticated) return error!

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Only allow the authenticated user to access their own data
    const targetUserId = userId === payload!.userId ? userId : payload!.userId

    const cvUpload = await db.cvUpload.findUnique({
      where: { userId: targetUserId },
    })

    if (!cvUpload) {
      return NextResponse.json({ error: 'Aucun CV trouvé' }, { status: 404 })
    }

    return NextResponse.json({
      id: cvUpload.id,
      fileName: cvUpload.fileName,
      cvText: cvUpload.cvText,
      parsedSkills: cvUpload.parsedSkills,
      analyzedAt: cvUpload.analyzedAt,
    })
  } catch (err) {
    console.error('Get CV upload error:', err)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
