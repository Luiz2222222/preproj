"""
Management command para enviar lembretes por e-mail aos orientadores.

Deve ser executado 1x por dia via cron ou Task Scheduler.
Exemplo: python manage.py enviar_lembretes

Lembretes:
1. Confirmação de continuidade - 1 dia antes de avaliacao_continuidade_fim
2. Envio do termo de solicitação de avaliação - 1 dia antes de submissao_monografia_fim
"""

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from tccs.models import TCC
from tccs.constants import EtapaTCC
from definicoes.models import CalendarioSemestre
from notificacoes.services import criar_notificacao_com_email
from notificacoes.constants import TipoNotificacao, PrioridadeNotificacao


class Command(BaseCommand):
    help = 'Envia lembretes por e-mail aos orientadores 1 dia antes dos prazos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Exibe o que seria feito sem enviar e-mails',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        hoje = timezone.now().date()
        amanha = hoje + timedelta(days=1)

        calendario = CalendarioSemestre.obter_calendario_atual()
        if not calendario:
            self.stdout.write(self.style.WARNING('Nenhum calendário ativo encontrado.'))
            return

        total_enviados = 0

        # === 1. Lembrete de continuidade ===
        if calendario.avaliacao_continuidade_fim and calendario.avaliacao_continuidade_fim == amanha:
            total_enviados += self._lembrete_continuidade(calendario, dry_run)

        # === 2. Lembrete de termo de solicitação de avaliação ===
        if calendario.submissao_monografia_fim and calendario.submissao_monografia_fim == amanha:
            total_enviados += self._lembrete_termo(calendario, dry_run)

        if dry_run:
            self.stdout.write(self.style.WARNING(f'\n[DRY RUN] {total_enviados} lembrete(s) seriam enviados'))
        else:
            self.stdout.write(self.style.SUCCESS(f'\n{total_enviados} lembrete(s) enviados com sucesso'))

    def _lembrete_continuidade(self, calendario, dry_run):
        """Envia 1 lembrete por orientador sobre a confirmação de continuidade."""
        data_fim = calendario.avaliacao_continuidade_fim.strftime('%d/%m/%Y')

        # Buscar orientadores únicos com TCCs em DESENVOLVIMENTO sem continuidade
        tccs = TCC.objects.filter(
            etapa_atual=EtapaTCC.DESENVOLVIMENTO,
            flag_continuidade=False,
            orientador__isnull=False
        ).select_related('orientador')

        # Agrupar por orientador (1 email por professor)
        orientadores = {}
        for tcc in tccs:
            orientadores[tcc.orientador.id] = tcc.orientador

        enviados = 0

        for prof in orientadores.values():
            if dry_run:
                self.stdout.write(self.style.WARNING(
                    f'[DRY RUN] Lembrete de continuidade para {prof.nome_completo}'
                ))
            else:
                corpo_html = f"""
<p>Olá, {prof.nome_completo},</p>

<p>A confirmação de continuidade de TCC é <b>amanhã ({data_fim})</b>.</p>

<p>Acesse o sistema: <a href="{settings.FRONTEND_URL}">{settings.FRONTEND_URL}</a></p>

<p>---<br>
Portal TCC<br>
Esta é uma notificação automática. Para mais informações, acesse o sistema.</p>
"""
                corpo_texto = f"""Olá, {prof.nome_completo},

A confirmação de continuidade de TCC é amanhã ({data_fim}).

Acesse o sistema: {settings.FRONTEND_URL}

---
Portal TCC
Esta é uma notificação automática. Para mais informações, acesse o sistema.
"""
                criar_notificacao_com_email(
                    usuario=prof,
                    tipo=TipoNotificacao.DOCUMENTO_ENVIADO,
                    titulo='Lembrete: Confirmação de Continuidade',
                    mensagem=f'A confirmação de continuidade de TCC é amanhã ({data_fim}).',
                    campo_preferencia='prof_continuidade_aprovada',
                    action_url='/meus-tccs',
                    prioridade=PrioridadeNotificacao.ALTA,
                    corpo_html_customizado=corpo_html,
                    corpo_texto_customizado=corpo_texto
                )

            enviados += 1

        if enviados > 0:
            self.stdout.write(self.style.SUCCESS(
                f'Continuidade: {enviados} lembrete(s) {"seriam enviados" if dry_run else "enviados"}'
            ))

        return enviados

    def _lembrete_termo(self, calendario, dry_run):
        """Envia 1 lembrete por orientador sobre o prazo do termo."""
        data_fim = calendario.submissao_monografia_fim.strftime('%d/%m/%Y')

        # Buscar orientadores únicos com TCCs em DESENVOLVIMENTO
        tccs = TCC.objects.filter(
            etapa_atual=EtapaTCC.DESENVOLVIMENTO,
            orientador__isnull=False
        ).select_related('orientador')

        # Agrupar por orientador (1 email por professor)
        orientadores = {}
        for tcc in tccs:
            orientadores[tcc.orientador.id] = tcc.orientador

        enviados = 0

        for prof in orientadores.values():
            if dry_run:
                self.stdout.write(self.style.WARNING(
                    f'[DRY RUN] Lembrete de termo para {prof.nome_completo}'
                ))
            else:
                corpo_html = f"""
<p>Olá, {prof.nome_completo},</p>

<p>O prazo para envio do <b>Termo de Solicitação de Avaliação da Monografia</b> encerra <b>amanhã ({data_fim})</b>.</p>

<p>O envio é habilitado no sistema após a aprovação da monografia.</p>

<p>Acesse o sistema: <a href="{settings.FRONTEND_URL}">{settings.FRONTEND_URL}</a></p>

<p>---<br>
Portal TCC<br>
Esta é uma notificação automática. Para mais informações, acesse o sistema.</p>
"""
                corpo_texto = f"""Olá, {prof.nome_completo},

O prazo para envio do Termo de Solicitação de Avaliação da Monografia encerra amanhã ({data_fim}).

O envio é habilitado no sistema após a aprovação da monografia.

Acesse o sistema: {settings.FRONTEND_URL}

---
Portal TCC
Esta é uma notificação automática. Para mais informações, acesse o sistema.
"""
                criar_notificacao_com_email(
                    usuario=prof,
                    tipo=TipoNotificacao.DOCUMENTO_ENVIADO,
                    titulo='Lembrete: Envio do Termo de Solicitação de Avaliação',
                    mensagem=f'O prazo para envio do Termo de Solicitação de Avaliação encerra amanhã ({data_fim}).',
                    campo_preferencia='prof_lembrete_termo',
                    action_url='/meus-tccs',
                    prioridade=PrioridadeNotificacao.ALTA,
                    corpo_html_customizado=corpo_html,
                    corpo_texto_customizado=corpo_texto
                )

            enviados += 1

        if enviados > 0:
            self.stdout.write(self.style.SUCCESS(
                f'Termo: {enviados} lembrete(s) {"seriam enviados" if dry_run else "enviados"}'
            ))

        return enviados
