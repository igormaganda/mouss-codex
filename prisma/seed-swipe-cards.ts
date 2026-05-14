import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Gradients for visual variety
const gradients = [
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-rose-400 to-pink-500",
  "from-violet-400 to-purple-500",
  "from-sky-400 to-blue-500",
  "from-lime-400 to-green-500",
  "from-fuchsia-400 to-rose-500",
  "from-cyan-400 to-sky-500",
  "from-yellow-400 to-amber-500",
  "from-indigo-400 to-violet-500",
];

// Helper: slugify
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// =====================================================
// PEPITES — 100 soft skills
// =====================================================
const pepites: {
  title: string;
  description: string;
  icon: string;
}[] = [
  { title: "Leadership", description: "Savoir diriger, motiver et inspirer une équipe vers un objectif commun.", icon: "👑" },
  { title: "Créativité", description: "Générer des idées originales et innovantes pour résoudre des problèmes.", icon: "💡" },
  { title: "Gestion du stress", description: "Rester calme et efficace même dans les situations de forte pression.", icon: "🧘" },
  { title: "Communication", description: "Transmettre ses idées clairement à l'oral comme à l'écrit.", icon: "🗣️" },
  { title: "Résolution de problèmes", description: "Analyser les difficultés et trouver des solutions efficaces rapidement.", icon: "🧩" },
  { title: "Empathie", description: "Comprendre et partager les émotions et les besoins des autres.", icon: "❤️" },
  { title: "Adaptabilité", description: "S'ajuster rapidement aux changements et aux nouvelles situations.", icon: "🔄" },
  { title: "Esprit d'équipe", description: "Collaborer efficacement avec les autres pour atteindre un objectif commun.", icon: "🤝" },
  { title: "Prise de décision", description: "Faire des choix éclairés même en situation d'incertitude.", icon: "🎯" },
  { title: "Gestion du temps", description: "Organiser et prioriser ses activités pour optimiser sa productivité.", icon: "⏰" },
  { title: "Négociation", description: "Trouver des compromis satisfaisants pour toutes les parties prenantes.", icon: "🤲" },
  { title: "Persuasion", description: "Convaincre autrui avec des arguments solides et une attitude engageante.", icon: "💪" },
  { title: "Écoute active", description: "Prêter une attention totale et bienveillante à son interlocuteur.", icon: "👂" },
  { title: "Confiance en soi", description: "Croire en ses capacités et les exprimer avec assurance.", icon: "✨" },
  { title: "Initiative", description: "Agir de sa propre initiative sans attendre qu'on le demande.", icon: "🚀" },
  { title: "Organisation", description: "Structurer son travail et son environnement de manière optimale.", icon: "📋" },
  { title: "Sens de l'humour", description: "Utiliser l'humour pour désamorcer les tensions et créer du lien.", icon: "😄" },
  { title: "Patience", description: "Maintenir son calme et sa persévérance face aux obstacles.", icon: "⏳" },
  { title: "Résilience", description: "Rebondir après un échec et en tirer des leçons constructives.", icon: "🌿" },
  { title: "Curiosité", description: "S'intéresser activement à de nouveaux domaines et apprendre continuellement.", icon: "🔍" },
  { title: "Ouverture d'esprit", description: "Accepter et valoriser les perspectives et les cultures différentes.", icon: "🌍" },
  { title: "Sens critique", description: "Évaluer les informations avec objectivité et discernement.", icon: "🧠" },
  { title: "Flexibilité", description: "Moduler ses approches et ses horaires selon les besoins.", icon: "🧘‍♀️" },
  { title: "Autonomie", description: "Travailler de manière indépendante avec peu de supervision.", icon: "🧭" },
  { title: "Coopération", description: "Contribuer activement au succès collectif en s'investissant pleinement.", icon: "🤝" },
  { title: "Délégation", description: "Confier les bonnes tâches aux bonnes personnes en toute confiance.", icon: "📤" },
  { title: "Gestion des priorités", description: "Identifier et traiter en premier ce qui a le plus d'impact.", icon: "📊" },
  { title: "Sens du détail", description: "Porter une attention minutieuse à la qualité de chaque élément.", icon: "🔍" },
  { title: "Proactivité", description: "Anticiper les problèmes et agir avant qu'ils ne surviennent.", icon: "⚡" },
  { title: "Vision stratégique", description: "Penser à long terme et aligner les actions sur des objectifs globaux.", icon: "🔭" },
  { title: "Intelligence émotionnelle", description: "Reconnaître et gérer ses propres émotions et celles des autres.", icon: "💎" },
  { title: "Persévérance", description: "Maintenir ses efforts malgré les difficultés et les revers.", icon: "🏔️" },
  { title: "Optimisme", description: "Aborder les situations avec une attitude positive et constructive.", icon: "☀️" },
  { title: "Intégrité", description: "Agir avec honnêteté et respecter ses engagements moraux.", icon: "⚖️" },
  { title: "Savoir-faire relationnel", description: "Construire et entretenir des relations professionnelles de qualité.", icon: "🫂" },
  { title: "Assertivité", description: "Exprimer ses besoins et opinions fermement mais respectueusement.", icon: "📣" },
  { title: "Gestion des conflits", description: "Résoudre les désaccords de manière pacifique et constructive.", icon: "🕊️" },
  { title: "Esprit d'analyse", description: "Décomposer un problème complexe en éléments simples et actionnables.", icon: "🔬" },
  { title: "Capacité d'apprentissage", description: "Acquérir rapidement de nouvelles compétences et connaissances.", icon: "📚" },
  { title: "Sens des responsabilités", description: "Assumer pleinement les conséquences de ses actes et décisions.", icon: "🛡️" },
  { title: "Créativité visuelle", description: "Imaginer et concevoir des visuels impactants et mémorables.", icon: "🎨" },
  { title: "Présentation orale", description: "Livrer des présentations claires, engageantes et convaincantes.", icon: "🎤" },
  { title: "Networking", description: "Construire et développer un réseau professionnel solide et utile.", icon: "🌐" },
  { title: "Gestion de projet", description: "Piloter un projet de A à Z en respectant les délais et le budget.", icon: "📐" },
  { title: "Esprit de synthèse", description: "Résumer des informations complexes de manière claire et concise.", icon: "📝" },
  { title: "Réactivité", description: "Répondre rapidement et efficacement aux demandes et imprévus.", icon: "⚡" },
  { title: "Pédagogie", description: "Expliquer des concepts complexes de manière simple et accessible.", icon: "🎓" },
  { title: "Sens de l'accueil", description: "Recevoir les clients ou partenaires avec chaleur et professionnalisme.", icon: "🏠" },
  { title: "Rigueur", description: "Travailler avec précision et conformité aux standards établis.", icon: "📐" },
  { title: "Force de conviction", description: "Emporter l'adhésion grâce à des arguments et une posture solides.", icon: "💥" },
  { title: "Capacité de concentration", description: "Maintenir son attention sur une tâche sur une période prolongée.", icon: "🎯" },
  { title: "Facilitation", description: "Animer des réunions et ateliers pour favoriser la participation de tous.", icon: "🎪" },
  { title: "Mentorat", description: "Accompagner et guider des personnes moins expérimentées.", icon: "🧑‍🏫" },
  { title: "Gestion financière de base", description: "Comprendre et gérer les bases de la comptabilité et des budgets.", icon: "💶" },
  { title: "Polyvalence", description: "Être capable d'occuper différents rôles et fonctions.", icon: "🔧" },
  { title: "Observation", description: "Repérer les détails et les tendances que les autres ne voient pas.", icon: "👁️" },
  { title: "Sens de l'esthétique", description: "Avoir le goût du beau et de l'harmonie visuelle.", icon: "🌸" },
  { title: "Capacité d'abstraction", description: "Penser au-delà du concret pour concevoir des modèles et concepts.", icon: "💭" },
  { title: "Discrétion", description: "Garder les informations confidentielles avec professionnalisme.", icon: "🔒" },
  { title: "Motivation", description: "Maintenir un haut niveau d'énergie et d'engagement au quotidien.", icon: "🔥" },
  { title: "Humilité", description: "Reconnaître ses limites et accepter les retours constructifs.", icon: "🙏" },
  { title: "Ténacité", description: "Poursuivre ses objectifs avec détermination malgré les obstacles.", icon: "🪨" },
  { title: "Sens du service", description: "Placer la satisfaction du client ou de l'usager au cœur de ses priorités.", icon: "💝" },
  { title: "Esprit de compétition", description: "Utiliser la compétition comme moteur de dépassement personnel.", icon: "🏆" },
  { title: "Capacité d'adaptation interculturelle", description: "Travailler efficacement avec des personnes de cultures différentes.", icon: "🌏" },
  { title: "Sens de l'anticipation", description: "Prévoir les évolutions et se préparer en conséquence.", icon: "🔮" },
  { title: "Diplomatie", description: "Gérer les situations sensibles avec tact et doigté.", icon: "🕊️" },
  { title: "Esprit d'entrepreneuriat", description: "Identifier des opportunités et prendre des risques calculés.", icon: "🌱" },
  { title: "Gestion de l'énergie", description: "Savoir distribuer ses efforts pour éviter le surmenage.", icon: "🔋" },
  { title: "Sens de l'éthique", description: "Prendre des décisions alignées avec des valeurs morales fortes.", icon: "⚖️" },
  { title: "Capacité de rebond", description: "Se remettre rapidement d'un échec et repartir de plus belle.", icon: "🏅" },
  { title: "Esprit de logique", description: "Raisonner de manière structurée et cohérente.", icon: "🧩" },
  { title: "Gestion des émotions", description: "Canaliser ses émotions pour ne pas interférer avec le travail.", icon: "🌊" },
  { title: "Sens de la hiérarchie", description: "Respecter la chaîne de commandement tout en apportant sa contribution.", icon: "🏛️" },
  { title: "Capacité de recul", description: "Prendre du recul pour analyser objectivement une situation.", icon: "🔭" },
  { title: "Esprit de découverte", description: "Explorer de nouveaux territoires, idées ou marchés avec enthousiasme.", icon: "🧭" },
  { title: "Connaissance de soi", description: "Identifier ses forces, faiblesses et axes de progression.", icon: "🪞" },
  { title: "Accueil du feedback", description: "Recevoir et exploiter les critiques de manière constructive.", icon: "💬" },
  { title: "Capacité à déléguer", description: "Reconnaître quand confier une tâche pour mieux se concentrer.", icon: "🤝" },
  { title: "Modération", description: "Agir avec mesure et équilibre dans toutes les situations.", icon: "⚖️" },
  { title: "Tolérance", description: "Accepter les différences sans porter de jugement hâtif.", icon: "🤗" },
  { title: "Sens de la célébration", description: "Reconnaître et fêter les succès, même les plus petits.", icon: "🎉" },
  { title: "Capacité d'influence", description: "Impacter positivement les décisions et comportements des autres.", icon: "🌟" },
  { title: "Sens du collectif", description: "Placer l'intérêt du groupe au-dessus de ses intérêts personnels.", icon: "👥" },
  { title: "Capacité d'innovation", description: "Proposer des approches nouvelles et perturbatrices dans son domaine.", icon: "🚀" },
  { title: "Esprit méthodique", description: "Appliquer une approche structurée et réfléchie à chaque tâche.", icon: "📋" },
  { title: "Gestion de l'imprévu", description: "Faire face aux situations inattendues avec calme et créativité.", icon: "🌪️" },
  { title: "Sens de l'engagement", description: "S'investir pleinement dans ses missions et responsabilités.", icon: "📌" },
  { title: "Sens de l'effort", description: "Accepter de travailler dur pour atteindre des résultats concrets.", icon: "💪" },
  { title: "Pragmatisme", description: "Faire preuve de réalisme et privilégier les solutions concrètes.", icon: "🪨" },
  { title: "Gestion du changement", description: "Accompagner et faciliter les transitions au sein d'une organisation.", icon: "🔄" },
  { title: "Savoir-être", description: "Adopter une attitude professionnelle et positive en toute circonstance.", icon: "🌟" },
  { title: "Capacité de planification", description: "Organiser ses activités à l'avance pour maximiser l'efficacité.", icon: "📅" },
  { title: "Agilité mentale", description: "Pivoter rapidement entre différentes tâches et priorités.", icon: "🧠" },
  { title: "Force de travail", description: "Produire un effort soutenu et régulier dans la durée.", icon: "⚒️" },
  { title: "Sens du contact", description: "Établir facilement une relation de confiance avec les inconnus.", icon: "👋" },
  { title: "Éloquence", description: "S'exprimer avec clarté, fluidité et force de conviction.", icon: "🗣️" },
  { title: "Esprit de détail", description: "Porter une attention fine à chaque aspect de son travail.", icon: "🔎" },
  { title: "Gestion des priorités multiples", description: "Juger efficacement entre plusieurs urgences concurrentes.", icon: "🎯" },
  { title: "Sens du parcours client", description: "Comprendre et optimiser chaque étape de l'expérience client.", icon: "🛤️" },
];

