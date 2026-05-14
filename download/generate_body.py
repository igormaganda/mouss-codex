#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CréaPulse - Cahier des Charges Fonctionnelles
Body PDF generated via ReportLab
"""
import sys, os, hashlib
PDF_SKILL_DIR = '/home/z/my-project/skills/pdf'
_scripts = os.path.join(PDF_SKILL_DIR, 'scripts')
if _scripts not in sys.path:
    sys.path.insert(0, _scripts)
from pdf import install_font_fallback

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, CondPageBreak
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus import SimpleDocTemplate
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FONT REGISTRATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
pdfmetrics.registerFont(TTFont('LiberationSerif', '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSerif-Bold', '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'))
pdfmetrics.registerFont(TTFont('Carlito', '/usr/share/fonts/truetype/english/Carlito-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Carlito-Bold', '/usr/share/fonts/truetype/english/Carlito-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('LiberationSerif', normal='LiberationSerif', bold='LiberationSerif-Bold')
registerFontFamily('Carlito', normal='Carlito', bold='Carlito-Bold')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')
install_font_fallback()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# COLOR PALETTE (cascade palette)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE_BG       = colors.HexColor('#f2f2f1')
SECTION_BG    = colors.HexColor('#f1f0ef')
CARD_BG       = colors.HexColor('#eae9e6')
TABLE_STRIPE  = colors.HexColor('#f2f2f0')
HEADER_FILL   = colors.HexColor('#6d6345')
COVER_BLOCK   = colors.HexColor('#827a60')
BORDER        = colors.HexColor('#d4cdb9')
ICON          = colors.HexColor('#a89048')
ACCENT        = colors.HexColor('#542dca')
ACCENT_2      = colors.HexColor('#64be91')
TEXT_PRIMARY   = colors.HexColor('#1a1918')
TEXT_MUTED     = colors.HexColor('#8a8880')
SEM_SUCCESS   = colors.HexColor('#489863')
SEM_WARNING   = colors.HexColor('#9c7f47')
SEM_ERROR     = colors.HexColor('#964d46')
SEM_INFO      = colors.HexColor('#47698c')

TABLE_HEADER_COLOR = HEADER_FILL
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = TABLE_STRIPE

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STYLES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
styles = {}

styles['Title'] = ParagraphStyle(
    name='Title', fontName='Carlito', fontSize=28, leading=34,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceAfter=12
)
styles['TOCTitle'] = ParagraphStyle(
    name='TOCTitle', fontName='Carlito', fontSize=24, leading=30,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceBefore=0, spaceAfter=18
)
styles['H1'] = ParagraphStyle(
    name='H1', fontName='Carlito', fontSize=20, leading=26,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceBefore=18, spaceAfter=10
)
styles['H2'] = ParagraphStyle(
    name='H2', fontName='Carlito', fontSize=15, leading=20,
    textColor=ACCENT, alignment=TA_LEFT, spaceBefore=14, spaceAfter=8
)
styles['H3'] = ParagraphStyle(
    name='H3', fontName='Carlito', fontSize=12, leading=16,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceBefore=10, spaceAfter=6
)
styles['Body'] = ParagraphStyle(
    name='Body', fontName='LiberationSerif', fontSize=10.5, leading=17,
    textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=8,
    firstLineIndent=0
)
styles['BodyIndent'] = ParagraphStyle(
    name='BodyIndent', fontName='LiberationSerif', fontSize=10.5, leading=17,
    textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=8,
    leftIndent=18
)
styles['Bullet'] = ParagraphStyle(
    name='Bullet', fontName='LiberationSerif', fontSize=10.5, leading=17,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceAfter=4,
    leftIndent=24, bulletIndent=12
)
styles['Callout'] = ParagraphStyle(
    name='Callout', fontName='LiberationSerif', fontSize=10.5, leading=17,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceAfter=6,
    leftIndent=24, borderWidth=0, borderColor=ACCENT, borderPadding=8
)
styles['TableHeader'] = ParagraphStyle(
    name='TableHeader', fontName='Carlito', fontSize=10,
    textColor=colors.white, alignment=TA_CENTER
)
styles['TableCell'] = ParagraphStyle(
    name='TableCell', fontName='LiberationSerif', fontSize=10,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, leading=14
)
styles['TableCellCenter'] = ParagraphStyle(
    name='TableCellCenter', fontName='LiberationSerif', fontSize=10,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER, leading=14
)
styles['Caption'] = ParagraphStyle(
    name='Caption', fontName='LiberationSerif', fontSize=9, leading=13,
    textColor=TEXT_MUTED, alignment=TA_CENTER, spaceBefore=3, spaceAfter=6
)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DOC TEMPLATE WITH TOC
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

A4_W, A4_H = A4
output_path = '/home/z/my-project/download/body.pdf'

doc = TocDocTemplate(
    output_path,
    pagesize=A4,
    topMargin=1.0*inch,
    bottomMargin=0.8*inch,
    leftMargin=1.0*inch,
    rightMargin=1.0*inch,
    title='Cahier des Charges - Plateforme SaaS CréaPulse',
    author='France Travail',
    subject='Spécifications Fonctionnelles'
)

available_width = A4_W - 2.0*inch

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# HELPER FUNCTIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/>%s' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

H1_ORPHAN_THRESHOLD = (A4_H - 1.0*inch - 0.8*inch) * 0.15

def add_major_section(text, level=0):
    return [
        CondPageBreak(H1_ORPHAN_THRESHOLD),
        add_heading(text, styles['H1'], level=level),
    ]

def make_table(headers, rows, col_widths=None):
    """Create a styled table with Paragraph cells."""
    data = []
    header_row = [Paragraph('<b>%s</b>' % h, styles['TableHeader']) for h in headers]
    data.append(header_row)
    for row in rows:
        data.append([Paragraph(str(c), styles['TableCell']) for c in row])

    if col_widths is None:
        col_widths = [available_width / len(headers)] * len(headers)
    else:
        total = sum(col_widths)
        if total < available_width * 0.85:
            scale = (available_width * 0.90) / total
            col_widths = [w * scale for w in col_widths]

    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

def safe_keep_together(elements):
    MAX_KEEP_HEIGHT = A4_H * 0.4
    total_h = 0
    for el in elements:
        w, h = el.wrap(available_width, A4_H)
        total_h += h
    if total_h <= MAX_KEEP_HEIGHT:
        return [KeepTogether(elements)]
    elif len(elements) >= 2:
        return [KeepTogether(elements[:2])] + list(elements[2:])
    else:
        return list(elements)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONTENT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story = []

# --- TABLE OF CONTENTS ---
story.append(Paragraph('<b>Table des Matières</b>', styles['TOCTitle']))
toc = TableOfContents()
toc.levelStyles = [
    ParagraphStyle(name='TOCLevel0', fontName='Carlito', fontSize=13, leftIndent=20, leading=22, spaceBefore=6, spaceAfter=2),
    ParagraphStyle(name='TOCLevel1', fontName='LiberationSerif', fontSize=11, leftIndent=40, leading=18, spaceBefore=2, spaceAfter=1),
]
story.append(toc)
story.append(PageBreak())

# ═══════════════════════════════════════
# SECTION 1: Présentation du Projet
# ═══════════════════════════════════════
story.extend(add_major_section('1. Présentation du Projet'))
story.append(add_heading('1.1 Contexte et Vision', styles['H2'], level=1))
story.append(Paragraph(
    "Le projet CréaPulse s'inscrit dans une démarche d'innovation publique visant à moderniser et enrichir le diagnostic entrepreneurial traditionnel. "
    "Face aux évolutions profondes du marché du travail et à l'aspiration croissante des individus pour l'entrepreneuriat, il est devenu indispensable de doter "
    "les demandeurs d'emploi et les porteurs de projet d'outils performants, accessibles et intelligents. La plateforme proposée ici vise à répondre à ce besoin "
    "en offrant une expérience de co-construction intense, mêlant technologies de pointe, intelligence artificielle et expertise humaine.",
    styles['Body']
))
story.append(Paragraph(
    "L'objectif principal est de fournir une plateforme SaaS modulaire permettant aux bénéficiaires de mesurer la viabilité de leur projet entrepreneurial de "
    "manière objective et structurée. À l'issue de cette démarche, chaque porteur de projet doit disposer des éléments nécessaires pour prendre une décision "
    "éclairée entre la poursuite de son projet de création d'entreprise et un retour vers l'emploi salarié. Cette double orientation garantit que le dispositif "
    "ne se limite pas à encourager l'entrepreneuriat, mais sécurise réellement le parcours de chaque individu.",
    styles['Body']
))
story.append(Paragraph(
    "La démarche s'adresse prioritairement aux publics en reconversion professionnelle, aux créateurs potentiels en phase d'exploration, ainsi qu'aux "
    "entrepreneurs souhaitant consolider leur business plan grâce à un accompagnement structuré. Le dispositif est conçu pour s'intégrer dans les parcours "
    "déployés par France Travail et les structures d'accompagnement territoriales, contribuant ainsi à la politique nationale d'activation et de sécurisation "
    "des parcours professionnels.",
    styles['Body']
))

story.append(add_heading('1.2 Objectifs Stratégiques', styles['H2'], level=1))
story.append(Paragraph(
    "Les objectifs stratégiques du projet CréaPulse s'articulent autour de quatre axes fondamentaux qui guident l'ensemble du développement de la plateforme "
    "et définissent les indicateurs de succès du dispositif. Chaque axe traduit une dimension essentielle de la mission de service public assignée au projet.",
    styles['Body']
))

obj_headers = ['Axe', 'Objectif', 'Indicateur Clé']
obj_rows = [
    ['Viabilité', 'Mesurer objectivement la pertinence du projet entrepreneurial du porteur', 'Taux de décision Go/No-Go documenté à l\'issue du diagnostic'],
    ['Accessibilité', 'Garantir un accès inclusif conformément aux standards WCAG 2.1 AA', 'Conformité audit d\'accessibilité avec score supérieur à 90%'],
    ['Personnalisation', 'Offrir un parcours adapté au profil et aux besoins de chaque bénéficiaire', 'Taux de complétion du parcours personnalisé supérieur à 85%'],
    ['Territorialité', 'Déployer une solution modulaire adaptable aux spécificités locales', 'Nombre de territoires pilotes déployés et taux de satisfaction régional'],
]
story.append(Spacer(1, 18))
t = make_table(obj_headers, obj_rows, col_widths=[available_width*0.15, available_width*0.50, available_width*0.35])
story.append(t)
story.append(Paragraph('<i>Tableau 1 : Axes stratégiques et indicateurs de performance du projet CréaPulse</i>', styles['Caption']))
story.append(Spacer(1, 18))

story.append(add_heading('1.3 Parties Prenantes', styles['H2'], level=1))
story.append(Paragraph(
    "Le projet CréaPulse implique un écosystème diversifié de parties prenantes dont les besoins et les attentes doivent être intégrés de manière cohérente "
    "dans la conception de la plateforme. Trois profils principaux ont été identifiés, chacun disposant d'un espace dédié au sein de la solution SaaS. "
    "Le porteur de projet, figure centrale du dispositif, bénéficie d'un accompagnement gamifié et personnalisé. Le conseiller expert du centre d'accompagnement "
    "dispose d'outils d'analyse avancés pour sécuriser la prise de décision. Enfin, l'administrateur France Travail assure la gestion globale et le suivi "
    "de performance du dispositif à l'échelle territoriale.",
    styles['Body']
))

# ═══════════════════════════════════════
# SECTION 2: Spécifications Front-End & Accessibilité
# ═══════════════════════════════════════
story.extend(add_major_section('2. Spécifications Front-End et Accessibilité'))
story.append(Paragraph(
    "L'interface utilisateur de la plateforme CréaPulse est conçue dès l'origine pour répondre aux exigences les plus strictes en matière d'accessibilité "
    "numérique. Conformément aux standards WCAG 2.1 Niveau AA, chaque composant de l'interface est pensé pour garantir une utilisation fluide et confortable "
    "par l'ensemble des publics, y compris les personnes en situation de handicap. Cette démarche inclusive constitue un pilier fondamental du projet, reflétant "
    "l'engagement de France Travail en faveur de l'égalité d'accès aux services publics numériques.",
    styles['Body']
))

story.append(add_heading('2.1 Réglages Visuels', styles['H2'], level=1))
story.append(Paragraph(
    "La plateforme intègre un ensemble de fonctionnalités d'adaptation visuelle permettant à chaque utilisateur de personnaliser l'affichage selon ses besoins "
    "spécifiques. L'agrandissement du texte est disponible jusqu'à trois fois la taille standard, sans altération de la mise en page ni dégradation de la lisibilité "
    "des éléments adjacents. Le curseur agrandi offre une meilleure visibilité et facilite la navigation pour les utilisateurs souffrant de troubles de la motricité "
    "fine ou de déficience visuelle. L'inversion des couleurs et l'ajustement des contrastes permettent une lecture confortable en conditions de luminosité variées "
    "et pour les personnes atteintes de sensibilité à la lumière.",
    styles['Body']
))

story.append(add_heading('2.2 Aides à la Lecture', styles['H2'], level=1))
story.append(Paragraph(
    "Un ensemble d'aides à la lecture innovantes est intégré à l'interface pour faciliter le suivi visuel du contenu textuel. La ligne de lecture matérialise "
    "une barre horizontale de couleur contrastée qui suit le curseur de l'utilisateur, isolant visuellement la ligne en cours de lecture et réduisant ainsi la "
    "fatigue oculaire. Le masque de lecture va encore plus loin en assombrissant la totalité de l'écran à l'exception d'une zone rectangulaire configurable "
    "autour du texte actif, permettant une concentration optimale. Des polices spécifiques pour les personnes dyslexiques, telles que OpenDyslexic, sont proposées "
    "comme alternative aux polices standard, avec un espacement inter-caractères et inter-lignes adapté aux recommandations de la recherche en cognition visuelle.",
    styles['Body']
))

story.append(add_heading('2.3 Interactivité Inclusive', styles['H2'], level=1))
story.append(Paragraph(
    "La navigation complète au clavier constitue un impératif absolu de la conception. Chaque élément interactif, qu'il s'agisse de boutons, de formulaires, de "
    "menus déroulants ou de zones de saisie, doit être atteignable et activable sans recourir au périphérique de pointage. L'ordre de tabulation suit une logique "
    "naturelle et intuitive, et des indicateurs de focus visuels clairs sont systématiquement affichés. La fonctionnalité d'arrêt des animations répond aux besoins "
    "des personnes souffrant de troubles vestibulaires, conformément au critère de succès 2.3.3 des WCAG 2.1. Enfin, les descriptions d'images générées par IA "
    "permettent aux utilisateurs malvoyants de comprendre le contenu visuel grâce à des descriptions contextuelles riches et pertinentes, diffusées via les "
    "technologies d'assistance.",
    styles['Body']
))

story.append(add_heading('2.4 Text-to-Speech', styles['H2'], level=1))
story.append(Paragraph(
    "La lecture vocale intégrée constitue la pierre angulaire de l'accessibilité de la plateforme CréaPulse. Cette fonctionnalité permet une consultation sans écran, "
    "répondant ainsi aux besoins des personnes malvoyantes, des personnes illettrées ou de celles qui préfèrent un mode de consommation audio du contenu. Le moteur "
    "de synthèse vocale utilise des voix naturelles en langue française, avec la possibilité de choisir entre une voix masculine et féminine. La vitesse de lecture, "
    "le ton et le volume sont entièrement paramétrables par l'utilisateur. La synchronisation visuelle entre le texte lu et la portion vocalisée en surbrillance "
    "permet un suivi multimodal confortable, et le navigateur vocal permet de sauter des sections, de mettre en pause ou de revenir en arrière dans le contenu.",
    styles['Body']
))

# Accessibility features summary table
story.append(Spacer(1, 18))
acc_headers = ['Fonctionnalité', 'Description', 'Norme WCAG']
acc_rows = [
    ['Agrandissement texte', 'Zoom jusqu\'à 3x sans perte de mise en page', '1.4.4 - Redimensionnement du texte'],
    ['Ligne de lecture', 'Barre de suivi visuel du texte en cours', 'Contraste et lisibilité'],
    ['Masque de lecture', 'Assombrissement sélectif hors zone de lecture', 'Navigation et orientation'],
    ['Polices dyslexiques', 'OpenDyslexic et espacement adapté', 'Lisibilité perceptible'],
    ['Navigation clavier', 'Accès complet sans souris', '2.1.1 - Clavier'],
    ['Arrêt animations', 'Désactivation pour troubles vestibulaires', '2.3.3 - Animations'],
    ['Text-to-Speech', 'Synthèse vocale en français avec suivi visuel', 'Consultation sans écran'],
    ['Descriptions IA', 'Génération automatique de textes alternatifs', '1.1.1 - Textes non textuels'],
]
t2 = make_table(acc_headers, acc_rows, col_widths=[available_width*0.25, available_width*0.45, available_width*0.30])
story.append(t2)
story.append(Paragraph('<i>Tableau 2 : Synthèse des fonctionnalités d\'accessibilité et conformité WCAG 2.1 AA</i>', styles['Caption']))
story.append(Spacer(1, 18))

# ═══════════════════════════════════════
# SECTION 3: Espace Utilisateur - Pathfinder IA
# ═══════════════════════════════════════
story.extend(add_major_section('3. Espace Utilisateur (Pathfinder IA)'))
story.append(Paragraph(
    "L'espace utilisateur, baptisé Pathfinder IA, constitue le coeur expérientiel de la plateforme CréaPulse. En adoptant une approche gamifiée, cet espace "
    "transforme le traditionnel diagnostic entrepreneurial en une véritable aventure d'orientation professionnelle. Chaque étape du parcours est conçue pour "
    "maintenir l'engagement du porteur de projet tout en recueillant des données structurées sur son profil, ses compétences et ses motivations. L'ensemble "
    "des modules interagit de manière fluide pour construire progressivement une feuille de route personnalisée servant de base à l'entretien de diagnostic "
    "approfondi de trois heures avec un conseiller expert.",
    styles['Body']
))

story.append(add_heading('3.1 Module Bilan Découverte', styles['H2'], level=1))
story.append(Paragraph(
    "Le module Bilan Découverte inaugure le parcours du porteur de projet au sein de Pathfinder IA. Son objectif est d'établir un premier panorama des "
    "compétences transversales, des motivations profondes et des traits de personnalité du bénéficiaire. Ce module se compose de deux sous-modules "
    "complémentaires qui exploitent des mécaniques interactives modernes pour favoriser l'engagement et la sincérité des réponses.",
    styles['Body']
))

story.append(add_heading('3.1.1 Le Jeu des Pépites', styles['H3'], level=1))
story.append(Paragraph(
    "Le Jeu des Pépites propose une interface de tri par swipe inspirée des applications de rencontre modernes, adaptée au contexte de l'évaluation des "
    "compétences comportementales. L'utilisateur est confronté à une série de cartes, chacune décrivant une situation professionnelle ou une compétence "
    "transversale. Pour chaque carte, trois actions sont possibles : un swipe à droite indique une affinité forte, un swipe à gauche marque un rejet, "
    "et un swipe vers le haut signale une compétence à développer. Cette mécanique ludique supprime la fatigue questionnaire tout en générant des données "
    "riches et exploitables sur les soft skills du porteur de projet. Les résultats sont automatiquement agrégés pour alimenter le Diagramme de Kiviat.",
    styles['Body']
))

story.append(add_heading('3.1.2 Diagramme de Kiviat', styles['H3'], level=1))
story.append(Paragraph(
    "À l'issue du Jeu des Pépites, un Diagramme de Kiviat interactif est généré automatiquement. Cette visualisation en forme de toile d'araignée présente "
    "de manière synthétique et visuellement impactante les forces et les axes de progrès du porteur de projet. Chaque branche du diagramme représente une "
    "dimension clé du profil entrepreneurial : leadership, créativité, gestion du stress, communication, esprit d'équipe, résolution de problèmes et "
    "adaptabilité. L'utilisateur peut interagir avec le diagramme pour explorer les détails de chaque compétence et comprendre comment ses résultats se "
    "positionnent par rapport aux profils entrepreneuriaux de référence. Le diagramme sert également de base de discussion lors de l'entretien avec le "
    "conseiller, offrant un support visuel concret pour alimenter l'échange.",
    styles['Body']
))

story.append(add_heading('3.2 Tests d\'Orientation - Modèle RIASEC', styles['H2'], level=1))
story.append(Paragraph(
    "Le module d'orientation intègre le modèle RIASEC (Realistic, Investigative, Artistic, Social, Enterprising, Conventional) de John Holland, reconnu "
    "internationalement comme l'un des outils d'orientation professionnelle les plus fiables. La plateforme propose une version modernisée et gamifiée de "
    "ce modèle, où l'utilisateur progresse à travers des scénarios interactifs et des mises en situation plutôt que de répondre à un questionnaire "
    "traditionnel. Chaque scénario évalue l'affinité naturelle du porteur de projet avec l'un des six profils RIASEC, et les résultats sont présentés "
    "sous forme de classement dynamique accompagné de suggestions de secteurs d'activité compatibles.",
    styles['Body']
))
story.append(Paragraph(
    "La loterie de mots-clés constitue une mécanique complémentaire originale. À partir des résultats RIASEC, l'utilisateur participe à un exercice de "
    "co-construction où il sélectionne et combine des mots-clés représentant ses aspirations, ses valeurs et ses compétences. La plateforme utilise ensuite "
    "un algorithme de correspondance pour proposer un objectif final personnalisé, formulé en termes concrets et actionnables. Cette approche participative "
    "garantit que l'orientation proposée ne résulte pas d'un simple calcul algorithmique, mais bien d'une co-construction entre le porteur de projet et "
    "la plateforme.",
    styles['Body']
))

story.append(add_heading('3.3 Gestion des Compétences', styles['H2'], level=1))
story.append(Paragraph(
    "La gestion des compétences constitue un pilier essentiel de l'évaluation de la viabilité du projet entrepreneurial. La plateforme propose un module "
    "complet permettant au porteur de projet de cartographier ses compétences acquises, de les comparer aux exigences du marché et d'identifier les "
    "écarts à combler pour maximiser ses chances de succès.",
    styles['Body']
))

story.append(add_heading('3.3.1 Upload et Parsing du CV', styles['H3'], level=1))
story.append(Paragraph(
    "L'utilisateur peut importer son CV au format PDF, DOCX ou TXT directement dans la plateforme. Un moteur de parsing automatique, alimenté par des "
    "technologies de traitement automatique du langage naturel (NLP), extrait les compétences techniques (Hard Skills), les certifications, les expériences "
    "professionnelles et les formations du document. Les données extraites sont présentées à l'utilisateur sous forme de carte de compétences interactive, "
    "lui permettant de vérifier, compléter et hiérarchiser les informations identifiées. Ce processus de validation participatif garantit la fiabilité "
    "des données exploitées dans les étapes ultérieures du parcours.",
    styles['Body']
))

story.append(add_heading('3.3.2 Analyse des Écarts (Skill Gap) et Career Map', styles['H3'], level=1))
story.append(Paragraph(
    "L'analyse des écarts constitue le volet stratégique du module de gestion des compétences. En croisant les compétences identifiées dans le CV avec "
    "les exigences du marché cible, déterminées à partir de bases de données de référence telles que O*NET et les fiches ROME de France Travail, la "
    "plateforme génère une Career Map personnalisée. Cette carte de carrière visuelle présente de manière intuitive les compétences maîtrisées, les "
    "compétences partiellement acquises et les compétences manquantes, avec pour chacune un plan de développement suggéré incluant des formations, "
    "des certifications et des expériences recommandées. La Career Map permet au porteur de projet de prendre conscience de la distance entre son "
    "profil actuel et les exigences de son marché cible, alimentant ainsi la réflexion sur la viabilité de son projet.",
    styles['Body']
))

# ═══════════════════════════════════════
# SECTION 4: Espace Centre d'Accompagnement
# ═══════════════════════════════════════
story.extend(add_major_section('4. Espace Centre d\'Accompagnement'))
story.append(Paragraph(
    "L'espace Centre d'Accompagnement est dédié aux conseillers experts chargés d'accompagner les porteurs de projet dans leur démarche de diagnostic. "
    "Il constitue un outil d'aide à la décision puissant qui vient enrichir la pratique professionnelle du conseiller sans la remplacer. L'ensemble des "
    "fonctionnalités de cet espace a été conçu en étroite collaboration avec des professionnels de l'accompagnement entrepreneurial pour garantir "
    "pertinence, ergonomie et efficacité opérationnelle.",
    styles['Body']
))

story.append(add_heading('4.1 IA Co-Pilote de Diagnostic', styles['H2'], level=1))
story.append(Paragraph(
    "Le module IA Co-Pilote de Diagnostic représente l'une des innovations majeures de la plateforme CréaPulse. Il s'agit d'un assistant intelligent "
    "qui assiste le conseiller en temps réel durant l'entretien de diagnostic de trois heures, en analysant les réponses du candidat et en proposant "
    "des suggestions contextuelles pour approfondir l'évaluation. Cette IA ne se substitue pas au jugement professionnel du conseiller, mais constitue "
    "un second regard analytique capable de détecter des éléments que l'oeil humain pourrait manquer dans le flux d'un entretien.",
    styles['Body']
))

story.append(add_heading('4.1.1 Analyse en Direct', styles['H3'], level=1))
story.append(Paragraph(
    "L'analyse en direct s'appuie sur des modèles de traitement du langage naturel et d'analyse de sentiment pour évaluer en temps réel la cohérence "
    "des réponses du candidat, détecter les contradictions potentielles et identifier les zones de fragilité dans le discours entrepreneurial. Le "
    "système génère des suggestions de questions de relance personnalisées, présentées au conseiller sous forme de bulles de suggestion contextuelles. "
    "Ces suggestions sont basées sur une analyse croisée entre les réponses en cours, le profil du candidat préalablement établi via Pathfinder IA "
    "et les bonnes pratiques d'entretien de diagnostic entrepreneurial. Le conseiller conserve une totale liberté d'action et peut accepter, modifier "
    "ou ignorer chaque suggestion proposée par l'IA.",
    styles['Body']
))

story.append(add_heading('4.1.2 Aide à la Décision Go/No-Go', styles['H3'], level=1))
story.append(Paragraph(
    "À l'issue de l'entretien de diagnostic, l'IA Co-Pilote synthétise l'ensemble des données collectées pour fournir au conseiller un tableau de bord "
    "décisionnel structuré. Ce tableau de bord présente une évaluation multidimensionnelle de la viabilité du projet, couvrant les dimensions financières, "
    "commerciales, humaines et juridiques. Pour chaque dimension, un indicateur de confiance est calculé, accompagné d'une recommandation contextuelle "
    "(favorable, défavorable, ou nécessitant des investigations complémentaires). Le conseiller peut ajuster les pondérations des différents critères "
    "en fonction de la spécificité du projet et de son propre jugement professionnel, avant de valider ou d'infirmer le scénario recommandé.",
    styles['Body']
))

story.append(add_heading('4.2 Chat d\'Information Marché', styles['H2'], level=1))
story.append(Paragraph(
    "Le Chat d'Information Marché offre au conseiller un accès instantané à des données économiques, sectorielles et juridiques en lien avec le projet "
    "du porteur. Contrairement à une recherche web générique, cet outil focalise les résultats en fonction des données réelles saisies par l'utilisateur "
    "durant son parcours Pathfinder IA : secteur d'activité, localisation géographique, profil de compétences et type de projet entrepreneurial. "
    "Le conseiller peut ainsi consulter des informations sur le marché breton, le tissu économique local, les tendances sectorielles, les réglementations "
    "en vigueur et les dispositifs de soutien disponibles, le tout dans une interface conversationnelle intuitive qui facilite l'accès à l'information "
    "en temps réel durant l'entretien.",
    styles['Body']
))

story.append(add_heading('4.3 Générateur de Livrables', styles['H2'], level=1))
story.append(Paragraph(
    "Le Générateur de Livrables automatise la production des documents de synthèse issus du diagnostic entrepreneurial. À l'issue de l'entretien, le "
    "conseiller peut générer en un clic un plan d'actions détaillé et un prévisionnel financier personnalisé. Le plan d'actions structure les étapes "
    "à suivre pour le porteur de projet, avec des jalons temporels, des ressources à mobiliser et des indicateurs de suivi. Le prévisionnel financier "
    "intègre les données macro-économiques du secteur, les coûts identifiés durant l'entretien et les hypothèses de chiffre d'affaires discutées avec "
    "le candidat. Ces livrables sont exportables au format PDF et constituent le document de référence partagé entre le porteur de projet, le conseiller "
    "et, le cas échéant, les partenaires financiers.",
    styles['Body']
))

# ═══════════════════════════════════════
# SECTION 5: Espace Administrateur
# ═══════════════════════════════════════
story.extend(add_major_section('5. Espace Administrateur'))
story.append(Paragraph(
    "L'espace Administrateur est conçu pour les pilotes France Travail et les responsables territoriaux du dispositif CréaPulse. Il offre une vue "
    "d'ensemble sur l'ensemble des parcours en cours et terminés, permettant une gestion centralisée, un suivi de performance en temps réel et une "
    "adaptation continue de l'offre aux besoins des territoires. L'architecture modulaire de la plateforme garantit une flexibilité maximale dans la "
    "configuration et le déploiement des fonctionnalités.",
    styles['Body']
))

story.append(add_heading('5.1 Gestion Modulaire', styles['H2'], level=1))
story.append(Paragraph(
    "L'architecture SaaS modulaire de CréaPulse permet aux administrateurs d'activer ou de désactiver des briques technologiques individuelles en "
    "fonction des spécificités de chaque parcours et de chaque territoire. Par exemple, un territoire dont l'écosystème entrepreneurial est fortement "
    "orienté vers l'économie sociale et solidaire peut activer en priorité le module d'orientation RIASEC et les outils de gestion des compétences, "
    "tandis qu'un territoire à dominante industrielle privilégiera le module Finance et le Chat d'Information Marché. Cette granularité de configuration "
    "garantit que chaque déploiement territorial reflète fidèlement les besoins locaux sans imposer un fonctionnement uniforme.",
    styles['Body']
))

# Module table
story.append(Spacer(1, 18))
mod_headers = ['Module', 'Description', 'Activation']
mod_rows = [
    ['Bilan Découverte', 'Jeu des Pépites et Diagramme de Kiviat', 'Oui / Non (par territoire)'],
    ['RIASEC', 'Tests d\'orientation et loterie de mots-clés', 'Oui / Non (par territoire)'],
    ['Skill Gap', 'Upload CV et analyse des écarts de compétences', 'Oui / Non (par territoire)'],
    ['IA Co-Pilote', 'Analyse en direct et aide à la décision', 'Oui / Non (par conseiller)'],
    ['Chat Marché', 'Recherche focalisée de données économiques', 'Oui / Non (par territoire)'],
    ['Générateur Livrables', 'Plan d\'actions et prévisionnel financier', 'Oui / Non (par territoire)'],
    ['Finance', 'Module avancé de viabilité financière', 'Oui / Non (par territoire)'],
]
t3 = make_table(mod_headers, mod_rows, col_widths=[available_width*0.25, available_width*0.45, available_width*0.30])
story.append(t3)
story.append(Paragraph('<i>Tableau 3 : Architecture modulaire et options d\'activation par territoire</i>', styles['Caption']))
story.append(Spacer(1, 18))

story.append(add_heading('5.2 Monitoring Territorial', styles['H2'], level=1))
story.append(Paragraph(
    "Le module de monitoring territorial fournit aux administrateurs un tableau de bord complet présentant les statistiques agrégées sur les issues "
    "du diagnostic entrepreneurial à l'échelle de chaque territoire. Les indicateurs suivis comprennent le taux de poursuite d'activité entrepreneuriale, "
    "le taux de retour à l'emploi salarié, le temps moyen de parcours complet et les scores de satisfaction des bénéficiaires. Des filtres permettent "
    "d'analyser ces données par période, par type de public, par secteur d'activité et par conseiller. Les tableaux de bord sont actualisés en temps réel "
    "et peuvent être exportés au format CSV pour des analyses complémentaires dans les outils de business intelligence de France Travail.",
    styles['Body']
))

story.append(add_heading('5.3 Référent Handicap', styles['H2'], level=1))
story.append(Paragraph(
    "Le système de Référent Handicap constitue une fonctionnalité essentielle de l'espace Administrateur. Il permet une mise en relation structurée "
    "entre les situations de handicap signalées par les utilisateurs et les ressources d'adaptation disponibles. Lorsqu'un porteur de projet signale "
    "une situation de handicap dans son profil, le système alerte automatiquement le référent handicap désigné pour le territoire concerné. Ce dernier "
    "peut alors consulter le profil de l'utilisateur, évaluer les adaptations nécessaires et mettre en place un plan d'accompagnement adapté, "
    "qu'il s'agisse d'aménagements techniques, de délais supplémentaires ou de l'intervention d'un tiers spécialisé.",
    styles['Body']
))

# ═══════════════════════════════════════
# SECTION 6: Architecture Technique & Conformité
# ═══════════════════════════════════════
story.extend(add_major_section('6. Architecture Technique et Conformité'))
story.append(Paragraph(
    "L'architecture technique de la plateforme CréaPulse repose sur les principes fondamentaux de modularité, de scalabilité et de sécurité. "
    "Conçue en mode SaaS (Software as a Service), la solution adopte une architecture à base de microservices communicants, permettant une évolution "
    "rapide et indépendante de chaque composant fonctionnel. Ce choix architectural garantit la pérennité de l'investissement et la capacité "
    "d'adaptation de la plateforme aux évolutions technologiques et réglementaires futures.",
    styles['Body']
))

story.append(add_heading('6.1 Mode SaaS Modulaire', styles['H2'], level=1))
story.append(Paragraph(
    "La plateforme est construite autour d'une architecture à briques open source, sélectionnées pour leur maturité, leur communauté de contributeurs "
    "et leur compatibilité avec les standards du marché. Chaque module fonctionnel (orientation, compétences, diagnostic, livrables) est développé "
    "comme un service autonome, communiquant avec les autres via des API RESTful sécurisées. Cette approche permet de remplacer, mettre à jour ou "
    "désactiver un module sans impact sur les autres composants du système. Les briques open source utilisées incluent des frameworks reconnus pour "
    "le développement web, des moteurs de base de données performants, des solutions de messagerie asynchrone et des outils de conteneurisation "
    "assurant la portabilité des déploiements.",
    styles['Body']
))

story.append(add_heading('6.2 Sécurité et Données', styles['H2'], level=1))
story.append(Paragraph(
    "La protection des données personnelles constitue une priorité absolue pour la plateforme CréaPulse. Le système intègre une plateforme de gestion "
    "des consentements certifiée, permettant à chaque utilisateur de contrôler précisément les données collectées, les traitements effectués et les "
    "tiers autorisés à accéder à ses informations. La conformité au Règlement Général sur la Protection des Données (RGPD) est garantie par une "
    "architecture de sécurité multicouche comprenant le chiffrement des données en transit et au repos, la gestion fine des accès par rôle (RBAC), "
    "la journalisation complète des opérations sensibles et la mise en place de procédures d'audit régulières. Les données de CV et les résultats "
    "des tests psychométriques bénéficient d'un niveau de protection renforcé, avec des mesures de pseudonymisation et d'anonymisation appliquées "
    "lors des traitements analytiques agrégés.",
    styles['Body']
))

story.append(add_heading('6.3 Disponibilité et Accessibilité', styles['H2'], level=1))
story.append(Paragraph(
    "La plateforme CréaPulse est conçue pour garantir une disponibilité 24 heures sur 24, 7 jours sur 7, avec une garantie de temps de fonctionnement "
    "(SLA) de 99,9%. Les sessions d'entrée dans le parcours de diagnostic sont possibles tout au long de l'année, sans interruption liée aux périodes "
    "de congés ou aux contraintes administratives. Cette disponibilité permanente est essentielle pour accompagner les porteurs de projet dans leur "
    "démarche, quel que soit leur calendrier personnel. L'infrastructure d'hébergement est redondante et géorépliquée pour garantir la résilience du "
    "service face aux incidents matériels ou réseau. Des procédures de sauvegarde automatique et de restauration sont en place pour assurer la "
    "continuité de service et l'intégrité des données en toutes circonstances.",
    styles['Body']
))

# Architecture summary table
story.append(Spacer(1, 18))
arch_headers = ['Dimension', 'Caractéristique', 'Garantie']
arch_rows = [
    ['Architecture', 'Microservices modulaires, API RESTful, open source', 'Évolutivité et portabilité'],
    ['Sécurité', 'Chiffrement, RBAC, journalisation, audit régulier', 'RGPD et certifications'],
    ['Disponibilité', 'SLA 99,9%, redondance, réplication géographique', 'Accès 24/7 toute l\'année'],
    ['Accessibilité', 'WCAG 2.1 AA, navigation clavier, TTS', 'Conformité audit supérieur à 90%'],
    ['Scalabilité', 'Conteneurisation, auto-scaling, CI/CD', 'Adaptation à la charge'],
    ['Données', 'Pseudonymisation, anonymisation, consentement certifié', 'Protection des données CV et tests'],
]
t4 = make_table(arch_headers, arch_rows, col_widths=[available_width*0.20, available_width*0.50, available_width*0.30])
story.append(t4)
story.append(Paragraph('<i>Tableau 4 : Synthèse de l\'architecture technique et des garanties de conformité</i>', styles['Caption']))
story.append(Spacer(1, 18))

# ═══════════════════════════════════════
# BUILD
# ═══════════════════════════════════════
doc.multiBuild(story)
print(f"Body PDF generated: {output_path}")
