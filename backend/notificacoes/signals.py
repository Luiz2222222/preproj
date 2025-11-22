"""
Signals para criar notificações automaticamente em eventos do sistema.

Este arquivo contém os gatilhos principais que disparam notificações.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from tccs.models import (
    SolicitacaoOrientacao,
    DocumentoTCC,
    AvaliacaoFase1,
    AvaliacaoFase2,
    BancaFase1,
    TCC
)
from tccs.constants import StatusSolicitacao, StatusDocumento, TipoDocumento, EtapaTCC
from .services import criar_notificacao, criar_notificacao_em_massa
from .constants import TipoNotificacao, PrioridadeNotificacao


# ==================== SOLICITAÇÕES DE ORIENTAÇÃO ====================

@receiver(post_save, sender=SolicitacaoOrientacao)
def notificar_solicitacao_orientacao(sender, instance, created, **kwargs):
    """
    Notifica quando uma solicitação de orientação é criada, aprovada ou rejeitada.
    """
    # 1. Nova solicitação criada → notificar coordenador
    if created and instance.status == StatusSolicitacao.PENDENTE:
        from users.models import Usuario
        coordenadores = Usuario.objects.filter(tipo_usuario='COORDENADOR')

        for coord in coordenadores:
            criar_notificacao(
                usuario=coord,
                tipo=TipoNotificacao.SOLICITACAO_RECEBIDA,
                titulo="Nova solicitação de orientação",
                mensagem=f"{instance.tcc.aluno.nome_completo} solicitou orientação para '{instance.tcc.titulo}'",
                action_url="/coordenador/solicitacoes",
                metadata={
                    "solicitacao_id": instance.id,
                    "aluno_id": instance.tcc.aluno.id,
                    "aluno_nome": instance.tcc.aluno.nome_completo
                },
                prioridade=PrioridadeNotificacao.ALTA
            )

    # 2. Solicitação aprovada → notificar aluno e orientador
    elif not created and instance.status == StatusSolicitacao.ACEITA:
        # Notificar aluno
        criar_notificacao(
            usuario=instance.tcc.aluno,
            tipo=TipoNotificacao.SOLICITACAO_APROVADA,
            titulo="Solicitação de orientação aprovada!",
            mensagem=f"Sua solicitação para '{instance.tcc.titulo}' foi aprovada. Orientador: {instance.professor.nome_completo}",
            action_url="/aluno/meu-tcc",
            metadata={
                "solicitacao_id": instance.id,
                "orientador_id": instance.professor.id,
                "orientador_nome": instance.professor.nome_completo
            },
            prioridade=PrioridadeNotificacao.ALTA
        )

        # Notificar orientador
        criar_notificacao(
            usuario=instance.professor,
            tipo=TipoNotificacao.SOLICITACAO_APROVADA,
            titulo="Novo orientando atribuído!",
            mensagem=f"Você foi designado orientador de {instance.tcc.aluno.nome_completo} para '{instance.tcc.titulo}'",
            action_url=f"/professor/orientacoes/meus-orientandos/{instance.tcc.id}",
            metadata={
                "solicitacao_id": instance.id,
                "aluno_id": instance.tcc.aluno.id,
                "aluno_nome": instance.tcc.aluno.nome_completo,
                "tcc_id": instance.tcc.id
            },
            tcc_id=instance.tcc.id,
            prioridade=PrioridadeNotificacao.ALTA
        )

    # 3. Solicitação rejeitada → notificar aluno
    elif not created and instance.status == StatusSolicitacao.RECUSADA:
        criar_notificacao(
            usuario=instance.tcc.aluno,
            tipo=TipoNotificacao.SOLICITACAO_REJEITADA,
            titulo="Solicitação de orientação rejeitada",
            mensagem=f"Sua solicitação para '{instance.tcc.titulo}' foi rejeitada. Motivo: {instance.resposta_professor or 'Não informado'}",
            action_url="/aluno/solicitacoes",
            metadata={
                "solicitacao_id": instance.id,
                "motivo": instance.resposta_professor or ""
            },
            prioridade=PrioridadeNotificacao.ALTA
        )


# ==================== DOCUMENTOS ====================

@receiver(post_save, sender=DocumentoTCC)
def notificar_documento(sender, instance, created, **kwargs):
    """
    Notifica quando documentos são enviados, aprovados ou rejeitados.
    """
    tcc = instance.tcc

    # 1. Documento enviado → notificar orientador e coordenador
    if created:
        # Notificar orientador
        if tcc.orientador:
            criar_notificacao(
                usuario=tcc.orientador,
                tipo=TipoNotificacao.DOCUMENTO_ENVIADO,
                titulo="Novo documento enviado",
                mensagem=f"{tcc.aluno.nome_completo} enviou {instance.tipo_documento}",
                action_url=f"/professor/orientacoes/meus-orientandos/{tcc.id}",
                metadata={
                    "tcc_id": tcc.id,
                    "documento_id": instance.id,
                    "tipo_doc": instance.tipo_documento,
                    "aluno_nome": tcc.aluno.nome_completo
                },
                tcc_id=tcc.id,
                prioridade=PrioridadeNotificacao.NORMAL
            )

        # Tratamento especial para TERMO_SOLICITACAO_AVALIACAO baseado em quem enviou
        if instance.tipo_documento == TipoDocumento.TERMO_SOLICITACAO_AVALIACAO:
            # Caso 1: Aluno enviou o termo
            if instance.enviado_por == tcc.aluno:
                # Notificar coordenadores
                from users.models import Usuario
                coordenadores = Usuario.objects.filter(tipo_usuario='COORDENADOR')

                for coord in coordenadores:
                    criar_notificacao(
                        usuario=coord,
                        tipo=TipoNotificacao.DOCUMENTO_ENVIADO,
                        titulo="Termo de solicitação de avaliação enviado",
                        mensagem=f"{tcc.aluno.nome_completo} enviou termo de solicitação de avaliação",
                        action_url=f"/coordenador/tccs/{tcc.id}",
                        metadata={
                            "tcc_id": tcc.id,
                            "documento_id": instance.id,
                            "aluno_nome": tcc.aluno.nome_completo
                        },
                        tcc_id=tcc.id,
                        prioridade=PrioridadeNotificacao.ALTA
                    )

                # Notificar aluno (confirmação)
                criar_notificacao(
                    usuario=tcc.aluno,
                    tipo=TipoNotificacao.DOCUMENTO_ENVIADO,
                    titulo="Termo enviado com sucesso",
                    mensagem="Seu termo de solicitação de avaliação foi enviado ao coordenador",
                    action_url="/aluno/meu-tcc",
                    metadata={
                        "tcc_id": tcc.id,
                        "documento_id": instance.id
                    },
                    tcc_id=tcc.id,
                    prioridade=PrioridadeNotificacao.NORMAL
                )

            # Caso 2: Coordenador gerou o termo
            else:
                # Notificar apenas o aluno
                criar_notificacao(
                    usuario=tcc.aluno,
                    tipo=TipoNotificacao.DOCUMENTO_ENVIADO,
                    titulo="Termo de solicitação disponível",
                    mensagem="Coordenador disponibilizou o termo de solicitação de avaliação",
                    action_url="/aluno/meu-tcc",
                    metadata={
                        "tcc_id": tcc.id,
                        "documento_id": instance.id
                    },
                    tcc_id=tcc.id,
                    prioridade=PrioridadeNotificacao.ALTA
                )

        # Se for monografia, notificar coordenador
        elif instance.tipo_documento == TipoDocumento.MONOGRAFIA:
            from users.models import Usuario
            coordenadores = Usuario.objects.filter(tipo_usuario='COORDENADOR')

            for coord in coordenadores:
                criar_notificacao(
                    usuario=coord,
                    tipo=TipoNotificacao.DOCUMENTO_ENVIADO,
                    titulo="Nova monografia enviada",
                    mensagem=f"{tcc.aluno.nome_completo} enviou monografia",
                    action_url=f"/coordenador/tccs/{tcc.id}",
                    metadata={
                        "tcc_id": tcc.id,
                        "documento_id": instance.id,
                        "aluno_nome": tcc.aluno.nome_completo
                    },
                    tcc_id=tcc.id,
                    prioridade=PrioridadeNotificacao.NORMAL
                )

    # 2. Documento aprovado → notificar aluno e coordenador
    elif not created and instance.status == StatusDocumento.APROVADO:
        # Notificar aluno
        criar_notificacao(
            usuario=tcc.aluno,
            tipo=TipoNotificacao.DOCUMENTO_APROVADO,
            titulo="Documento aprovado!",
            mensagem=f"Seu documento {instance.tipo_documento} foi aprovado",
            action_url="/aluno/meu-tcc",
            metadata={
                "tcc_id": tcc.id,
                "documento_id": instance.id,
                "tipo_doc": instance.tipo_documento
            },
            tcc_id=tcc.id,
            prioridade=PrioridadeNotificacao.NORMAL
        )

        # Notificar coordenador
        from users.models import Usuario
        coordenadores = Usuario.objects.filter(tipo_usuario='COORDENADOR')
        for coord in coordenadores:
            criar_notificacao(
                usuario=coord,
                tipo=TipoNotificacao.DOCUMENTO_APROVADO,
                titulo=f"Documento aprovado - {tcc.aluno.nome_completo}",
                mensagem=f"Documento {instance.tipo_documento} foi aprovado pelo orientador",
                action_url=f"/coordenador/tccs/{tcc.id}",
                metadata={
                    "tcc_id": tcc.id,
                    "documento_id": instance.id,
                    "tipo_doc": instance.tipo_documento,
                    "aluno_nome": tcc.aluno.nome_completo
                },
                tcc_id=tcc.id,
                prioridade=PrioridadeNotificacao.NORMAL
            )

    # 3. Documento rejeitado → notificar aluno
    elif not created and instance.status == StatusDocumento.REJEITADO:
        criar_notificacao(
            usuario=tcc.aluno,
            tipo=TipoNotificacao.DOCUMENTO_REJEITADO,
            titulo="Documento rejeitado",
            mensagem=f"Seu documento {instance.tipo_documento} foi rejeitado. Motivo: {instance.observacoes or 'Não informado'}",
            action_url="/aluno/meu-tcc",
            metadata={
                "tcc_id": tcc.id,
                "documento_id": instance.id,
                "tipo_doc": instance.tipo_documento,
                "motivo": instance.observacoes or ""
            },
            tcc_id=tcc.id,
            prioridade=PrioridadeNotificacao.ALTA
        )


# ==================== AVALIAÇÕES ====================

@receiver(post_save, sender=AvaliacaoFase1)
def notificar_avaliacao_fase1(sender, instance, created, **kwargs):
    """
    Notifica quando todas as avaliações da Fase I são concluídas.
    Processo duplo-cego: não expõe avaliadores ou notas até a decisão final do coordenador.
    """
    if not created and instance.status == 'ENVIADO':
        tcc = instance.tcc

        # Verificar se todas as avaliações Fase I foram enviadas
        total_avaliacoes = AvaliacaoFase1.objects.filter(tcc=tcc).count()
        avaliacoes_enviadas = AvaliacaoFase1.objects.filter(tcc=tcc, status='ENVIADO').count()

        if total_avaliacoes > 0 and avaliacoes_enviadas == total_avaliacoes:
            from users.models import Usuario

            # Notificar coordenadores
            coordenadores = Usuario.objects.filter(tipo_usuario='COORDENADOR')
            for coord in coordenadores:
                criar_notificacao(
                    usuario=coord,
                    tipo=TipoNotificacao.AVALIACAO_FASE1_COMPLETA,
                    titulo=f"Todas avaliações Fase I recebidas - {tcc.aluno.nome_completo}",
                    mensagem=f"Todas as {total_avaliacoes} avaliações da Fase I foram enviadas. Pronto para aprovação.",
                    action_url=f"/coordenador/tccs/{tcc.id}",
                    metadata={
                        "tcc_id": tcc.id,
                        "aluno_nome": tcc.aluno.nome_completo,
                        "total_avaliacoes": total_avaliacoes
                    },
                    tcc_id=tcc.id,
                    prioridade=PrioridadeNotificacao.ALTA
                )

            # Notificar aluno (sem expor notas ou avaliadores)
            criar_notificacao(
                usuario=tcc.aluno,
                tipo=TipoNotificacao.AVALIACAO_FASE1_COMPLETA,
                titulo="Avaliações da Fase I concluídas",
                mensagem="A banca concluiu as avaliações da Fase I. Aguarde a decisão do coordenador.",
                action_url="/aluno/meu-tcc",
                metadata={"tcc_id": tcc.id},
                tcc_id=tcc.id,
                prioridade=PrioridadeNotificacao.NORMAL
            )

            # Notificar orientador (sem expor notas ou avaliadores)
            if tcc.orientador:
                criar_notificacao(
                    usuario=tcc.orientador,
                    tipo=TipoNotificacao.AVALIACAO_FASE1_COMPLETA,
                    titulo=f"Avaliações Fase I concluídas - {tcc.aluno.nome_completo}",
                    mensagem="A banca concluiu as avaliações da Fase I. Aguarde a decisão do coordenador.",
                    action_url=f"/professor/orientacoes/meus-orientandos/{tcc.id}",
                    metadata={
                        "tcc_id": tcc.id,
                        "aluno_nome": tcc.aluno.nome_completo
                    },
                    tcc_id=tcc.id,
                    prioridade=PrioridadeNotificacao.NORMAL
                )


@receiver(post_save, sender=AvaliacaoFase2)
def notificar_avaliacao_fase2(sender, instance, created, **kwargs):
    """
    Notifica quando avaliações da Fase II são recebidas.
    """
    if not created and instance.status == 'ENVIADO':
        tcc = instance.tcc

        # Notificar aluno
        criar_notificacao(
            usuario=tcc.aluno,
            tipo=TipoNotificacao.AVALIACAO_RECEBIDA,
            titulo="Avaliação recebida - Fase II",
            mensagem=f"Avaliação de {instance.avaliador.nome_completo} foi recebida (Nota: {instance.calcular_nota_total()})",
            action_url="/aluno/meu-tcc",
            metadata={
                "tcc_id": tcc.id,
                "avaliacao_id": instance.id,
                "avaliador_nome": instance.avaliador.nome_completo,
                "nota": float(instance.calcular_nota_total()) if instance.calcular_nota_total() else None
            },
            tcc_id=tcc.id
        )

        # Notificar orientador
        if tcc.orientador:
            criar_notificacao(
                usuario=tcc.orientador,
                tipo=TipoNotificacao.AVALIACAO_RECEBIDA,
                titulo="Avaliação recebida - Fase II",
                mensagem=f"{instance.avaliador.nome_completo} enviou avaliação para {tcc.aluno.nome_completo}",
                action_url=f"/professor/orientacoes/meus-orientandos/{tcc.id}",
                metadata={
                    "tcc_id": tcc.id,
                    "avaliacao_id": instance.id,
                    "avaliador_nome": instance.avaliador.nome_completo,
                    "aluno_nome": tcc.aluno.nome_completo
                },
                tcc_id=tcc.id
            )

        # Verificar se todas as avaliações Fase II foram enviadas → notificar coordenador
        total_avaliacoes = AvaliacaoFase2.objects.filter(tcc=tcc).count()
        avaliacoes_enviadas = AvaliacaoFase2.objects.filter(tcc=tcc, status='ENVIADO').count()

        if total_avaliacoes > 0 and avaliacoes_enviadas == total_avaliacoes:
            from users.models import Usuario
            coordenadores = Usuario.objects.filter(tipo_usuario='COORDENADOR')
            for coord in coordenadores:
                criar_notificacao(
                    usuario=coord,
                    tipo=TipoNotificacao.AVALIACAO_FASE2_COMPLETA,
                    titulo=f"Todas avaliações Fase II recebidas - {tcc.aluno.nome_completo}",
                    mensagem=f"Todas as {total_avaliacoes} avaliações da Fase II foram enviadas. Pronto para aprovação.",
                    action_url=f"/coordenador/tccs/{tcc.id}",
                    metadata={
                        "tcc_id": tcc.id,
                        "aluno_nome": tcc.aluno.nome_completo,
                        "total_avaliacoes": total_avaliacoes
                    },
                    tcc_id=tcc.id,
                    prioridade=PrioridadeNotificacao.ALTA
                )


# ==================== BANCA ====================

@receiver(post_save, sender=BancaFase1)
def notificar_banca_fase1(sender, instance, created, **kwargs):
    """
    Notifica quando banca da Fase I é formada.
    """
    if created:
        tcc = instance.tcc

        # Notificar aluno
        criar_notificacao(
            usuario=tcc.aluno,
            tipo=TipoNotificacao.BANCA_FORMADA,
            titulo="Banca de avaliação formada!",
            mensagem=f"Sua banca da Fase I foi formada",
            action_url="/aluno/meu-tcc",
            metadata={
                "tcc_id": tcc.id,
                "banca_id": instance.id
            },
            tcc_id=tcc.id,
            prioridade=PrioridadeNotificacao.ALTA
        )

        # Notificar orientador
        if tcc.orientador:
            criar_notificacao(
                usuario=tcc.orientador,
                tipo=TipoNotificacao.BANCA_FORMADA,
                titulo="Banca formada para seu orientando",
                mensagem=f"A banca da Fase I foi formada para {tcc.aluno.nome_completo}",
                action_url=f"/professor/orientacoes/meus-orientandos/{tcc.id}",
                metadata={
                    "tcc_id": tcc.id,
                    "banca_id": instance.id,
                    "aluno_nome": tcc.aluno.nome_completo
                },
                tcc_id=tcc.id,
                prioridade=PrioridadeNotificacao.ALTA
            )

        # Notificar membros da banca
        membros = instance.membros.all()
        if membros.exists():
            membros_users = [m.avaliador for m in membros]
            criar_notificacao_em_massa(
                usuarios=membros_users,
                tipo=TipoNotificacao.CONVITE_BANCA,
                titulo="Convite para participar de banca",
                mensagem=f"Você foi convidado para avaliar o TCC de {tcc.aluno.nome_completo}",
                action_url="/avaliador/bancas",
                metadata={
                    "tcc_id": tcc.id,
                    "banca_id": instance.id,
                    "aluno_nome": tcc.aluno.nome_completo,
                    "titulo_tcc": tcc.titulo
                },
                tcc_id=tcc.id,
                prioridade=PrioridadeNotificacao.ALTA
            )


# ==================== CONTINUIDADE ====================

@receiver(pre_save, sender=TCC)
def capturar_estado_anterior_continuidade(sender, instance, **kwargs):
    """
    Captura o estado anterior da flag_continuidade antes do save.
    """
    if instance.pk:
        try:
            tcc_anterior = TCC.objects.get(pk=instance.pk)
            instance._flag_continuidade_anterior = tcc_anterior.flag_continuidade
        except TCC.DoesNotExist:
            instance._flag_continuidade_anterior = None
    else:
        instance._flag_continuidade_anterior = None


@receiver(post_save, sender=TCC)
def notificar_continuidade(sender, instance, created, **kwargs):
    """
    Notifica quando continuidade é aprovada ou rejeitada.
    Notifica aluno, orientador e coordenador.
    """
    # Ignorar se for criação
    if created:
        return

    # Verificar se temos o estado anterior
    flag_anterior = getattr(instance, '_flag_continuidade_anterior', None)

    if flag_anterior is None:
        return

    # Detectar mudança na flag_continuidade
    flag_mudou = flag_anterior != instance.flag_continuidade

    if not flag_mudou:
        return

    from users.models import Usuario

    # CASO 1: Continuidade APROVADA (mudou para True)
    if instance.flag_continuidade:
        # Notificar aluno
        criar_notificacao(
            usuario=instance.aluno,
            tipo=TipoNotificacao.CONTINUIDADE_APROVADA,
            titulo="Continuidade aprovada!",
            mensagem="Seu orientador aprovou a continuidade do seu TCC",
            action_url="/aluno/meu-tcc",
            metadata={"tcc_id": instance.id},
            tcc_id=instance.id,
            prioridade=PrioridadeNotificacao.ALTA
        )

        # Notificar coordenador
        coordenadores = Usuario.objects.filter(tipo_usuario='COORDENADOR')
        for coord in coordenadores:
            criar_notificacao(
                usuario=coord,
                tipo=TipoNotificacao.CONTINUIDADE_APROVADA,
                titulo=f"Continuidade aprovada - {instance.aluno.nome_completo}",
                mensagem=f"Orientador aprovou a continuidade para '{instance.titulo}'",
                action_url=f"/coordenador/tccs/{instance.id}",
                metadata={
                    "tcc_id": instance.id,
                    "aluno_nome": instance.aluno.nome_completo,
                    "orientador_nome": instance.orientador.nome_completo if instance.orientador else None
                },
                tcc_id=instance.id,
                prioridade=PrioridadeNotificacao.ALTA
            )

        # Notificar orientador (confirmação)
        if instance.orientador:
            criar_notificacao(
                usuario=instance.orientador,
                tipo=TipoNotificacao.CONTINUIDADE_APROVADA,
                titulo="Continuidade aprovada",
                mensagem=f"Continuidade aprovada para {instance.aluno.nome_completo}",
                action_url=f"/professor/orientacoes/meus-orientandos/{instance.id}",
                metadata={
                    "tcc_id": instance.id,
                    "aluno_nome": instance.aluno.nome_completo
                },
                tcc_id=instance.id,
                prioridade=PrioridadeNotificacao.NORMAL
            )

    # CASO 2: Continuidade REJEITADA (mudou para False)
    else:
        # Notificar aluno
        criar_notificacao(
            usuario=instance.aluno,
            tipo=TipoNotificacao.CONTINUIDADE_REJEITADA,
            titulo="Continuidade rejeitada",
            mensagem="Seu orientador rejeitou a continuidade do seu TCC. Entre em contato com ele para mais informações.",
            action_url="/aluno/meu-tcc",
            metadata={"tcc_id": instance.id},
            tcc_id=instance.id,
            prioridade=PrioridadeNotificacao.ALTA
        )

        # Notificar coordenador
        coordenadores = Usuario.objects.filter(tipo_usuario='COORDENADOR')
        for coord in coordenadores:
            criar_notificacao(
                usuario=coord,
                tipo=TipoNotificacao.CONTINUIDADE_REJEITADA,
                titulo=f"Continuidade rejeitada - {instance.aluno.nome_completo}",
                mensagem=f"Orientador rejeitou a continuidade para '{instance.titulo}'",
                action_url=f"/coordenador/tccs/{instance.id}",
                metadata={
                    "tcc_id": instance.id,
                    "aluno_nome": instance.aluno.nome_completo,
                    "orientador_nome": instance.orientador.nome_completo if instance.orientador else None
                },
                tcc_id=instance.id,
                prioridade=PrioridadeNotificacao.ALTA
            )
