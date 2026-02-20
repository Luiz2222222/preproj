"""
Geração do Relatório de Avaliação do TCC em DOCX.
Formato baseado no modelo oficial UFPE/DEE (Relatorio de Avaliação do TCC).
Usa o template DOCX como base para preservar header (logo) e estilos.
"""

import io
import os
import re
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml


# Cor roxa do modelo UFPE
COR_ROXA = RGBColor(0x70, 0x30, 0xA0)

# Caminho do template
TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), 'templates', 'relatorio_template.docx')

# Meses em português
MESES_PT = {
    1: 'janeiro', 2: 'fevereiro', 3: 'março', 4: 'abril',
    5: 'maio', 6: 'junho', 7: 'julho', 8: 'agosto',
    9: 'setembro', 10: 'outubro', 11: 'novembro', 12: 'dezembro',
}

# Labels dos critérios do apêndice
CRITERIOS_LABELS = [
    '1) RESUMO',
    '2) INTRODUÇÃO/RELEVÂNCIA DO TRABALHO',
    '3) REVISÃO BIBLIOGRÁFICA',
    '4) DESENVOLVIMENTO',
    '5) CONCLUSÕES',
    '6) CONSIDERAÇÕES ADICIONAIS',
]


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


def _data_por_extenso(data):
    """Formata data como '30 de janeiro de 2026'."""
    return f'{data.day} de {MESES_PT[data.month]} de {data.year}'


def _limpar_body(doc):
    """Remove todos os elementos do body exceto sectPr (section properties)."""
    body = doc.element.body
    sect_pr = body.find(qn('w:sectPr'))
    for child in list(body):
        if child.tag != qn('w:sectPr'):
            body.remove(child)


def _add_paragraph(doc, text='', style=None):
    """Adiciona parágrafo ao documento."""
    p = doc.add_paragraph(text, style=style)
    return p


def _add_run(paragraph, text, bold=False, italic=False, size=None, color=None, font_name=None):
    """Adiciona run a um parágrafo com formatação."""
    run = paragraph.add_run(text)
    if bold:
        run.bold = True
    if italic:
        run.italic = True
    if size:
        run.font.size = size
    if color:
        run.font.color.rgb = color
    if font_name:
        run.font.name = font_name
    return run


def _set_cell_text(cell, text, bold=False, size=None, font_name='Arial', alignment=WD_ALIGN_PARAGRAPH.CENTER):
    """Define texto de uma célula com formatação."""
    cell.text = ''
    p = cell.paragraphs[0]
    p.alignment = alignment
    run = p.add_run(text)
    if bold:
        run.bold = True
    if size:
        run.font.size = size
    if font_name:
        run.font.name = font_name
    # Vertical alignment
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    vAlign = parse_xml(f'<w:vAlign {nsdecls("w")} w:val="center"/>')
    tcPr.append(vAlign)


def _set_cell_shading(cell, color_hex):
    """Define cor de fundo de uma célula."""
    shading = parse_xml(
        f'<w:shd {nsdecls("w")} w:fill="{color_hex}" w:val="clear"/>'
    )
    cell._tc.get_or_add_tcPr().append(shading)


def _set_table_borders(table):
    """Define bordas para toda a tabela (estilo Table Grid)."""
    tbl = table._tbl
    tblPr = tbl.tblPr if tbl.tblPr is not None else parse_xml(f'<w:tblPr {nsdecls("w")}/>')
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        '  <w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/>'
        '  <w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/>'
        '  <w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/>'
        '  <w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/>'
        '  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/>'
        '  <w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/>'
        '</w:tblBorders>'
    )
    # Remove existing borders if any
    existing = tblPr.find(qn('w:tblBorders'))
    if existing is not None:
        tblPr.remove(existing)
    tblPr.append(borders)


