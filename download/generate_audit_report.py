#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CreaPulse Audit Report - UX, Ergonomie et Qualite du Code
Body PDF generation via ReportLab
"""

import sys, os, hashlib
sys.path.insert(0, '/home/z/my-project/skills/pdf/scripts')

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, CondPageBreak,
    SimpleDocTemplate, HRFlowable
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FONT REGISTRATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
pdfmetrics.registerFont(TTFont('NotoSansSC', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSansSCBold', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('Carlito', '/usr/share/fonts/truetype/english/Carlito-Regular.ttf'))
pdfmetrics.registerFont(TTFont('CarlitoBold', '/usr/share/fonts/truetype/english/Carlito-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSerif', '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSerifBold', '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'))
registerFontFamily('DejaVuSerif', normal='DejaVuSerif', bold='DejaVuSerifBold')
registerFontFamily('NotoSansSC', normal='NotoSansSC', bold='NotoSansSCBold')
registerFontFamily('Carlito', normal='Carlito', bold='CarlitoBold')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

from pdf import install_font_fallback
install_font_fallback()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# COLOR PALETTE (cascade minimal)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE_BG       = colors.HexColor('#f7f7f6')
SECTION_BG    = colors.HexColor('#ecebe9')
CARD_BG       = colors.HexColor('#eeedea')
TABLE_STRIPE  = colors.HexColor('#f1f0ee')
HEADER_FILL   = colors.HexColor('#625a40')
COVER_BLOCK   = colors.HexColor('#847852')
BORDER        = colors.HexColor('#d0cdc3')
ICON          = colors.HexColor('#a89354')
ACCENT        = colors.HexColor('#5431bd')
ACCENT_2      = colors.HexColor('#45c484')
TEXT_PRIMARY   = colors.HexColor('#272623')
TEXT_MUTED     = colors.HexColor('#7e7c74')
SEM_SUCCESS   = colors.HexColor('#488f5f')
SEM_WARNING   = colors.HexColor('#997d46')
SEM_ERROR     = colors.HexColor('#b24c43')
SEM_INFO      = colors.HexColor('#4e6f90')

TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = TABLE_STRIPE

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STYLES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE_W, PAGE_H = A4
LEFT_M = 1.0 * inch
RIGHT_M = 1.0 * inch
TOP_M = 0.9 * inch
BOT_M = 0.9 * inch
AW = PAGE_W - LEFT_M - RIGHT_M  # available width

H1_STYLE = ParagraphStyle('H1', fontName='DejaVuSerif', fontSize=20, leading=26, spaceBefore=18, spaceAfter=10, textColor=TEXT_PRIMARY)
H2_STYLE = ParagraphStyle('H2', fontName='DejaVuSerif', fontSize=15, leading=20, spaceBefore=14, spaceAfter=8, textColor=ACCENT)
H3_STYLE = ParagraphStyle('H3', fontName='DejaVuSerif', fontSize=12, leading=16, spaceBefore=10, spaceAfter=6, textColor=HEADER_FILL)
BODY_STYLE = ParagraphStyle('Body', fontName='DejaVuSerif', fontSize=10.5, leading=17, spaceAfter=6, alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY)
BODY_LEFT = ParagraphStyle('BodyLeft', fontName='DejaVuSerif', fontSize=10.5, leading=17, spaceAfter=6, alignment=TA_LEFT, textColor=TEXT_PRIMARY)
BULLET_STYLE = ParagraphStyle('Bullet', fontName='DejaVuSerif', fontSize=10.5, leading=17, spaceAfter=4, leftIndent=18, bulletIndent=6, alignment=TA_LEFT, textColor=TEXT_PRIMARY)
KICKER_STYLE = ParagraphStyle('Kicker', fontName='Carlito', fontSize=9, leading=12, textColor=ICON, spaceAfter=4)
META_STYLE = ParagraphStyle('Meta', fontName='Carlito', fontSize=9, leading=13, textColor=TEXT_MUTED)
CAPTION_STYLE = ParagraphStyle('Caption', fontName='Carlito', fontSize=9, leading=13, alignment=TA_CENTER, textColor=TEXT_MUTED, spaceBefore=3, spaceAfter=6)
CALLOUT_STYLE = ParagraphStyle('Callout', fontName='DejaVuSerif', fontSize=10.5, leading=17, leftIndent=18, borderPadding=(6,6,6,6), borderColor=ACCENT, borderWidth=2, spaceBefore=8, spaceAfter=8, textColor=TEXT_PRIMARY)

TH_STYLE = ParagraphStyle('TH', fontName='DejaVuSerif', fontSize=9.5, leading=13, alignment=TA_CENTER, textColor=TABLE_HEADER_TEXT)
TD_STYLE = ParagraphStyle('TD', fontName='DejaVuSerif', fontSize=9.5, leading=14, alignment=TA_LEFT, textColor=TEXT_PRIMARY)
TD_CENTER = ParagraphStyle('TDC', fontName='DejaVuSerif', fontSize=9.5, leading=14, alignment=TA_CENTER, textColor=TEXT_PRIMARY)
TD_SEVERE = ParagraphStyle('TDSErr', fontName='DejaVuSerif', fontSize=9.5, leading=14, alignment=TA_CENTER, textColor=SEM_ERROR)
TD_WARN = ParagraphStyle('TDWarn', fontName='DejaVuSerif', fontSize=9.5, leading=14, alignment=TA_CENTER, textColor=SEM_WARNING)
TD_OK = ParagraphStyle('TDOk', fontName='DejaVuSerif', fontSize=9.5, leading=14, alignment=TA_CENTER, textColor=SEM_SUCCESS)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DOCUMENT TEMPLATE WITH TOC
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT_PATH = '/home/z/my-project/download/CreaPulse_Audit_UX_Qualite.pdf'

class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

doc = TocDocTemplate(OUTPUT_PATH, pagesize=A4, leftMargin=LEFT_M, rightMargin=RIGHT_M, topMargin=TOP_M, bottomMargin=BOT_M)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# HELPERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MAX_KEEP = A4[1] * 0.4

def safe_keep(elements):
    total = sum(el.wrap(AW, 9999)[1] for el in elements)
    if total <= MAX_KEEP:
        return [KeepTogether(elements)]
    elif len(elements) >= 2:
        return [KeepTogether(elements[:2])] + list(elements[2:])
    return list(elements)

def heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/>%s' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def h1(text): return heading('<b>%s</b>' % text, H1_STYLE, 0)
def h2(text): return heading('<b>%s</b>' % text, H2_STYLE, 1)
def h3(text): return heading('<b>%s</b>' % text, H3_STYLE, 2)

def body(text): return Paragraph(text, BODY_STYLE)
def bullet(text): return Paragraph('<bullet>&bull;</bullet> ' + text, BULLET_STYLE)
def spacer(h=12): return Spacer(1, h)
def hr(): return HRFlowable(width='100%', thickness=0.5, color=BORDER, spaceBefore=6, spaceAfter=6)

def make_table(headers, rows, col_widths=None):
    """Create a styled table with Paragraph cells."""
    data = [[Paragraph('<b>%s</b>' % h, TH_STYLE) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), TD_CENTER if len(headers) <= 3 else TD_STYLE) for c in row])
    if col_widths is None:
        n = len(headers)
        col_widths = [AW / n] * n
    table = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_ODD if i % 2 == 0 else TABLE_ROW_EVEN
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    table.setStyle(TableStyle(style_cmds))
    return table

def severity_table(headers, rows, col_widths=None):
    """Table with severity coloring in the last column."""
    data = [[Paragraph('<b>%s</b>' % h, TH_STYLE) for h in headers]]
    for row in rows:
        styled_row = []
        for i, c in enumerate(row):
            if i == len(row) - 1:
                sev = str(c).lower()
                if 'critique' in sev or 'p0' in sev:
                    styled_row.append(Paragraph('<b>%s</b>' % c, TD_SEVERE))
                elif 'haute' in sev or 'p1' in sev:
                    styled_row.append(Paragraph('<b>%s</b>' % c, TD_WARN))
                elif 'moyenne' in sev or 'p2' in sev:
                    styled_row.append(Paragraph(c, META_STYLE))
                else:
                    styled_row.append(Paragraph(c, TD_OK))
            else:
                styled_row.append(Paragraph(str(c), TD_STYLE))
        data.append(styled_row)
    if col_widths is None:
        n = len(headers)
        col_widths = [AW / n] * n
    table = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_ODD if i % 2 == 0 else TABLE_ROW_EVEN
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    table.setStyle(TableStyle(style_cmds))
    return table


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONTENT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story = []

# --- TOC ---
toc = TableOfContents()
toc.levelStyles = [
    ParagraphStyle('TOC1', fontName='DejaVuSerif', fontSize=12, leftIndent=20, spaceBefore=6, spaceAfter=2),
    ParagraphStyle('TOC2', fontName='DejaVuSerif', fontSize=10, leftIndent=40, spaceBefore=2, spaceAfter=1),
]
story.append(Paragraph('<b>Table des matieres</b>', H1_STYLE))
story.append(spacer(6))
story.append(toc)
story.append(PageBreak())

# ════════════════════════════════════════════════════
# SECTION 1: SYNTHESE EXECUTIVE
# ════════════════════════════════════════════════════
story.extend(safe_keep([h1('1. Synthese executive')]))
story.append(body(
    "CreaPulse est une plateforme SaaS d'accompagnement a la creation d'entreprise combinant diagnostic intelligent, "
    "accompagnement humain et outils de planification. Cette analyse approfondie couvre quatre axes complementaires : "
    "le parcours utilisateur et l'ergonomie, la qualite du code et l'architecture, la securite des API, et l'accessibilite. "
    "L'objectif est d'identifier les points de friction qui nuisent a l'experience des porteurs de projet et de proposer "
    "des recommandations concretes, priorisees par impact et effort de mise en oeuvre."
))
story.append(spacer(6))

# Stats callout
story.append(Paragraph('<b>Chiffres cles de la plateforme</b>', H3_STYLE))
stats_headers = ['Indicateur', 'Valeur', 'Appreciation']
stats_rows = [
    ['Composants applicatifs', '33', 'Couverture fonctionnelle large'],
    ['Routes API', '55', 'API riche mais securite inegale'],
    ['Modeles Prisma', '30+', 'Schema solide et bien structure'],
    ['Composants shadcn/ui', '42', 'Bonne base UI componentisee'],
    ['Comptes de test (seed)', '15', 'Couverture multi-profils'],
    ['Points de friction critiques', '6', 'Necessitent une action immediate'],
    ['Routes non authentifiees', '19 sur 55', 'Faille de securite majeure'],
    ['Rate limiting actif', '0 route', 'Module existant mais jamais utilise'],
]
story.append(spacer(6))
story.append(make_table(stats_headers, stats_rows, [AW*0.35, AW*0.20, AW*0.45]))
story.append(Paragraph('Tableau 1 - Indicateurs generaux de la plateforme', CAPTION_STYLE))
story.append(spacer(8))

story.append(body(
    "L'audit revele une plateforme fonctionnellement riche dont la qualite du code est globalement bonne, "
    "mais qui souffre de problemes structurels en termes d'experience utilisateur. Les trois constats les plus "
    "impactants sont : l'absence totale d'onboarding pour les nouveaux utilisateurs, la presence de boutons "
    "non fonctionnels qui erodent la confiance, et une navigation surchargee avec 19 elements plats sans "
    "groupement logique. Cote securite, 19 routes API sur 55 ne verifient pas l'authentification et le "
    "module de rate limiting n'est jamais appele malgre son existence."
))

# ════════════════════════════════════════════════════
# SECTION 2: PARCOURS UTILISATEUR
# ════════════════════════════════════════════════════
story.extend(safe_keep([h1('2. Parcours utilisateur et ergonomie')]))

story.append(h2('2.1 Premier contact - Landing page'))
story.append(body(
    "La landing page de CreaPulse presente une proposition de valeur claire : <i>Diagnostiquez votre projet "
    "entrepreneurial avec l'IA</i>. Le hero section est bien structure avec un titre accrocheur, un sous-titre "
    "explicatif, et deux boutons d'appel a l'action. Les statistiques animees (entrepreneurs accompagnes, "
    "taux de reussite) ajoutent de la credibilite, tandis que les temoignages clients renforcent la preuve sociale. "
    "Cependant, plusieurs elements limitent l'efficacite de cette premiere impression."
))
story.append(spacer(4))
story.append(bullet(
    '<b>Bouton "Voir la demo" non fonctionnel :</b> Le bouton ne possede aucun gestionnaire onClick. Un visiteur curieux '
    'qui clique dessus ne constate aucune action, ce qui cree une impression negative immadiate et erode la confiance.'
))
story.append(bullet(
    '<b>Navigation mobile incomplete :</b> Sur ecran mobile, les liens de navigation (Fonctionnalites, Resultats, Temoignages) '
    'sont masques via <i>hidden md:flex</i> sans alternative de type menu hamburger. Seuls les boutons CTA restent visibles.'
))
story.append(bullet(
    '<b>Liens footer non fonctionnels :</b> "Mentions legales" et "CGU" sont des elements span sans href, '
    'inaccessibles au clavier et non cliquables.'
))
story.append(bullet(
    '<b>Pas de ciblage par role :</b> La landing s\'adresse generiquement a "vous" sans distinguer les porteurs de projet '
    'des conseillers ou administrateurs, ce qui peut semer la confusion.'
))

story.append(h2('2.2 Inscription et authentification'))
story.append(body(
    "Le formulaire d'authentification adopte une disposition split-panel avec un panneau decoratif a gauche "
    "(branding, statistiques) et le formulaire a droite, une approche visuellement moderne. Le basculement "
    "entre connexion et inscription se fait par une animation fluide via AnimatePresence. Neanmoins, "
    "l'experience d'inscription comporte plusieurs lacunes significatives qui augmentent le risque d'abandon "
    "avant la premiere valeur."
))
story.append(spacer(4))

auth_headers = ['Probleme', 'Fichier', 'Impact']
auth_rows = [
    ['Boutons Google/Microsoft non fonctionnels', 'auth.tsx:344-378', 'Haute - Perte de confiance'],
    ['"Mot de passe oublie ?" sans handler', 'auth.tsx:268-272', 'Moyenne - Frustration'],
    ['Pas d\'indicateur de force du mot de passe', 'auth.tsx:277', 'Moyenne - Echecs inscription'],
    ['Checkbox CGU non validee a la soumission', 'auth.tsx:294-312', 'Critique - Conformite juridique'],
    ['Pas de confirmation du mot de passe', 'auth.tsx:217-330', 'Moyenne - Erreurs de saisie'],
    ['Pas de validation pre-soumission', 'auth.tsx:53-110', 'Haute - Appels API inutiles'],
]
story.append(make_table(auth_headers, auth_rows, [AW*0.45, AW*0.25, AW*0.30]))
story.append(Paragraph('Tableau 2 - Problemes identifies dans le parcours d\'inscription', CAPTION_STYLE))

story.append(h2('2.3 Dashboard - Surcharge cognitive'))
story.append(body(
    "Une fois connecte, le porteur de projet atterrit sur l'onglet <b>Profil</b> par defaut. Pour un nouvel "
    "utilisateur, cet ecran affiche une barre de progression a 0%, un score 0/100, et le message 'Aucune activite "
    "recente'. C'est une experience demoralisante qui ne donne aucune indication sur la marche a suivre. "
    "Il n'existe aucun systeme d'onboarding, aucun message de bienvenue, aucun indicateur de prochaine etape."
))
story.append(spacer(4))
story.append(body(
    "Le probleme le plus critique concerne la navigation. La sidebar compte <b>19 elements</b> pour le role "
    "utilisateur, presentes dans une liste plate sans groupement, sans sections visibles et sans separator. "
    "A titre de comparaison, les bonnes pratiques UX recommandent un maximum de 7 items dans un menu de "
    "navigation primaire, organises en 3 a 4 groupes thematiques. Les 19 items de CreaPulse creent une "
    "surcharge cognitive considerable, surtout pour un public non-technique."
))
story.append(spacer(4))
story.append(body(
    "De plus, un decalage existe entre la sidebar (19 items) et la barre d'onglets horizontale (13 items). "
    "Des sections comme 'Annuaire Acteurs', 'Forum', 'Mentorat', 'Actualites' et 'Mon Parcours' sont "
    "accessibles uniquement via la sidebar mais n'apparaissent pas dans les onglets. A l'inverse, "
    "l'onglet 'Notifications' existe dans le code mais n'est accessible ni par la sidebar ni par la barre "
    "d'onglets, le rendant totalement invisible pour l'utilisateur."
))

story.append(h2('2.4 Navigation mobile'))
story.append(body(
    "Sur mobile, la barre de navigation inferieure affiche uniquement les 5 premiers items du menu "
    "(Profil, Bilan Decouverte, Orientation RIASEC, Motivations, Juridique). Les 14 items restants sont "
    "caches dans un sheet 'Plus' qui s'ouvre en bas de l'ecran. Ce sheet presente les items dans une liste "
    "plate non groupee, ce qui rend la recherche difficile. En outre, le bouton hamburger dans le header "
    "ouvre un sheet completement vide affichant uniquement le texte 'Menu mobile', ce qui constitue une "
    "experience utilisateur brisee. Pour un porteur de projet qui consulte la plateforme sur son smartphone, "
    "l'acces a la majorite des fonctionnalites necessite plusieurs manipulations, ce qui est contre-productif."
))

story.append(h2('2.5 Parcours ideal propose'))
story.append(body(
    "Plutot que de laisser l'utilisateur deviner son chemin dans un dashboard complexe, nous proposons un "
    "parcours guide en trois etapes qui replace l'utilisateur au centre de l'experience. Ce parcours "
    "transforme la premiere visite d'une experience de decouverte passive en une progression active "
    "vers un premier resultat concret."
))
story.append(spacer(4))
story.append(bullet('<b>Etape 1 - Bienvenue :</b> Modal de bienvenue personnalise avec le prenom de l\'utilisateur, '
    'explication en 3 phrases de la valeur de la plateforme, et bouton "Commencer mon diagnostic".'))
story.append(bullet('<b>Etape 2 - Decouverte des forces :</b> Navigation automatique vers l\'onglet Bilan '
    'ou le Jeu des Pepites invite l\'utilisateur a swiper des cartes de competences de maniere ludique.'))
story.append(bullet('<b>Etape 3 - Identification des motivations :</b> Apres le jeu, redirection vers '
    'l\'onglet Motivations pour un auto-diagnostic rapide avec 6 sliders intuitifs.'))
story.append(bullet('<b>Etape 4 - Premier resultat :</b> Retour sur le Profil, desormais peuple avec les '
    'donnees collectees, accompagne d\'un message encourageant et de la prochaine etape recommandee.'))


# ════════════════════════════════════════════════════
# SECTION 3: QUALITE DU CODE
# ════════════════════════════════════════════════════
story.extend(safe_keep([h1('3. Qualite du code et architecture')]))

story.append(h2('3.1 Architecture generale'))
story.append(body(
    "CreaPulse utilise une architecture SPA (Single Page Application) au sein de Next.js. L'ensemble de "
    "l'application est controle par un seul fichier <b>page.tsx</b> qui commute entre LandingPage, AuthPage et "
    "DashboardView via l'etat Zustand <i>currentView</i>. Ce choix architectural offre des transitions fluides "
    "mais sacrifie les avantages du routing Next.js : pas de deep linking, pas de pre-rendering SSR des vues, "
    "pas de partage d'URL, et le bouton retour du navigateur ne fonctionne pas pour naviguer entre les vues."
))
story.append(spacer(4))
story.append(body(
    "La gestion d'etat repose sur Zustand pour l'etat global (vue courante, onglet actif, identite utilisateur) "
    "et sur le useState local pour l'etat composant. L'absence de React Query ou SWR pour la gestion des "
    "donnees serveur signifie que chaque composant implemente son propre pattern de fetch avec useEffect, "
    "sans cache, sans revalidation automatique et sans gestion centralisee des erreurs."
))

story.append(h2('3.2 Composants monolithiques'))
story.append(body(
    "Plusieurs composants atteignent des tailles problematiques qui compromettent la maintenabilite et "
    "la lisibilite du code. Le composant <b>user-dashboard.tsx</b> compte 1 546 lignes et contient au moins "
    "7 sous-composants definis inline (ProfilTab, BilanTab, RiasecTab, MotivationsTab, JuridiqueTab, etc.). "
    "De meme, <b>admin-dashboard.tsx</b> atteint 792 lignes avec 6 sous-composants. Ces 'god components' "
    "rendent le debugging difficile, augmentent le temps de recompilation, et violent le principe de "
    "responsabilite unique. La decomposition recommandee est d'extraire chaque onglet dans un fichier "
    "dedie sous un repertoire structure."
))

story.append(h2('3.3 Securite des API'))
story.append(body(
    "L'audit des 55 routes API revele des incoherences majeures dans l'application des regles de securite. "
    "Sur les 55 routes, environ 20 utilisent correctement le middleware d'authentification via "
    "<i>authenticateRequest()</i>, tandis que 19 routes sont completement ouvertes sans aucune verification. "
    "Les 16 routes restantes utilisent des patterns hybrides ou l'authentification est partielle. Cette "
    "situation represente un risque reel de fuite de donnees et d'acces non autorise."
))
story.append(spacer(4))

sec_headers = ['Route non securisee', 'Donnees exposees', 'Severite']
sec_rows = [
    ['GET /api/users', 'Liste complete des utilisateurs (emails, noms)', 'Critique'],
    ['GET /api/diagnostics', 'Tous les diagnostics (donnees mock)', 'Critique'],
    ['GET /api/dashboard/stats', 'Statistiques admin compltes', 'Critique'],
    ['GET /api/notifications?userId=', 'Notifications de n\'importe quel utilisateur', 'Critique'],
    ['GET /api/notes', 'Notes CRUD sans authentification', 'Haute'],
    ['POST /api/livrables', 'Creation de livrables sans verification', 'Haute'],
    ['GET /api/roadmap', 'Feuille de route (donnees mock)', 'Moyenne'],
    ['GET/POST /api/skill-gap', 'Analyse de competences sans auth', 'Moyenne'],
]
story.append(severity_table(sec_headers, sec_rows, [AW*0.35, AW*0.40, AW*0.25]))
story.append(Paragraph('Tableau 3 - Routes API non authentifiees identifiees', CAPTION_STYLE))
story.append(spacer(6))

story.append(body(
    "Un probleme supplementaire concerne la configuration CORS. Deux patterns coexistent : le premier utilise "
    "une verification dynamique de l'origine (correct), le second applique un wildcard <i>Access-Control-Allow-Origin: *</i> "
    "sur 19 routes. Combine avec l'absence d'authentification, cela cree un vecteur potentiel d'exfiltration "
    "de donnees depuis n'importe quel site web externe."
))

story.append(h2('3.4 Rate limiting inexistant'))
story.append(body(
    "Un module de rate limiting complet existe dans <b>src/lib/rate-limit.ts</b>, implementant un systeme "
    "de fenetre glissante par identifiant avec une limite par defaut de 100 requetes par minute. Cependant, "
    "ce module n'est <b>importe et appele dans aucune route</b> du projet. Cette situation est particulierement "
    "dangereuse pour les endpoints qui appellent l'API Anthropic (IA) : <i>/api/ai/chat</i>, "
    "<i>/api/business-plan/bmc</i>, <i>/api/business-plan/pitch-deck</i>, <i>/api/business-plan/smart-roadmap</i>, "
    "et <i>/api/market-analysis/research</i>. Un utilisateur malveillant ou un script automatise pourrait "
    "generer des couts significatifs en appelant ces endpoints de maniere repetee."
))

story.append(h2('3.5 Qualite TypeScript'))
story.append(body(
    "L'analyse du code revele 35 instances du type <b>any</b> reparties entre les routes API (10 occurrences) "
    "et les composants React (25 occurrences, principalement dans admin-dashboard.tsx). L'utilisation du type "
    "any neutralise les avantages de TypeScript en termes de securite du typage et de detection precoce des "
    "erreurs. Par ailleurs, un mismatch existe entre l'enum Prisma <i>UserRole</i> qui utilise des valeurs "
    "majuscules (USER, COUNSELOR, ADMIN) et le store Zustand qui definit le meme type en minuscules "
    "(user, counselor, admin). Cette incoherence force des conversions de chaine fragiles dans plusieurs "
    "composants, notamment avec <i>currentRole.toUpperCase()</i>."
))

story.append(h2('3.6 Erreurs silencieuses'))
story.append(body(
    "Un pattern recurrent dans le codebase est l'utilisation de <i>catch {}</i> vide ou de <i>.catch(() => {})</i> "
    "qui avale les erreurs sans aucun retour utilisateur. De nombreux appels API dans les composants adoptent "
    "ce pattern, ce qui signifie que si une requete echoue (reseau indisponible, erreur serveur, timeout), "
    "l'utilisateur ne recoit aucune notification ni indication que quelque chose s'est mal passe. Les donnees "
    "ne se chargent tout simplement pas, laissant l'utilisateur dans une situation d'incertitude. L'utilisation "
    "du composant Toaster (deja monte dans le layout via shadcn) permettrait de resoudre ce probleme de "
    "maniere elegante et unifiee."
))


# ════════════════════════════════════════════════════
# SECTION 4: ACCESSIBILITE
# ════════════════════════════════════════════════════
story.extend(safe_keep([h1('4. Accessibilite et inclusivite')]))

story.append(body(
    "CreaPulse integre un panneau d'accessibilite complet offrant six fonctionnalites avancees : ajustement "
    "de la taille du texte (100% a 300%), mode contraste eleve, police OpenDyslexic pour les personnes "
    "dyslexiques, pause des animations, ligne de lecture et masque de lecture. Ce niveau d'integration "
    "est remarquable pour une plateforme de cette taille et temoigne d'une veritable volonte d'inclusivite. "
    "Cependant, plusieurs problemes fondamentaux d'accessibilite persistent au niveau de la structure HTML."
))
story.append(spacer(4))

a11y_headers = ['Probleme', 'Severite', 'Recommandation']
a11y_rows = [
    ['Pas de lien "Aller au contenu"', 'Haute', 'Ajouter un lien skip-to-content en debut de page'],
    ['Sidebar : buttons au lieu de nav/a', 'Haute', 'Utiliser des elements nav semantiques'],
    ['Pas de gestion du focus apres transition', 'Moyenne', 'Gerer le focus lors des changements de vue'],
    ['Contraste insuffisant (text-gray-400)', 'Moyenne', 'Verifier les ratios WCAG AA (4.5:1)'],
    ['Pas de regions ARIA live', 'Moyenne', 'Ajouter aria-live pour contenu dynamique'],
    ['Footer : span au lieu de a/button', 'Haute', 'Utiliser des vrais liens accessibles'],
    ['Pas de aria-expanded sur les toggles', 'Moyenne', 'Ajouter aria-expanded sur sidebar, dropdowns'],
    ['Pas de prefers-reduced-motion', 'Moyenne', 'Ajouter media query CSS pour animations'],
]
story.append(make_table(a11y_headers, a11y_rows, [AW*0.40, AW*0.15, AW*0.45]))
story.append(Paragraph('Tableau 4 - Problemes d\'accessibilite identifies', CAPTION_STYLE))
story.append(spacer(6))

story.append(body(
    "L'absence de liens skip-to-content est particulierement problematique pour les utilisateurs naviguant "
    "au clavier. Actuellement, la navigation au clavier doit traverser l'ensemble de la sidebar avant "
    "d'atteindre le contenu principal. De meme, l'utilisation d'elements span pour les liens du footer "
    "les rend totalement invisibles pour les lecteurs d'ecran et inaccessibles via la touche Tab. "
    "L'ajout de l'attribut <i>aria-expanded</i> sur les elements depliables (sidebar, dropdowns, sheets) "
    "permettrait aux technologies d'assistance de communiquer l'etat d'ouverture/fermeture a l'utilisateur."
))


# ════════════════════════════════════════════════════
# SECTION 5: PERFORMANCE ET MAINTENABILITE
# ════════════════════════════════════════════════════
story.extend(safe_keep([h1('5. Performance et maintenabilite')]))

story.append(h2('5.1 Stores de donnees en memoire'))
story.append(body(
    "Plusieurs routes API stockent leurs donnees dans des variables en memoire (tableaux JavaScript ou "
    "objets) plutot que dans la base de donnees PostgreSQL. C'est le cas des routes <i>/api/diagnostics</i> "
    "(donnees mock hardcodees), <i>/api/go-nogo</i>, <i>/api/financing</i>, <i>/api/roadmap</i> (etapes "
    "hardcodees), et <i>/api/strategy</i>. Ces donnees sont perdues a chaque redemarrage du serveur, "
    "ne sont pas partagees entre les instances, et ne peuvent pas etre queryees de maniere flexible. "
    "Le schema Prisma contient pourtant les modeles correspondants (DiagnosisSession, ModuleResult), "
    "mais la route diagnostics ne les utilise pas et retourne des donnees fictives."
))

story.append(h2('5.2 Gestion des erreurs'))
story.append(body(
    "La plateforme ne dispose d'aucun <b>ErrorBoundary</b> React. Si un composant leve une erreur lors "
    "du rendu, l'ensemble de l'application crash sans possibilite de recouverement. De plus, le pattern "
    "de gestion d'erreurs API est inegal : certaines routes retournent <i>{ error: string }</i>, d'autres "
    "<i>{ message: string }</i>, et les messages d'erreur melangent francais et anglais sans logique "
    "apparente. La standardisation du format de reponse d'erreur et l'ajout d'un ErrorBoundary "
    "enveloppant chaque composant de dashboard seraient des ameliorations significatives."
))

story.append(h2('5.3 Dependencies et patterns'))
story.append(body(
    "L'authentification utilise le hashage synchrone bcrypt (hashSync/compareSync) qui bloque l'event loop "
    "Node.js pendant l'operation. Sur un serveur avec de la charge, cela peut ralentir toutes les requetes "
    "concurrentes. Les versions asynchrones (hash/compare) sont recommandees. Par ailleurs, les constantes "
    "de modele IA sont hardcodees dans 5 fichiers routes (<i>'claude-opus-4-6-20250514'</i>, "
    "<i>'claude-sonnet-4-20250514'</i>) au lieu d'utiliser systematiquement une variable d'environnement "
    "<i>AI_MODEL</i>. Enfin, le jeton JWT expire par defaut apres 7 jours sans mecanisme de renouvellement, "
    "ce qui represents un risque de securite pour les sessions longues."
))


# ════════════════════════════════════════════════════
# SECTION 6: PLAN D'ACTION PRIORISE
# ════════════════════════════════════════════════════
story.extend(safe_keep([h1('6. Plan d\'action priorise')]))

story.append(body(
    "Les recommandations suivantes sont organisees en quatre niveaux de priorite selon leur impact "
    "sur la satisfaction utilisateur et l'effort de mise en oeuvre. Le niveau P0 regroupe les actions "
    "critiques qui doivent etre traitees immediatement car elles affectent directement la confiance des "
    "utilisateurs et la securite de la plateforme. Les niveaux P1 et P2 representent des ameliorations "
    "significatives a planifier sur le court et moyen terme."
))
story.append(spacer(6))

story.append(h2('6.1 P0 - Actions critiques (immediat)'))
p0_headers = ['#', 'Action', 'Fichier(s)', 'Impact']
p0_rows = [
    ['1', 'Ajouter onClick au bouton "Voir la demo"', 'landing.tsx:270-276', 'Confiance utilisateur'],
    ['2', 'Valider le checkbox CGU a la soumission', 'auth.tsx:53-110', 'Conformite juridique'],
    ['3', 'Securiser les 19 routes API non authentifiees', 'api/*', 'Securite des donnees'],
    ['4', 'Activer le rate limiting sur les routes IA', 'api/ai/chat, api/business-plan/*', 'Cout et securite'],
    ['5', 'Corriger le header hamburger (sheet vide)', 'header.tsx', 'Experience mobile'],
    ['6', 'Supprimer ou implementer les boutons OAuth', 'auth.tsx:344-378', 'Perte de confiance'],
]
story.append(severity_table(p0_headers, p0_rows, [AW*0.05, AW*0.40, AW*0.30, AW*0.25]))
story.append(Paragraph('Tableau 5 - Actions critiques P0', CAPTION_STYLE))
story.append(spacer(8))

story.append(h2('6.2 P1 - Ameliorations haute priorite (1-2 semaines)'))
p1_headers = ['#', 'Action', 'Impact utilisateur']
p1_rows = [
    ['7', 'Ajouter un systeme d\'onboarding (modal de bienvenue + parcours guide)', 'Reduction du taux d\'abandon de 30-50%'],
    ['8', 'Grouper les 19 items de navigation en 3-4 categories', 'Reduction de la surcharge cognitive'],
    ['9', 'Ajouter un ErrorBoundary global + notifications toast', 'Fiabilisation de l\'experience'],
    ['10', 'Corriger le mismatch labels sidebar vs onglets (Tableau de Bord / Roadmap)', 'Coherence de la navigation'],
    ['11', 'Ajouter l\'onglet Notifications dans la sidebar', 'Accessibilite complete des fonctionnalites'],
    ['12', 'Standardiser les formats de reponse API et les messages d\'erreur', 'Maintenabilite et debug'],
    ['13', 'Remplacer les donnees mock de /api/diagnostics par des requetes DB', 'Fiabilite des donnees'],
]
story.append(make_table(p1_headers, p1_rows, [AW*0.05, AW*0.60, AW*0.35]))
story.append(Paragraph('Tableau 6 - Ameliorations haute priorite P1', CAPTION_STYLE))
story.append(spacer(8))

story.append(h2('6.3 P2 - Ameliorations moyenne priorite (2-4 semaines)'))
p2_headers = ['#', 'Action', 'Impact utilisateur']
p2_rows = [
    ['14', 'Extraire user-dashboard.tsx (1546 lignes) en composants separes', 'Maintenabilite du code'],
    ['15', 'Remplacer les 35 types "any" par des types Prisma specifiques', 'Securite du typage'],
    ['16', 'Ajouter un indicateur de force du mot de passe', 'Reduction des echecs d\'inscription'],
    ['17', 'Migrer bcrypt synchrone vers asynchrone', 'Performance serveur'],
    ['18', 'Ajouter aria-expanded et role="tablist" pour l\'accessibilite', 'Conformite WCAG'],
    ['19', 'Implmenter prefers-reduced-motion comme media query CSS', 'Accessibilite animations'],
    ['20', 'Ajouter un break-point tablette (768-1024px)', 'Experience sur tablette'],
    ['21', 'Remplacer les stores en memoire par des requetes Prisma', 'Persistance des donnees'],
]
story.append(make_table(p2_headers, p2_rows, [AW*0.05, AW*0.55, AW*0.40]))
story.append(Paragraph('Tableau 7 - Ameliorations moyenne priorite P2', CAPTION_STYLE))
story.append(spacer(8))

story.append(h2('6.4 P3 - Ameliorations basse priorite (backlog)'))
story.append(body(
    "Les ameliorations de niveau P3 sont des optimisations a placer dans le backlog pour une iteration "
    "ulterieure. Elles incluent : la migration du JWT localStorage vers des cookies httpOnly pour la "
    "production, l'ajout d'un mecanisme de refresh token, l'unification du systeme de roles entre "
    "Prisma et Zustand, l'introduction de React Query ou SWR pour la gestion des donnees serveur, "
    "la standardisation de la taille de pagination (actuellement variable entre 9, 12, 15 et 20 selon les routes), "
    "et l'implementation ou la suppression definitive des fonctionnalites OAuth Google/Microsoft."
))


# ════════════════════════════════════════════════════
# SECTION 7: CONCLUSION
# ════════════════════════════════════════════════════
story.extend(safe_keep([h1('7. Conclusion et vision')]))

story.append(body(
    "CreaPulse dispose d'une base solide : un schema de donnees Prisma bien structure avec plus de 30 modeles, "
    "une bibliotheque de 42 composants UI shadcn, et une couverture fonctionnelle impressionnante avec 55 routes API "
    "et 33 composants applicatifs. La plateforme repond a un veritable besoin d'accompagnement entrepreneurial "
    "et propose des fonctionnalites innovantes comme le Jeu des Pepites, les simulations juridiques et l'IA "
    "copilote. Cependant, l'experience utilisateur actuelle ne reflete pas cette richesse fonctionnelle."
))
story.append(spacer(4))
story.append(body(
    "Les six points de friction critiques identifies - boutons non fonctionnels, absence d'onboarding, "
    "navigation surchargee, routes non securisees, rate limiting inactif, et erreurs silencieuses - "
    "creent une experience qui peut frustrer meme les utilisateurs les plus motives. La bonne nouvelle est "
    "que la plupart de ces problemes sont resolubles avec un effort modere. Les actions P0 peuvent etre "
    "traitees en quelques jours et auront un impact immediat sur la confiance et la securite."
))
story.append(spacer(4))
story.append(body(
    "La priorite strategique recommandee est de se concentrer d'abord sur le parcours premier contact "
    "(landing, inscription, onboarding) avant d'investir dans de nouvelles fonctionnalites. Un porteur "
    "de projet qui vit une premiere experience fluide et encourageante est significativement plus likely "
    "de s'engager dans la plateforme, de completer les modules de diagnostic, et de recommander CreaPulse "
    "a son reseau. L'investissement dans l'experience utilisateur est donc directement corrle a l'acquisition "
    "et a la retention."
))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# BUILD
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
doc.multiBuild(story)
print("Body PDF generated:", OUTPUT_PATH)
