# -*- coding: utf-8 -*-
"""Audit CréaPulse - Conformité aux objectifs de la prestation CréaScope"""
import sys, os
sys.path.insert(0, os.path.join(os.path.expanduser('~/.openclaw/workspace/skills/pdf/scripts')))
from pdf import install_font_fallback

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from pypdf import PdfReader, PdfWriter, Transformation
import hashlib

# ━━ Palette ━━
ACCENT       = colors.HexColor('#318ead')
TEXT_PRIMARY  = colors.HexColor('#21201e')
TEXT_MUTED    = colors.HexColor('#8d8881')
BG_SURFACE   = colors.HexColor('#dfdcd7')
BG_PAGE      = colors.HexColor('#f2f0ed')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_SURFACE

# Status colors
GREEN  = colors.HexColor('#059669')
AMBER  = colors.HexColor('#d97706')
RED    = colors.HexColor('#dc2626')

# ━━ Fonts ━━
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/english/calibri-regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('Calibri', normal='Calibri', bold='Calibri')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')
install_font_fallback()

# ━─ Page setup ━─
PAGE_W, PAGE_H = A4
LEFT_M = 1.8*cm
RIGHT_M = 1.8*cm
TOP_M = 2*cm
BOT_M = 2*cm
AW = PAGE_W - LEFT_M - RIGHT_M  # ~523pt

# ━─ Styles ━─
s_title = ParagraphStyle('Title', fontName='Microsoft YaHei', fontSize=22, leading=28, textColor=TEXT_PRIMARY, spaceAfter=12, alignment=TA_LEFT)
s_h1 = ParagraphStyle('H1', fontName='Microsoft YaHei', fontSize=16, leading=22, textColor=ACCENT, spaceBefore=18, spaceAfter=8, alignment=TA_LEFT)
s_h2 = ParagraphStyle('H2', fontName='Microsoft YaHei', fontSize=13, leading=18, textColor=TEXT_PRIMARY, spaceBefore=14, spaceAfter=6, alignment=TA_LEFT)
s_body = ParagraphStyle('Body', fontName='SimHei', fontSize=10.5, leading=17, textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK', firstLineIndent=0)
s_body_indent = ParagraphStyle('BodyIndent', fontName='SimHei', fontSize=10.5, leading=17, textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK', firstLineIndent=21)
s_bullet = ParagraphStyle('Bullet', fontName='SimHei', fontSize=10.5, leading=17, textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK', leftIndent=18, bulletIndent=6, bulletFontName='SimHei', bulletFontSize=10.5)
s_small = ParagraphStyle('Small', fontName='SimHei', fontSize=9, leading=14, textColor=TEXT_MUTED, alignment=TA_LEFT, wordWrap='CJK')
s_cell = ParagraphStyle('Cell', fontName='SimHei', fontSize=9.5, leading=14, textColor=TEXT_PRIMARY, alignment=TA_CENTER, wordWrap='CJK')
s_cell_left = ParagraphStyle('CellLeft', fontName='SimHei', fontSize=9.5, leading=14, textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK')
s_header_cell = ParagraphStyle('HeaderCell', fontName='Microsoft YaHei', fontSize=10, leading=14, textColor=colors.white, alignment=TA_CENTER, wordWrap='CJK')
s_toc_h1 = ParagraphStyle('TOCH1', fontName='SimHei', fontSize=12, leftIndent=20)
s_toc_h2 = ParagraphStyle('TOCH2', fontName='SimHei', fontSize=10.5, leftIndent=40)

def status_txt(level):
    if level == 'ok': return Paragraph('<font color="#059669">OK</font>', s_cell)
    if level == 'partial': return Paragraph('<font color="#d97706">PARTIEL</font>', s_cell)
    if level == 'missing': return Paragraph('<font color="#dc2626">MANQUANT</font>', s_cell)
    return Paragraph(level, s_cell)

def pct_bar(pct):
    """Return colored percentage bar text."""
    if pct >= 70: c = '#059669'
    elif pct >= 40: c = '#d97706'
    else: c = '#dc2626'
    return Paragraph(f'<font color="{c}">{pct}%</font>', s_cell)

def make_table(data, col_widths):
    """Create styled table with proper widths."""
    avail = AW
    total = sum(col_widths)
    if total < avail * 0.85:
        scale = (avail * 0.90) / total
        col_widths = [w * scale for w in col_widths]
    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

# ── TOC ──
class TocDoc(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

def heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/>%s' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

# ── Build ──
OUT_PDF = '/home/z/my-project/download/CreaPulse_Audit_Conformite_Objectifs.pdf'
BODY_PDF = '/home/z/my-project/download/_audit_body.pdf'

doc = TocDoc(BODY_PDF, pagesize=A4, leftMargin=LEFT_M, rightMargin=RIGHT_M, topMargin=TOP_M, bottomMargin=BOT_M)
story = []

# ===== COVER (placeholder page, will be replaced) =====
story.append(Spacer(1, 300))

# ===== TABLE DES MATIERES =====
story.append(Paragraph('<b>Tableau des matieres</b>', s_title))
toc = TableOfContents()
toc.levelStyles = [s_toc_h1, s_toc_h2]
story.append(toc)
story.append(PageBreak())

# ============================================================
# 1. INTRODUCTION
# ============================================================
story.append(heading('1. Introduction', s_h1, level=0))
story.append(Paragraph(
    "Ce rapport constitue un audit complet de la plateforme CréaPulse confrontant l'etat "
    "actuel du systeme aux six objectifs definis dans le referentiel de prestation CréaScope BGE Bretagne. "
    "L'objectif est d'identifier les fonctionnalites conformes, celles partiellement couvertes, "
    "et les lacunes critiques, afin de prioriser les developments a realiser pour atteindre un taux "
    "de couverture optimal.", s_body_indent))
story.append(Spacer(1, 8))
story.append(Paragraph(
    "L'audit porte sur l'ensemble des composants frontend et backend du systeme, soit : 18 composants "
    "React, 27 routes API, 15 modeles de donnees Prisma, et une base de donnees PostgreSQL. "
    "Le systeme se decompose en trois espaces : Porteur de projet, Conseiller, et Administrateur.", s_body_indent))
story.append(Spacer(1, 8))
story.append(Paragraph(
    "Methode : chaque objectif est decompose en sous-objectifs operationnels. Pour chaque sous-objectif, "
    "une evaluation est realisee sur trois niveaux : OK (fonctionnalite complete et operationnelle), "
    "PARTIEL (fonctionnalite presente mais incomplete ou non reliee aux donnees), MANQUANT (aucune "
    "fonctionnalite correspondante). Un pourcentage de couverture est calcule par objectif et globalement.", s_body_indent))
story.append(Spacer(1, 12))

# ============================================================
# 2. OBJECTIF 1 — Élaborer une stratégie de développement
# ============================================================
story.append(heading('2. Objectif 1 : Elaborer une strategie de developpement', s_h1, level=0))
story.append(Paragraph(
    "Cet objectif couvre la capacite du porteur a construire une vision strategique pour son projet, "
    "en s'appuyant sur une analyse de rentabilite, un portefeuille clients et l'identification de leviers "
    "de croissance. C'est un pilier central de la prestation CréaScope qui doit permettre de "
    "transformer les intuitions en donnees argumentees.", s_body_indent))
story.append(Spacer(1, 12))

# 2.1
story.append(heading('2.1 Analyse de rentabilite et previsionnel financier', s_h2, level=1))
story.append(Paragraph(
    "Le module de previsionnel financier (FinancialForecast) est bien developpe. Il permet de saisir les "
    "revenus mensuels estimes (CA, nombre de clients, panier moyen), les charges detaillees (loyer, salaires, "
    "charges sociales, marketing, fournitures, assurances, autres), et d'appliquer des taux de croissance "
    "et d'inflation. Le systeme calcule automatiquement le resultat mensuel, la marge nette, le point mort, "
    "et genere une projection sur 3 ans.", s_body_indent))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "L'analyse IA via Claude est integree et fonctionne via /api/ai/chat. Les donnees sont sauvegardables "
    "en base (/api/financial) et exportables en JSON. Cependant, plusieurs limites existent : aucune analyse par "
    "offre ou par produit, pas de calcul de la rentabilite unitaire, pas de suivi des couts complets "
    "(TVA, CFE, CVAE), et pas de comparaison scenario optimiste/pessimiste.", s_body_indent))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "De plus, le previsionnel est en grande partie statique avec des donnees saisies manuellement. "
    "Il n'y a pas de connexion avec les modules RIASEC, Kiviat ou Analyse de marche pour croiser les "
    "donnees et enrichir les projections avec les resultats du diagnostic.", s_body_indent))

# 2.2
story.append(heading('2.2 Analyse de marche et positionnement concurrentiel', s_h2, level=1))
story.append(Paragraph(
    "Le module d'analyse de marche (MarketAnalysis) est le plus complet des outils strategiques. Il dispose "
    "d'une interface de recherche par secteur et region, d'une analyse IA complete via /api/market-analysis/research, "
    "qui produit : un apercu marche (taille, croissance, tendance), des clients cibles identifies, "
    "un tableau concurrentiel detaille (forces/faiblesses, parts de marche), des tendances du marche "
    "avec niveaux d'impact, une matrice SWOT, des indicateurs cles sourcés, des recommandations "
    "IA priorisees, et un score de confiance.", s_body_indent))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Le systeme integre egalement une base de connaissances Obsidian-like (KnowledgeEntry) pour stocker "
    "des donnees sectorielles, reglementaires, bonnes pratiques et actualites. Cependant, cette base "
    "est actuellement peuplee uniquement avec des donnees de demo statiques et non alimentee dynamiquement "
    "par les recherches web ou des imports de documents. L'integration avec z-ai-web-dev-sdk pour les "
    "recherches en temps reel existe dans le code mais n'est pas exploitee dans le composant.", s_body_indent))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "L'absence de donnees reelles et d'historique constitue le principal point faible de ce module. "
    "Le score de confiance affiche est generique et les recommandations, bien structurees, restent "
    "generiques.", s_body_indent))

