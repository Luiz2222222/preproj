"""
Geração do Relatório de Avaliação do TCC em PDF.
Layout baseado no modelo REL20.pdf (UFPE/DEE).
"""

import io
from decimal import Decimal
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.colors import black, white, HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)


# Cores
COR_CABECALHO = HexColor('#2C3E50')
COR_CABECALHO_CLARO = HexColor('#ECF0F1')
COR_BORDA = HexColor('#BDC3C7')


def _criar_estilos():
    """Cria os estilos de parágrafo usados no relatório."""
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        'Cabecalho',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        alignment=TA_CENTER,
        spaceAfter=2 * mm,
    ))

    styles.add(ParagraphStyle(
        'SubCabecalho',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        alignment=TA_CENTER,
        spaceAfter=4 * mm,
    ))

    styles.add(ParagraphStyle(
        'TituloSecao',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        alignment=TA_CENTER,
        spaceBefore=6 * mm,
        spaceAfter=3 * mm,
    ))

    styles.add(ParagraphStyle(
        'CorpoTexto',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        alignment=TA_JUSTIFY,
        leading=13,
        spaceAfter=3 * mm,
    ))

    styles.add(ParagraphStyle(
        'CorpoTextoPequeno',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        alignment=TA_JUSTIFY,
        leading=11,
    ))

    styles.add(ParagraphStyle(
        'TabelaTitulo',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        alignment=TA_LEFT,
        spaceAfter=2 * mm,
    ))

    styles.add(ParagraphStyle(
        'Assinatura',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        alignment=TA_CENTER,
    ))

    styles.add(ParagraphStyle(
        'AssinaturaSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        alignment=TA_CENTER,
    ))

    styles.add(ParagraphStyle(
        'ApendiceAvaliador',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        spaceBefore=6 * mm,
        spaceAfter=3 * mm,
    ))

    styles.add(ParagraphStyle(
        'ApendiceCriterio',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        spaceBefore=3 * mm,
        spaceAfter=1 * mm,
    ))

    styles.add(ParagraphStyle(
        'ApendiceTexto',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        alignment=TA_JUSTIFY,
        leading=12,
        spaceAfter=2 * mm,
    ))

    return styles


def _fmt(valor, casas=1):
    """Formata número decimal para string com vírgula."""
    if valor is None:
        return '-'
    return f'{float(valor):.{casas}f}'.replace('.', ',')


def _obter_label_curso(curso_key):
    """Retorna o label amigável do curso."""
    mapa = {
        'ENGENHARIA_ELETRICA': 'Engenharia Elétrica',
        'ENGENHARIA_CONTROLE_AUTOMACAO': 'Engenharia de Controle e Automação',
    }
    return mapa.get(curso_key, curso_key or 'N/A')


def _tabela_style_base():
    """Estilo base reutilizável para tabelas."""
    return [
        ('GRID', (0, 0), (-1, -1), 0.5, COR_BORDA),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]


