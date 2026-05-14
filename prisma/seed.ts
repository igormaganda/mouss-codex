import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

// ===================== HELPERS =====================
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

// ===================== USER DEFINITIONS =====================
interface UserDef {
  email: string
  name: string
  firstName: string
  lastName: string
  phone?: string
  role: 'USER' | 'COUNSELOR' | 'ADMIN'
  territory?: string
  organization?: string
  maxAssignments?: number
  kiviat: number[]
  riasec: number[]
  dominantRiasec: ('R' | 'I' | 'A' | 'S' | 'E' | 'C')[]
  keptSkills: string[]
  keywords: string[]
  diagnosisStatus: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
  goNoGo: 'GO' | 'NO_GO' | 'PENDING_REVIEW' | null
  score: number
  modulesCompleted: number
  accessibilitySettings?: {
    textSize?: number
    highContrast?: boolean
    dyslexicFont?: boolean
    readingLine?: boolean
    readingMask?: boolean
    pauseAnimations?: boolean
  }
  disabilityRequests?: { region: string; type: string; desc: string; status: string; priority: string }[]
}

const KIVIAT_DIMS = ['Leadership', 'Créativité', 'Gestion du stress', 'Communication', 'Résolution pb', 'Autonomie']
const RIASEC_TYPES: ('R' | 'I' | 'A' | 'S' | 'E' | 'C')[] = ['R', 'I', 'A', 'S', 'E', 'C']
const ALL_SKILLS = [
  { id: 'leadership', name: 'Leadership' },
  { id: 'creativite', name: 'Créativité' },
  { id: 'stress', name: 'Gestion du stress' },
  { id: 'communication', name: 'Communication' },
  { id: 'resolution', name: 'Résolution de problèmes' },
  { id: 'autonomie', name: 'Autonomie' },
  { id: 'negociation', name: 'Négociation' },
  { id: 'adaptabilite', name: 'Adaptabilité' },
  { id: 'organisation', name: 'Organisation' },
  { id: 'esprit-equipe', name: "Esprit d'équipe" },
  { id: 'vision-strategique', name: 'Vision stratégique' },
  { id: 'prise-risque', name: 'Prise de risque calculé' },
]
const ALL_KEYWORDS = [
  'Innovation', 'Management', 'Finance', 'Marketing', 'Technologie',
  'RH', 'Écologie', 'Commerce', 'Design', 'Data', 'Handicap',
  'Social', 'International', 'Agroalimentaire', 'Santé', 'BTP',
  'Éducation', 'Culture', 'Tourisme', 'Digital',
]