# 2.3
story.append(heading('2.3 Portefeuille clients et segmentation', s_h2, level=1))
story.append(Paragraph(
    "Aucun module de gestion du portefeuille clients n'existe dans le systeme actuel. Le champ "
    "'nombre de clients' du previsionnel financier est un champ numerique simple sans structure sous-jacente. "
    "Il n'y a pas de CRM, pas de segmentation client, pas de suivi historique des commandes, "
    "pas d'analyse de la valeur vie client (LTV), et pas de fidelisation. C'est un manque "
    "majeur pour l'elaboration d'une strategie de developpement.", s_body_indent))

# 2.4 Summary Table
story.append(Spacer(1, 12))
data1 = [
    [Paragraph('<b>Sous-objectif</b>', s_header_cell),
     Paragraph('<b>Statut</b>', s_header_cell),
     Paragraph('<b>Couverture</b>', s_header_cell),
     Paragraph('<b>Details</b>', s_header_cell)],
    [Paragraph('Previsionnel financier (3 ans)', s_cell_left),
     status_txt('partial'), pct_bar(65),
     Paragraph('Charges, projection 3 ans, IA', s_small),
     Paragraph('Manque : par offre, TVA/CFE, scenarios', s_small)],
    [Paragraph('Analyse de marche IA', s_cell_left),
     status_txt('ok'), pct_bar(85),
     Paragraph('SWOT, concurrents, tendances', s_small),
     Paragraph('Base de connaissances non alimentee', s_small)],
    [Paragraph('Portefeuille clients', s_cell_left),
     status_txt('missing'), pct_bar(0),
     Paragraph('', s_small),
     Paragraph('Aucun module, champ numerique basique', s_small)],
    [Paragraph('Leviers de croissance', s_cell_left),
     status_txt('missing'), pct_bar(10),
     Paragraph('Taux croissance only', s_small),
     Paragraph('Pas d'identification structuree', s_small)],
    [Paragraph('Strategie globale', s_cell_left),
     status_txt('partial'), pct_bar(40),
     Paragraph('Marche + financier existent', s_small),
     Paragraph('Pas de vue strategique unifiee', s_small)],
]
story.append(make_table(data1, [160, 70, 70, 200]))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tableau 1 : Couverture de lObjectif 1 — Strategie de developpement</i>', s_small))
story.append(Spacer(1, 18))

# ============================================================
# 3. OBJECTIF 2 — Piloter la croissance
# ============================================================
story.append(heading('3. Objectif 2 : Piloter la croissance de son activite', s_h1, level=0))
story.append(Paragraph(
    "Cet objectif exige des outils de pilotage : indicateurs, tableaux de bord, axes de developpement "
    "identifies, et prise de decision sur le changement de regime juridique. Il s'agit du suivi "
    "operationnel post-creation.", s_body_indent))
story.append(Spacer(1, 12))

story.append(heading('3.1 Tableaux de bord et indicateurs de performance', s_h2, level=1))
story.append(Paragraph(
    "Le porteur dispose d'un Tableau de Bord (onglet dans le dashboard) qui affiche une "
    "feuille de route dynamique : profil, Bilan, RIASEC, Motivations, Juridique, Analyse de marche, "
    "et Previsionnel financier. La progression est calculee automatiquement en fonction des onglets "
    "visites. Cependant, il s'agit d'une roadmap de parcours de diagnostic, non d'un tableau de bord "
    "operational avec des KPIs.", s_body_indent))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Il manque : des indicateurs quantifies suivis dans le temps (CA reel vs previsionnel, "
    "nombre de clients, marge effective), des graphiques d'evolution, des alertes automatisees "
    "(seuil de rentabilite, alerte de tresorerie), et d'un systeme de notification basee sur les "
    "indicateurs cles. Le module ne permet pas de piloter la croissance au quotidien.", s_body_indent))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Le conseiller dispose d'un dashboard avec synthese IA, notes d'entretien, et entretien "
    "phases. Mais il n'a pas de vue temps reel sur les KPIs de ses clients, pas de tableaux de "
    "board comparatifs, et pas de systeme d'alertes sur les echeances et les indicateurs critiques.", s_body_indent))