def _criar_tabela_notas(doc, headers, pesos, avaliacoes_data, label_media, media_valor, col_widths):
    """
    Cria tabela de notas (Fase I ou Fase II).
    headers: lista de strings para cabeçalho
    pesos: lista de strings para linha de pesos ("0 a X,X")
    avaliacoes_data: lista de listas [['#1', nota1, nota2, ..., total], ...]
    label_media: string para label da média
    media_valor: string formatada da média
    col_widths: lista de larguras das colunas
    """
    n_rows = 2 + len(avaliacoes_data) + 1  # header + pesos + avaliadores + média
    n_cols = len(headers)

    table = doc.add_table(rows=n_rows, cols=n_cols)
    _set_table_borders(table)

    # Row 0: Headers
    for i, header in enumerate(headers):
        cell = table.rows[0].cells[i]
        _set_cell_text(cell, header, bold=True, size=Pt(7), font_name='Arial')

    # "Nota" column header larger
    _set_cell_text(table.rows[0].cells[-1], 'Nota', bold=True, size=Pt(10), font_name='Arial')

    # Row 1: Pesos
    for i, peso in enumerate(pesos):
        cell = table.rows[1].cells[i]
        _set_cell_text(cell, peso, bold=True, size=Pt(8), font_name='Arial')

    # "Nota" on pesos row
    _set_cell_text(table.rows[1].cells[-1], 'Nota', bold=True, size=Pt(10), font_name='Arial')

    # Rows 2+: Avaliadores
    for row_idx, av_data in enumerate(avaliacoes_data):
        for col_idx, val in enumerate(av_data):
            cell = table.rows[2 + row_idx].cells[col_idx]
            _set_cell_text(cell, val, bold=False, size=Pt(8), font_name='Arial')

    # Last row: Média
    last_row = n_rows - 1
    # Merge empty cells on the left
    merge_end = n_cols - 3  # merge from col 0 to col (n-3)
    if merge_end > 0:
        table.rows[last_row].cells[0].merge(table.rows[last_row].cells[merge_end])
    _set_cell_text(table.rows[last_row].cells[0], '', size=Pt(8), font_name='Arial')
    _set_cell_text(table.rows[last_row].cells[-2], label_media, bold=False, size=Pt(8), font_name='Arial')
    _set_cell_text(table.rows[last_row].cells[-1], media_valor, bold=False, size=Pt(8), font_name='Arial')

    # Set column widths
    for row in table.rows:
        for i, width in enumerate(col_widths):
            row.cells[i].width = width

    return table