// =====================================================
// APPETENCES — 100 motivations/aspirations
// =====================================================
const appetences: {
  title: string;
  description: string;
  icon: string;
}[] = [
  { title: "Indépendance", description: "Être son propre patron et prendre ses décisions en toute liberté.", icon: "🦅" },
  { title: "Impact social", description: "Contribuer positivement à la société et à la communauté.", icon: "🌍" },
  { title: "Innovation", description: "Créer des produits ou services qui changent les règles du jeu.", icon: "💡" },
  { title: "Création de valeur", description: "Générer de la richesse économique et intellectuelle.", icon: "💰" },
  { title: "Liberté géographique", description: "Travailler de n'importe où dans le monde, sans contrainte de lieu.", icon: "🗺️" },
  { title: "Transmission", description: "Partager son savoir et son expérience avec les générations futures.", icon: "📖" },
  { title: "Reconnaissance", description: "Être reconnu pour son expertise et ses accomplissements.", icon: "🏅" },
  { title: "Équilibre vie pro/perso", description: "Concilier carrière professionnelle et vie personnelle épanouie.", icon: "⚖️" },
  { title: "Apprentissage continu", description: "Enrichir constamment ses compétences et ses connaissances.", icon: "🎓" },
  { title: "Dépassement de soi", description: "Repousser ses limites et réaliser des objectifs ambitieux.", icon: "🏔️" },
  { title: "Entrepreneuriat social", description: "Créer une entreprise avec une mission sociale ou environnementale.", icon: "🌱" },
  { title: "Sécurité financière", description: "Construire un revenu stable et pérenne sur le long terme.", icon: "🏦" },
  { title: "Créativité artistique", description: "Exprimer son talent artistique à travers son activité professionnelle.", icon: "🎨" },
  { title: "Collaboration", description: "Travailler avec des personnes inspirantes et complémentaires.", icon: "🤝" },
  { title: "Autonomie décisionnelle", description: "Prendre toutes les décisions stratégiques sans validation hiérarchique.", icon: "🎯" },
  { title: "Changement de mode de vie", description: "Transformer radicalement son quotidien pour plus d'épanouissement.", icon: "🦋" },
  { title: "Développement local", description: "Contribuer au dynamisme économique de son territoire.", icon: "🏘️" },
  { title: "Expertise technique", description: "Devenir une référence incontournable dans son domaine technique.", icon: "⚙️" },
  { title: "Flexibilité horaire", description: "Choisir ses horaires de travail selon ses préférences.", icon: "🕐" },
  { title: "Accompagnement", description: "Aider les autres à atteindre leurs objectifs et se réaliser.", icon: "🤗" },
  { title: "Exploration", description: "Découvrir de nouveaux marchés, secteurs ou cultures.", icon: "🧭" },
  { title: "Rentabilité", description: "Maximiser les profits et optimiser la rentabilité de son activité.", icon: "📈" },
  { title: "Impact environnemental", description: "Agir pour la protection de l'environnement et le développement durable.", icon: "🌿" },
  { title: "Leadership communautaire", description: "Devenir un leader reconnu dans sa communauté professionnelle.", icon: "👑" },
  { title: "Transmission de savoir-faire", description: "Enseigner son métier et former la prochaine génération.", icon: "👨‍🏫" },
  { title: "Simplification", description: "Rendre la vie plus simple pour ses clients au quotidien.", icon: "✨" },
  { title: "Pionnier", description: "Être parmi les premiers à explorer un nouveau marché ou concept.", icon: "🚀" },
  { title: "Qualité de vie", description: "Prioriser son bien-être et sa santé dans ses choix professionnels.", icon: "💝" },
  { title: "Pérennité", description: "Construire un projet durable qui traverse les générations.", icon: "🏛️" },
  { title: "Stimulation intellectuelle", description: "Être constamment challengeé mentalement dans son travail.", icon: "🧠" },
  { title: "Différenciation", description: "Se démarquer de la concurrence par une offre unique.", icon: "💎" },
  { title: "Philanthropie", description: "Utiliser sa réussite pour soutenir des causes importantes.", icon: "💝" },
  { title: "Intrapreneuriat", description: "Innover de l'intérieur d'une organisation existante.", icon: "🏢" },
  { title: "Réputation", description: "Bâtir une image de marque forte et respectée sur son marché.", icon: "⭐" },
  { title: "Activité manuelle", description: "Travailler de ses mains et créer des objets tangibles.", icon: "🔨" },
  { title: "Fractionnement du travail", description: "Découper son activité en plusieurs projets variés.", icon: "🧩" },
  { title: "Scalabilité", description: "Construire un modèle facilement duplicable et expansible.", icon: "📊" },
  { title: "Artisanat d'art", description: "Pratiquer un métier d'art et perpétuer un savoir-faire ancestral.", icon: "🏺" },
  { title: "Mobilité", description: "Pouvoir travailler en déplacement et être nomade.", icon: "✈️" },
  { title: "Transformation digitale", description: "Participer à la révolution numérique de son secteur.", icon: "💻" },
  { title: "Santé et bien-être", description: "Promouvoir la santé physique et mentale par son activité.", icon: "🧘" },
  { title: "Éducation", description: "Contribuer à l'éducation et à la formation des individus.", icon: "📚" },
  { title: "Justice sociale", description: "Lutter contre les inégalités par son action entrepreneuriale.", icon: "⚖️" },
  { title: "Passion", description: "Vivre de sa passion et transformer un hobby en métier.", icon: "❤️‍🔥" },
  { title: "Patrimoine", description: "Construire un patrimoine familial ou entrepreneurial durable.", icon: "🏡" },
  { title: "Alimentation durable", description: "Promouvoir une alimentation saine, locale et responsable.", icon: "🥗" },
  { title: "Immobilier", description: "Investir dans l'immobilier et créer de la valeur foncière.", icon: "🏠" },
  { title: "Sécurité juridique", description: "Évoluer dans un cadre légal clair et protecteur.", icon: "📜" },
  { title: "Aventure humaine", description: "Vivre une aventure entrepreneuriale riche en rencontres.", icon: "🎪" },
  { title: "Évasion créative", description: "Utiliser la création comme moyen d'expression et de liberté.", icon: "🎭" },
  { title: "Optimisation", description: "Améliorer continuellement les processus et la performance.", icon: "🔧" },
  { title: "Inclusion", description: "Créer des solutions accessibles à tous, sans discrimination.", icon: "🤝" },
  { title: "Nouvelle expérience", description: "Vivre une expérience professionnelle inédite et formatrice.", icon: "🌟" },
  { title: "Produits locaux", description: "Valoriser les produits et savoir-faire de son terroir.", icon: "🧀" },
  { title: "Démocratisation", description: "Rendre un service premium accessible au plus grand nombre.", icon: "📢" },
  { title: "Économie circulaire", description: "Participer à un modèle de consommation responsable et recyclable.", icon: "♻️" },
  { title: "Bénévolat", description: "Dédier une partie de son temps à des actions bénévoles.", icon: "🤲" },
  { title: "Résilience économique", description: "Créer un business model capable de résister aux crises.", icon: "🛡️" },
  { title: "Esthétique", description: "Créer des produits ou services d'une grande qualité visuelle.", icon: "🌸" },
  { title: "Authenticité", description: "Rester fidèle à ses valeurs et à son identité dans son projet.", icon: "🌟" },
  { title: "Solidarité", description: "Soutenir et entraider les autres entrepreneurs ou créateurs.", icon: "🫂" },
  { title: "Tech for good", description: "Utiliser la technologie pour résoudre des problèmes sociétaux.", icon: "🤖" },
  { title: "Évasion sensorielle", description: "Offrir des expériences uniques qui sollicitent les sens.", icon: "🎪" },
  { title: "Fédération", description: "Rassembler une communauté autour d'un projet ou d'une cause.", icon: "👥" },
  { title: "Simplicité", description: "Prôner la simplicité dans ses produits et sa manière de travailler.", icon: "✨" },
  { title: "Challenge sportif", description: "Intégrer le sport ou le dépassement physique dans son projet.", icon: "🏃" },
  { title: "Animalerie", description: "Travailler avec ou pour les animaux avec passion.", icon: "🐾" },
  { title: "Minimalisme", description: "Adopter une approche minimaliste dans sa vie et son business.", icon: "🤍" },
  { title: "Oenologie", description: "Se consacrer au monde du vin et de la gastronomie.", icon: "🍷" },
  { title: "Art de vivre", description: "Promouvoir un art de vivre français reconnu mondialement.", icon: "🥐" },
  { title: "Renouveau", description: "Donner une seconde vie à des traditions ou des savoir-faire oubliés.", icon: "🔄" },
  { title: "Héritage culturel", description: "Préserver et valoriser le patrimoine culturel de sa région.", icon: "🏛️" },
  { title: "Micro-entrepreneuriat", description: "Lancer une petite activité avec un modèle léger et agile.", icon: "🌱" },
  { title: "Coopération inter-entreprises", description: "Collaborer avec d'autres entreprises pour créer de la valeur.", icon: "🔗" },
  { title: "Gastronomie", description: "Cultiver l'excellence culinaire et le goût du bien manger.", icon: "👨‍🍳" },
  { title: "Bienveillance", description: "Placer la bienveillance au cœur de sa relation avec les clients.", icon: "🌸" },
  { title: "Frugalité", description: "Faire plus avec moins, en optimisant les ressources.", icon: "♻️" },
  { title: "Haute technologie", description: "Travailler à la pointe de l'innovation technologique.", icon: "🔬" },
  { title: "Reconversion", description: "Opérer un changement de carrière radical et réussi.", icon: "🔀" },
  { title: "Empowerment", description: "Donner du pouvoir et de l'autonomie à ses collaborateurs ou clients.", icon: "💪" },
  { title: "Urbanisme", description: "Contribuer à l'amélioration du cadre de vie urbain.", icon: "🏙️" },
  { title: "Slow business", description: "Privilégier la qualité et la durabilité à la croissance rapide.", icon: "🐢" },
  { title: "Création de contenu", description: "Produire du contenu qui informe, divertit ou inspire.", icon: "📝" },
  { title: "Recherche scientifique", description: "Contribuer à l'avancée des connaissances scientifiques.", icon: "🔬" },
  { title: "Souveraineté", description: "Préserver son indépendance face aux grandes plateformes.", icon: "🏰" },
  { title: "Influence numérique", description: "Bâtir une présence en ligne forte et impactante.", icon: "📱" },
  { title: "Artisanat du goût", description: "Créer des produits alimentaires artisanaux de qualité exceptionnelle.", icon: "🧀" },
  { title: "Numérique responsable", description: "Utiliser le numérique de manière éthique et durable.", icon: "🌱" },
  { title: "Mécénat", description: "Soutenir financièrement des causes culturelles ou sociales.", icon: "💝" },
  { title: "Sport professionnel", description: "Transformer sa passion sportive en carrière professionnelle.", icon: "⚽" },
  { title: "Mode et textile", description: "Créer des collections et des marques dans l'univers de la mode.", icon: "👗" },
  { title: "Design d'espace", description: "Concevoir des intérieurs et des espaces fonctionnels et esthétiques.", icon: "🏠" },
  { title: "Édition", description: "Publier des livres ou des contenus éditoriaux de qualité.", icon: "📖" },
  { title: "Humanitaire", description: "Consacrer son énergie à des missions d'aide humanitaire.", icon: "🤝" },
  { title: "Jeux vidéo", description: "Créer des jeux vidéo captivants et innovants.", icon: "🎮" },
  { title: "Obsolescence programmée", description: "Lutter contre le gaspillage en créant des produits réparables.", icon: "♻️" },
  { title: "Littérature", description: "Écrire et publier des œuvres littéraires.", icon: "✒️" },
  { title: "Santé mentale", description: "Promouvoir le bien-être psychologique et l'accompagnement.", icon: "🧠" },
  { title: "Design produit", description: "Concevoir des produits innovants centrés sur l'utilisateur.", icon: "📦" },
  { title: "Création artistique", description: "Exprimer sa vision artistique à travers son activité professionnelle.", icon: "🎨" },
];