const USERS: UserDef[] = [
  // ===== EXISTING USERS =====
  {
    email: 'admin@creapulse.fr', name: 'Administrateur CréaPulse', firstName: 'Admin', lastName: 'CréaPulse',
    role: 'ADMIN', kiviat: [70, 65, 80, 75, 72, 68], riasec: [50, 60, 40, 70, 55, 90], dominantRiasec: ['C', 'S'],
    keptSkills: [], keywords: [], diagnosisStatus: 'COMPLETED', goNoGo: null, score: 0, modulesCompleted: 0,
  },
  {
    email: 'conseiller@creapulse.fr', name: 'Sophie Martin', firstName: 'Sophie', lastName: 'Martin',
    role: 'COUNSELOR', territory: 'Auvergne-Rhône-Alpes', organization: 'BGE Lyon', maxAssignments: 25,
    kiviat: [82, 78, 70, 88, 75, 85], riasec: [45, 55, 50, 90, 65, 72], dominantRiasec: ['S'],
    keptSkills: [], keywords: [], diagnosisStatus: 'COMPLETED', goNoGo: null, score: 0, modulesCompleted: 0,
  },
  {
    email: 'marie@example.com', name: 'Marie Dupont', firstName: 'Marie', lastName: 'Dupont',
    phone: '+33 6 12 34 56 78', role: 'USER',
    kiviat: [78, 85, 62, 90, 73, 88], riasec: [65, 82, 45, 91, 88, 38], dominantRiasec: ['S', 'E'],
    keptSkills: ['leadership', 'creativite', 'communication', 'resolution', 'autonomie'],
    keywords: ['Innovation', 'Management', 'Marketing', 'Technologie', 'Écologie', 'Social', 'Digital'],
    diagnosisStatus: 'IN_PROGRESS', goNoGo: 'PENDING_REVIEW', score: 72, modulesCompleted: 2,
    disabilityRequests: [
      { region: 'Auvergne-Rhône-Alpes', type: 'Adaptation visuelle', desc: 'Contraste renforcé + Navigation clavier pour malvoyant', status: 'PENDING', priority: 'HIGH' },
    ],
  },
  // ===== NEW USERS =====
  {
    email: 'jean-pierre.lambert@example.com', name: 'Jean-Pierre Lambert', firstName: 'Jean-Pierre', lastName: 'Lambert',
    phone: '+33 6 98 76 54 32', role: 'USER',
    kiviat: [85, 60, 55, 72, 80, 92], riasec: [88, 42, 35, 60, 82, 70], dominantRiasec: ['R', 'E'],
    keptSkills: ['leadership', 'autonomie', 'prise-risque', 'vision-strategique', 'organisation'],
    keywords: ['BTP', 'Management', 'Finance', 'Technologie', 'Commerce'],
    diagnosisStatus: 'COMPLETED', goNoGo: 'GO', score: 81, modulesCompleted: 5,
    accessibilitySettings: { highContrast: true, textSize: 120 },
  },
  {
    email: 'fatima.benali@example.com', name: 'Fatima Benali', firstName: 'Fatima', lastName: 'Benali',
    phone: '+33 7 11 22 33 44', role: 'USER',
    kiviat: [65, 92, 58, 85, 70, 78], riasec: [40, 88, 95, 75, 60, 45], dominantRiasec: ['A', 'I'],
    keptSkills: ['creativite', 'communication', 'adaptabilite', 'vision-strategique'],
    keywords: ['Design', 'Culture', 'Écologie', 'Innovation', 'Digital', 'Social'],
    diagnosisStatus: 'IN_PROGRESS', goNoGo: null, score: 58, modulesCompleted: 2,
  },
  {
    email: 'lucas.moreau@example.com', name: 'Lucas Moreau', firstName: 'Lucas', lastName: 'Moreau',
    phone: '+33 6 55 44 33 22', role: 'USER',
    kiviat: [42, 55, 38, 50, 45, 40], riasec: [72, 35, 30, 65, 28, 85], dominantRiasec: ['C', 'R'],
    keptSkills: ['organisation', 'stress'],
    keywords: ['Finance', 'RH', 'Technologie'],
    diagnosisStatus: 'COMPLETED', goNoGo: 'NO_GO', score: 35, modulesCompleted: 4,
  },
  {
    email: 'sarah.konate@example.com', name: 'Sarah Konaté', firstName: 'Sarah', lastName: 'Konaté',
    phone: '+33 6 77 88 99 00', role: 'USER',
    kiviat: [90, 75, 68, 88, 82, 80], riasec: [55, 70, 60, 92, 85, 50], dominantRiasec: ['S', 'E'],
    keptSkills: ['leadership', 'communication', 'esprit-equipe', 'negociation', 'adaptabilite'],
    keywords: ['Social', 'Santé', 'Éducation', 'RH', 'Management', 'International'],
    diagnosisStatus: 'COMPLETED', goNoGo: 'GO', score: 86, modulesCompleted: 5,
    accessibilitySettings: { dyslexicFont: true, textSize: 110 },
  },
  {
    email: 'ahmed.touzani@example.com', name: 'Ahmed Touzani', firstName: 'Ahmed', lastName: 'Touzani',
    phone: '+33 6 33 22 11 00', role: 'USER',
    kiviat: [72, 68, 75, 65, 70, 82], riasec: [60, 78, 55, 70, 75, 65], dominantRiasec: ['I'],
    keptSkills: ['autonomie', 'organisation', 'adaptabilite', 'prise-risque'],
    keywords: ['Agroalimentaire', 'Commerce', 'Écologie', 'Finance', 'Technologie'],
    diagnosisStatus: 'IN_PROGRESS', goNoGo: null, score: 48, modulesCompleted: 1,
    disabilityRequests: [
      { region: 'Provence-Alpes-Côte d\'Azur', type: 'Interface adaptée', desc: 'Utilisation une main — Motricité réduite membre supérieur droit', status: 'IN_PROGRESS', priority: 'MEDIUM' },
    ],
  },
  {
    email: 'isabelle.roux@example.com', name: 'Isabelle Roux', firstName: 'Isabelle', lastName: 'Roux',
    phone: '+33 6 44 55 66 77', role: 'USER',
    kiviat: [88, 80, 72, 92, 85, 86], riasec: [50, 65, 75, 95, 90, 42], dominantRiasec: ['S', 'E'],
    keptSkills: ['leadership', 'communication', 'negociation', 'esprit-equipe', 'vision-strategique', 'adaptabilite'],
    keywords: ['Tourisme', 'Écologie', 'Social', 'Management', 'Innovation', 'Digital', 'Commerce'],
    diagnosisStatus: 'COMPLETED', goNoGo: 'GO', score: 89, modulesCompleted: 5,
  },
  {
    email: 'thomas.bernard@example.com', name: 'Thomas Bernard', firstName: 'Thomas', lastName: 'Bernard',
    phone: '+33 7 88 77 66 55', role: 'USER',
    kiviat: [55, 70, 50, 60, 65, 72], riasec: [75, 80, 65, 55, 60, 72], dominantRiasec: ['R', 'I'],
    keptSkills: ['autonomie', 'organisation'],
    keywords: ['Technologie', 'Data', 'Innovation'],
    diagnosisStatus: 'IN_PROGRESS', goNoGo: null, score: 30, modulesCompleted: 1,
  },
  {
    email: 'nadia.cherif@example.com', name: 'Nadia Chérif', firstName: 'Nadia', lastName: 'Chérif',
    phone: '+33 6 22 33 44 55', role: 'USER',
    kiviat: [80, 88, 65, 82, 78, 90], riasec: [48, 92, 82, 68, 72, 40], dominantRiasec: ['I', 'A'],
    keptSkills: ['creativite', 'adaptabilite', 'vision-strategique', 'prise-risque', 'resolution'],
    keywords: ['Innovation', 'Data', 'Technologie', 'Santé', 'International', 'Design'],
    diagnosisStatus: 'COMPLETED', goNoGo: 'GO', score: 84, modulesCompleted: 5,
  },
  // ===== MORE NEW USERS =====
  {
    email: 'paul.girard@example.com', name: 'Paul Girard', firstName: 'Paul', lastName: 'Girard',
    phone: '+33 6 99 88 77 66', role: 'USER',
    kiviat: [60, 45, 82, 55, 62, 50], riasec: [85, 40, 30, 58, 45, 88], dominantRiasec: ['R', 'C'],
    keptSkills: ['organisation', 'stress', 'autonomie'],
    keywords: ['BTP', 'Finance', 'RH'],
    diagnosisStatus: 'COMPLETED', goNoGo: 'NO_GO', score: 42, modulesCompleted: 4,
  },
  {
    email: 'camille.petit@example.com', name: 'Camille Petit', firstName: 'Camille', lastName: 'Petit',
    phone: '+33 7 11 00 99 88', role: 'USER',
    kiviat: [75, 90, 60, 85, 72, 82], riasec: [42, 75, 95, 78, 68, 38], dominantRiasec: ['A', 'I'],
    keptSkills: ['creativite', 'communication', 'adaptabilite', 'vision-strategique', 'esprit-equipe'],
    keywords: ['Culture', 'Design', 'Tourisme', 'Écologie', 'Innovation', 'Social', 'Digital'],
    diagnosisStatus: 'COMPLETED', goNoGo: 'GO', score: 79, modulesCompleted: 5,
    accessibilitySettings: { readingLine: true, textSize: 110 },
  },
  {
    email: 'francois.dumont@example.com', name: 'François Dumont', firstName: 'François', lastName: 'Dumont',
    phone: '+33 6 55 66 77 88', role: 'USER',
    kiviat: [82, 70, 68, 78, 80, 88], riasec: [62, 72, 50, 65, 88, 60], dominantRiasec: ['E'],
    keptSkills: ['leadership', 'negociation', 'prise-risque', 'vision-strategique', 'autonomie'],
    keywords: ['Commerce', 'Finance', 'Management', 'International', 'Agroalimentaire'],
    diagnosisStatus: 'COMPLETED', goNoGo: 'GO', score: 77, modulesCompleted: 4,
  },
  // ===== NEW COUNSELORS =====
  {
    email: 'pierre.dubois@creapulse.fr', name: 'Pierre Dubois', firstName: 'Pierre', lastName: 'Dubois',
    role: 'COUNSELOR', territory: 'Île-de-France', organization: 'CCI Paris', maxAssignments: 30,
    kiviat: [75, 68, 72, 80, 70, 78], riasec: [55, 60, 45, 82, 70, 78], dominantRiasec: ['S'],
    keptSkills: [], keywords: [], diagnosisStatus: 'COMPLETED', goNoGo: null, score: 0, modulesCompleted: 0,
  },
  {
    email: 'claire.lefevre@creapulse.fr', name: 'Claire Lefèvre', firstName: 'Claire', lastName: 'Lefèvre',
    role: 'COUNSELOR', territory: 'Occitanie', organization: 'Réseau Entreprendre', maxAssignments: 20,
    kiviat: [80, 85, 65, 90, 78, 82], riasec: [48, 70, 80, 88, 62, 55], dominantRiasec: ['S', 'A'],
    keptSkills: [], keywords: [], diagnosisStatus: 'COMPLETED', goNoGo: null, score: 0, modulesCompleted: 0,
  },
  {
    email: 'marc.petit@creapulse.fr', name: 'Marc Petit', firstName: 'Marc', lastName: 'Petit',
    role: 'COUNSELOR', territory: 'Bretagne', organization: 'BGE Rennes', maxAssignments: 15,
    kiviat: [70, 72, 78, 75, 68, 74], riasec: [68, 55, 42, 78, 65, 82], dominantRiasec: ['C', 'S'],
    keptSkills: [], keywords: [], diagnosisStatus: 'COMPLETED', goNoGo: null, score: 0, modulesCompleted: 0,
  },
  // ===== NEW ADMIN =====
  {
    email: 'superadmin@creapulse.fr', name: 'Directeur Général', firstName: 'DG', lastName: 'CréaPulse',
    role: 'ADMIN',
    kiviat: [88, 80, 85, 82, 90, 86], riasec: [55, 65, 50, 70, 92, 78], dominantRiasec: ['E'],
    keptSkills: [], keywords: [], diagnosisStatus: 'COMPLETED', goNoGo: null, score: 0, modulesCompleted: 0,
  },
]

