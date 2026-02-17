from django.db import models
from users.models import Usuario


class Aviso(models.Model):
    titulo = models.CharField(max_length=200, verbose_name='Título')
    mensagem = models.TextField(verbose_name='Mensagem')
    destinatarios = models.JSONField(
        default=list,
        verbose_name='Destinatários',
        help_text='Lista de tipos de usuário: ALUNO, PROFESSOR, AVALIADOR, COORDENADOR'
    )
    fixado = models.BooleanField(default=False, verbose_name='Fixado no topo')
    criado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        related_name='avisos_criados',
        verbose_name='Criado por'
    )
    criado_em = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    atualizado_em = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')

    class Meta:
        verbose_name = 'Aviso'
        verbose_name_plural = 'Avisos'
        ordering = ['-fixado', '-criado_em']

    def __str__(self):
        return f'{self.titulo} ({", ".join(self.destinatarios)})'