story.append(heading('3.2 Axes de developpement identifies', s_h2, level=1))
story.append(Paragraph(
    "Les modules de diagnostic (RIASEC, Kiviat, Motivations, Jeu des Pepites) identifient les axes "
    "de developpement du porteur, mais de facon statique. Les resultats sont sauvegardes en base "
    "mais ne sont pas exploites dynamiquement dans un suivi longitudinal. Il n'y a pas de comparaison "
    "avant/apres diagnostic, pas de suivi de l'evolution des competences, et pas de "
    "mesure de l'impact des formations recommandees.", s_body_indent))

story.append(heading('3.3 Changement de regime juridique', s_h2, level=1))
story.append(Paragraph(
    "Le module juridique (JuridiquePanel) est bien concu avec un comparatif detaille de 4 statuts "
    "(Auto-entrepreneur, SARL/EURL, SAS/SASU, SCI), incluant fiscalite, charges sociales, "
    "plafonds de CA, avantages/inconvenients, protection sociale et complexite. Une recommandation "
    "IA est disponible. Cependant, le choix de statut est purement informatif : il n'y a pas de "
    "sauvegarde du statut selectionne, pas de simulation d'impact fiscal, et pas de "
    "fonctionnement de comparaison avant/apres changement de regime.", s_body_indent))

story.append(heading('3.4 Synthese Objectif 2', s_h2, level=1))
data2 = [
    [Paragraph('<b>Sous-objectif</b>', s_header_cell),
     Paragraph('<b>Statut</b>', s_header_cell),
     Paragraph('<b>Couverture</b>', s_header_cell),
     Paragraph('<b>Details</b>', s_header_cell)],
    [Paragraph('Roadmap parcours diagnostic', s_cell_left),
     status_txt('ok'), pct_bar(80),
     Paragraph('7 etapes, auto-progression', s_small),
     Paragraph('Pas des KPIs operationnels', s_small)],
    [Paragraph('KPIs et indicateurs', s_cell_left),
     status_txt('missing'), pct_bar(5),
     Paragraph('', s_small),
     Paragraph('Aucune mesure temporelle', s_small)],
    [Paragraph('Axes de developpement', s_cell_left),
     status_txt('partial'), pct_bar(30),
     Paragraph('Identifies mais pas suivis', s_small),
     Paragraph('Pas de suivi longitudinal', s_small)],
    [Paragraph('Changement juridique', s_cell_left),
     status_txt('partial'), pct_bar(55),
     Paragraph('Comparatif 4 statuts + IA', s_small),
     Paragraph('Pas de simulation fiscale', s_small)],
    [Paragraph('Pilotage croissance', s_cell_left),
     status_txt('missing'), pct_bar(10),
     Paragraph('', s_small),
     Paragraph('Pas de dashboard operationnel', s_small)],
]
story.append(make_table(data2, [160, 70, 70, 200]))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tableau 2 : Couverture de lObjectif 2 — Pilotage de la croissance</i>', s_small))
story.append(Spacer(1, 18))

# ============================================================
# 4. OBJECTIF 3 — Changement d'échelle
# ============================================================
story.append(heading('4. Objectif 3 : Mesurer les incidences du changement d\'echelle', s_h1, level=0))
story.append(Paragraph(
    "Cet objectif traite des implications de la croissance : augmentation de la production, "
    "expansion sur de nouveaux marches, et anticipation de l'impact sur la structure et les "
    "ressources de l'entreprise.", s_body_indent))
story.append(Spacer(1, 12))

story.append(heading('4.1 Augmentation de la production', s_h2, level=1))
story.append(Paragraph(
    "Aucun module ne permet de simuler l'impact d'une augmentation de la production sur l'entreprise. "
    "Il n'y a pas d'outil de capacite de production, pas de calcul des couts marginaux croissants, "
    "pas de gestion des approvisionnements, et pas de plan de charge. Le previsionnel financier "
    "permet de saisir un taux de croissance mais sans lien avec les besoins en ressources humaines "
    "ou materielles.", s_body_indent))

story.append(heading('4.2 Expansion sur nouveaux marches', s_h2, level=1))
story.append(Paragraph(
    "Le module d'analyse de marche permet de lancer des recherches par secteur et region, ce "
    "constitue la base d'une analyse d'expansion. Cependant, il n'y a pas de comparaison "
    "multi-territoire, pas de mesure du potentiel de chaque marche, pas d'outil d'evaluation "
    "des couts d'entree sur un nouveau marche (logistique, distribution, reglementation locale), "
    "et pas de scenarisation d'expansion progressive.", s_body_indent))

