# -*- coding: utf-8 -*-
from tccs.models import TCC, AvaliacaoFase1, AvaliacaoFase2

tcc = TCC.objects.filter(etapa_atual='ANALISE_FINAL_COORDENADOR').first()

if tcc:
    print(f'\n=== TCC #{tcc.id}: {tcc.titulo[:50]}... ===')
    print(f'Etapa: {tcc.etapa_atual}')
    print(f'Orientador ID: {tcc.orientador_id}')
    print(f'Coorientador ID: {tcc.coorientador_id}')

    print(f'\n--- Avaliacoes Fase II ---')
    avaliacoes_f2 = AvaliacaoFase2.objects.filter(tcc=tcc)
    for av in avaliacoes_f2:
        eh_orientador = (av.avaliador_id == tcc.orientador_id)
        eh_coorientador = (av.avaliador_id == tcc.coorientador_id) if tcc.coorientador_id else False
        tipo = "Orientador" if eh_orientador else ("Coorientador" if eh_coorientador else "Avaliador Externo")

        print(f'  [{av.id}] {av.avaliador.nome_completo} ({tipo})')
        print(f'      Avaliador ID: {av.avaliador_id}')
        print(f'      Status: {av.status}')
        print(f'      Nota: {av.calcular_nota_total()}')

    print(f'\n--- Avaliacoes Fase I ---')
    avaliacoes_f1 = AvaliacaoFase1.objects.filter(tcc=tcc)
    for av in avaliacoes_f1:
        eh_orientador = (av.avaliador_id == tcc.orientador_id)
        eh_coorientador = (av.avaliador_id == tcc.coorientador_id) if tcc.coorientador_id else False
        tipo = "Orientador" if eh_orientador else ("Coorientador" if eh_coorientador else "Avaliador Externo")

        print(f'  [{av.id}] {av.avaliador.nome_completo} ({tipo})')
        print(f'      Avaliador ID: {av.avaliador_id}')
        print(f'      Status: {av.status}')
        print(f'      Nota: {av.calcular_nota_total()}')

    print(f'\nOK TCC #{tcc.id} esta pronto para testar PARTE 8')
    print(f'\nPara testar via API:')
    print(f'POST /api/tccs/{tcc.id}/analise-final/solicitar-ajustes-finais/')

    avaliadores_ids = [str(av.avaliador_id) for av in avaliacoes_f2]
    print(f'Body: {{"avaliadores": [{", ".join(avaliadores_ids)}], "mensagem": "Teste"}}')

    print(f'\nResultado esperado:')
    print(f'- Fase II: {avaliacoes_f2.count()} avaliacoes desbloqueadas')
    externos_ids = [av.avaliador_id for av in avaliacoes_f2
                     if av.avaliador_id != tcc.orientador_id
                     and (not tcc.coorientador_id or av.avaliador_id != tcc.coorientador_id)]
    print(f'- Fase I: {len(externos_ids)} avaliacoes desbloqueadas (apenas externos: {externos_ids})')

else:
    print('\nNenhum TCC em ANALISE_FINAL_COORDENADOR encontrado')