// =====================================================
// COMPETENCES — 100 hard skills
// =====================================================
const competences: {
  title: string;
  description: string;
  icon: string;
}[] = [
  { title: "Marketing digital", description: "Maîtriser les leviers du marketing en ligne pour acquérir et fidéliser des clients.", icon: "📱" },
  { title: "Comptabilité", description: "Tenir et gérer la comptabilité d'une entreprise de manière rigoureuse.", icon: "🧮" },
  { title: "Gestion de projet", description: "Piloter des projets complexes en maîtrisant planning, budget et ressources.", icon: "📊" },
  { title: "Développement web", description: "Concevoir et développer des sites et applications web performants.", icon: "💻" },
  { title: "Design graphique", description: "Créer des visuels professionnels pour la communication et le branding.", icon: "🎨" },
  { title: "Vente", description: "Développer le chiffre d'affaires par des techniques de vente efficaces.", icon: "💰" },
  { title: "Logistique", description: "Organiser et optimiser la chaîne d'approvisionnement et les livraisons.", icon: "🚚" },
  { title: "Ressources humaines", description: "Gérer le recrutement, la formation et le développement des talents.", icon: "👥" },
  { title: "Finance", description: "Analyser les données financières et optimiser la gestion de trésorerie.", icon: "🏦" },
  { title: "Data analysis", description: "Exploiter les données pour prendre des décisions stratégiques éclairées.", icon: "📈" },
  { title: "SEO / Référencement", description: "Optimiser la visibilité d'un site web sur les moteurs de recherche.", icon: "🔍" },
  { title: "Réseaux sociaux", description: "Gérer et animer les présence sur les réseaux sociaux.", icon: "📲" },
  { title: "Rédaction web", description: "Écrire des contenus optimisés pour le web et le référencement.", icon: "✍️" },
  { title: "Photographie", description: "Capturer des images professionnelles pour la communication visuelle.", icon: "📸" },
  { title: "Montage vidéo", description: "Monter et éditer des vidéos pour les réseaux sociaux et le web.", icon: "🎬" },
  { title: "Excel avancé", description: "Maîtriser les fonctions avancées d'Excel pour l'analyse de données.", icon: "📊" },
  { title: "Droit des affaires", description: "Connaître le cadre juridique applicable aux entreprises.", icon: "⚖️" },
  { title: "Community management", description: "Animer et développer une communauté en ligne engagée.", icon: "💬" },
  { title: "Email marketing", description: "Concevoir et gérer des campagnes d'emailing performantes.", icon: "📧" },
  { title: "UX Design", description: "Concevoir des interfaces utilisateur intuitives et agréables.", icon: "🎯" },
  { title: "Développement mobile", description: "Créer des applications mobiles natives ou cross-platform.", icon: "📲" },
  { title: "Cybersécurité", description: "Protéger les systèmes et données contre les menaces informatiques.", icon: "🔒" },
  { title: "Intelligence artificielle", description: "Utiliser les technologies d'IA pour automatiser et innover.", icon: "🤖" },
  { title: "Gestion de stock", description: "Optimiser les niveaux de stock et les approvisionnements.", icon: "📦" },
  { title: "Facturation", description: "Établir et gérer les factures et le suivi des paiements.", icon: "🧾" },
  { title: "Négociation commerciale", description: "Conduire des négociations commerciales pour conclure des accords.", icon: "🤝" },
  { title: "Formation professionnelle", description: "Concevoir et animer des sessions de formation adaptées.", icon: "🎓" },
  { title: "Traduction", description: "Traduire des contenus entre différentes langues avec précision.", icon: "🌐" },
  { title: "Coaching", description: "Accompagner des individus ou équipes vers l'atteinte de leurs objectifs.", icon: "🎯" },
  { title: "Boulangerie / Pâtisserie", description: "Maîtriser les techniques de fabrication du pain et de la pâtisserie.", icon: "🥐" },
  { title: "Cuisine / Gastronomie", description: "Préparer des plats raffinés et maîtriser les techniques culinaires.", icon: "👨‍🍳" },
  { title: "Plomberie", description: "Installer et réparer les systèmes de plomberie et sanitaire.", icon: "🔧" },
  { title: "Électricité", description: "Installer et entretenir les installations électriques.", icon: "⚡" },
  { title: "Menuiserie", description: "Fabriquer et installer des ouvrages en bois sur mesure.", icon: "🪚" },
  { title: "Peinture en bâtiment", description: "Préparer et appliquer les revêtements de peinture sur tous supports.", icon: "🖌️" },
  { title: "Maçonnerie", description: "Construire et réparer des murs, fondations et structures.", icon: "🧱" },
  { title: "Couverture", description: "Installer et réparer les toitures et systèmes d'étanchéité.", icon: "🏠" },
  { title: "Carrelage", description: "Poser des carrelages et revêtements de sol avec précision.", icon: "🔲" },
  { title: "Jardinage / Paysagisme", description: "Concevoir et entretenir des espaces verts harmonieux.", icon: "🌻" },
  { title: "Coiffure", description: "Maîtriser les techniques de coupe, coloration et coiffage.", icon: "💇" },
  { title: "Esthétique", description: "Réaliser des soins beauté et des techniques de maquillage.", icon: "💄" },
  { title: "Massage / Bien-être", description: "Pratiquer des techniques de massage et de relaxation.", icon: "💆" },
  { title: "Conduite", description: "Conduite professionnelle de véhicules légers ou poids lourds.", icon: "🚛" },
  { title: "Coursier / Livraison", description: "Organiser et effectuer des livraisons rapides et fiables.", icon: "📦" },
  { title: "Nettoyage professionnel", description: "Assurer l'entretien et le nettoyage de locaux professionnels.", icon: "🧹" },
  { title: "Garde d'enfants", description: "Accompagner et superviser des enfants en toute sécurité.", icon: "👶" },
  { title: "Aide à domicile", description: "Assister les personnes âgées ou dépendantes dans leur quotidien.", icon: "🏠" },
  { title: "Soudure", description: "Réaliser des soudures de qualité sur différents matériaux.", icon: "🔥" },
  { title: "Mécanique automobile", description: "Diagnostiquer et réparer les véhicules automobiles.", icon: "🚗" },
  { title: "Mécanique moto", description: "Entretenir et réparer les motos et autres deux-roues.", icon: "🏍️" },
  { title: "Installation thermique", description: "Installer et maintenir les systèmes de chauffage et climatisation.", icon: "🌡️" },
  { title: "Photographie professionnelle", description: "Capturer des images de haute qualité pour des clients professionnels.", icon: "📷" },
  { title: "Vidéo professionnelle", description: "Produire des films et vidéos pour des projets commerciaux.", icon: "🎥" },
  { title: "Sonorisation", description: "Gérer les systèmes audio pour des événements ou studios.", icon: "🎤" },
  { title: "Événementiel", description: "Organiser et coordonner des événements professionnels ou privés.", icon: "🎪" },
  { title: "Tourisme", description: "Concevoir et vendre des offres touristiques et voyages.", icon: "✈️" },
  { title: "Hôtellerie", description: "Gérer l'accueil et le service dans les établissements hôteliers.", icon: "🏨" },
  { title: "Restauration", description: "Gérer un restaurant ou un service de restauration.", icon: "🍽️" },
  { title: "Agriculture", description: "Cultiver la terre et gérer une exploitation agricole.", icon: "🌾" },
  { title: "Viticulture", description: "Cultiver la vigne et produire du vin de qualité.", icon: "🍇" },
  { title: "Élevage", description: "Gérer un troupeau et assurer le bien-être des animaux.", icon: "🐄" },
  { title: "Apiculture", description: "Élever des abeilles et produire du miel et autres produits.", icon: "🐝" },
  { title: "Bricolage / DIY", description: "Réaliser soi-même des travaux d'aménagement et de rénovation.", icon: "🛠️" },
  { title: "Imprimerie", description: "Gérer des travaux d'impression offset ou numérique.", icon: "🖨️" },
  { title: "Conception 3D", description: "Modéliser des objets en 3D pour l'impression ou l'industrie.", icon: "🎲" },
  { title: "Impression 3D", description: "Utiliser des imprimantes 3D pour fabriquer des objets.", icon: "🖨️" },
  { title: "Infographie", description: "Créer des visuels et illustrations numériques professionnels.", icon: "🖼️" },
  { title: "Motion design", description: "Créer des animations et des visuels en mouvement.", icon: "🎞️" },
  { title: "Tapisserie d'ameublement", description: "Restaurer et créer des revêtements textiles pour meubles.", icon: "🛋️" },
  { title: "Ferronnerie", description: "Travailler le métal pour créer des structures décoratives.", icon: "⛓️" },
  { title: "Céramique", description: "Façonner la argile pour créer des objets en céramique.", icon: "🏺" },
  { title: "Reliure", description: "Relier et restaurer des livres avec des techniques artisanales.", icon: "📕" },
  { title: "Verrerie", description: "Souffler et façonner le verre pour créer des objets uniques.", icon: "🍾" },
  { title: "Maroquinerie", description: "Créer des objets en cuir avec des techniques artisanales.", icon: "👜" },
  { title: "Horlogerie", description: "Assembler et réparer des montres et mécanismes horlogers.", icon: "⌚" },
  { title: "Droit du travail", description: "Connaître et appliquer la réglementation du travail.", icon: "📋" },
  { title: "Fiscalité", description: "Maîtriser les impôts et optimiser la charge fiscale.", icon: "🧾" },
  { title: "Immobilier", description: "Gérer les transactions et la mise en valeur de biens immobiliers.", icon: "🏠" },
  { title: "Assurance", description: "Conseiller et vendre des contrats d'assurance adaptés.", icon: "🛡️" },
  { title: "Banque", description: "Gérer les opérations bancaires et le conseil financier.", icon: "🏦" },
  { title: "Commerce de détail", description: "Gérer un point de vente et optimiser l'expérience client.", icon: "🏪" },
  { title: "E-commerce", description: "Créer et gérer une boutique en ligne performante.", icon: "🛒" },
  { title: "Supply chain", description: "Optimiser l'ensemble de la chaîne d'approvisionnement.", icon: "🔗" },
  { title: "Qualité", description: "Garantir la conformité aux normes qualité et certifications.", icon: "✅" },
  { title: "Sécurité au travail", description: "Prévenir les risques professionnels et assurer la sécurité.", icon: "⛑️" },
  { title: "Droit de la propriété intellectuelle", description: "Protéger ses créations par des brevets, marques et copyrights.", icon: "©️" },
  { title: "Cloud computing", description: "Déployer et gérer des solutions dans le cloud.", icon: "☁️" },
  { title: "DevOps", description: "Automatiser les processus de développement et de déploiement.", icon: "⚙️" },
  { title: "Bases de données", description: "Concevoir et administrer des bases de données performantes.", icon: "🗄️" },
  { title: "UI Design", description: "Concevoir des interfaces visuelles attrayantes et cohérentes.", icon: "🎨" },
  { title: "Copywriting", description: "Rédiger des textes persuasifs pour la vente et le marketing.", icon: "✍️" },
  { title: "Gestion des médias", description: "Gérer les relations avec les médias et la presse.", icon: "📰" },
  { title: "Podcasting", description: "Créer et animer des podcasts sur des thématiques variées.", icon: "🎙️" },
  { title: "Développement backend", description: "Concevoir et développer la logique serveur et les API.", icon: "⚙️" },
  { title: "Automatisation", description: "Automatiser les tâches répétitives pour gagner du temps.", icon: "🤖" },
  { title: "Analyse de marché", description: "Étudier les tendances et la concurrence pour orienter sa stratégie.", icon: "📊" },
  { title: "Négociation B2B", description: "Conduire des négociations complexes entre entreprises.", icon: "🏢" },
  { title: "Recrutement", description: "Identifier, attirer et sélectionner les meilleurs talents.", icon: "👥" },
  { title: "Gestion de la paie", description: "Administrer les salaires et les charges sociales.", icon: "💶" },
  { title: "Techniques de vente", description: "Maîtriser les méthodes de vente pour maximiser le chiffre d'affaires.", icon: "📞" },
];