def gerar_relatorio_avaliacao_pdf(tcc):
    """
    Gera o PDF do Relatório de Avaliação do TCC.
    Retorna bytes do PDF gerado.
    """
    from .models import AvaliacaoFase1, AvaliacaoFase2, AgendamentoDefesa
    from definicoes.models import CalendarioSemestre

    # Buscar dados
    avaliacoes_f1 = list(
        AvaliacaoFase1.objects.filter(tcc=tcc, status='BLOQUEADO')
        .select_related('avaliador')
        .order_by('id')
    )
    avaliacoes_f2 = list(
        AvaliacaoFase2.objects.filter(tcc=tcc, status='BLOQUEADO')
        .select_related('avaliador')
        .order_by('id')
    )

    # Data da defesa
    try:
        agendamento = AgendamentoDefesa.objects.get(tcc=tcc)
        data_defesa = agendamento.data.strftime('%d/%m/%Y')
    except AgendamentoDefesa.DoesNotExist:
        data_defesa = 'N/A'

    # Pesos do calendário
    calendario = CalendarioSemestre.obter_calendario_atual(tcc.semestre)
    if calendario:
        peso_resumo = float(calendario.peso_resumo)
        peso_introducao = float(calendario.peso_introducao)
        peso_revisao = float(calendario.peso_revisao)
        peso_desenvolvimento = float(calendario.peso_desenvolvimento)
        peso_conclusoes = float(calendario.peso_conclusoes)
        peso_coerencia = float(calendario.peso_coerencia_conteudo)
        peso_qualidade = float(calendario.peso_qualidade_apresentacao)
        peso_dominio = float(calendario.peso_dominio_tema)
        peso_clareza = float(calendario.peso_clareza_fluencia)
        peso_tempo = float(calendario.peso_observancia_tempo)
    else:
        peso_resumo, peso_introducao, peso_revisao = 1.0, 2.0, 2.0
        peso_desenvolvimento, peso_conclusoes = 3.5, 1.5
        peso_coerencia, peso_qualidade = 2.0, 2.0
        peso_dominio, peso_clareza, peso_tempo = 2.5, 2.5, 1.0

    # Calcular NF1 e NF2 a partir das avaliações
    notas_f1 = [float(a.calcular_nota_total()) for a in avaliacoes_f1] if avaliacoes_f1 else []
    nf1 = sum(notas_f1) / len(notas_f1) if notas_f1 else (float(tcc.nf1) if tcc.nf1 else 0)

    notas_f2 = [float(a.calcular_nota_total()) for a in avaliacoes_f2] if avaliacoes_f2 else []
    nf2_media = sum(notas_f2) / len(notas_f2) if notas_f2 else 0

    # Nota final: NF1 × 0.6 + NF2 × 0.4 (conforme modelo REL20)
    peso_fase1 = Decimal('0.6')
    peso_fase2 = Decimal('0.4')
    nf1_ponderado = float(peso_fase1) * nf1
    nf2_ponderado = float(peso_fase2) * nf2_media
    nota_final = nf1_ponderado + nf2_ponderado

    resultado = tcc.resultado_final or ('APROVADO' if nota_final >= 6 else 'REPROVADO')

    # Dados do aluno
    aluno = tcc.aluno
    curso_label = _obter_label_curso(aluno.curso)

    # Coordenador (quem está gerando)
    coordenador_nome = 'Coordenador do TCC'

    # Gerar PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = _criar_estilos()
    elements = []

    # ===== PÁGINA 1 =====

    # Cabeçalho
    elements.append(Paragraph('Universidade Federal de Pernambuco', styles['Cabecalho']))
    elements.append(Paragraph('Departamento de Engenharia Elétrica - DEE', styles['Cabecalho']))
    elements.append(Spacer(1, 4 * mm))
    elements.append(Paragraph('RELATÓRIO DE AVALIAÇÃO', styles['SubCabecalho']))
    elements.append(Paragraph('TRABALHO DE CONCLUSÃO DE CURSO', styles['SubCabecalho']))
    elements.append(Spacer(1, 4 * mm))

    # Texto introdutório
    texto_intro = (
        'Prezado(a) aluno(a),<br/><br/>'
        'Seu Trabalho de Conclusão de Curso foi avaliado pelas bancas examinadoras na fase I e na fase II, '
        'de acordo com o que estabelece o Regulamento de TCC do Departamento de Engenharia Elétrica da UFPE. '
        'As notas atribuídas ao trabalho, por quesito, são apresentadas na Tabela 1 (fase I) e na Tabela 2 (fase II). '
        f'As notas, considerando os pesos associados a cada fase, são apresentadas na Tabela 4, onde, também, '
        f'verifica-se que a nota final atribuída ao seu trabalho é <b>{_fmt(nota_final, 1)}</b>. '
        f'Assim, seu TCC está <b>{resultado}</b>.'
    )

    if resultado == 'APROVADO':
        texto_intro += (
            ' Com isso, você deve proceder com as correções apontadas pela Banca. '
            'Além dos comentários feitos no dia da apresentação, veja, também, as observações '
            'apontadas pela banca na Fase I (APÊNDICES). Após os devidos ajustes e/ou correções e '
            'a anuência do seu orientador, seu trabalho passará a ter o status de versão final. '
            'Na versão final, é imprescindível incluir a Ficha Eletrônica gerada pela biblioteca.'
        )

    elements.append(Paragraph(texto_intro, styles['CorpoTexto']))
    elements.append(Spacer(1, 3 * mm))

    # Data
    from django.utils import timezone
    data_atual = timezone.localdate().strftime('%d de %B de %Y')
    # Traduzir meses
    meses = {
        'January': 'janeiro', 'February': 'fevereiro', 'March': 'março',
        'April': 'abril', 'May': 'maio', 'June': 'junho',
        'July': 'julho', 'August': 'agosto', 'September': 'setembro',
        'October': 'outubro', 'November': 'novembro', 'December': 'dezembro',
    }
    for en, pt in meses.items():
        data_atual = data_atual.replace(en, pt)
    elements.append(Paragraph(f'Recife, {data_atual}.', styles['CorpoTexto']))
    elements.append(Spacer(1, 3 * mm))

    # Informações do TCC
    largura_disponivel = A4[0] - 4 * cm
    info_data = [
        ['Título do Trabalho', tcc.titulo.upper()],
        ['Curso', curso_label],
        ['Data Defesa', data_defesa],
        ['Aluno', aluno.nome_completo],
    ]
    info_table = Table(info_data, colWidths=[4 * cm, largura_disponivel - 4 * cm])
    info_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, COR_BORDA),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 0), (0, -1), COR_CABECALHO_CLARO),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 5 * mm))

    # ===== TABELA 1 — Notas Fase I =====
    elements.append(Paragraph(
        f'Tabela 1 – Notas atribuídas ao trabalho escrito (Fase I)',
        styles['TabelaTitulo']
    ))

    # Cabeçalho
    header_f1 = [
        '', 'Resumo', 'Introdução /\nRelevância',
        'Revisão\nBibliográfica', 'Desenvolvimento', 'Conclusões', 'Nota'
    ]
    pesos_f1_row = [
        'Avaliador', f'0 a {_fmt(peso_resumo)}', f'0 a {_fmt(peso_introducao)}',
        f'0 a {_fmt(peso_revisao)}', f'0 a {_fmt(peso_desenvolvimento)}',
        f'0 a {_fmt(peso_conclusoes)}', ''
    ]

    rows_f1 = [header_f1, pesos_f1_row]
    for i, av in enumerate(avaliacoes_f1, 1):
        nota_total = av.calcular_nota_total()
        rows_f1.append([
            f'#{i}',
            _fmt(av.nota_resumo), _fmt(av.nota_introducao),
            _fmt(av.nota_revisao), _fmt(av.nota_desenvolvimento),
            _fmt(av.nota_conclusoes), _fmt(nota_total)
        ])

    # Linha de NF1
    rows_f1.append(['', '', '', '', '', f'Nota Fase I\n(média – NF1)', _fmt(nf1)])

    col_w_f1 = largura_disponivel / 7
    tab_f1 = Table(rows_f1, colWidths=[col_w_f1] * 7)
    style_f1 = _tabela_style_base() + [
        ('BACKGROUND', (0, 0), (-1, 0), COR_CABECALHO),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 1), (-1, 1), COR_CABECALHO_CLARO),
        ('FONTNAME', (0, 1), (0, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, 1), 7),
        # Última linha - NF1
        ('FONTNAME', (-2, -1), (-1, -1), 'Helvetica-Bold'),
        ('SPAN', (0, -1), (-3, -1)),
    ]
    tab_f1.setStyle(TableStyle(style_f1))
    elements.append(tab_f1)
    elements.append(Spacer(1, 5 * mm))

    # ===== TABELA 2 — Notas Fase II =====
    elements.append(Paragraph(
        f'Tabela 2 – Notas atribuídas à apresentação (Fase II)',
        styles['TabelaTitulo']
    ))

    header_f2 = [
        '', 'Coerência do\nconteúdo', 'Qualidade e\nestrutura',
        'Domínio e\nconhecimento', 'Clareza e\nfluência', 'Observância\ndo tempo', 'Nota'
    ]
    pesos_f2_row = [
        'Avaliador', f'0 a {_fmt(peso_coerencia)}', f'0 a {_fmt(peso_qualidade)}',
        f'0 a {_fmt(peso_dominio)}', f'0 a {_fmt(peso_clareza)}',
        f'0 a {_fmt(peso_tempo)}', ''
    ]

    rows_f2 = [header_f2, pesos_f2_row]
    for i, av in enumerate(avaliacoes_f2, 1):
        nota_total = av.calcular_nota_total()
        rows_f2.append([
            f'#{i}',
            _fmt(av.nota_coerencia_conteudo), _fmt(av.nota_qualidade_apresentacao),
            _fmt(av.nota_dominio_tema), _fmt(av.nota_clareza_fluencia),
            _fmt(av.nota_observancia_tempo), _fmt(nota_total)
        ])

    # Linha de NF2
    rows_f2.append(['', '', '', '', '', f'Nota Fase II\n(média – NF2)', _fmt(nf2_media)])

    tab_f2 = Table(rows_f2, colWidths=[col_w_f1] * 7)
    style_f2 = _tabela_style_base() + [
        ('BACKGROUND', (0, 0), (-1, 0), COR_CABECALHO),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 1), (-1, 1), COR_CABECALHO_CLARO),
        ('FONTNAME', (0, 1), (0, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, 1), 7),
        ('FONTNAME', (-2, -1), (-1, -1), 'Helvetica-Bold'),
        ('SPAN', (0, -1), (-3, -1)),
    ]
    tab_f2.setStyle(TableStyle(style_f2))
    elements.append(tab_f2)
    elements.append(Spacer(1, 5 * mm))

    # ===== TABELA 3 — Avaliadores da Fase II =====
    elements.append(Paragraph(
        'Tabela 3 – Avaliadores da Banca Examinadora da Fase II (apresentação)',
        styles['TabelaTitulo']
    ))

    rows_f2_nomes = []
    for i, av in enumerate(avaliacoes_f2, 1):
        avaliador = av.avaliador
        tratamento = avaliador.tratamento or ''
        nome = f'{tratamento} {avaliador.nome_completo}'.strip()
        rows_f2_nomes.append([f'#{i}', nome])

    if rows_f2_nomes:
        tab_nomes = Table(rows_f2_nomes, colWidths=[1.5 * cm, largura_disponivel - 1.5 * cm])
        tab_nomes.setStyle(TableStyle(
            _tabela_style_base() + [
                ('ALIGN', (0, 0), (0, -1), 'CENTER'),
                ('ALIGN', (1, 0), (1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ]
        ))
        elements.append(tab_nomes)
        elements.append(Spacer(1, 5 * mm))

    # ===== TABELA 4 — Apuração da nota final =====
    elements.append(Paragraph(
        'Tabela 4 – Apuração da nota final do trabalho (NF).',
        styles['TabelaTitulo']
    ))

    peso_f1_label = _fmt(float(peso_fase1), 1)
    peso_f2_label = _fmt(float(peso_fase2), 1)

    rows_nf = [
        [
            Paragraph(f'<b>NF1 × {peso_f1_label}</b>', styles['CorpoTextoPequeno']),
            Paragraph(f'<b>NF2 × {peso_f2_label}</b>', styles['CorpoTextoPequeno']),
            Paragraph('<b>Nota Final</b>', styles['CorpoTextoPequeno']),
        ],
        [_fmt(nf1_ponderado), _fmt(nf2_ponderado), _fmt(nota_final)],
    ]

    col_w_nf = largura_disponivel / 3
    tab_nf = Table(rows_nf, colWidths=[col_w_nf] * 3)
    tab_nf.setStyle(TableStyle(
        _tabela_style_base() + [
            ('BACKGROUND', (0, 0), (-1, 0), COR_CABECALHO_CLARO),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, 1), 10),
        ]
    ))
    elements.append(tab_nf)
    elements.append(Spacer(1, 12 * mm))

    # Assinatura do coordenador
    elements.append(Paragraph(coordenador_nome, styles['Assinatura']))
    elements.append(Paragraph(
        'Coordenador do Trabalho de Conclusão<br/>de Curso DEE / CTG / UFPE',
        styles['AssinaturaSub']
    ))

    # ===== PÁGINAS SEGUINTES — APÊNDICE A =====
    # Verificar se há pareceres
    pareceres_f1 = [(i, av) for i, av in enumerate(avaliacoes_f1, 1) if av.parecer and av.parecer.strip()]

    if pareceres_f1:
        elements.append(PageBreak())

        # Cabeçalho do apêndice
        elements.append(Paragraph('Universidade Federal de Pernambuco', styles['Cabecalho']))
        elements.append(Paragraph('Departamento de Engenharia Elétrica - DEE', styles['Cabecalho']))
        elements.append(Spacer(1, 4 * mm))
        elements.append(Paragraph('APÊNDICE A', styles['SubCabecalho']))
        elements.append(Paragraph('COMENTÁRIOS RELATIVOS AO TRABALHO ESCRITO', styles['SubCabecalho']))
        elements.append(Spacer(1, 6 * mm))

        criterios_labels = [
            '1) RESUMO',
            '2) INTRODUÇÃO/RELEVÂNCIA DO TRABALHO',
            '3) REVISÃO BIBLIOGRÁFICA',
            '4) DESENVOLVIMENTO',
            '5) CONCLUSÕES',
            '6) CONSIDERAÇÕES ADICIONAIS',
        ]

        for idx, av in pareceres_f1:
            elements.append(Paragraph(f'Avaliador #{idx}', styles['ApendiceAvaliador']))

            # O parecer é um texto livre. Mostramos ele organizado pelos critérios
            # se o avaliador usou numeração, senão mostramos como texto único
            parecer_texto = av.parecer.strip()

            # Verificar se o parecer tem seções numeradas (1), 2), etc.)
            has_sections = any(f'{n})' in parecer_texto for n in range(1, 7))

            if has_sections:
                # Tentar dividir por seções
                import re
                secoes = re.split(r'(\d\))', parecer_texto)
                secao_atual = None
                for parte in secoes:
                    parte = parte.strip()
                    if re.match(r'^\d\)$', parte):
                        secao_atual = int(parte[0])
                        if 1 <= secao_atual <= 6:
                            elements.append(Paragraph(criterios_labels[secao_atual - 1], styles['ApendiceCriterio']))
                    elif parte and secao_atual:
                        elements.append(Paragraph(parte, styles['ApendiceTexto']))
            else:
                # Mostrar parecer como texto único sob "Considerações"
                for label in criterios_labels:
                    elements.append(Paragraph(label, styles['ApendiceCriterio']))
                    if label == '6) CONSIDERAÇÕES ADICIONAIS':
                        elements.append(Paragraph(parecer_texto, styles['ApendiceTexto']))
                    else:
                        elements.append(Spacer(1, 2 * mm))

            elements.append(Spacer(1, 6 * mm))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
