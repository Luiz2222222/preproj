"""
Signals para automação de eventos no app tccs.

Nota: Boa parte da lógica de eventos está implementada diretamente nas views
para manter o fluxo explícito e facilitar manutenção. Signals aqui são
complementares para ações que devem acontecer sempre, independente da view.
"""
from decimal import Decimal
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import TCC, EventoTimeline, AvaliacaoFase1, AvaliacaoFase2
from .constants import TipoEvento, Visibilidade, EtapaTCC


def _verificar_etapa_fase1(tcc):
    """
    Helper que ajusta tcc.etapa_atual entre AVALIACAO_FASE_1 e VALIDACAO_FASE_1
    com base no estado das avaliações.
    - Todas finalizadas (ENVIADO/BLOQUEADO/CONCLUIDO) e etapa=AVALIACAO_FASE_1 → VALIDACAO_FASE_1.
    - Alguma não-finalizada e etapa=VALIDACAO_FASE_1 → AVALIACAO_FASE_1.
    Pode ser chamado tanto pelo signal quanto por views que usam .update().
    """
    if tcc.etapa_atual not in [EtapaTCC.AVALIACAO_FASE_1, EtapaTCC.VALIDACAO_FASE_1]:
        return False

    total = AvaliacaoFase1.objects.filter(tcc=tcc).count()
    if total == 0:
        return False

    finalizadas = AvaliacaoFase1.objects.filter(
        tcc=tcc,
        status__in=['ENVIADO', 'BLOQUEADO', 'CONCLUIDO']
    ).count()

    if finalizadas == total and tcc.etapa_atual == EtapaTCC.AVALIACAO_FASE_1:
        tcc.etapa_atual = EtapaTCC.VALIDACAO_FASE_1
        tcc.save(update_fields=['etapa_atual'])

        EventoTimeline.objects.create(
            tcc=tcc,
            usuario=None,
            tipo_evento=TipoEvento.FASE2_CONCLUIDA,  # reaproveitando — indica "fase concluída, aguardando coord"
            descricao='Todas as avaliações da Fase I foram enviadas. Aguardando confirmação do coordenador.',
            visibilidade=Visibilidade.ORIENTADOR_COORDENADOR
        )

        # Notificar coordenadores
        try:
            from notificacoes.services import criar_notificacao_em_massa
            from notificacoes.constants import TipoNotificacao, PrioridadeNotificacao
            from users.models import Usuario
            coordenadores = list(Usuario.objects.filter(tipo_usuario='COORDENADOR'))
            criar_notificacao_em_massa(
                usuarios=coordenadores,
                tipo=TipoNotificacao.RESULTADO_FASE_1,
                titulo='Avaliações da Fase I prontas para validação',
                mensagem=f'Todas as avaliações da Fase I do TCC "{tcc.titulo}" foram enviadas e aguardam sua confirmação.',
                action_url=f'/tccs/{tcc.id}',
                tcc_id=tcc.id,
                prioridade=PrioridadeNotificacao.ALTA
            )
        except Exception:
            pass
        return True

    if finalizadas < total and tcc.etapa_atual == EtapaTCC.VALIDACAO_FASE_1:
        tcc.etapa_atual = EtapaTCC.AVALIACAO_FASE_1
        tcc.save(update_fields=['etapa_atual'])
        return True

    return False


@receiver(post_save, sender=TCC)
def criar_evento_criacao_tcc(sender, instance, created, **kwargs):
    """
    Signal para criar evento de criação de TCC.
    Apenas como fallback, já que a view criar_com_solicitacao já cria o evento.
    """
    if created:
        # Verificar se já existe evento de criação (evitar duplicatas)
        existe_evento = EventoTimeline.objects.filter(
            tcc=instance,
            tipo_evento=TipoEvento.CRIACAO_TCC
        ).exists()

        if not existe_evento:
            EventoTimeline.objects.create(
                tcc=instance,
                usuario=instance.aluno,
                tipo_evento=TipoEvento.CRIACAO_TCC,
                descricao=f'TCC "{instance.titulo}" criado',
                visibilidade=Visibilidade.TODOS
            )


@receiver(post_save, sender=AvaliacaoFase1)
def verificar_transicao_fase1(sender, instance, created, **kwargs):
    """
    Detecta quando todas as avaliações da Fase I foram finalizadas e move
    o TCC de AVALIACAO_FASE_1 para VALIDACAO_FASE_1 (aguardando coordenador).
    Também faz a transição reversa quando alguma volta para PENDENTE.
    Roda apenas em saves individuais (não em queryset.update()).
    """
    _verificar_etapa_fase1(instance.tcc)


