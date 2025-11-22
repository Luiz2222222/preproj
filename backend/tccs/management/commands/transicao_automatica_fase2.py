"""
Management command para transição automática de TCCs para APRESENTACAO_FASE_2.

Deve ser executado periodicamente (ex: a cada 15 minutos) via cron ou similar.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from tccs.models import TCC, AgendamentoDefesa, EventoTimeline
from tccs.constants import EtapaTCC, TipoEvento, Visibilidade


class Command(BaseCommand):
    help = 'Verifica agendamentos vencidos e transiciona TCCs para APRESENTACAO_FASE_2'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Exibe o que seria feito sem executar as transições',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        agora = timezone.now()

        # Buscar TCCs em AGENDAMENTO_APRESENTACAO com agendamento vencido
        tccs_agendados = TCC.objects.filter(
            etapa_atual=EtapaTCC.AGENDAMENTO_APRESENTACAO
        ).select_related('agendamento_defesa')

        transicionados = 0

        for tcc in tccs_agendados:
            try:
                agendamento = tcc.agendamento_defesa

                # Combinar data e hora do agendamento
                data_hora_agendamento = datetime.combine(agendamento.data, agendamento.hora)
                data_hora_agendamento = timezone.make_aware(data_hora_agendamento)

                # Verificar se a data/hora já passou
                if data_hora_agendamento <= agora:
                    if dry_run:
                        self.stdout.write(
                            self.style.WARNING(
                                f'[DRY RUN] TCC #{tcc.id} ({tcc.titulo}) seria transicionado para APRESENTACAO_FASE_2'
                            )
                        )
                    else:
                        # Transicionar para APRESENTACAO_FASE_2
                        tcc.etapa_atual = EtapaTCC.APRESENTACAO_FASE_2
                        tcc.save()

                        # Criar evento de transição
                        EventoTimeline.objects.create(
                            tcc=tcc,
                            usuario=None,  # Sistema
                            tipo_evento=TipoEvento.DEFESA_REALIZADA,
                            descricao=f'TCC avançou automaticamente para etapa: Apresentação - Fase 2. Data/hora da defesa alcançada.',
                            detalhes_json={
                                'etapa_anterior': EtapaTCC.AGENDAMENTO_APRESENTACAO,
                                'etapa_nova': EtapaTCC.APRESENTACAO_FASE_2,
                                'data_hora_agendamento': data_hora_agendamento.isoformat()
                            },
                            visibilidade=Visibilidade.TODOS
                        )

                        transicionados += 1
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'TCC #{tcc.id} ({tcc.titulo}) transicionado para APRESENTACAO_FASE_2'
                            )
                        )

            except AgendamentoDefesa.DoesNotExist:
                # TCC em AGENDAMENTO_APRESENTACAO mas sem agendamento criado
                self.stdout.write(
                    self.style.WARNING(
                        f'TCC #{tcc.id} ({tcc.titulo}) está em AGENDAMENTO_APRESENTACAO mas não possui agendamento'
                    )
                )
                continue

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'\n[DRY RUN] {transicionados} TCC(s) seriam transicionados'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n{transicionados} TCC(s) transicionados com sucesso'
                )
            )