// ===================== MAIN SEED =====================
async function main() {
  console.log('🌱 Seeding CréaPulse database...\n')

  // ============ MODULES ============
  console.log('📦 Creating module configs...')
  const modules = [
    { name: 'Bilan Découverte', description: 'Jeu des Pépites + Diagramme de Kiviat pour évaluer les soft skills entrepreneuriales', sortOrder: 1, enabled: true },
    { name: 'Orientation RIASEC', description: 'Évaluation des profils RIASEC et loterie de mots-clés sectoriels', sortOrder: 2, enabled: true },
    { name: 'Analyse Compétences', description: 'Import CV, cartographie des compétences et Skill Gap Analysis', sortOrder: 3, enabled: true },
    { name: 'Chat Marché', description: 'Exploration des données de marché sectorielles et territoriales', sortOrder: 4, enabled: true },
    { name: 'Prévisionnel Financier', description: 'Projections financières sur 3 ans avec tableaux interactifs', sortOrder: 5, enabled: false },
    { name: 'IA Co-Pilote', description: 'Assistant IA temps réel pour l\'analyse et les recommandations personnalisées', sortOrder: 6, enabled: true },
    { name: 'Suivi Territorial', description: 'Monitoring des indicateurs par région et tableau de bord administratif', sortOrder: 7, enabled: false },
  ]

  for (const mod of modules) {
    await prisma.moduleConfig.upsert({
      where: { name: mod.name },
      update: mod,
      create: mod,
    })
  }
  console.log(`   ✅ ${modules.length} modules created`)

  // ============ TERRITORIES ============
  console.log('🗺️  Creating territories...')
  const territories = [
    { name: 'Auvergne-Rhône-Alpes', region: 'ARA', diagnostics: 342, pursuitRate: 78, returnRate: 45, satisfaction: 92 },
    { name: 'Île-de-France', region: 'IDF', diagnostics: 287, pursuitRate: 82, returnRate: 51, satisfaction: 89 },
    { name: 'Occitanie', region: 'OCC', diagnostics: 198, pursuitRate: 71, returnRate: 38, satisfaction: 94 },
    { name: "Provence-Alpes-Côte d'Azur", region: 'PACA', diagnostics: 176, pursuitRate: 75, returnRate: 42, satisfaction: 91 },
    { name: 'Bretagne', region: 'BRE', diagnostics: 134, pursuitRate: 69, returnRate: 35, satisfaction: 88 },
    { name: 'Nouvelle-Aquitaine', region: 'NAQ', diagnostics: 110, pursuitRate: 74, returnRate: 40, satisfaction: 93 },
  ]

  for (const ter of territories) {
    await prisma.territory.upsert({
      where: { name: ter.name },
      update: ter,
      create: ter,
    })
  }
  console.log(`   ✅ ${territories.length} territories created`)

  // ============ USERS & RICH DATA ============
  console.log('👤 Creating users and rich data...')

  const userRecords: Map<string, { id: string; def: UserDef }> = new Map()
  const counselorRecords: Map<string, { id: string; userId: string }> = new Map()

  for (const u of USERS) {
    // Upsert user
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash: '$2b$10$placeholder_hash',
        name: u.name,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone || null,
        role: u.role as UserRole,
        isActive: true,
        lastLoginAt: daysAgo(randomInt(0, 7)),
      },
    })
    userRecords.set(u.email, { id: user.id, def: u })

    // Create counselor profile if COUNSELOR
    if (u.role === 'COUNSELOR') {
      const counselor = await prisma.counselor.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          territory: u.territory || null,
          organization: u.organization || null,
          maxAssignments: u.maxAssignments || 20,
          isAvailable: true,
        },
      })
      counselorRecords.set(u.email, { id: counselor.id, userId: user.id })
    }

    // Skip rich data for ADMIN/COUNSELOR users (they don't do diagnostics)
    if (u.role !== 'USER') continue

    // Kiviat results (delete first for idempotency)
    await prisma.kiviatResult.deleteMany({ where: { userId: user.id } })
    await prisma.kiviatResult.createMany({
      data: KIVIAT_DIMS.map((dim, i) => ({
        userId: user.id,
        dimension: dim,
        value: u.kiviat[i],
        maxValue: 100,
      })),
    })

    // RIASEC results (delete first for idempotency)
    await prisma.riasecResult.deleteMany({ where: { userId: user.id } })
    await prisma.riasecResult.createMany({
      data: RIASEC_TYPES.map((type, i) => ({
        userId: user.id,
        profileType: type,
        score: u.riasec[i],
        isDominant: u.dominantRiasec.includes(type),
      })),
    })

    // Swipe game results
    if (u.keptSkills.length > 0) {
      const keptSet = new Set(u.keptSkills)
      // Add some not-kept skills too
      const notKept = ALL_SKILLS.filter((s) => !keptSet.has(s.id)).slice(0, 3)
      await prisma.swipeGameResult.deleteMany({ where: { userId: user.id } })
      await prisma.swipeGameResult.createMany({
        data: [
          ...u.keptSkills.map((skillId) => {
            const skill = ALL_SKILLS.find((s) => s.id === skillId)!
            return { userId: user.id, skillId: skill.id, skillName: skill.name, kept: true }
          }),
          ...notKept.map((skill) => ({
            userId: user.id, skillId: skill.id, skillName: skill.name, kept: false,
          })),
        ],
      })
    }

    // Keyword selections
    if (u.keywords.length > 0) {
      const keywordSet = new Set(u.keywords)
      // Add some unselected keywords
      const unselected = ALL_KEYWORDS.filter((kw) => !keywordSet.has(kw)).slice(0, 4)
      await prisma.keywordSelection.deleteMany({ where: { userId: user.id } })
      await prisma.keywordSelection.createMany({
        data: [
          ...u.keywords.map((keyword) => ({ userId: user.id, keyword, selected: true })),
          ...unselected.map((keyword) => ({ userId: user.id, keyword, selected: false })),
        ],
      })
    }

    // Diagnosis session
    const moduleTypes = ['BILAN_DECOUVERTE', 'RIASEC', 'COMPETENCES', 'MARCHE', 'FINANCIER']
    const completedModules = moduleTypes.slice(0, u.modulesCompleted)
    await prisma.diagnosisSession.create({
      data: {
        userId: user.id,
        type: 'FULL_DIAGNOSTIC',
        status: u.diagnosisStatus,
        goNoGoDecision: u.goNoGo,
        goNoGoReason: u.goNoGo === 'GO' ? 'Profil entrepreneurial confirmé' : u.goNoGo === 'NO_GO' ? 'Profil inadapté à la création, orientation emploi recommandée' : null,
        score: u.score,
        startedAt: daysAgo(randomInt(10, 45)),
        completedAt: u.diagnosisStatus === 'COMPLETED' ? daysAgo(randomInt(1, 9)) : null,
        durationMinutes: u.diagnosisStatus === 'COMPLETED' ? randomInt(45, 120) : null,
        moduleResults: {
          create: completedModules.map((mt) => ({
            moduleType: mt,
            score: randomInt(50, 95),
            data: { completed: true, date: daysAgo(randomInt(1, 30)).toISOString() },
          })),
        },
      },
    })

    // Accessibility settings
    await prisma.accessibilitySetting.upsert({
      where: { userId: user.id },
      update: u.accessibilitySettings || {},
      create: {
        userId: user.id,
        textSize: u.accessibilitySettings?.textSize ?? 100,
        highContrast: u.accessibilitySettings?.highContrast ?? false,
        readingLine: u.accessibilitySettings?.readingLine ?? false,
        readingMask: u.accessibilitySettings?.readingMask ?? false,
        dyslexicFont: u.accessibilitySettings?.dyslexicFont ?? false,
        pauseAnimations: u.accessibilitySettings?.pauseAnimations ?? false,
      },
    })

    // Notifications
    const notifications = [
      { userId: user.id, title: 'Bienvenue sur CréaPulse', content: 'Votre compte a été créé avec succès. Commencez votre diagnostic entrepreneurial dès maintenant.', type: 'info' },
    ]
    if (u.modulesCompleted >= 1) {
      notifications.push({ userId: user.id, title: 'Bilan découverte terminé', content: 'Votre bilan découverte a été analysé par l\'IA. Consultez vos résultats dans l\'onglet Bilan.', type: 'success' })
    }
    if (u.modulesCompleted >= 2) {
      notifications.push({ userId: user.id, title: 'Profil RIASEC disponible', content: 'Votre profil RIASEC est disponible. Votre profil dominant est ' + u.dominantRiasec.join('/') + '.', type: 'success' })
    }
    if (u.goNoGo === 'GO') {
      notifications.push({ userId: user.id, title: 'Diagnostic favorable !', content: 'Félicitations ! Votre diagnostic entrepreneurial est favorable (GO). Votre conseiller va vous contacter.', type: 'success' })
    }
    if (u.goNoGo === 'NO_GO') {
      notifications.push({ userId: user.id, title: 'Orientation recommandée', content: 'Votre diagnostic indique qu\'une orientation emploi pourrait être plus adaptée. Contactez votre conseiller pour en discuter.', type: 'info' })
    }
    if (u.diagnosisStatus === 'IN_PROGRESS') {
      notifications.push({ userId: user.id, title: 'Continuez votre diagnostic', content: 'Vous avez des modules en cours. Reprenez là où vous vous êtes arrêté.', type: 'info' })
    }
    await prisma.notification.createMany({ data: notifications })

    // Disability requests
    if (u.disabilityRequests) {
      for (const dr of u.disabilityRequests) {
        await prisma.disabilityRequest.create({
          data: {
            userId: user.id,
            region: dr.region,
            requestType: dr.type,
            description: dr.desc,
            status: dr.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED',
            priority: dr.priority as 'LOW' | 'MEDIUM' | 'HIGH',
          },
        })
      }
    }

    // Skill gap analysis for users with enough modules
    if (u.modulesCompleted >= 3) {
      const acquiredSkills = u.keptSkills.map((sid) => ALL_SKILLS.find((s) => s.id === sid)?.name || sid)
      const gapSkills = ALL_SKILLS.filter((s) => !u.keptSkills.includes(s.id)).slice(0, 3).map((s) => s.name)
      await prisma.skillGapAnalysis.create({
        data: {
          userId: user.id,
          cvFileName: `CV_${u.firstName}_${u.lastName}.pdf`,
          acquiredSkills: acquiredSkills as any,
          gapSkills: gapSkills as any,
          recommendedPlan: {
            formations: [
              { name: 'Gestion financière', duration: '40h', provider: 'BGE' },
              { name: 'Droit des sociétés', duration: '16h', provider: 'CCI' },
            ],
            mentorat: 'Recommandé',
            delai: '3-6 mois',
          } as any,
        },
      })
    }
  }

  const userCount = USERS.length
  const regularUsers = USERS.filter((u) => u.role === 'USER').length
  const counselorCount = USERS.filter((u) => u.role === 'COUNSELOR').length
  const adminCount = USERS.filter((u) => u.role === 'ADMIN').length
  console.log(`   ✅ ${userCount} users created (${regularUsers} porteurs, ${counselorCount} conseillers, ${adminCount} admins)`)

  // ============ COUNSELOR ASSIGNMENTS ============
  console.log('🔗 Creating counselor assignments...')
  const regularUserEmails = USERS.filter((u) => u.role === 'USER').map((u) => u.email)
  const counselorEmails = [...counselorRecords.keys()]

  let assignmentCount = 0
  for (const userEmail of regularUserEmails) {
    const userRec = userRecords.get(userEmail)!
    // Assign each user to 1-2 counselors
    const numAssignments = randomInt(1, 2)
    const shuffled = [...counselorEmails].sort(() => Math.random() - 0.5)
    for (let i = 0; i < numAssignments && i < shuffled.length; i++) {
      const counselorEmail = shuffled[i]
      const counselorRec = counselorRecords.get(counselorEmail)!
      try {
        await prisma.counselorAssignment.create({
          data: {
            counselorId: counselorRec.id,
            userId: userRec.id,
            status: 'ACTIVE',
          },
        })
        assignmentCount++
      } catch {
        // Unique constraint violation - already exists
      }
    }
  }
  console.log(`   ✅ ${assignmentCount} counselor assignments created`)

  // ============ AI CONVERSATIONS ============
  console.log('🤖 Creating AI conversations and messages...')
  let conversationCount = 0
  let messageCount = 0

  const conversationTemplates = [
    {
      title: 'Analyse du profil entrepreneurial',
      summary: 'Évaluation des compétences et recommandations',
      messages: [
        { role: 'AI' as const, content: "J'ai analysé le profil de ce porteur de projet. Voici mes premières observations sur son potentiel entrepreneurial.", messageType: 'TEXT' as const, suggestionType: null as any },
        { role: 'AI' as const, content: "Les compétences en communication et leadership sont des atouts majeurs. Le profil RIASEC montre une bonne adéquation avec la création d'entreprise.", messageType: 'SUGGESTION' as const, suggestionType: 'POSITIVE' },
        { role: 'AI' as const, content: "Attention : les compétences en gestion financière et administrative nécessitent un renfort avant le lancement.", messageType: 'ALERT' as const, suggestionType: 'ALERT' },
        { role: 'USER' as const, content: "Quelles formations recommandez-vous ?", messageType: 'TEXT' as const, suggestionType: null as any },
        { role: 'AI' as const, content: "1. Formation 'Gestion financière pour créateurs' — 40h\n2. Atelier 'Droit des sociétés' — 16h\n3. Coaching individualisé en gestion", messageType: 'RECOMMENDATION' as const, suggestionType: 'NEUTRAL' },
      ],
    },
    {
      title: 'Suivi post-diagnostic',
      summary: 'Bilan des actions menées et prochaines étapes',
      messages: [
        { role: 'AI' as const, content: "Voici le résumé du diagnostic et les recommandations de suivi.", messageType: 'TEXT' as const, suggestionType: null as any },
        { role: 'AI' as const, content: "Le score global de diagnostic est encourageant. La feuille de route est en bonne voie de réalisation.", messageType: 'SUGGESTION' as const, suggestionType: 'POSITIVE' },
        { role: 'USER' as const, content: "Comment optimiser le parcours d'accompagnement ?", messageType: 'TEXT' as const, suggestionType: null as any },
        { role: 'AI' as const, content: "Je recommande de prioriser les modules Compétences et Marché avant d'aborder le Prévisionnel Financier.", messageType: 'RECOMMENDATION' as const, suggestionType: 'NEUTRAL' },
      ],
    },
    {
      title: 'Analyse de marché sectoriel',
      summary: 'Étude des tendances et opportunités',
      messages: [
        { role: 'AI' as const, content: "Analyse des données de marché pour le secteur d'activité ciblé.", messageType: 'TEXT' as const, suggestionType: null as any },
        { role: 'AI' as const, content: "Le secteur montre une croissance de +15% sur les 12 derniers mois. La concurrence reste modérée dans la zone géographique ciblée.", messageType: 'SUGGESTION' as const, suggestionType: 'POSITIVE' },
        { role: 'AI' as const, content: "Point de vigilance : les marges dans ce secteur sont sous pression. Un positionnement différencié sera clé.", messageType: 'ALERT' as const, suggestionType: 'ALERT' },
      ],
    },
    {
      title: 'Préparation au Go/No-Go',
      summary: 'Évaluation finale avant décision',
      messages: [
        { role: 'AI' as const, content: "Synthèse des éléments pour la décision Go/No-Go.", messageType: 'TEXT' as const, suggestionType: null as any },
        { role: 'AI' as const, content: "L'ensemble des indicateurs est favorable : profil RIASEC adapté, compétences solides, marché porteur.", messageType: 'SUGGESTION' as const, suggestionType: 'POSITIVE' },
        { role: 'USER' as const, content: "Quels sont les risques principaux identifiés ?", messageType: 'TEXT' as const, suggestionType: null as any },
        { role: 'AI' as const, content: "Les principaux risques sont : 1) Financement initial insuffisant 2) Manque d'expérience en gestion 3) Concurrence locale forte dans certains segments.", messageType: 'ALERT' as const, suggestionType: 'ALERT' },
        { role: 'AI' as const, content: "Recommandation : valider le Go avec un plan d'accompagnement renforcé sur la gestion financière les 6 premiers mois.", messageType: 'RECOMMENDATION' as const, suggestionType: 'NEUTRAL' },
      ],
    },
  ]

  for (const [counselorEmail, counselorRec] of counselorRecords.entries()) {
    // Each counselor gets 2-4 conversations
    const numConversations = randomInt(2, 4)
    const assignedUsers = regularUserEmails.slice(0, 4) // Use first 4 regular users for conversations

    for (let i = 0; i < numConversations; i++) {
      const template = conversationTemplates[i % conversationTemplates.length]
      const userRec = userRecords.get(assignedUsers[i % assignedUsers.length])!

      const conversation = await prisma.aiConversation.create({
        data: {
          counselorId: counselorRec.id,
          userId: userRec.id,
          title: `${template.title} — ${userRec.def.firstName} ${userRec.def.lastName}`,
          summary: template.summary,
          messages: {
            create: template.messages.map((m) => ({
              role: m.role,
              content: m.content,
              messageType: m.messageType,
              suggestionType: m.suggestionType,
            })),
          },
        },
      })
      conversationCount++
      messageCount += template.messages.length
    }
  }
  console.log(`   ✅ ${conversationCount} AI conversations created with ${messageCount} messages`)

  // ============ LIVRABLES ============
  console.log('📄 Creating livrables...')
  let livrableCount = 0

  const livrableTemplates = [
    { type: 'ACTION_PLAN' as const, title: "Plan d'actions personnalisé", status: 'COMPLETED' as const, fileName: 'plan_actions.pdf', fileSize: randomInt(150, 400) * 1000 },
    { type: 'FINANCIAL_FORECAST' as const, title: 'Prévisionnel financier 3 ans', status: 'COMPLETED' as const, fileName: 'previsionnel.xlsx', fileSize: randomInt(80, 250) * 1000 },
    { type: 'DIAGNOSIS_REPORT' as const, title: 'Rapport de diagnostic complet', status: 'COMPLETED' as const, fileName: 'rapport_diagnostic.pdf', fileSize: randomInt(300, 600) * 1000 },
    { type: 'CAREER_MAP' as const, title: 'Cartographie de compétences', status: 'DRAFT' as const },
    { type: 'CERTIFICATE' as const, title: 'Attestation de parcours', status: 'DRAFT' as const },
  ]

  for (const [counselorEmail, counselorRec] of counselorRecords.entries()) {
    // Each counselor gets 3-6 livrables
    const numLivrables = randomInt(3, 6)
    const assignedUserIds = regularUserEmails.slice(0, 5).map((e) => userRecords.get(e)!.id)

    for (let i = 0; i < numLivrables; i++) {
      const template = livrableTemplates[i % livrableTemplates.length]
      const userId = assignedUserIds[i % assignedUserIds.length]
      try {
        await prisma.livrable.create({
          data: {
            counselorId: counselorRec.id,
            userId,
            type: template.type,
            title: `${template.title} — ${USERS.find((u) => u.email === regularUserEmails[i % regularUserEmails.length])?.firstName || ''}`,
            status: template.status,
            fileName: template.fileName || null,
            fileSize: template.fileSize || null,
            content: { generated: template.status === 'COMPLETED', sections: 5 } as any,
          },
        })
        livrableCount++
      } catch {
        // Skip duplicates
      }
    }
  }
  console.log(`   ✅ ${livrableCount} livrables created`)

  // ============ ADDITIONAL DISABILITY REQUESTS ============
  console.log('♿ Creating additional disability requests...')
  const extraDisabilityRequests = [
    { userId: userRecords.get('lucas.moreau@example.com')!.id, region: 'Occitanie', requestType: 'Version audio', description: 'Version audio du Jeu des Pépites — Dyslexie sévère', status: 'PENDING', priority: 'HIGH' },
    { userId: userRecords.get('sarah.konate@example.com')!.id, region: 'Bretagne', requestType: 'Simplification vocabulaire', description: "Simplification du vocabulaire dans le module RIASEC — Déficience intellectuelle légère", status: 'COMPLETED', priority: 'LOW' },
    { userId: userRecords.get('camille.petit@example.com')!.id, region: 'Auvergne-Rhône-Alpes', requestType: 'Temps supplémentaire', description: "Temps majoré pour les exercices — Trouble de l'attention avec hyperactivité", status: 'IN_PROGRESS', priority: 'MEDIUM' },
  ]
  for (const dr of extraDisabilityRequests) {
    try {
      await prisma.disabilityRequest.create({ data: dr })
    } catch {
      // Skip if already exists
    }
  }
  console.log(`   ✅ ${extraDisabilityRequests.length} additional disability requests created`)

  // ============ ACTIVITY LOGS ============
  console.log('📋 Creating activity logs...')
  const actions = [
    { action: 'USER_REGISTERED', userId: null },
    { action: 'LOGIN', userId: userRecords.get('admin@creapulse.fr')!.id },
    { action: 'DIAGNOSIS_STARTED', userId: userRecords.get('marie@example.com')!.id },
    { action: 'MODULE_COMPLETED', userId: userRecords.get('marie@example.com')!.id },
    { action: 'AI_CONVERSATION_STARTED', userId: userRecords.get('conseiller@creapulse.fr')!.id },
    { action: 'LIVRABLE_GENERATED', userId: userRecords.get('conseiller@creapulse.fr')!.id },
    { action: 'USER_REGISTERED', userId: null },
    { action: 'DIAGNOSIS_COMPLETED', userId: userRecords.get('jean-pierre.lambert@example.com')!.id },
    { action: 'GO_NO_GO_DECISION', userId: userRecords.get('jean-pierre.lambert@example.com')!.id },
    { action: 'DISABILITY_REQUEST_CREATED', userId: userRecords.get('ahmed.touzani@example.com')!.id },
    { action: 'MODULE_CONFIG_UPDATED', userId: userRecords.get('admin@creapulse.fr')!.id },
    { action: 'COUNSELOR_ASSIGNED', userId: userRecords.get('conseiller@creapulse.fr')!.id },
    { action: 'AI_CONVERSATION_STARTED', userId: userRecords.get('pierre.dubois@creapulse.fr')!.id },
    { action: 'DIAGNOSIS_STARTED', userId: userRecords.get('fatima.benali@example.com')!.id },
    { action: 'DIAGNOSIS_COMPLETED', userId: userRecords.get('sarah.konate@example.com')!.id },
    { action: 'GO_NO_GO_DECISION', userId: userRecords.get('sarah.konate@example.com')!.id },
    { action: 'SKILL_GAP_ANALYZED', userId: userRecords.get('isabelle.roux@example.com')!.id },
    { action: 'LIVRABLE_GENERATED', userId: userRecords.get('claire.lefevre@creapulse.fr')!.id },
    { action: 'LOGIN', userId: userRecords.get('superadmin@creapulse.fr')!.id },
    { action: 'TERRITORY_STATS_UPDATED', userId: null },
    { action: 'USER_REGISTERED', userId: null },
    { action: 'NOTIFICATION_SENT', userId: userRecords.get('nadia.cherif@example.com')!.id },
    { action: 'ACCESSIBILITY_SETTINGS_UPDATED', userId: userRecords.get('jean-pierre.lambert@example.com')!.id },
    { action: 'DIAGNOSIS_COMPLETED', userId: userRecords.get('nadia.cherif@example.com')!.id },
  ]

  await prisma.activityLog.createMany({
    data: actions.map((a, i) => ({
      ...a,
      details: { timestamp: daysAgo(i).toISOString() },
      createdAt: daysAgo(i),
    })),
  })
  console.log(`   ✅ ${actions.length} activity logs created`)

  // ============ SUMMARY ============
  console.log('\n🎉 Seed completed successfully!\n')
  console.log('Database summary:')
  const counts = {
    users: await prisma.user.count(),
    counselors: await prisma.counselor.count(),
    territories: await prisma.territory.count(),
    moduleConfigs: await prisma.moduleConfig.count(),
    diagnosisSessions: await prisma.diagnosisSession.count(),
    moduleResults: await prisma.moduleResult.count(),
    kiviatResults: await prisma.kiviatResult.count(),
    riasecResults: await prisma.riasecResult.count(),
    swipeGameResults: await prisma.swipeGameResult.count(),
    keywordSelections: await prisma.keywordSelection.count(),
    notifications: await prisma.notification.count(),
    disabilityRequests: await prisma.disabilityRequest.count(),
    aiConversations: await prisma.aiConversation.count(),
    aiMessages: await prisma.aiMessage.count(),
    livrables: await prisma.livrable.count(),
    counselorAssignments: await prisma.counselorAssignment.count(),
    accessibilitySettings: await prisma.accessibilitySetting.count(),
    skillGapAnalyses: await prisma.skillGapAnalysis.count(),
    activityLogs: await prisma.activityLog.count(),
  }

  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table}: ${count}`)
  }

  console.log('\n📋 Test accounts:')
  console.log('  Admin:        admin@creapulse.fr / superadmin@creapulse.fr')
  console.log('  Conseillers:  conseiller@creapulse.fr / pierre.dubois@creapulse.fr / claire.lefevre@creapulse.fr / marc.petit@creapulse.fr')
  console.log('  Utilisateurs: marie@example.com / jean-pierre.lambert@example.com / fatima.benali@example.com / lucas.moreau@example.com / sarah.konate@example.com / ahmed.touzani@example.com / isabelle.roux@example.com / thomas.bernard@example.com / nadia.cherif@example.com / paul.girard@example.com / camille.petit@example.com / francois.dumont@example.com')
  console.log('  Password:     password123 (all accounts)')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