function buildCards(
  category: string,
  items: { title: string; description: string; icon: string }[]
) {
  return items.map((item, index) => ({
    id: crypto.randomUUID(),
    category,
    skillId: `${category.toLowerCase()}-${slugify(item.title)}`,
    title: item.title,
    description: item.description,
    icon: item.icon,
    gradient: gradients[index % gradients.length],
    sortOrder: index,
    active: true,
  }));
}

async function main() {
  console.log("🌱 Starting swipe card seeding...\n");

  const allCards = [
    ...buildCards("PEPITES", pepites),
    ...buildCards("APPETENCES", appetences),
    ...buildCards("COMPETENCES", competences),
  ];

  console.log(`📊 Total cards to insert: ${allCards.length}`);
  console.log(`   PEPITES: ${pepites.length}`);
  console.log(`   APPETENCES: ${appetences.length}`);
  console.log(`   COMPETENCES: ${competences.length}`);
  console.log("");

  // Clear existing cards
  console.log("🗑️  Clearing existing swipe cards...");
  await prisma.swipeCard.deleteMany();
  console.log("✅ Existing cards cleared.\n");

  // Insert in batches of 50
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < allCards.length; i += batchSize) {
    const batch = allCards.slice(i, i + batchSize);
    try {
      await prisma.swipeCard.createMany({ data: batch, skipDuplicates: true });
      inserted += batch.length;
      console.log(`✅ Inserted ${inserted}/${allCards.length} cards`);
    } catch (error) {
      console.error(`❌ Error inserting batch starting at index ${i}:`, error);
      // Try one by one for this batch
      for (const card of batch) {
        try {
          await prisma.swipeCard.create({ data: card });
          inserted++;
        } catch (e) {
          console.error(`   ⚠️  Failed to insert card "${card.title}" (${card.skillId}):`, e);
        }
      }
      console.log(`   Batch recovery complete. Total inserted: ${inserted}`);
    }
  }

  // Verify
  const count = await prisma.swipeCard.count();
  const byCategory = await prisma.swipeCard.groupBy({
    by: ["category"],
    _count: true,
  });

  console.log("\n" + "═".repeat(50));
  console.log("📊 FINAL COUNTS:");
  console.log(`   Total: ${count}`);
  for (const cat of byCategory) {
    console.log(`   ${cat.category}: ${cat._count}`);
  }
  console.log("═".repeat(50));
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Fatal error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