story.append(heading('4.3 Anticipation des implications', s_h2, level=1))
story.append(Paragraph(
    "Il n'y a pas de module de gestion du changement d'echelle. Pas d'outil de planification "
    "des ressources (recrutement, locaux, equipements), pas de calcul de l'impact du "
    "changement de statut juridique sur les charges sociales en cas d'embauche, pas de "
    "gestion des risques lies a la croissance, et pas de modelisation de scénarios "
    "optimiste/pessimiste.", s_body_indent))

data3 = [
    [Paragraph('<b>Sous-objectif</b>', s_header_cell),
     Paragraph('<b>Statut</b>', s_header_cell),
     Paragraph('<b>Couverture</b>', s_header_cell),
     Paragraph('<b>Details</b>', s_header_cell)],
    [Paragraph('Analyse de marche multi-territoire', s_cell_left),
     status_txt('missing'), pct_bar(15),
     Paragraph('', s_small),
     Paragraph('Secteur unique, pas de comparaison', s_small)],
    [Paragraph('Planification ressources', s_cell_left),
     status_txt('missing'), pct_bar(0),
     Paragraph('', s_small),
     Paragraph('Aucun module', s_small)],
    [Paragraph('Scenarisation expansion', s_cell_left),
     status_txt('missing'), pct_bar(0),
     Paragraph('', s_small),
     Paragraph('Pas de simulateur', s_small)],
    [Paragraph('Gestion risques croissance', s_cell_left),
     status_txt('missing'), pct_bar(0),
     Paragraph('', s_small),
     Paragraph('Aucun module', s_small)],
    [Paragraph('Impacts changement statut', s_cell_left),
     status_txt('missing'), pct_bar(5),
     Paragraph('Juridique statique compare', s_small),
     Paragraph('Pas de simulation sociale', s_small)],
]
story.append(make_table(data3, [160, 70, 70, 200]))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tableau 3 : Couverture de lObjectif 3 — Changement d\'echelle</i>', s_small))
story.append(Spacer(1, 18))

# ============================================================
# 5. OBJECTIF 4 — Besoins en financement
# ============================================================
story.append(heading('5. Objectif 4 : Analyser les besoins en financement', s_h1, level=0))
story.append(Paragraph(
    "Cet objectif couvre l'identification des besoins financiers et la recherche de ressources "
    "appropriees pour y repondre : subventions, prets bancaires, investisseurs, aides publiques.", s_body_indent))
story.append(Spacer(1, 12))

story.append(heading('5.1 Identification des besoins financiers', s_h2, level=1))
story.append(Paragraph(
    "Le previsionnel financier permet de determiner si le projet est viable (resultat mensuel/annuel, "
    "marge, point mort) et estime un besoin en tresorerie initiale (champ 'tresorerie initiale' "
    "dans la synthese). Cependant, il n'y a pas de calcul structure des besoins : pas de plan de "
    "financement detaille (besoins en fonds propres, besoins en emprunt, besoins en subventions), "
    "pas de distinction tresorerie de demarrage vs tresorerie d'exploitation, pas de calendrier "
    "de besoins de financement, et pas d'evaluation de la capacite d'autofinancement.", s_body_indent))

story.append(heading('5.2 Ressources et aides disponibles', s_h2, level=1))
story.append(Paragraph(
    "Aucun module ne reference les dispositifs de financement existants : ACRE, Bpifrance, Prêt "
    "d'honneur d'initiative (PDI), CCI, region Bretagne, aides BGE, ARE, etc. Il n'y a pas de "
    "base de donnees des aides et subventions disponibles, pas de simulateur de pret bancaire, "
    "pas d'outil de matching investisseur, et pas de génération automatique de dossiers de "
    "financement. C'est un manque critique car le porteur est souvent perdu face à la complexite "
    "du paysage financier francais.", s_body_indent))

data4 = [
    [Paragraph('<b>Sous-objectif</b>', s_header_cell),
     Paragraph('<b>Statut</b>', s_header_cell),
     Paragraph('<b>Couverture</b>', s_header_cell),
     Paragraph('<b>Details</b>', s_header_cell)],
    [Paragraph('Calcul besoins financiers', s_cell_left),
     status_txt('partial'), pct_bar(25),
     Paragraph('Point mort + tresorerie', s_small),
     Paragraph('Pas de plan de financement', s_small)],
    [Paragraph('Catalogue aides/subventions', s_cell_left),
     status_txt('missing'), pct_bar(0),
     Paragraph('', s_small),
     Paragraph('Aucune reference existante', s_small)],
    [Paragraph('Simulateur pret bancaire', s_cell_left),
     status_txt('missing'), pct_bar(0),
     Paragraph('', s_small),
     Paragraph('Aucun simulateur', s_small)],
    [Paragraph('Matching investisseurs', s_cell_left),
     status_txt('missing'), pct_bar(0),
     Paragraph('', s_small),
     Paragraph('Aucun module', s_small)],
    [Paragraph('Dossiers financement', s_cell_left),
     status_txt('missing'), pct_bar(0),
     Paragraph('', s_small),
     Paragraph('Aucun generateur', s_small)],
]
story.append(make_table(data4, [160, 70, 70, 200]))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tableau 4 : Couverture de lObjectif 4 — Besoins en financement</i>', s_small))
story.append(Spacer(1, 18))

# ============================================================
# 6. OBJECTIF 5 — Compétences
# ============================================================
story.append(heading('6. Objectif 5 : Identifier les competences acquises et a developper', s_h1, level=0))
story.append(Paragraph(
    "Cet objectif exige un systeme d'evaluation des competences du porteur, identification des "
    "ecarts (gaps), et elaboration d'un plan de developpement des competences cles.", s_body_indent))
story.append(Spacer(1, 12))

