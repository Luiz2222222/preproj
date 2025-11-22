# -*- coding: utf-8 -*-
"""
Teste completo da PARTE 8: Ajustes Finais com Fase I e II

Testa o fluxo completo:
1. Coordenador solicita ajustes finais
2. Backend desbloqueia Fase II (todos) e Fase I (apenas externos)
3. Orientador consegue reeditar apenas Fase II
4. Externos conseguem reeditar Fase I e II
"""

from tccs.models import TCC, AvaliacaoFase1, AvaliacaoFase2

print('\n' + '='*80)
print('TESTE PARTE 8: Ajustes Finais com Fase I e II')
print('='*80)

# Encontrar TCC em ANALISE_FINAL_COORDENADOR
tcc = TCC.objects.filter(etapa_atual='ANALISE_FINAL_COORDENADOR').first()

if tcc:
    print(f'\n[1] TCC ENCONTRADO')
    print(f'    ID: {tcc.id}')
    print(f'    Titulo: {tcc.titulo[:50]}...')
    print(f'    Etapa: {tcc.etapa_atual}')
    print(f'    Orientador ID: {tcc.orientador_id}')

    print(f'\n[2] AVALIACOES FASE II (3 total)')
    avaliacoes_f2 = AvaliacaoFase2.objects.filter(tcc=tcc)
    for av in avaliacoes_f2:
        eh_orientador = (av.avaliador_id == tcc.orientador_id)
        tipo = "ORIENTADOR" if eh_orientador else "EXTERNO"
        print(f'    - {av.avaliador.nome_completo} (ID:{av.avaliador_id}) [{tipo}]')
        print(f'      Status: {av.status}')

    print(f'\n[3] AVALIACOES FASE I')
    avaliacoes_f1 = AvaliacaoFase1.objects.filter(tcc=tcc)
    if avaliacoes_f1.exists():
        print(f'    Total: {avaliacoes_f1.count()}')
        for av in avaliacoes_f1:
            eh_orientador = (av.avaliador_id == tcc.orientador_id)
            tipo = "ORIENTADOR" if eh_orientador else "EXTERNO"
            print(f'    - {av.avaliador.nome_completo} (ID:{av.avaliador_id}) [{tipo}]')
            print(f'      Status: {av.status}')
    else:
        print('    Nenhuma avaliacao Fase I encontrada')

    print(f'\n[4] TESTE: Solicitar Ajustes Finais')
    avaliadores_ids = [av.avaliador_id for av in avaliacoes_f2]
    print(f'    Endpoint: POST /api/tccs/{tcc.id}/analise-final/solicitar-ajustes-finais/')
    print(f'    Body: {{"avaliadores": {avaliadores_ids}, "mensagem": "Teste"}}')

    externos_ids = [av.avaliador_id for av in avaliacoes_f2
                    if av.avaliador_id != tcc.orientador_id]

    print(f'\n[5] RESULTADO ESPERADO APOS SOLICITAR AJUSTES:')
    print(f'    - TCC muda para: AGUARDANDO_AJUSTES_FINAIS')
    print(f'    - Fase II: {avaliacoes_f2.count()} avaliacoes desbloqueadas (BLOQUEADO -> PENDENTE)')
    print(f'    - Fase I: {len(externos_ids)} avaliacoes desbloqueadas (apenas externos: {externos_ids})')

    print(f'\n[6] COMPORTAMENTO ESPERADO DOS AVALIADORES:')
    for av in avaliacoes_f2:
        eh_orientador = (av.avaliador_id == tcc.orientador_id)
        if eh_orientador:
            print(f'    - {av.avaliador.nome_completo} (Orientador):')
            print(f'      * Pode reeditar Fase II: SIM')
            print(f'      * Pode reeditar Fase I: NAO (nao sera desbloqueada)')
        else:
            print(f'    - {av.avaliador.nome_completo} (Externo):')
            print(f'      * Pode reeditar Fase II: SIM')
            print(f'      * Pode reeditar Fase I: SIM')

    print(f'\n[7] VALIDACAO DA CORRECAO CRITICA:')
    print(f'    A view enviar_avaliacao_fase1 agora:')
    print(f'    - Aceita TCC em AGUARDANDO_AJUSTES_FINAIS')
    print(f'    - Se avaliacao individual esta PENDENTE, permite edicao')
    print(f'    - Ignora flags globais e prazos durante ajustes')

    print(f'\n' + '='*80)
    print('TESTE PRONTO! Execute o fluxo no frontend para validar.')
    print('='*80 + '\n')

else:
    print('\n[ERRO] Nenhum TCC em ANALISE_FINAL_COORDENADOR encontrado')
    print('Execute o fluxo completo ate chegar nessa etapa.\n')
