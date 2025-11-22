from tccs.models import TCC, AvaliacaoFase2

tcc = TCC.objects.latest('id')
print(f'ID: {tcc.id}')
print(f'Etapa: {tcc.etapa_atual}')
print(f'NF1: {tcc.nf1}')
print(f'NF2: {tcc.nf2}')
print(f'Bloqueada F2: {tcc.avaliacao_fase2_bloqueada}')

avs = AvaliacaoFase2.objects.filter(tcc=tcc)
print(f'Total Avaliacoes F2: {avs.count()}')
for av in avs:
    nota = av.calcular_nota_total()
    print(f'  - Avaliador {av.avaliador.nome_completo}: Status={av.status}, Nota={nota}')