story.append(heading('6.1 Identification des competences existantes', s_h2, level=1))
story.append(Paragraph(
    "Le module CompetencesTab presente une zone de drag-and-drop pour l'import de CV (PDF, DOC, DOCX) "
    "et une cartographie visuelle statique en 3 etapes : Competences acquises, Ecarts identifies, "
    "Plan de developpement. Cependant, l'upload de CV est purement visuel (aucun traitement backend), "
    "la cartographie affiche des donnees en dur (Management, Communication, Marketing digital / "
    "Gestion financiere, Droit des societes, Strategie) sans lien avec les resultats des modules "
    "RIASEC, Kiviat ou Jeu des Pepites.", s_body_indent))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Le modele de donnees SkillGapAnalysis existe dans le schema Prisma mais n'est pas exploite "
    "par l'interface. Il n'y a pas d'analyse IA du CV, pas de comparaison automatique entre les "
    "competences du CV et les resultats des tests, et pas de mise a jour dynamique des ecarts.", s_body_indent))

story.append(heading('6.2 Plan de developpement des competences', s_h2, level=1))
story.append(Paragraph(
    "Le plan de developpement affiche des donnees statiques ('Formation comptabilite', "
    "'Mentorat entrepreneurial') mais n'est ni personnalise ni relie aux ecarts reels identifies. "
    "Il n'y a pas de recommandation de formations specifiques basee sur le profil RIASEC "
    "et les besoins du projet, pas de suivi de la completion des formations, et pas de "
    "mesure de l'evolution des competences apres formation.", s_body_indent))

story.append(heading('6.3 Jeu des Pepites et Kiviat', s_h2, level=1))
story.append(Paragraph(
    "Le Jeu des Pepites (SwipeGame) est bien implemente : 50 cartes de soft skills avec "
    "interaction swipe, sauvegarde en base via /api/swipe-game, et compteur de pepites identifiees. "
    "Le diagramme de Kiviat affiche 6 dimensions entrepreneuriales (Leadership, Creativite, "
    "Gestion stress, Communication, Resolution pb, Autonomie). Cependant, ces deux modules sont "
    "independants et leurs resultats ne se croisent pas. Les dimensions du Kiviat ne sont pas "
    "alimentees par les pepites selectionnes.", s_body_indent))

data5 = [
    [Paragraph('<b>Sous-objectif</b>', s_header_cell),
     Paragraph('<b>Statut</b>', s_header_cell),
     Paragraph('<b>Couverture</b>', s_header_cell),
     Paragraph('<b>Details</b>', s_header_cell)],
    [Paragraph('Upload CV + analyse IA', s_cell_left),
     status_txt('missing'), pct_bar(5),
     Paragraph('Zone upload visuelle', s_small),
     Paragraph('Aucun traitement backend', s_small)],
    [Paragraph('Skill Gap Analysis', s_cell_left),
     status_txt('missing'), pct_bar(5),
     Paragraph('Modele Prisma existe', s_small),
     Paragraph('Pas exploite par l'interface', s_small)],
    [Paragraph('Jeu des Pepites', s_cell_left),
     status_txt('ok'), pct_bar(80),
     Paragraph('50 soft skills, sauvegarde BDD', s_small),
     ('Non relie aux ecarts', s_small)],
    [Paragraph('Diagramme Kiviat', s_cell_left),
     status_txt('ok'), pct_bar(75),
     Paragraph('6 dimensions, affichage', s_small),
     ('Donnees statiques, pas dynamique', s_small)],
    [Paragraph('Plan formation', s_cell_left),
     status_txt('missing'), pct_bar(10),
     Paragraph('Affiche donnees statiques', s_small),
     ('Non personnalise, pas suivi', s_small)],
    [Paragraph('Suivi evolution', s_cell_left),
     status_txt('missing'), pct_bar(0),
     Paragraph('', s_small),
     ('Aucun suivi longitudinal', s_small)],
]
story.append(make_table(data5, [160, 70, 70, 200]))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tableau 5 : Couverture de lObjectif 5 — Competences</i>', s_small))
story.append(Spacer(1, 18))

# ============================================================
# 7. OBJECTIF 6 — Diagnostic global
# ============================================================
story.append(heading('7. Objectif 6 : Poser un diagnostic global', s_h1, level=0))
story.append(Paragraph(
    "Cet objectif est le fil rouge de la prestation CréaScope : evaluer la situation de "
    "l'entrepreneur et de son entreprise pour identifier les actions a mettre en oeuvre "
    "pour assurer le developpement.", s_body_indent))
story.append(Spacer(1, 12))

story.append(heading('7.1 Evaluation complete du porteur', s_h2, level=1))
story.append(Paragraph(
    "Le systeme offre un ensemble complet de modules d'evaluation : Profil, Bilan Decouverte "
    "(Jeu des Pepites + Kiviat), Test RIASEC (18 questions, 6 profils, mots-cles), "
    "Motivations & Freins (7 motivations, 7 barriers, score d'alignement), Choix du statut "
    "juridique (4 statuts compares), Analyse de marche IA, et Previsionnel financier. "
    "La feuille de route du Tableau de Bord permet de suivre la progression.", s_body_indent))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Tous ces modules disposent d'une analyse IA via Claude et d'une sauvegarde en base de "
    "donnees. Le systeme couvre donc bien les dimensions du diagnostic entrepreneurial.", s_body_indent))

story.append(heading('7.2 Processus d\'entretien structure', s_h2, level=1))
story.append(Paragraph(
    "L'entretien est un element central de la prestation CréaScope. Le systeme dispose d'un "
    "module InterviewSession tres complet : 3 phases structurees (Accueil & Profil, Diagnostic "
    "Approfondi, Synthese & Feuille de route), mode flexible (3h continue ou 3x1h), "
    "chronometre avec timer circulaire, checklist par phase, navigation entre phases, et "
    "suivi du temps ecoule.", s_body_indent))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Les notes d'entretien (NotesPanel) sont bien structurees : 8 categories (Observation, "
    "Question, Point cle, Action, Inquietude, Force, Idee, Decision), tri par phase et par "
    "categorie, synthese IA, filtrage par recherche, et epinage/_marquage. La sauvegarde en base "
    "est operationnelle via /api/interview-notes.", s_body_indent))