@receiver(post_save, sender=AvaliacaoFase2)
def verificar_transicao_fase2(sender, instance, created, **kwargs):
    """
    Signal que detecta quando todas as 3 avaliações da Fase II foram enviadas
    e faz a transição automática para ANALISE_FINAL_COORDENADOR.

    Também detecta quando uma avaliação é cancelada (volta para PENDENTE) e
    faz a transição de volta para APRESENTACAO_FASE_2 se necessário.
    """
    tcc = instance.tcc

    # Contar quantas avaliações estão com status ENVIADO ou BLOQUEADO (já submetidas)
    avaliacoes_enviadas = AvaliacaoFase2.objects.filter(
        tcc=tcc,
        status__in=['ENVIADO', 'BLOQUEADO']
    ).count()

    # CASO 1: TCC em APRESENTACAO_FASE_2 e todas as 3 avaliações foram enviadas
    if tcc.etapa_atual == EtapaTCC.APRESENTACAO_FASE_2 and avaliacoes_enviadas == 3:
        # Calcular NF2 (média das 3 avaliações)
        avaliacoes = AvaliacaoFase2.objects.filter(tcc=tcc, status__in=['ENVIADO', 'BLOQUEADO'])
        notas = []
        for av in avaliacoes:
            nota = av.calcular_nota_total()
            if nota is not None:
                notas.append(nota)

        if len(notas) == 3:
            # Calcular NF2 (média das 3 avaliações) e arredondar para 2 casas decimais
            nf2 = (sum(notas) / Decimal(3)).quantize(Decimal('0.01'))

            # Calcular MF = (NF1 + NF2) / 2
            if tcc.nf1 is not None:
                media_final = ((tcc.nf1 + nf2) / Decimal(2)).quantize(Decimal('0.01'))

                # Definir resultado
                resultado = 'APROVADO' if media_final >= Decimal('6.0') else 'REPROVADO'

                # Atualizar TCC
                tcc.nf2 = nf2
                tcc.media_final = media_final
                tcc.resultado_final = resultado
                tcc.etapa_atual = EtapaTCC.ANALISE_FINAL_COORDENADOR
                tcc.save()

                # Registrar evento na timeline (somente coordenador — contém notas)
                EventoTimeline.objects.create(
                    tcc=tcc,
                    usuario=None,  # Transição automática
                    tipo_evento=TipoEvento.FASE2_CONCLUIDA,
                    descricao=f'Todas as avaliações da Fase II foram enviadas. NF2 = {nf2:.2f}, MF = {media_final:.2f}, Resultado: {resultado}',
                    visibilidade=Visibilidade.COORDENADOR_APENAS
                )

                # Criar notificações COM e-mail
                from notificacoes.services import criar_notificacao_com_email, criar_notificacao_em_massa_com_email
                from notificacoes.constants import TipoNotificacao, PrioridadeNotificacao
                from users.models import Usuario

                # Notificar coordenador
                coordenadores = Usuario.objects.filter(tipo_usuario='COORDENADOR')
                criar_notificacao_em_massa_com_email(
                    usuarios=list(coordenadores),
                    tipo=TipoNotificacao.RESULTADO_FASE_2,
                    titulo='Avaliações Fase II Completas',
                    mensagem=f'Todas as avaliações da Fase II do TCC "{tcc.titulo}" foram concluídas. NF2: {nf2:.2f}, Resultado: {resultado}',
                    campo_preferencia='coord_avaliacoes_fase2_completas',
                    action_url=f'/tccs/{tcc.id}',
                    tcc_id=tcc.id,
                    prioridade=PrioridadeNotificacao.ALTA
                )

    # CASO 2: TCC em ANALISE_FINAL_COORDENADOR mas não tem mais 3 avaliações enviadas
    # (alguém cancelou o envio)
    elif tcc.etapa_atual == EtapaTCC.ANALISE_FINAL_COORDENADOR and avaliacoes_enviadas < 3:
        # Limpar as notas calculadas
        tcc.nf2 = None
        tcc.media_final = None
        tcc.resultado_final = None
        tcc.etapa_atual = EtapaTCC.APRESENTACAO_FASE_2
        tcc.save()

        # Registrar evento na timeline
        EventoTimeline.objects.create(
            tcc=tcc,
            usuario=instance.avaliador,
            tipo_evento=TipoEvento.AVALIACAO_REABERTA,
            descricao=f'Avaliação cancelada por {instance.avaliador.nome_completo}. TCC retornou para Apresentação - Fase II.',
            visibilidade=Visibilidade.TODOS
        )

    # CASO 4: TCC em ANALISE_FINAL_COORDENADOR, 3 avaliações enviadas/bloqueadas e o save
    # foi de uma avaliação que voltou para ENVIADO (reenvio após solicitar_ajustes_fase2).
    # Recalcula NF2/MF/resultado e bloqueia tudo automaticamente.
    elif (tcc.etapa_atual == EtapaTCC.ANALISE_FINAL_COORDENADOR
          and avaliacoes_enviadas == 3
          and instance.status == 'ENVIADO'):
        avaliacoes = AvaliacaoFase2.objects.filter(tcc=tcc, status__in=['ENVIADO', 'BLOQUEADO'])
        notas = []
        for av in avaliacoes:
            nota = av.calcular_nota_total()
            if nota is not None:
                notas.append(nota)

        if len(notas) == 3 and tcc.nf1 is not None:
            nf2 = (sum(notas) / Decimal(3)).quantize(Decimal('0.01'))
            media_final = ((tcc.nf1 + nf2) / Decimal(2)).quantize(Decimal('0.01'))
            resultado = 'APROVADO' if media_final >= Decimal('6.0') else 'REPROVADO'

            # Bloquear todas (auto) — para permitir aprovar_concluir_tcc em seguida
            AvaliacaoFase2.objects.filter(tcc=tcc).update(status='BLOQUEADO')

            tcc.nf2 = nf2
            tcc.media_final = media_final
            tcc.resultado_final = resultado
            tcc.avaliacao_fase2_bloqueada = True
            tcc.save()

            EventoTimeline.objects.create(
                tcc=tcc,
                usuario=None,
                tipo_evento=TipoEvento.FASE2_CONCLUIDA,
                descricao=f'Avaliação reenviada após ajuste pontual. NF2 recalculada = {nf2:.2f}, MF = {media_final:.2f}, Resultado: {resultado}.',
                visibilidade=Visibilidade.COORDENADOR_APENAS
            )

    # CASO 3: TCC em AGUARDANDO_AJUSTES_FINAIS e todos os avaliadores solicitados reenviaram
    elif tcc.etapa_atual == EtapaTCC.AGUARDANDO_AJUSTES_FINAIS:
        # Buscar o último evento de ajustes finais solicitados
        evento_ajustes = EventoTimeline.objects.filter(
            tcc=tcc,
            tipo_evento=TipoEvento.AJUSTES_SOLICITADOS,
            detalhes_json__tipo='ajustes_finais'
        ).order_by('-timestamp').first()

        if evento_ajustes and 'avaliadores_ids' in evento_ajustes.detalhes_json:
            avaliadores_solicitados = evento_ajustes.detalhes_json['avaliadores_ids']

            # Verificar se todos os avaliadores solicitados reenviaram (status ENVIADO ou BLOQUEADO)
            avaliacoes_solicitadas = AvaliacaoFase2.objects.filter(
                tcc=tcc,
                avaliador_id__in=avaliadores_solicitados
            )

            # Contar quantos já reenviaram (status ENVIADO ou BLOQUEADO)
            avaliacoes_reenviadas = avaliacoes_solicitadas.filter(
                status__in=['ENVIADO', 'BLOQUEADO']
            ).count()

            # Se todos reenviaram
            if avaliacoes_reenviadas == len(avaliadores_solicitados):
                # Recalcular NF2 (média das 3 avaliações ENVIADAS ou BLOQUEADAS)
                todas_avaliacoes = AvaliacaoFase2.objects.filter(
                    tcc=tcc,
                    status__in=['ENVIADO', 'BLOQUEADO']
                )

                if todas_avaliacoes.count() == 3:
                    notas = []
                    for av in todas_avaliacoes:
                        nota = av.calcular_nota_total()
                        if nota is not None:
                            notas.append(nota)

                    if len(notas) == 3:
                        # Recalcular NF2
                        nf2 = (sum(notas) / Decimal(3)).quantize(Decimal('0.01'))

                        # Recalcular MF = (NF1 + NF2) / 2
                        if tcc.nf1 is not None:
                            media_final = ((tcc.nf1 + nf2) / Decimal(2)).quantize(Decimal('0.01'))

                            # Redefinir resultado
                            resultado = 'APROVADO' if media_final >= Decimal('6.0') else 'REPROVADO'

                            # Bloquear TODAS as 3 avaliações
                            AvaliacaoFase2.objects.filter(tcc=tcc).update(status='BLOQUEADO')

                            # Atualizar TCC
                            tcc.nf2 = nf2
                            tcc.media_final = media_final
                            tcc.resultado_final = resultado
                            tcc.etapa_atual = EtapaTCC.ANALISE_FINAL_COORDENADOR
                            tcc.avaliacao_fase2_bloqueada = True
                            tcc.save()

                            # Registrar evento na timeline (somente coordenador — contém notas)
                            EventoTimeline.objects.create(
                                tcc=tcc,
                                usuario=None,  # Transição automática
                                tipo_evento=TipoEvento.FASE2_CONCLUIDA,
                                descricao=f'Todos os avaliadores solicitados reenviaram suas avaliações. NF2 recalculada = {nf2:.2f}, MF = {media_final:.2f}, Resultado: {resultado}. TCC retornou para Análise Final do Coordenador.',
                                visibilidade=Visibilidade.COORDENADOR_APENAS
                            )


# Nota: Signals para SolicitacaoOrientacao e DocumentoTCC foram
# implementados diretamente nas views para manter controle explícito
# do fluxo e facilitar debug/manutenção.
#
# Caso seja necessário adicionar automações futuras (ex: envio de emails),
# basta adicionar novos signals aqui ou nas views conforme a lógica de negócio.
