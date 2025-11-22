from tccs.models import TCC, AvaliacaoFase2
from usuarios.models import Usuario

tcc = TCC.objects.filter(id=5).first()
if tcc:
    print(f'\n=== TCC #{tcc.id} ===')
    print(f'Título: {tcc.titulo[:50]}...')
    print(f'Etapa atual: {tcc.etapa_atual}')
    print(f'NF2: {tcc.nf2}')
    print(f'Avaliação F2 bloqueada: {tcc.avaliacao_fase2_bloqueada}')

    avs = AvaliacaoFase2.objects.filter(tcc=tcc)
    print(f'\n=== Avaliações Fase II ({avs.count()} total) ===')
    for av in avs:
        nota = av.calcular_nota_total()
        print(f'  [{av.id}] {av.avaliador.nome_completo}')
        print(f'      Status: {av.status}')
        print(f'      Nota: {nota}')
        print(f'      Avaliador ID: {av.avaliador_id}')

    print(f'\n✅ TCC #{tcc.id} está pronto para testar "Solicitar Ajustes"')
    print(f'   - Selecione alguns avaliadores com status BLOQUEADO')
    print(f'   - Use IDs: {[av.avaliador_id for av in avs if av.status == "BLOQUEADO"]}')
else:
    print('TCC #5 não encontrado')