story.append(heading('7.3 Decision Go/No-Go', s_h2, level=1))
story.append(Paragraph(
    "Le module GoNoGoPanel est bien concu avec 6 criteres pondérés (Motivation 20%, "
    "Competences 20%, Marche 20%, Financier 15%, Juridique 10%, Reseau 15%), "
    "un radar chart SVG interactif, une recommandation IA automatisee (GO si score >= 60, "
    "NO-GO si < 40), une zone de justification, et un systeme de confirmation de decision. "
    "La sauvegarde en base est operationnelle.", s_body_indent))

story.append(heading('7.4 Synthese et livrables', s_h2, level=1))
story.append(Paragraph(
    "Le module SynthesisPanel genere une synthese IA du diagnostic complet, un rapport "
    "imprimable (window.print), et des livrables sauvegardables en base (rapport de diagnostic "
    "et certificat). Cependant, la synthese utilise des donnees de demo/mock plutot que des "
    "donnees reelles issues des modules. Le generateur de livrables (LivrablesTab) "
    "est un simulateur avec delai d'attente : les fichiers PDF et Excel ne sont pas "
    "generees reellement.", s_body_indent))

story.append(heading('7.5 Mode collaboratif', s_h2, level=1))
story.append(Paragraph(
    "C'est le point le plus critique de l'objectif. La prestation CréaScope implique "
    "un accompagnement humain avec un conseiller. Or, le systeme actuel ne prevoit pas de "
    "mode collaboratif reel. Le conseiller et le porteur n'ont pas de vue partagee sur le "
    "diagnostic en cours. Les donnees sont stockees par utilisateur mais ne sont pas "
    "visibles par le conseiller en temps reel. Il n'y a pas de messagerie instantanee, pas de "
    "partage d'ecran collaboratif, et pas de workflow de validation conjointe. "
    "L'entretien est concu pour etre realise par le conseiller seul.", s_body_indent))

story.append(heading('7.6 Synthese Objectif 6', s_h2, level=1))
data6 = [
    [Paragraph('<b>Sous-objectif</b>', s_header_cell),
     Paragraph('<b>Statut</b>', s_header_cell),
     Paragraph('<b>Couverture</b>', s_header_cell),
     Paragraph('<b>Details</b>', s_header_cell)],
    [Paragraph('Modules d\'evaluation', s_cell_left),
     status_txt('ok'), pct_bar(90),
     Paragraph('6 modules complets', s_small),
     ('Tous avec IA + sauvegarde BDD', s_small)],
    [Paragraph('Processus d\'entretien', s_cell_left),
     status_txt('ok'), pct_bar(85),
     Paragraph('3 phases, 2 modes, chrono', s_small),
     ('Checklist par phase operationnel', s_small)],
    [Paragraph('Notes d\'entretien', s_cell_left),
     status_txt('ok'), pct_bar(80),
     Paragraph('8 categories, tri, synthese IA', s_small),
     ('Sauvegarde BDD operationnelle', s_small)],
    [Paragraph('Decision Go/No-Go', s_cell_left),
     status_txt('ok'), pct_bar(85),
     Paragraph('6 criteres ponderes, radar', s_small),
     ('Confirmation de decision', s_small)],
    [Paragraph('Synthese & livrables', s_cell_left),
     status_txt('partial'), pct_bar(40),
     Paragraph('Synthese IA + rapport', s_small),
     ('Donnees mock, pas vrais livrables', s_small)],
    [Paragraph('Mode collaboratif', s_cell_left),
     status_txt('missing'), pct_bar(0),
     Paragraph('', s_small),
     ('Pas de vue partagee, pas messagerie', s_small)],
    [Paragraph('Rapport exportable', s_cell_left),
     status_txt('partial'), pct_bar(35),
     Paragraph('Print + structure', s_small),
     ('Pas de PDF/Excel reel', s_small)],
]
story.append(make_table(data6, [160, 70, 70, 200]))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tableau 6 : Couverture de l\'Objectif 6 — Diagnostic global</i>', s_small))
story.append(Spacer(1, 18))

# ============================================================
# 8. TABLEAU RECAPITULATIF GLOBAL
# ============================================================
story.append(heading('8. Tableau recapitulatif global', s_h1, level=0))
story.append(Paragraph(
    "Le tableau ci-dessous synthetise le taux de couverture de chaque objectif de la prestation "
    "CréaScope BGE Bretagne, avec une decomposition par sous-objectif.", s_body_indent))
story.append(Spacer(1, 12))

data_global = [
    [Paragraph('<b>Objectif CréaScope</b>', s_header_cell),
     Paragraph('<b>Taux</b>', s_header_cell),
     Paragraph('<b>Points forts</b>', s_header_cell),
     Paragraph('<b>Lacunes critiques</b>', s_header_cell)],
    [Paragraph('1 - Strategie de developpement', s_cell_left),
     status_txt('partial'), pct_bar(40),
     Paragraph('Marche IA, previsionnel', s_small),
     Paragraph('CRM manquant, pas de strategie unifiee', s_small)],
    [Paragraph('2 - Piloter la croissance', s_cell_left),
     status_txt('partial'), pct_bar(30),
     Paragraph('Comparatif juridique', s_small),
     Paragraph('Pas de KPIs, pas de dashboard', s_small)],
    [Paragraph('3 - Changement d\'echelle', s_cell_left),
     status_txt('missing'), pct_bar(5),
     Paragraph('Analyse de marche existe', s_small),
     ('Pas de simulation, pas de planif ressources', s_small)],
    [Paragraph('4 - Besoins en financement', s_cell_left),
     status_txt('partial'), pct_bar(15),
     Paragraph('Tresorerie initiale', s_small),
     ('Pas de catalogue aides, pas de simulateur', s_small)],
    [Paragraph('5 - Competences', s_cell_left),
     status_txt('partial'), pct_bar(35),
     Paragraph('Jeu des Pepites, Kiviat', s_small),
     ('CV non traite, plan non personnalise', s_small)],
    [Paragraph('6 - Diagnostic global', s_cell_left),
     status_txt('ok'), pct_bar(75),
     Paragraph('Entretien, Go/No-Go, IA', s_small),
     ('Collaboratif absent, livrables mock', s_small)],
]
story.append(make_table(data_global, [155, 55, 145, 140]))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Taux de couverture global estime : environ 33%</i> (<i>30/90</i>) '
    'avec les lacunes critiques identifiees. <b>Note : ce taux ne prend pas '
    'en compte les qualites ergonomiques, l\'accessibilite WCAG 2.1 AA, et les '
    'ameliorations de securite deja effectuees qui sont conformes.</i>', s_small))