def gerar_relatorio_avaliacao_docx(tcc):
    """
    Gera o Relatório de Avaliação do TCC em DOCX.
    Retorna bytes do DOCX gerado.
    """
    from .models import AvaliacaoFase1, AvaliacaoFase2, AgendamentoDefesa
    from definicoes.models import CalendarioSemestre
    from users.models import Usuario

    # ===== BUSCAR DADOS =====
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
        data_defesa = agendamento.data
        data_defesa_fmt = data_defesa.strftime('%d/%m/%Y')
        data_defesa_extenso = _data_por_extenso(data_defesa)
    except AgendamentoDefesa.DoesNotExist:
        from django.utils import timezone
        data_defesa = timezone.localdate()
        data_defesa_fmt = data_defesa.strftime('%d/%m/%Y')
        data_defesa_extenso = _data_por_extenso(data_defesa)

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

    # Calcular NF1 e NF2
    notas_f1 = [float(a.calcular_nota_total()) for a in avaliacoes_f1] if avaliacoes_f1 else []
    nf1 = sum(notas_f1) / len(notas_f1) if notas_f1 else (float(tcc.nf1) if tcc.nf1 else 0)

    notas_f2 = [float(a.calcular_nota_total()) for a in avaliacoes_f2] if avaliacoes_f2 else []
    nf2_media = sum(notas_f2) / len(notas_f2) if notas_f2 else 0

    peso_fase1 = 0.6
    peso_fase2 = 0.4
    nf1_ponderado = peso_fase1 * nf1
    nf2_ponderado = peso_fase2 * nf2_media
    nota_final = nf1_ponderado + nf2_ponderado

    resultado = tcc.resultado_final or ('APROVADO' if nota_final >= 6 else 'REPROVADO')

    # Dados do aluno
    aluno = tcc.aluno
    curso_label = _obter_label_curso(aluno.curso)

    # Coordenador
    try:
        coordenador = Usuario.objects.filter(tipo_usuario='COORDENADOR').first()
        coord_tratamento = coordenador.tratamento or '' if coordenador else ''
        coord_nome = f'{coord_tratamento} {coordenador.nome_completo}'.strip() if coordenador else 'Coordenador do TCC'
    except Exception:
        coord_nome = 'Coordenador do TCC'

    # ===== ABRIR TEMPLATE E LIMPAR =====
    doc = Document(TEMPLATE_PATH)
    _limpar_body(doc)

    # ===== TÍTULO =====
    p_titulo = doc.add_paragraph()
    p_titulo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run1 = p_titulo.add_run('RELATÓRIO DE AVALIAÇÃO ')
    run1.font.size = Pt(16)
    run1.font.color.rgb = COR_ROXA
    run1.font.name = 'Tisa Offc Serif Pro'
    # Quebra de linha dentro do mesmo parágrafo
    run_br = p_titulo.add_run('\n')
    run_br.font.size = Pt(16)
    run2 = p_titulo.add_run('TRABALHO DE CONCLUSÃO DE CURSO')
    run2.font.size = Pt(16)
    run2.font.color.rgb = COR_ROXA
    run2.font.name = 'Tisa Offc Serif Pro'

    # Linhas em branco
    doc.add_paragraph()
    doc.add_paragraph()

    # ===== TEXTO INTRODUTÓRIO =====
    p_saudacao = doc.add_paragraph()
    _add_run(p_saudacao, 'Prezado(a) aluno(a),', size=Pt(10))

    doc.add_paragraph()

    # Corpo do texto
    p_corpo = doc.add_paragraph()
    p_corpo.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    pf = p_corpo.paragraph_format
    pf.space_after = Pt(0)

    _add_run(p_corpo,
             'Seu Trabalho de Conclusão de Curso foi avaliado pelas bancas examinadoras '
             'na fase I e na fase II, de acordo com o que estabelece o Regulamento de TCC '
             'do Departamento de Engenharia Elétrica da UFPE. As notas atribuídas ao trabalho, '
             'por quesito, são apresentadas na Tabela 1 (fase I) e na Tabela 2 (fase II). '
             'As notas, considerando os pesos associados a cada fase, são apresentadas na '
             'Tabela 4, onde, também, verifica-se que a ',
             size=Pt(10))
    _add_run(p_corpo, 'nota final', bold=True, size=Pt(10))
    _add_run(p_corpo, ' atribuída ao ', bold=True, size=Pt(10))
    _add_run(p_corpo, 'seu ', bold=True, size=Pt(10))
    _add_run(p_corpo, 'trabalho ', bold=True, size=Pt(10))
    _add_run(p_corpo, 'é', bold=True, size=Pt(10))
    _add_run(p_corpo, ' ', size=Pt(10))
    _add_run(p_corpo, _fmt(nota_final), bold=True, size=Pt(10))
    _add_run(p_corpo, '. Assim, seu TCC está ', size=Pt(10))
    _add_run(p_corpo, resultado, bold=True, size=Pt(10))
    _add_run(p_corpo, '.', size=Pt(10))

    if resultado == 'APROVADO':
        _add_run(p_corpo,
                 ' Com isso, você deve proceder com as correções apontadas pela Banca. '
                 'Além dos comentários feitos no dia da apresentação, veja, também, as observações '
                 'apontadas pela banca na Fase I (APÊNDICES). Após os devidos ajustes e/ou '
                 'correções e a anuência do seu orientador, seu trabalho passará a ter o status '
                 'de versão final. Na versão final, é imprescindível incluir a Ficha Eletrônica '
                 'gerada pela biblioteca.',
                 size=Pt(10))

    doc.add_paragraph()

    # Data
    p_data = doc.add_paragraph()
    p_data.alignment = WD_ALIGN_PARAGRAPH.CENTER
    _add_run(p_data, f'Recife, {data_defesa_extenso}.', size=Pt(10))

    doc.add_paragraph()
    doc.add_paragraph()

    # ===== TABELA INFO (Título, Curso, Data Defesa, Aluno) =====
    info_table = doc.add_table(rows=4, cols=2)
    _set_table_borders(info_table)

    info_data = [
        ('Título do Trabalho', tcc.titulo.upper()),
        ('Curso', curso_label),
        ('Data Defesa', data_defesa_fmt),
        ('Aluno', aluno.nome_completo),
    ]
    for i, (label, valor) in enumerate(info_data):
        _set_cell_text(info_table.rows[i].cells[0], label, bold=True, size=Pt(10),
                       font_name=None, alignment=WD_ALIGN_PARAGRAPH.RIGHT)
        _set_cell_text(info_table.rows[i].cells[1], valor, bold=False, size=Pt(10),
                       font_name=None, alignment=WD_ALIGN_PARAGRAPH.LEFT)

    # Column widths for info table
    for row in info_table.rows:
        row.cells[0].width = Cm(4)
        row.cells[1].width = Cm(13)

    doc.add_paragraph()

    # ===== TABELA 1 — Notas Fase I =====
    p_cap1 = doc.add_paragraph()
    run_cap1 = p_cap1.add_run('Tabela 1 – Notas atribuídas ao trabalho escrito (Fase I)')
    run_cap1.italic = True
    run_cap1.font.size = Pt(9)

    n_av_f1 = len(avaliacoes_f1)
    rows_t1 = 2 + n_av_f1 + 1  # header + pesos + avaliadores + NF1
    table1 = doc.add_table(rows=rows_t1, cols=7)
    _set_table_borders(table1)

    # Header row
    h1_labels = ['', 'Resumo', 'Introdução\nRelevância do trabalho', 'Revisão \nBibliográfica',
                 'Desenvolvimento', 'Conclusões', 'Nota']
    for i, label in enumerate(h1_labels):
        _set_cell_text(table1.rows[0].cells[i], label, bold=True, size=Pt(7), font_name='Arial')
    _set_cell_text(table1.rows[0].cells[6], 'Nota', bold=True, size=Pt(10), font_name='Arial')

    # Pesos row
    p1_pesos = ['Avaliador', f'0 a {_fmt(peso_resumo)}', f'0 a {_fmt(peso_introducao)}',
                f'0 a {_fmt(peso_revisao)}', f'0 a {_fmt(peso_desenvolvimento)}',
                f'0 a {_fmt(peso_conclusoes)}', 'Nota']
    for i, peso in enumerate(p1_pesos):
        _set_cell_text(table1.rows[1].cells[i], peso, bold=True, size=Pt(8), font_name='Arial')
    _set_cell_text(table1.rows[1].cells[6], 'Nota', bold=True, size=Pt(10), font_name='Arial')

    # Avaliadores rows
    for idx, av in enumerate(avaliacoes_f1):
        row = table1.rows[2 + idx]
        nota_total = av.calcular_nota_total()
        vals = [f'#{idx + 1}', _fmt(av.nota_resumo), _fmt(av.nota_introducao),
                _fmt(av.nota_revisao), _fmt(av.nota_desenvolvimento),
                _fmt(av.nota_conclusoes), _fmt(nota_total)]
        for i, val in enumerate(vals):
            _set_cell_text(row.cells[i], val, bold=False, size=Pt(8), font_name='Arial')

    # NF1 row
    last_r1 = rows_t1 - 1
    # Merge cols 0-4 (empty)
    table1.rows[last_r1].cells[0].merge(table1.rows[last_r1].cells[4])
    _set_cell_text(table1.rows[last_r1].cells[0], '', size=Pt(8), font_name='Arial')
    _set_cell_text(table1.rows[last_r1].cells[5], f'Nota Fase I\n(média – NF1)', bold=False, size=Pt(8), font_name='Arial')
    _set_cell_text(table1.rows[last_r1].cells[6], _fmt(nf1), bold=False, size=Pt(8), font_name='Arial')

    # ===== TABELA 2 — Notas Fase II =====
    p_cap2 = doc.add_paragraph()
    run_cap2 = p_cap2.add_run('Tabela 2 – Notas atribuídas a apresentação (Fase II)')
    run_cap2.italic = True
    run_cap2.font.size = Pt(9)

    n_av_f2 = len(avaliacoes_f2)
    rows_t2 = 2 + n_av_f2 + 1
    table2 = doc.add_table(rows=rows_t2, cols=7)
    _set_table_borders(table2)

    h2_labels = ['', 'Coerência do conteúdo da apresentação oral com o documento textual',
                 'Qualidade e estrutura do material de apresentação',
                 'Domínio e conhecimento do tema',
                 'Clareza e fluência verbal na exposição de ideias',
                 'Observância do tempo de apresentação (de 20 a 25 minutos ou definido pela banca)',
                 'Nota']
    for i, label in enumerate(h2_labels):
        _set_cell_text(table2.rows[0].cells[i], label, bold=True, size=Pt(7), font_name='Arial')
    _set_cell_text(table2.rows[0].cells[6], 'Nota', bold=True, size=Pt(10), font_name='Arial')

    p2_pesos = ['Avaliador', f'0 a {_fmt(peso_coerencia)}', f'0 a {_fmt(peso_qualidade)}',
                f'0 a {_fmt(peso_dominio)}', f'0 a {_fmt(peso_clareza)}',
                f'0 a {_fmt(peso_tempo)}', 'Nota']
    for i, peso in enumerate(p2_pesos):
        _set_cell_text(table2.rows[1].cells[i], peso, bold=True, size=Pt(8), font_name='Arial')
    _set_cell_text(table2.rows[1].cells[6], 'Nota', bold=True, size=Pt(10), font_name='Arial')

    for idx, av in enumerate(avaliacoes_f2):
        row = table2.rows[2 + idx]
        nota_total = av.calcular_nota_total()
        vals = [f'#{idx + 1}', _fmt(av.nota_coerencia_conteudo), _fmt(av.nota_qualidade_apresentacao),
                _fmt(av.nota_dominio_tema), _fmt(av.nota_clareza_fluencia),
                _fmt(av.nota_observancia_tempo), _fmt(nota_total)]
        for i, val in enumerate(vals):
            _set_cell_text(row.cells[i], val, bold=False, size=Pt(8), font_name='Arial')

    # NF2 row
    last_r2 = rows_t2 - 1
    table2.rows[last_r2].cells[0].merge(table2.rows[last_r2].cells[4])
    _set_cell_text(table2.rows[last_r2].cells[0], '', size=Pt(8), font_name='Arial')
    _set_cell_text(table2.rows[last_r2].cells[5], f'Nota Fase II\n(média – NF2)', bold=False, size=Pt(8), font_name='Arial')
    _set_cell_text(table2.rows[last_r2].cells[6], _fmt(nf2_media), bold=False, size=Pt(8), font_name='Arial')

    # ===== TABELA 3 — Avaliadores da Banca Fase II =====
    p_cap3 = doc.add_paragraph()
    run_cap3 = p_cap3.add_run('Tabela 3 – Avaliadores da Banca Examinadora da Fase II (apresentação)')
    run_cap3.italic = True
    run_cap3.font.size = Pt(9)

    if avaliacoes_f2:
        table3 = doc.add_table(rows=len(avaliacoes_f2), cols=2)
        _set_table_borders(table3)

        for idx, av in enumerate(avaliacoes_f2):
            avaliador = av.avaliador
            tratamento = avaliador.tratamento or ''
            if tratamento == 'Outro' and avaliador.tratamento_customizado:
                tratamento = avaliador.tratamento_customizado
            nome = f'{tratamento} {avaliador.nome_completo}'.strip()
            _set_cell_text(table3.rows[idx].cells[0], f'#{idx + 1}', bold=False, size=Pt(10),
                           font_name=None, alignment=WD_ALIGN_PARAGRAPH.CENTER)
            _set_cell_text(table3.rows[idx].cells[1], nome, bold=False, size=Pt(10),
                           font_name=None, alignment=WD_ALIGN_PARAGRAPH.LEFT)

        for row in table3.rows:
            row.cells[0].width = Cm(1.5)
            row.cells[1].width = Cm(15.5)

    doc.add_paragraph()

    # ===== TABELA 4 — Apuração da nota final =====
    p_cap4 = doc.add_paragraph()
    run_cap4 = p_cap4.add_run('Tabela 4 – Apuração da nota final do trabalho (NF).')
    run_cap4.italic = True
    run_cap4.font.size = Pt(9)

    table4 = doc.add_table(rows=2, cols=3)
    _set_table_borders(table4)

    # Header row
    _set_cell_text(table4.rows[0].cells[0], 'NF1 × 0,6', bold=True, size=Pt(10), font_name='Arial')
    _set_cell_text(table4.rows[0].cells[1], 'NF2 × 0,4', bold=True, size=Pt(10), font_name='Arial')
    _set_cell_text(table4.rows[0].cells[2], 'Nota Final', bold=True, size=Pt(10), font_name='Arial')

    # Values row
    _set_cell_text(table4.rows[1].cells[0], _fmt(nf1_ponderado), bold=False, size=Pt(8), font_name='Arial')
    _set_cell_text(table4.rows[1].cells[1], _fmt(nf2_ponderado), bold=False, size=Pt(8), font_name='Arial')
    _set_cell_text(table4.rows[1].cells[2], _fmt(nota_final), bold=False, size=Pt(8), font_name='Arial')

    doc.add_paragraph()

    # ===== APÊNDICE A — Comentários Fase I =====
    pareceres_f1 = [(i, av) for i, av in enumerate(avaliacoes_f1, 1) if av.parecer and av.parecer.strip()]

    if pareceres_f1:
        # Page break
        p_break = doc.add_paragraph()
        run_break = p_break.add_run()
        run_break.add_break(WD_BREAK.PAGE)

        # Título do apêndice
        p_ap_titulo = doc.add_paragraph()
        p_ap_titulo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run_ap = p_ap_titulo.add_run('APÊNDICE A')
        run_ap.font.size = Pt(16)
        run_ap.font.color.rgb = COR_ROXA
        run_ap.font.name = 'Tisa Offc Serif Pro'

        p_ap_sub = doc.add_paragraph()
        p_ap_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run_ap_sub = p_ap_sub.add_run('COMENTÁRIOS RELATIVOS AO TRABALHO ESCRITO')
        run_ap_sub.font.size = Pt(16)
        run_ap_sub.font.color.rgb = COR_ROXA
        run_ap_sub.font.name = 'Tisa Offc Serif Pro'

        doc.add_paragraph()
        doc.add_paragraph()

        for idx, av in pareceres_f1:
            # Título do avaliador
            p_avaliador = doc.add_paragraph()
            p_avaliador.alignment = WD_ALIGN_PARAGRAPH.LEFT
            run_av = p_avaliador.add_run(f'Avaliador #{idx}')
            run_av.font.size = Pt(16)

            parecer_texto = av.parecer.strip()

            # Verificar se o parecer tem seções numeradas
            has_sections = any(f'{n})' in parecer_texto for n in range(1, 7))

            if has_sections:
                # Dividir por seções
                secoes = re.split(r'(\d\))', parecer_texto)
                secao_atual = None
                for parte in secoes:
                    parte = parte.strip()
                    if re.match(r'^\d\)$', parte):
                        secao_atual = int(parte[0])
                        if 1 <= secao_atual <= 6:
                            p_crit = doc.add_paragraph()
                            run_crit = p_crit.add_run(CRITERIOS_LABELS[secao_atual - 1])
                            run_crit.font.size = Pt(14)
                    elif parte and secao_atual:
                        p_texto = doc.add_paragraph()
                        run_texto = p_texto.add_run(parte)
                        run_texto.font.size = Pt(10)
                        doc.add_paragraph()
            else:
                # Mostrar todos os critérios, texto sob "Considerações Adicionais"
                for label in CRITERIOS_LABELS:
                    p_crit = doc.add_paragraph()
                    run_crit = p_crit.add_run(label)
                    run_crit.font.size = Pt(14)

                    if label == '6) CONSIDERAÇÕES ADICIONAIS':
                        p_texto = doc.add_paragraph()
                        run_texto = p_texto.add_run(parecer_texto)
                        run_texto.font.size = Pt(10)
                    doc.add_paragraph()

            doc.add_paragraph()

    # ===== GERAR BYTES =====
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()
