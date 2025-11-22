from tccs.models import TCC, AvaliacaoFase2
from usuarios.models import Usuario

# Buscar aluno luiz
aluno = Usuario.objects.filter(email__icontains='luiz').first()
if aluno:
    print(f'Aluno encontrado: {aluno.email}')
    tcc = TCC.objects.filter(aluno=aluno).first()
    if tcc:
        print(f'\nID: {tcc.id}')
        print(f'Etapa: {tcc.etapa_atual}')
        print(f'NF1: {tcc.nf1}')
        print(f'NF2: {tcc.nf2}')
        print(f'Media Final: {tcc.media_final}')
        print(f'Resultado: {tcc.resultado_final}')
        print(f'Bloqueada F2: {tcc.avaliacao_fase2_bloqueada}')

        avs = AvaliacaoFase2.objects.filter(tcc=tcc)
        print(f'\nTotal Avaliacoes F2: {avs.count()}')
        for av in avs:
            nota = av.calcular_nota_total()
            print(f'  - Avaliador {av.avaliador.nome_completo}: Status={av.status}, Nota={nota}')
    else:
        print('TCC nao encontrado')
else:
    print('Aluno luiz nao encontrado')