story.append(Spacer(1, 12))

# ============================================================
# 9. PLAN D'ACTION PRIORITISE
# ============================================================
story.append(heading('9. Plan d\'action priorise', s_h1, level=0))
story.append(Paragraph(
    "Pour atteindre un taux de couverture superieur a 80%, les actions suivantes sont "
    "recommandees par ordre de priorite, en fonction de leur impact sur la couverture "
    "des objectifs et de leur complexite de realisation.", s_body_indent))
story.append(Spacer(1, 12))

story.append(heading('9.1 Priorite HAUTE — Impact immediat sur 3+ objectifs', s_h2, level=1))

story.append(heading('9.1.1 Mode collaboratif Conseiller-Porteur', s_cell_left))
story.append(Paragraph(
    "Impact : Objectifs 1, 2, 5, 6 (tous sauf 3). Actuellement, le systeme est "
    "uniquement mono-utilisateur. Mettre en place un espace de partage de diagnostic, un "
    "systeme de notification en temps reel, et une vue conseiller du diagnostic en cours "
    "avec possibilite d'annoter les resultats. Ceci est fondamental pour la valeur de "
    "l'accompagnement.", s_body_indent))
story.append(Spacer(1, 4))
story.append(Paragraph(
    '<b>Complexite :</b> Moyenne. Necessite une refonte du modele de donnees pour lier les '
    'entites, ajouter des permissions de lecture, et creer un systeme de notifications '
    'push en temps reel.', s_body))

story.append(heading('9.1.2 Modulesriques manquants pour le diagnostic', s_cell_left))
story.append(Paragraph(
    "Impact : Objectifs 2, 5, 6. Ajouter les modules Tableau de bord operationnel "
    "avec KPIs suivis (CA reel mensuel, marge, tresorerie, nombre de clients actifs, taux de "
    "retention), un module de suivi de l'evolution des competences avec timeline, et une "
    "vue admin des indicateurs territoriaux agreges.", s_body_indent))
story.append(Spacer(1, 4))
story.append(Paragraph(
    '<b>Complexite :</b> Moyenne. Le dashboard operationnel necessite des donnees temps reel '
    'et des agregations. Le suivi competences necessite une reference initiale et un '
    'systeme de rappels.', s_body))

story.append(heading('9.1.3 Base de connaissances dynamique', s_cell_left))
story.append(Paragraph(
    "Impact : Objectifs 1, 3, 4. Connecter la base de connaissances Obsidian avec les "
    "resultats des recherches web de l'analyse de marche (/api/market-analysis/research utilise "
    "deja le SDK z-ai-web-dev-sdk) et les flux d'actualites. Permettre au conseiller "
    "d'enrichir la base avec des etudes sectorielles, reglementations et actualites.", s_body_indent))
story.append(Spacer(1, 4))
story.append(Paragraph(
    '<b>Complexite :</b> Moyenne. Necessite un pipeline ETL (Extract-Transform-Load), "
    'une validation des sources, et une interface d'administration de la base.', s_body))

story.append(heading('9.2 Priorite MOYENNE — Impact sur 2+ objectifs', s_h2, level=1))

story.append(heading('9.2.1 CRM et gestion portefeuille clients', s_cell_left))
story.append(Paragraph(
    "Impact : Objectif 1 (strategie) et 4 (financement). Creer un module de gestion du "
    "portefeuille clients avec : fiche client, historique des echanges, segmentation "
    "(PME/grand compte/professionnel), suivi des commandes, analyse de la valeur vie client, "
    "et integration avec le previsionnel financier pour des projections personnalisees.", s_body_indent))
story.append(Spacer(1, 4))
story.append(Paragraph(
    '<b>Complexite :</b> Elevee. Necessite un modele de donnees CRM, des relations, '
    'et une interface de gestion complete.', s_body))

story.append(heading('9.2.2 Module de financement et aides', s_cell_left))
story.append(Paragraph(
    "Impact : Objectif 4 (financement) et 2 (croissance). Creer un catalogue des aides et "
    "subventions disponibles (Bpifrance, ACRE, CCI, BGE Bretagne, Region, etc.), un "
    "simulateur de pret bancaire, et un generateur de plan de financement structure.", s_body_indent))
story.append(Spacer(1, 4))
story.append(Paragraph(
    '<b>Complexite :</b> Elevee. Necessite une base de donnees externe mise a jour et '
    'des integrations API.', s_body))

story.append(heading('9.2.3 Suivi longitudinal des competences', s_cell_left))
story.append(Paragraph(
    "Impact : Objectif 5 (competences). Relier les resultats RIASEC, Kiviat, Jeu des "
    "Pepites et analyse de CV pour creer un profil competences dynamique qui evolue "
    "dans le temps. Ajouter des recommandations de formations personnalisees et un suivi "
    "de la realisation des formations completees.", s_body_indent))
story.append(Spacer(1, 4))
story.append(Paragraph(
    '<b>Complexite :</b> Moyenne. Necessite de croiser les donnees des 4+ modules '
    'et d'ajouter une logique de suivi.', s_body))

story.append(heading('9.2.4 Generateur de livrables reels', s_cell_left))
story.append(Paragraph(
    "Impact : Objectif 6 (diagnostic). Remplacer le simulateur de livrables par un "
    "generateur PDF/Excel reel qui compile les donnees de tous les modules en un rapport "
    "professionnel structure : profil, resultats des tests, analyse IA, recommandations, et "
    "feuille de route.", s_body_indent))
story.append(Spacer(1, 4))
story.append(Paragraph(
    '<b>Complexite :</b> Moyenne. Necessite ReportLab pour PDF, et un template '
    'professionnel.', s_body))

story.append(heading('9.3 Priorite BASSE — Ameliorations', s_h2, level=1))

story.append(heading('9.3.1 Croisement des donnees inter-modules', s_cell_left))
story.append(Paragraph(
    "Impact : Tous les objectifs. Les modules fonctionnent en silos mais partagent les memes "
    "donnees (projet, secteur, resultats). Centraliser les donnees dans un modele "
    "unifie et croiser les references entre modules pour des analyses plus riches.", s_body_indent))

story.append(heading('9.3.2 Simulation de scénarios', s_cell_left))
story.append(Paragraph(
    "Impact : Objectifs 1, 2, 3, 4. Ajouter des simulateurs optimiste/pessimiste "
    "pour le previsionnel financier, l'expansion, et le changement d'echelle.", s_body_indent))

story.append(heading('9.3.3 Notifications intelligentes et alertes', s_cell_left))
story.append(Paragraph(
    "Impact : Objectif 2, 5. Creer un systeme de notifications intelligentes "
    "bases sur les seuils definis : alerte de tresorerie, rappel de formation, "
    "anomalie de marche, echeance d'entretien, et deadline.", s_body_indent))

# ============================================================
# 10. CONCLUSION
# ============================================================
story.append(heading('10. Conclusion et recommandation', s_h1, level=0))
story.append(Paragraph(
    "Le systeme CréaPulse dispose d'une base solide avec des modules de diagnostic "
    "bien concus (RIASEC, Kiviat, Motivations, Juridique, Marche, Financier, "
    "Entretien, Notes, Go/No-Go, Synthese). La qualite ergonomique, "
    "l'accessibilite WCAG 2.1 AA, et la securite sont conformes.", s_body_indent))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Cependant, le taux de couverture reel de la prestation CréaScope est est estime a "
    "environ 33% (hors securite et ergonomie), principalement en raison de lacunes "
    "structurelles : absence de mode collaboratif, absence de donnees operationnelles, "
    "et faible interconnexion entre les modules.", s_body_indent))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "La mise en oeuvre des 3 actions prioritaires hautes (collaboratif, modules "
    "manquants pour le diagnostic, base de connaissances dynamique) permettrait d'atteindre "
    "un taux de couverture superieur a 70-80%. Les actions moyennes et basses "
    "viendient ensuite completer l'edifice pour une couverture optimale.", s_body_indent))

