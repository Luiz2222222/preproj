from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from users.models import Usuario
from definicoes.models import CodigoCadastro, CalendarioSemestre


class Command(BaseCommand):
    help = 'Cria usuário administrador padrão e códigos de cadastro iniciais'

    def handle(self, *args, **options):
        # Criar administrador padrão
        if not Usuario.objects.filter(email='admin').exists():
            admin = Usuario.objects.create_superuser(
                email='admin',
                password='senhaesenha',
                nome_completo='Administrador do Sistema',
                departamento='Coordenação'
            )
            self.stdout.write(self.style.SUCCESS(
                f'[OK] Administrador criado: {admin.email} / senhaesenha'
            ))
        else:
            self.stdout.write(self.style.WARNING(
                '[AVISO] Administrador já existe'
            ))

        # Criar códigos de cadastro padrão
        codigos_padrao = [
            ('ALUNO', 'ALUNO2025'),
            ('PROFESSOR', 'PROF2025'),
            ('AVALIADOR', 'AVAL2025'),
        ]

        for tipo, codigo in codigos_padrao:
            obj, created = CodigoCadastro.objects.get_or_create(
                tipo=tipo,
                defaults={'codigo': codigo}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f'[OK] Codigo {tipo} criado: {codigo}'
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f'[AVISO] Codigo {tipo} ja existe: {obj.codigo}'
                ))

        # Criar calendário acadêmico padrão
        hoje = timezone.localdate()
        semestre_atual = f"{hoje.year}.{1 if hoje.month <= 6 else 2}"

        if not CalendarioSemestre.objects.filter(semestre=semestre_atual).exists():
            calendario = CalendarioSemestre.objects.create(
                semestre=semestre_atual,
                reuniao_alunos=hoje + timedelta(days=15),  # Reunião com alunos (informativa)
                envio_documentos_fim=hoje + timedelta(days=30),  # 30 dias para documentos iniciais
                submissao_monografia_fim=hoje + timedelta(days=120),  # 4 meses para monografia
                avaliacao_continuidade_fim=hoje + timedelta(days=150),  # 5 meses para continuidade
                preparacao_bancas_fase1_inicio=hoje + timedelta(days=155),  # Preparação bancas Fase I (informativa)
                preparacao_bancas_fase1_fim=hoje + timedelta(days=165),  # Fim preparação bancas Fase I
                avaliacao_fase1_fim=hoje + timedelta(days=180),  # Avaliação Fase I
                preparacao_bancas_fase2=hoje + timedelta(days=195),  # Preparação bancas Fase II (informativa)
                defesas_fim=hoje + timedelta(days=210),  # Apresentação dos trabalhos (Fase II)
                ajustes_finais_fim=hoje + timedelta(days=240),  # 8 meses para ajustes finais
                ativo=True,
                atualizado_por=None
            )
            self.stdout.write(self.style.SUCCESS(
                f'[OK] Calendário acadêmico criado para semestre {semestre_atual}'
            ))
        else:
            self.stdout.write(self.style.WARNING(
                f'[AVISO] Calendário para semestre {semestre_atual} já existe'
            ))

        self.stdout.write(self.style.SUCCESS('\n[OK] Setup inicial concluido!'))
