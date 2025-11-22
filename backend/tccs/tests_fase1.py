"""Testes para Fase I (backend/tccs/tests_fase1.py)."""
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from users.models import Usuario
from .models import TCC, BancaFase1, MembroBanca, AvaliacaoFase1, EventoTimeline, DocumentoTCC, SolicitacaoOrientacao
from .constants import EtapaTCC, StatusSolicitacao, TipoDocumento, StatusDocumento, TipoEvento


class BancaFase1GetPutTest(TestCase):
    """Testes para GET/PUT /api/tccs/{id}/banca-fase1/."""

    def setUp(self):
        """Configurar dados de teste."""
        self.aluno = Usuario.objects.create_user(
            email='aluno@test.com',
            nome_completo='Aluno Teste',
            tipo_usuario='ALUNO',
            curso='ENGENHARIA_ELETRICA',
            password='senha123'
        )
        self.professor = Usuario.objects.create_user(
            email='prof@test.com',
            nome_completo='Professor Teste',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.avaliador1 = Usuario.objects.create_user(
            email='aval1@test.com',
            nome_completo='Avaliador 1',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.avaliador2 = Usuario.objects.create_user(
            email='aval2@test.com',
            nome_completo='Avaliador 2',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.coordenador = Usuario.objects.create_user(
            email='coord@test.com',
            nome_completo='Coordenador Teste',
            tipo_usuario='COORDENADOR',
            departamento='Depto Eng',
            password='senha123'
        )

        # Criar TCC em FORMACAO_BANCA_FASE_1
        self.tcc = TCC.objects.create(
            aluno=self.aluno,
            orientador=self.professor,
            titulo='TCC Teste',
            semestre='2025.1',
            etapa_atual=EtapaTCC.FORMACAO_BANCA_FASE_1,
            flag_liberado_avaliacao=True
        )

    def test_get_banca_lazy_create(self):
        """Testar que GET cria banca automaticamente se não existir."""
        client = APIClient()
        client.force_authenticate(user=self.coordenador)

        response = client.get(f'/api/tccs/{self.tcc.id}/banca-fase1/')

        self.assertEqual(response.status_code, 200)
        self.assertIn('status', response.data)
        self.assertEqual(response.data['status'], 'PENDENTE')

        # Verificar que banca foi criada
        self.assertTrue(BancaFase1.objects.filter(tcc=self.tcc).exists())

        # Verificar que orientador foi adicionado automaticamente
        banca = BancaFase1.objects.get(tcc=self.tcc)
        orientador_membro = MembroBanca.objects.filter(banca=banca, usuario=self.professor, tipo='ORIENTADOR').first()
        self.assertIsNotNone(orientador_membro)

        # Verificar que indicado_por é válido (não 'SISTEMA', que causaria ValidationError)
        self.assertIn(orientador_membro.indicado_por, ['ORIENTADOR', 'COORDENADOR'])

    def test_put_banca_coordenador_atualiza_composicao(self):
        """Testar que coordenador pode atualizar composição da banca."""
        client = APIClient()
        client.force_authenticate(user=self.coordenador)

        payload = {
            'avaliadores': [self.avaliador1.id, self.avaliador2.id]
        }

        response = client.put(f'/api/tccs/{self.tcc.id}/banca-fase1/', payload, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertIn('membros', response.data)

        # Verificar que avaliadores foram adicionados
        banca = BancaFase1.objects.get(tcc=self.tcc)
        self.assertEqual(MembroBanca.objects.filter(banca=banca, tipo='AVALIADOR').count(), 2)

    def test_put_banca_menos_de_2_avaliadores_retorna_400(self):
        """Testar que PUT com menos de 2 avaliadores retorna 400."""
        client = APIClient()
        client.force_authenticate(user=self.coordenador)

        payload = {
            'avaliadores': [self.avaliador1.id]  # Apenas 1 avaliador
        }

        response = client.put(f'/api/tccs/{self.tcc.id}/banca-fase1/', payload, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('avaliadores', str(response.data))

    def test_put_banca_professor_retorna_403(self):
        """Testar que professor não pode atualizar banca."""
        client = APIClient()
        client.force_authenticate(user=self.professor)

        payload = {
            'avaliadores': [self.avaliador1.id, self.avaliador2.id]
        }

        response = client.put(f'/api/tccs/{self.tcc.id}/banca-fase1/', payload, format='json')

        self.assertEqual(response.status_code, 403)


class ConcluirBancaFase1Test(TestCase):
    """Testes para POST /api/tccs/{id}/banca-fase1/concluir/."""

    def setUp(self):
        """Configurar dados de teste."""
        self.aluno = Usuario.objects.create_user(
            email='aluno@test.com',
            nome_completo='Aluno Teste',
            tipo_usuario='ALUNO',
            curso='ENGENHARIA_ELETRICA',
            password='senha123'
        )
        self.professor = Usuario.objects.create_user(
            email='prof@test.com',
            nome_completo='Professor Teste',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.avaliador1 = Usuario.objects.create_user(
            email='aval1@test.com',
            nome_completo='Avaliador 1',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.avaliador2 = Usuario.objects.create_user(
            email='aval2@test.com',
            nome_completo='Avaliador 2',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.coordenador = Usuario.objects.create_user(
            email='coord@test.com',
            nome_completo='Coordenador Teste',
            tipo_usuario='COORDENADOR',
            departamento='Depto Eng',
            password='senha123'
        )

        self.tcc = TCC.objects.create(
            aluno=self.aluno,
            orientador=self.professor,
            titulo='TCC Teste',
            semestre='2025.1',
            etapa_atual=EtapaTCC.FORMACAO_BANCA_FASE_1,
            flag_liberado_avaliacao=True
        )

        # Criar banca com 2 avaliadores
        self.banca = BancaFase1.objects.create(tcc=self.tcc, status='PENDENTE')
        MembroBanca.objects.create(banca=self.banca, usuario=self.professor, tipo='ORIENTADOR', indicado_por='SISTEMA', ordem=0)
        MembroBanca.objects.create(banca=self.banca, usuario=self.avaliador1, tipo='AVALIADOR', indicado_por='COORDENADOR', ordem=1)
        MembroBanca.objects.create(banca=self.banca, usuario=self.avaliador2, tipo='AVALIADOR', indicado_por='COORDENADOR', ordem=2)

    def test_concluir_banca_cria_avaliacoes_pendentes(self):
        """Testar que concluir banca cria avaliações PENDENTE para cada avaliador."""
        client = APIClient()
        client.force_authenticate(user=self.coordenador)

        response = client.post(f'/api/tccs/{self.tcc.id}/banca-fase1/concluir/')

        self.assertEqual(response.status_code, 200)
        self.assertIn('message', response.data)

        # Verificar que banca foi marcada como COMPLETA
        self.banca.refresh_from_db()
        self.assertEqual(self.banca.status, 'COMPLETA')
        self.assertIsNotNone(self.banca.data_formacao)

        # Verificar que avaliações foram criadas
        self.assertEqual(AvaliacaoFase1.objects.filter(tcc=self.tcc).count(), 2)
        self.assertTrue(AvaliacaoFase1.objects.filter(tcc=self.tcc, avaliador=self.avaliador1, status='PENDENTE').exists())
        self.assertTrue(AvaliacaoFase1.objects.filter(tcc=self.tcc, avaliador=self.avaliador2, status='PENDENTE').exists())

        # Verificar que TCC foi movido para AVALIACAO_FASE_1
        self.tcc.refresh_from_db()
        self.assertEqual(self.tcc.etapa_atual, EtapaTCC.AVALIACAO_FASE_1)

        # Verificar que evento foi criado
        self.assertTrue(EventoTimeline.objects.filter(tcc=self.tcc, tipo_evento=TipoEvento.FORMACAO_BANCA).exists())

    def test_concluir_banca_sem_2_avaliadores_retorna_400(self):
        """Testar que concluir banca com menos de 2 avaliadores retorna 400."""
        # Remover um avaliador
        MembroBanca.objects.filter(banca=self.banca, usuario=self.avaliador2).delete()

        client = APIClient()
        client.force_authenticate(user=self.coordenador)

        response = client.post(f'/api/tccs/{self.tcc.id}/banca-fase1/concluir/')

        self.assertEqual(response.status_code, 400)
        self.assertIn('pelo menos 2 avaliadores', str(response.data))


class AvaliacoesFase1GetTest(TestCase):
    """Testes para GET /api/tccs/{id}/avaliacoes-fase1/."""

    def setUp(self):
        """Configurar dados de teste."""
        self.aluno = Usuario.objects.create_user(
            email='aluno@test.com',
            nome_completo='Aluno Teste',
            tipo_usuario='ALUNO',
            curso='ENGENHARIA_ELETRICA',
            password='senha123'
        )
        self.professor = Usuario.objects.create_user(
            email='prof@test.com',
            nome_completo='Professor Teste',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.avaliador1 = Usuario.objects.create_user(
            email='aval1@test.com',
            nome_completo='Avaliador 1',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.avaliador2 = Usuario.objects.create_user(
            email='aval2@test.com',
            nome_completo='Avaliador 2',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.coordenador = Usuario.objects.create_user(
            email='coord@test.com',
            nome_completo='Coordenador Teste',
            tipo_usuario='COORDENADOR',
            departamento='Depto Eng',
            password='senha123'
        )

        self.tcc = TCC.objects.create(
            aluno=self.aluno,
            orientador=self.professor,
            titulo='TCC Teste',
            semestre='2025.1',
            etapa_atual=EtapaTCC.AVALIACAO_FASE_1,
            flag_liberado_avaliacao=True
        )

        # Criar banca e membros
        self.banca = BancaFase1.objects.create(tcc=self.tcc, status='COMPLETA')
        MembroBanca.objects.create(banca=self.banca, usuario=self.professor, tipo='ORIENTADOR', indicado_por='SISTEMA', ordem=0)
        MembroBanca.objects.create(banca=self.banca, usuario=self.avaliador1, tipo='AVALIADOR', indicado_por='COORDENADOR', ordem=1)
        MembroBanca.objects.create(banca=self.banca, usuario=self.avaliador2, tipo='AVALIADOR', indicado_por='COORDENADOR', ordem=2)

        # Criar avaliações
        AvaliacaoFase1.objects.create(tcc=self.tcc, avaliador=self.avaliador1, status='PENDENTE')
        AvaliacaoFase1.objects.create(tcc=self.tcc, avaliador=self.avaliador2, status='ENVIADO')

    def test_coordenador_ve_todas_avaliacoes(self):
        """Testar que coordenador vê todas as avaliações."""
        client = APIClient()
        client.force_authenticate(user=self.coordenador)

        response = client.get(f'/api/tccs/{self.tcc.id}/avaliacoes-fase1/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_orientador_ve_todas_avaliacoes(self):
        """Testar que orientador vê todas as avaliações."""
        client = APIClient()
        client.force_authenticate(user=self.professor)

        response = client.get(f'/api/tccs/{self.tcc.id}/avaliacoes-fase1/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_avaliador_ve_apenas_sua_avaliacao(self):
        """Testar que avaliador vê apenas sua própria avaliação."""
        client = APIClient()
        client.force_authenticate(user=self.avaliador1)

        response = client.get(f'/api/tccs/{self.tcc.id}/avaliacoes-fase1/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['avaliador'], self.avaliador1.id)


class EnviarAvaliacaoFase1Test(TestCase):
    """Testes para POST /api/tccs/{id}/avaliacoes-fase1/enviar/."""

    def setUp(self):
        """Configurar dados de teste."""
        self.aluno = Usuario.objects.create_user(
            email='aluno@test.com',
            nome_completo='Aluno Teste',
            tipo_usuario='ALUNO',
            curso='ENGENHARIA_ELETRICA',
            password='senha123'
        )
        self.professor = Usuario.objects.create_user(
            email='prof@test.com',
            nome_completo='Professor Teste',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.avaliador1 = Usuario.objects.create_user(
            email='aval1@test.com',
            nome_completo='Avaliador 1',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.coordenador = Usuario.objects.create_user(
            email='coord@test.com',
            nome_completo='Coordenador Teste',
            tipo_usuario='COORDENADOR',
            departamento='Depto Eng',
            password='senha123'
        )

        self.tcc = TCC.objects.create(
            aluno=self.aluno,
            orientador=self.professor,
            titulo='TCC Teste',
            semestre='2025.1',
            etapa_atual=EtapaTCC.AVALIACAO_FASE_1,
            flag_liberado_avaliacao=True
        )

        # Criar banca e membros
        self.banca = BancaFase1.objects.create(tcc=self.tcc, status='COMPLETA')
        MembroBanca.objects.create(banca=self.banca, usuario=self.professor, tipo='ORIENTADOR', indicado_por='SISTEMA', ordem=0)
        MembroBanca.objects.create(banca=self.banca, usuario=self.avaliador1, tipo='AVALIADOR', indicado_por='COORDENADOR', ordem=1)

        self.avaliacao = AvaliacaoFase1.objects.create(tcc=self.tcc, avaliador=self.avaliador1, status='PENDENTE')

    def test_avaliador_envia_avaliacao_com_sucesso(self):
        """Testar que avaliador pode enviar avaliação."""
        client = APIClient()
        client.force_authenticate(user=self.avaliador1)

        payload = {
            'nota_resumo': 0.8,
            'nota_introducao': 1.6,
            'nota_revisao': 1.6,
            'nota_desenvolvimento': 2.8,
            'nota_conclusoes': 1.2,
            'parecer': 'Trabalho bem desenvolvido',
            'status': 'ENVIADO'
        }

        response = client.post(f'/api/tccs/{self.tcc.id}/avaliacoes-fase1/enviar/', payload, format='json')

        self.assertEqual(response.status_code, 200)

        # Verificar que avaliação foi atualizada
        self.avaliacao.refresh_from_db()
        self.assertEqual(self.avaliacao.status, 'ENVIADO')
        self.assertEqual(self.avaliacao.nota_resumo, Decimal('0.8'))
        self.assertIsNotNone(self.avaliacao.enviado_em)

        # Verificar que evento foi criado
        self.assertTrue(EventoTimeline.objects.filter(tcc=self.tcc, tipo_evento=TipoEvento.AVALIACAO_ENVIADA).exists())

    def test_avaliador_salva_rascunho(self):
        """Testar que avaliador pode salvar rascunho (status PENDENTE)."""
        client = APIClient()
        client.force_authenticate(user=self.avaliador1)

        payload = {
            'nota_resumo': 0.8,
            'parecer': 'Rascunho inicial',
            'status': 'PENDENTE'
        }

        response = client.post(f'/api/tccs/{self.tcc.id}/avaliacoes-fase1/enviar/', payload, format='json')

        self.assertEqual(response.status_code, 200)

        self.avaliacao.refresh_from_db()
        self.assertEqual(self.avaliacao.status, 'PENDENTE')
        self.assertIsNone(self.avaliacao.enviado_em)

    def test_avaliador_cancela_envio(self):
        """Testar que avaliador pode cancelar envio (ENVIADO → PENDENTE)."""
        # Marcar como enviada
        self.avaliacao.status = 'ENVIADO'
        self.avaliacao.save()

        client = APIClient()
        client.force_authenticate(user=self.avaliador1)

        payload = {'status': 'PENDENTE'}

        response = client.post(f'/api/tccs/{self.tcc.id}/avaliacoes-fase1/enviar/', payload, format='json')

        self.assertEqual(response.status_code, 200)

        self.avaliacao.refresh_from_db()
        self.assertEqual(self.avaliacao.status, 'PENDENTE')
        self.assertIsNone(self.avaliacao.enviado_em)

        # Verificar evento de reabertura
        self.assertTrue(EventoTimeline.objects.filter(tcc=self.tcc, tipo_evento=TipoEvento.AVALIACAO_REABERTA).exists())

    def test_avaliador_nao_pode_editar_avaliacao_bloqueada(self):
        """Testar que avaliador não pode editar avaliação BLOQUEADA."""
        self.avaliacao.status = 'BLOQUEADO'
        self.avaliacao.save()

        client = APIClient()
        client.force_authenticate(user=self.avaliador1)

        payload = {'nota_resumo': 1.0}

        response = client.post(f'/api/tccs/{self.tcc.id}/avaliacoes-fase1/enviar/', payload, format='json')

        self.assertEqual(response.status_code, 403)


class BloquearDesbloquearAvaliacaoTest(TestCase):
    """Testes para bloqueio/desbloqueio de avaliações."""

    def setUp(self):
        """Configurar dados de teste."""
        self.aluno = Usuario.objects.create_user(
            email='aluno@test.com',
            nome_completo='Aluno Teste',
            tipo_usuario='ALUNO',
            curso='ENGENHARIA_ELETRICA',
            password='senha123'
        )
        self.professor = Usuario.objects.create_user(
            email='prof@test.com',
            nome_completo='Professor Teste',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.avaliador1 = Usuario.objects.create_user(
            email='aval1@test.com',
            nome_completo='Avaliador 1',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.avaliador2 = Usuario.objects.create_user(
            email='aval2@test.com',
            nome_completo='Avaliador 2',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.coordenador = Usuario.objects.create_user(
            email='coord@test.com',
            nome_completo='Coordenador Teste',
            tipo_usuario='COORDENADOR',
            departamento='Depto Eng',
            password='senha123'
        )

        self.tcc = TCC.objects.create(
            aluno=self.aluno,
            orientador=self.professor,
            titulo='TCC Teste',
            semestre='2025.1',
            etapa_atual=EtapaTCC.AVALIACAO_FASE_1,
            flag_liberado_avaliacao=True,
            avaliacao_fase1_bloqueada=False
        )

        # Criar avaliações ENVIADAS
        AvaliacaoFase1.objects.create(tcc=self.tcc, avaliador=self.avaliador1, status='ENVIADO')
        AvaliacaoFase1.objects.create(tcc=self.tcc, avaliador=self.avaliador2, status='ENVIADO')

    def test_coordenador_bloqueia_avaliacoes(self):
        """Testar que coordenador pode bloquear todas as avaliações."""
        client = APIClient()
        client.force_authenticate(user=self.coordenador)

        response = client.post(f'/api/tccs/{self.tcc.id}/avaliacao-fase1/bloquear/')

        self.assertEqual(response.status_code, 200)
        self.assertIn('avaliacoes_bloqueadas', response.data)
        self.assertEqual(response.data['avaliacoes_bloqueadas'], 2)

        # Verificar que flag foi setada
        self.tcc.refresh_from_db()
        self.assertTrue(self.tcc.avaliacao_fase1_bloqueada)

        # Verificar que avaliações foram bloqueadas
        self.assertEqual(AvaliacaoFase1.objects.filter(tcc=self.tcc, status='BLOQUEADO').count(), 2)

        # Verificar evento
        self.assertTrue(EventoTimeline.objects.filter(tcc=self.tcc, tipo_evento=TipoEvento.BLOQUEIO_AVALIACOES).exists())

    def test_coordenador_desbloqueia_avaliacoes(self):
        """Testar que coordenador pode desbloquear avaliações."""
        # Bloquear primeiro
        self.tcc.avaliacao_fase1_bloqueada = True
        self.tcc.save()
        AvaliacaoFase1.objects.filter(tcc=self.tcc).update(status='BLOQUEADO')

        client = APIClient()
        client.force_authenticate(user=self.coordenador)

        response = client.post(f'/api/tccs/{self.tcc.id}/avaliacao-fase1/desbloquear/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['avaliacoes_desbloqueadas'], 2)

        # Verificar que flag foi resetada
        self.tcc.refresh_from_db()
        self.assertFalse(self.tcc.avaliacao_fase1_bloqueada)

        # Verificar que avaliações foram desbloqueadas
        self.assertEqual(AvaliacaoFase1.objects.filter(tcc=self.tcc, status='ENVIADO').count(), 2)


class SolicitarAjustesFase1Test(TestCase):
    """Testes para POST /api/tccs/{id}/solicitar-ajustes-fase1/."""

    def setUp(self):
        """Configurar dados de teste."""
        self.aluno = Usuario.objects.create_user(
            email='aluno@test.com',
            nome_completo='Aluno Teste',
            tipo_usuario='ALUNO',
            curso='ENGENHARIA_ELETRICA',
            password='senha123'
        )
        self.professor = Usuario.objects.create_user(
            email='prof@test.com',
            nome_completo='Professor Teste',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.avaliador1 = Usuario.objects.create_user(
            email='aval1@test.com',
            nome_completo='Avaliador 1',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.coordenador = Usuario.objects.create_user(
            email='coord@test.com',
            nome_completo='Coordenador Teste',
            tipo_usuario='COORDENADOR',
            departamento='Depto Eng',
            password='senha123'
        )

        self.tcc = TCC.objects.create(
            aluno=self.aluno,
            orientador=self.professor,
            titulo='TCC Teste',
            semestre='2025.1',
            etapa_atual=EtapaTCC.AVALIACAO_FASE_1,
            flag_liberado_avaliacao=True
        )

        # Criar avaliação BLOQUEADA
        self.avaliacao = AvaliacaoFase1.objects.create(tcc=self.tcc, avaliador=self.avaliador1, status='BLOQUEADO')

    def test_coordenador_solicita_ajustes(self):
        """Testar que coordenador pode solicitar ajustes e realmente libera as avaliações."""
        from django.utils import timezone

        # Bloquear TCC e marcar avaliação como BLOQUEADA com enviado_em preenchido
        self.tcc.avaliacao_fase1_bloqueada = True
        self.tcc.save()

        self.avaliacao.status = 'BLOQUEADO'
        self.avaliacao.enviado_em = timezone.now()
        self.avaliacao.save()

        client = APIClient()
        client.force_authenticate(user=self.coordenador)

        payload = {
            'avaliadores': [self.avaliador1.id],
            'mensagem': 'Por favor, revisar nota de metodologia'
        }

        response = client.post(f'/api/tccs/{self.tcc.id}/solicitar-ajustes-fase1/', payload, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['avaliacoes_reabertas'], 1)
        self.assertTrue(response.data['tcc_desbloqueado'])

        # Verificar que avaliação foi reaberta corretamente
        self.avaliacao.refresh_from_db()
        self.assertEqual(self.avaliacao.status, 'PENDENTE')
        self.assertIsNone(self.avaliacao.enviado_em)  # enviado_em deve ser limpo

        # Verificar que TCC foi desbloqueado
        self.tcc.refresh_from_db()
        self.assertFalse(self.tcc.avaliacao_fase1_bloqueada)

        # Verificar evento
        self.assertTrue(EventoTimeline.objects.filter(tcc=self.tcc, tipo_evento=TipoEvento.SOLICITACAO_AJUSTES).exists())


class AprovarAvaliacoesFase1Test(TestCase):
    """Testes para aprovação parcial e completa."""

    def setUp(self):
        """Configurar dados de teste."""
        self.aluno = Usuario.objects.create_user(
            email='aluno@test.com',
            nome_completo='Aluno Teste',
            tipo_usuario='ALUNO',
            curso='ENGENHARIA_ELETRICA',
            password='senha123'
        )
        self.professor = Usuario.objects.create_user(
            email='prof@test.com',
            nome_completo='Professor Teste',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.avaliador1 = Usuario.objects.create_user(
            email='aval1@test.com',
            nome_completo='Avaliador 1',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.avaliador2 = Usuario.objects.create_user(
            email='aval2@test.com',
            nome_completo='Avaliador 2',
            tipo_usuario='PROFESSOR',
            departamento='Depto Eng',
            password='senha123'
        )
        self.coordenador = Usuario.objects.create_user(
            email='coord@test.com',
            nome_completo='Coordenador Teste',
            tipo_usuario='COORDENADOR',
            departamento='Depto Eng',
            password='senha123'
        )

        self.tcc = TCC.objects.create(
            aluno=self.aluno,
            orientador=self.professor,
            titulo='TCC Teste',
            semestre='2025.1',
            etapa_atual=EtapaTCC.AVALIACAO_FASE_1,
            flag_liberado_avaliacao=True
        )

    def test_aprovacao_parcial(self):
        """Testar aprovação parcial (bloqueia apenas avaliadores específicos)."""
        # Criar avaliações ENVIADAS
        AvaliacaoFase1.objects.create(tcc=self.tcc, avaliador=self.avaliador1, status='ENVIADO')
        AvaliacaoFase1.objects.create(tcc=self.tcc, avaliador=self.avaliador2, status='ENVIADO')

        client = APIClient()
        client.force_authenticate(user=self.coordenador)

        payload = {'avaliadores': [self.avaliador1.id]}

        response = client.post(f'/api/tccs/{self.tcc.id}/aprovar-avaliacoes-fase1/', payload, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['tipo'], 'parcial')
        self.assertEqual(response.data['avaliacoes_aprovadas'], 1)

        # Verificar que apenas 1 avaliação foi bloqueada
        self.assertEqual(AvaliacaoFase1.objects.filter(tcc=self.tcc, status='BLOQUEADO').count(), 1)
        self.assertEqual(AvaliacaoFase1.objects.filter(tcc=self.tcc, status='ENVIADO').count(), 1)

        # Verificar que TCC permanece em AVALIACAO_FASE_1
        self.tcc.refresh_from_db()
        self.assertEqual(self.tcc.etapa_atual, EtapaTCC.AVALIACAO_FASE_1)

    def test_aprovacao_completa_aprovado(self):
        """Testar aprovação completa com NF1 >= 6 (aprovado)."""
        # Criar avaliações com notas que resultam em soma total >= 6
        AvaliacaoFase1.objects.create(
            tcc=self.tcc, avaliador=self.avaliador1, status='ENVIADO',
            nota_resumo=0.8, nota_introducao=1.6, nota_revisao=1.6,
            nota_desenvolvimento=2.8, nota_conclusoes=1.2
        )
        AvaliacaoFase1.objects.create(
            tcc=self.tcc, avaliador=self.avaliador2, status='ENVIADO',
            nota_resumo=0.7, nota_introducao=1.4, nota_revisao=1.4,
            nota_desenvolvimento=2.45, nota_conclusoes=1.05
        )

        client = APIClient()
        client.force_authenticate(user=self.coordenador)

        # Aprovação completa (sem campo 'avaliadores')
        response = client.post(f'/api/tccs/{self.tcc.id}/aprovar-avaliacoes-fase1/', {}, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['tipo'], 'completa')
        self.assertEqual(response.data['resultado'], 'APROVADO')
        self.assertGreaterEqual(response.data['nf1'], 6.0)

        # Verificar que TCC foi movido para AGENDAMENTO_APRESENTACAO
        self.tcc.refresh_from_db()
        self.assertEqual(self.tcc.etapa_atual, EtapaTCC.AGENDAMENTO_APRESENTACAO)

        # Verificar evento
        self.assertTrue(EventoTimeline.objects.filter(tcc=self.tcc, tipo_evento=TipoEvento.RESULTADO_FASE_1).exists())

    def test_aprovacao_completa_reprovado(self):
        """Testar aprovação completa com NF1 < 6 (reprovado)."""
        # Criar avaliações com notas que resultam em soma total < 6
        AvaliacaoFase1.objects.create(
            tcc=self.tcc, avaliador=self.avaliador1, status='ENVIADO',
            nota_resumo=0.5, nota_introducao=1.0, nota_revisao=1.0,
            nota_desenvolvimento=1.75, nota_conclusoes=0.75
        )
        AvaliacaoFase1.objects.create(
            tcc=self.tcc, avaliador=self.avaliador2, status='ENVIADO',
            nota_resumo=0.4, nota_introducao=0.8, nota_revisao=0.8,
            nota_desenvolvimento=1.4, nota_conclusoes=0.6
        )

        client = APIClient()
        client.force_authenticate(user=self.coordenador)

        response = client.post(f'/api/tccs/{self.tcc.id}/aprovar-avaliacoes-fase1/', {}, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['resultado'], 'REPROVADO')
        self.assertLess(response.data['nf1'], 6.0)

        # Verificar que TCC foi movido para REPROVADO_FASE_1
        self.tcc.refresh_from_db()
        self.assertEqual(self.tcc.etapa_atual, EtapaTCC.REPROVADO_FASE_1)

    def test_aprovacao_completa_com_avaliacoes_pendentes_retorna_400(self):
        """Testar que não pode aprovar completamente se há avaliações pendentes."""
        # Criar 1 ENVIADA e 1 PENDENTE
        AvaliacaoFase1.objects.create(
            tcc=self.tcc, avaliador=self.avaliador1, status='ENVIADO',
            nota_resumo=0.8, nota_introducao=1.6, nota_revisao=1.6,
            nota_desenvolvimento=2.8, nota_conclusoes=1.2
        )
        AvaliacaoFase1.objects.create(tcc=self.tcc, avaliador=self.avaliador2, status='PENDENTE')

        client = APIClient()
        client.force_authenticate(user=self.coordenador)

        response = client.post(f'/api/tccs/{self.tcc.id}/aprovar-avaliacoes-fase1/', {}, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('pendente', str(response.data).lower())