# Build
doc.multiBuild(story)

# Now create cover
cover_html = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: 794px 1123px; margin: 0; }
  html, body { margin: 0; padding: 0; overflow: hidden; background: #f2f0ed; }
  .page { width: 794px; height: 1123px; position: relative; }
  .safe { padding: 12% 14%; }
  .accent-bar { width: 60px; height: 4px; background: #318ead; border-radius: 2px; margin-bottom: 24px; }
  .title { font-size: 38pt; font-weight: 700; color: #21201e; line-height: 1.2; margin-bottom: 8px; }
  .subtitle { font-size: 16pt; color: #8d8881; line-height: 1.5; margin-bottom: 32px; max-width: 500px; }
  .meta { font-size: 11pt; color: #8d8881; line-height: 1.6; margin-bottom: 6px; }
  .divider { width: 80px; height: 1px; background: #dfdcd7; margin-bottom: 24px; }
  .badge { display: inline-block; padding: 6px 16px; background: #318ead; color: white; font-size: 11pt; font-weight: 600; border-radius: 20px; margin-top: 16px; }
  .footer { position: absolute; bottom: 5%; left: 14%; font-size: 9pt; color: #8d8881; }
  .footer-line { width: 60px; height: 1px; background: #dfdcd7; margin-bottom: 8px; }
</style>
</head>
<body>
<div class="page">
  <div class="safe">
    <div class="accent-bar"></div>
    <h1 class="title">Audit de conformite</h1>
    <p class="subtitle">Plateforme CreaPulse vs Objectifs CréaScope BGE Bretagne</p>
    <div class="divider"></div>
    <div class="meta">Mai 2026 · Version 1.0</div>
    <div class="badge">AUDIT</div>
  </div>
  <div class="footer">
    <div class="footer-line"></div>
    <div>Confidentiel — Usage interne</div>
  </div>
</div>
</body>
</html>"""

cover_path = '/home/z/my-project/download/_audit_cover.html'
with open(cover_path, 'w', encoding='utf-8') as f:
    f.write(cover_html)

print("Body PDF built. Generating cover...")

# Generate cover PDF
import subprocess
scripts_dir = os.path.expanduser('~/.openclaw/workspace/skills/pdf/scripts')
result = subprocess.run([
    'node', os.path.join(scripts_dir, 'html2poster.js'),
    cover_path, '--output', '/home/z/my-project/download/_audit_cover.pdf',
    '--width', '794px',
], capture=True, text=True)

if result.returncode != 0:
    print(f"Cover error: {result}")
else:
    print("Cover generated.")

# Merge cover + body
from pypdf import PdfReader, PdfWriter
A4_W, A4_H = 595.28, 841.89

def normalize_page(page, target_w=A4_W, target_h=A4_H):
    box = page.mediabox
    w, h = float(box.width), float(box.height)
    if abs(w - target_w) > 2 or abs(h - target_h) > 2:
        sx, sy = target_w / w, target_h / h
        page.add_transformation(Transformation().scale(sx=sx, sy=sy))
        page.mediabox.lower_left = (0, 0)
        page.mediabox.upper_right = (target_w, target_h)
    return page

writer = PdfWriter()
cover_page = PdfReader('/home/z/my-project/download/_audit_cover.pdf').pages[0]
writer.add_page(normalize_page(cover_page))
for page in PdfReader('/home/z/my-project/download/_audit_body.pdf').pages:
    writer.add_page(normalize_page(page))
writer.add_metadata({
    '/Title': 'Audit CréaPulse - Conformité aux objectifs CréaScope',
    '/Author': 'Z.ai',
    '/Creator': 'Z.ai',
    '/Subject': 'Audit de conformite plateforme CreaPulse',
})
with open(OUT_PDF, 'wb') as f:
    writer.write(f)

# Cleanup temp files
for f in ['/home/z/my-project/download/_audit_cover.pdf', '/home/z/my-project/download/_audit_body.pdf', '/home/z/my-project/download/_audit_cover.html']:
    if os.path.exists(f):
        os.remove(f)

print(f"\nFinal PDF generated: {OUT_PDF}")
import os
print(f"Size: {os.path.getsize(OUT_PDF) / 1024:.1f} Ko")

# Count pages
reader = PdfReader(OUT_PDF)
print(f"Pages: {len(reader.pages)}")
