"""Testes para o app tccs."""
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from users.models import Usuario
from .models import TCC, SolicitacaoOrientacao, DocumentoTCC, EventoTimeline, BancaFase1, MembroBanca, AvaliacaoFase1
from .constants import EtapaTCC, StatusSolicitacao, TipoDocumento, StatusDocumento, TipoEvento, Visibilidade


class TCCModelTest(TestCase):
    """Testes para o modelo TCC."""

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
            departamento='Departamento de Engenharia Elétrica',
            password='senha123'
        )

    def test_criar_tcc_sucesso(self):
        """Testar criação de TCC com dados válidos."""
        tcc = TCC.objects.create(
            aluno=self.aluno,
            titulo='Título do TCC de Teste',
            semestre='2025.1'
        )
        self.assertEqual(tcc.aluno, self.aluno)
        self.assertEqual(tcc.etapa_atual, EtapaTCC.INICIALIZACAO)
        self.assertFalse(tcc.flag_continuidade)
        self.assertFalse(tcc.flag_liberado_avaliacao)

    def test_aluno_nao_pode_ter_dois_tccs_mesmo_semestre(self):
        """Testar que aluno não pode ter 2 TCCs no mesmo semestre."""
        TCC.objects.create(
            aluno=self.aluno,
            titulo='TCC 1',
            semestre='2025.1'
        )

        # Tentar criar segundo TCC no mesmo semestre deve falhar
        with self.assertRaises(Exception):
            TCC.objects.create(
                aluno=self.aluno,
                titulo='TCC 2',
                semestre='2025.1'
            )

    def test_validacao_tipo_usuario_aluno(self):
        """Testar que apenas ALUNO pode ser dono de TCC."""
        with self.assertRaises(Exception):
            TCC.objects.create(
                aluno=self.professor,  # Professor não pode ser aluno
                titulo='TCC Inválido',
                semestre='2025.1'
            )


class SolicitacaoOrientacaoTest(TestCase):
    """Testes para Solicitacao de Orientacao."""

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
            departamento='Departamento de Engenharia Eletrica',
            password='senha123'
        )
        self.coordenador = Usuario.objects.create_user(
            email='coord@test.com',
            nome_completo='Coordenador Teste',
            tipo_usuario='COORDENADOR',
            departamento='Departamento de Engenharia Eletrica',
            password='senha123'
        )
        self.tcc = TCC.objects.create(
            aluno=self.aluno,
            titulo='TCC Teste',
            semestre='2025.1'
        )

    def test_criar_solicitacao(self):
        """Testar criação de solicitação."""
        solicitacao = SolicitacaoOrientacao.objects.create(
            tcc=self.tcc,
            professor=self.professor,
            mensagem='Gostaria que você fosse meu orientador'
        )
        self.assertEqual(solicitacao.status, StatusSolicitacao.PENDENTE)
        self.assertEqual(solicitacao.professor, self.professor)

    def test_bloquear_segunda_solicitacao_pendente(self):
        """Testar que não pode haver 2 solicitações PENDENTES."""
        # Criar primeira solicitação
        SolicitacaoOrientacao.objects.create(
            tcc=self.tcc,
            professor=self.professor,
            mensagem='Primeira solicitação'
        )

        # Tentar criar segunda solicitação PENDENTE deve falhar
        professor2 = Usuario.objects.create_user(
            email='prof2@test.com',
            nome_completo='Professor 2',
            tipo_usuario='PROFESSOR',
            departamento='Departamento de Engenharia Elétrica',
            password='senha123'
        )

        with self.assertRaises(Exception):
            SolicitacaoOrientacao.objects.create(
                tcc=self.tcc,
                professor=professor2,
                mensagem='Segunda solicitação'
            )

    def test_coordenador_pode_aceitar_solicitacao(self):
        """Testar que coordenador pode aprovar solicitacao."""
        from rest_framework.test import APIClient

        solicitacao = SolicitacaoOrientacao.objects.create(
            tcc=self.tcc,
            professor=self.professor
        )

        # Coordenador aprova solicitacao via API
        client = APIClient()
        client.force_authenticate(user=self.coordenador)
        response = client.post(f'/api/solicitacoes/{solicitacao.id}/aceitar/', {'resposta': 'Aprovado'})

        self.assertEqual(response.status_code, 200)
        self.assertIn('message', response.data)

        # Verificar que TCC foi atualizado
        self.tcc.refresh_from_db()
        self.assertEqual(self.tcc.orientador, self.professor)
        self.assertEqual(self.tcc.etapa_atual, EtapaTCC.DESENVOLVIMENTO)
        self.assertFalse(self.tcc.flag_continuidade)
        self.assertFalse(self.tcc.flag_liberado_avaliacao)
        self.assertFalse(self.tcc.avaliacao_fase1_bloqueada)

        # Verificar que solicitacao foi atualizada
        solicitacao.refresh_from_db()
        self.assertEqual(solicitacao.status, StatusSolicitacao.ACEITA)
        self.assertIsNotNone(solicitacao.respondido_em)

    def test_professor_nao_pode_aceitar_solicitacao(self):
        """Testar que professor NAO pode aprovar solicitacao (apenas coordenador)."""
        from rest_framework.test import APIClient

        solicitacao = SolicitacaoOrientacao.objects.create(
            tcc=self.tcc,
            professor=self.professor
        )

        # Professor tenta aprovar solicitacao via API
        client = APIClient()
        client.force_authenticate(user=self.professor)
        response = client.post(f'/api/solicitacoes/{solicitacao.id}/aceitar/', {'resposta': 'Aprovado'})

        # Deve retornar 403 Forbidden
        self.assertEqual(response.status_code, 403)

        # Verificar que TCC nao foi alterado
        self.tcc.refresh_from_db()
        self.assertIsNone(self.tcc.orientador)
        self.assertEqual(self.tcc.etapa_atual, EtapaTCC.INICIALIZACAO)

    def test_coordenador_pode_recusar_solicitacao(self):
        """Testar que coordenador pode recusar solicitacao e TCC é removido."""
        from rest_framework.test import APIClient
        from .models import HistoricoRecusa

        solicitacao = SolicitacaoOrientacao.objects.create(
            tcc=self.tcc,
            professor=self.professor
        )

        # Guardar IDs para verificar deleção
        tcc_id = self.tcc.id
        solicitacao_id = solicitacao.id
        aluno_id = self.aluno.id

        # Coordenador recusa solicitacao via API (com parecer obrigatório)
        client = APIClient()
        client.force_authenticate(user=self.coordenador)
        response = client.post(f'/api/solicitacoes/{solicitacao_id}/recusar/', {'parecer': 'Nao aprovado'})

        self.assertEqual(response.status_code, 200)
        self.assertIn('message', response.data)
        self.assertEqual(response.data['tcc_id'], tcc_id)
        self.assertEqual(response.data['solicitacao_id'], solicitacao_id)
        self.assertIn('recusa', response.data)
        self.assertIn('parecer', response.data['recusa'])
        self.assertIn('coordenador_nome', response.data['recusa'])
        self.assertIn('recusado_em', response.data['recusa'])

        # Verificar que TCC foi deletado
        self.assertFalse(TCC.objects.filter(pk=tcc_id).exists())

        # Verificar que solicitacao foi deletada (cascade)
        with self.assertRaises(SolicitacaoOrientacao.DoesNotExist):
            solicitacao.refresh_from_db()

        # Verificar que HistoricoRecusa foi criado
        self.assertTrue(HistoricoRecusa.objects.filter(aluno_id=aluno_id).exists())

    def test_professor_nao_pode_recusar_solicitacao(self):
        """Testar que professor NAO pode recusar solicitacao (apenas coordenador)."""
        from rest_framework.test import APIClient

        solicitacao = SolicitacaoOrientacao.objects.create(
            tcc=self.tcc,
            professor=self.professor
        )

        # Professor tenta recusar solicitacao via API (com parecer)
        client = APIClient()
        client.force_authenticate(user=self.professor)
        response = client.post(f'/api/solicitacoes/{solicitacao.id}/recusar/', {'parecer': 'Recusado'})

        # Deve retornar 403 Forbidden
        self.assertEqual(response.status_code, 403)

        # Verificar que solicitacao nao foi alterada
        solicitacao.refresh_from_db()
        self.assertEqual(solicitacao.status, StatusSolicitacao.PENDENTE)

    def test_recusa_remove_tcc_e_aluno_recebe_recusa(self):
        """Testar que após recusa, TCC é removido e aluno recebe status RECUSADO ao consultar /api/tccs/meu/."""
        from rest_framework.test import APIClient
        from .models import HistoricoRecusa

        solicitacao = SolicitacaoOrientacao.objects.create(
            tcc=self.tcc,
            professor=self.professor
        )

        # Guardar IDs para verificar deleção
        tcc_id = self.tcc.id
        solicitacao_id = solicitacao.id

        # Coordenador recusa solicitacao com parecer longo
        client = APIClient()
        client.force_authenticate(user=self.coordenador)
        response = client.post(
            f'/api/solicitacoes/{solicitacao_id}/recusar/',
            {'parecer': 'Projeto não está alinhado com a linha de pesquisa do professor.'}
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('message', response.data)
        self.assertEqual(response.data['tcc_id'], tcc_id)
        self.assertEqual(response.data['solicitacao_id'], solicitacao_id)
        self.assertIn('recusa', response.data)

        # Verificar que TCC foi deletado
        self.assertFalse(TCC.objects.filter(pk=tcc_id).exists())

        # Verificar que solicitação foi deletada (cascade)
        self.assertFalse(SolicitacaoOrientacao.objects.filter(pk=solicitacao_id).exists())

        # Verificar que HistoricoRecusa foi criado
        self.assertTrue(HistoricoRecusa.objects.filter(aluno=self.aluno).exists())

        # Aluno consulta seu TCC via /api/tccs/meu/ e recebe status RECUSADO
        client.force_authenticate(user=self.aluno)
        response = client.get('/api/tccs/meu/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'RECUSADO')
        self.assertIn('recusa', response.data)
        self.assertIn('parecer', response.data['recusa'])
        self.assertIn('coordenador_nome', response.data['recusa'])
        self.assertIn('recusado_em', response.data['recusa'])
        self.assertEqual(response.data['recusa']['parecer'], 'Projeto não está alinhado com a linha de pesquisa do professor.')

    def test_recusa_e_criacao_novo_tcc_limpa_historico(self):
        """Testar que criar novo TCC limpa HistoricoRecusa."""
        from rest_framework.test import APIClient
        from .models import HistoricoRecusa

        # Criar solicitação e recusar
        solicitacao = SolicitacaoOrientacao.objects.create(
            tcc=self.tcc,
            professor=self.professor
        )

        client = APIClient()
        client.force_authenticate(user=self.coordenador)
        client.post(f'/api/solicitacoes/{solicitacao.id}/recusar/', {'parecer': 'Recusado'})

        # Verificar que HistoricoRecusa foi criado
        self.assertTrue(HistoricoRecusa.objects.filter(aluno=self.aluno).exists())

        # Aluno cria novo TCC
        client.force_authenticate(user=self.aluno)
        payload = {
            'titulo': 'Novo TCC',
            'semestre': '2025.1',
            'professor': self.professor.id,
            'mensagem': 'Nova solicitação'
        }
        response = client.post('/api/tccs/criar_com_solicitacao/', payload)

        self.assertEqual(response.status_code, 201)

        # Verificar que HistoricoRecusa foi limpo
        self.assertFalse(HistoricoRecusa.objects.filter(aluno=self.aluno).exists())

    def test_cancelar_solicitacao_reseta_tcc(self):
        """Testar que cancelar volta TCC para estado inicial."""
        solicitacao = SolicitacaoOrientacao.objects.create(
            tcc=self.tcc,
            professor=self.professor
        )

        # Cancelar
        solicitacao.status = StatusSolicitacao.CANCELADA
        solicitacao.save()

        # Resetar TCC
        self.tcc.orientador = None
        self.tcc.etapa_atual = EtapaTCC.INICIALIZACAO
        self.tcc.flag_continuidade = False
        self.tcc.flag_liberado_avaliacao = False
        self.tcc.save()

        self.tcc.refresh_from_db()
        self.assertIsNone(self.tcc.orientador)
        self.assertEqual(self.tcc.etapa_atual, EtapaTCC.INICIALIZACAO)

    def test_cancelar_solicitacao_endpoint_remove_tcc_completo(self):
        """Testar que DELETE /api/solicitacoes/{id}/cancelar/ remove TCC, documentos e arquivos."""
        from rest_framework.test import APIClient
        from django.core.files.storage import default_storage
        from .constants import TipoEvento, Visibilidade

        # Criar solicitação
        solicitacao = SolicitacaoOrientacao.objects.create(
            tcc=self.tcc,
            professor=self.professor,
            mensagem='Teste'
        )

        # Adicionar documentos com arquivos
        arquivo1 = SimpleUploadedFile("plano.pdf", b"conteudo do plano", content_type="application/pdf")
        doc1 = DocumentoTCC.objects.create(
            tcc=self.tcc,
            tipo_documento=TipoDocumento.PLANO_DESENVOLVIMENTO,
            arquivo=arquivo1,
            enviado_por=self.aluno
        )

        arquivo2 = SimpleUploadedFile("termo.pdf", b"conteudo do termo", content_type="application/pdf")
        doc2 = DocumentoTCC.objects.create(
            tcc=self.tcc,
            tipo_documento=TipoDocumento.TERMO_ACEITE,
            arquivo=arquivo2,
            enviado_por=self.aluno
        )

        # Adicionar evento
        EventoTimeline.objects.create(
            tcc=self.tcc,
            usuario=self.aluno,
            tipo_evento=TipoEvento.CRIACAO_TCC,
            descricao='TCC criado',
            visibilidade=Visibilidade.TODOS
        )

        # Guardar caminhos dos arquivos para verificar deleção
        arquivo1_path = doc1.arquivo.name
        arquivo2_path = doc2.arquivo.name

        # Verificar que arquivos existem
        self.assertTrue(default_storage.exists(arquivo1_path))
        self.assertTrue(default_storage.exists(arquivo2_path))

        # Verificar contagens iniciais
        tcc_id = self.tcc.id
        self.assertEqual(TCC.objects.filter(id=tcc_id).count(), 1)
        self.assertEqual(SolicitacaoOrientacao.objects.filter(id=solicitacao.id).count(), 1)
        self.assertEqual(DocumentoTCC.objects.filter(tcc_id=tcc_id).count(), 2)
        self.assertGreaterEqual(EventoTimeline.objects.filter(tcc_id=tcc_id).count(), 1)

        # Cancelar solicitação via API (DELETE)
        client = APIClient()
        client.force_authenticate(user=self.aluno)
        response = client.delete(f'/api/solicitacoes/{solicitacao.id}/cancelar/')

        # Verificar resposta 204 NO CONTENT
        self.assertEqual(response.status_code, 204)
        self.assertIsNone(response.data)

        # Verificar que TCC foi deletado
        self.assertEqual(TCC.objects.filter(id=tcc_id).count(), 0)

        # Verificar que solicitação foi deletada (cascade)
        self.assertEqual(SolicitacaoOrientacao.objects.filter(id=solicitacao.id).count(), 0)

        # Verificar que documentos foram deletados (cascade)
        self.assertEqual(DocumentoTCC.objects.filter(tcc_id=tcc_id).count(), 0)

        # Verificar que eventos foram deletados (cascade)
        self.assertEqual(EventoTimeline.objects.filter(tcc_id=tcc_id).count(), 0)

        # Verificar que arquivos físicos foram deletados
        self.assertFalse(default_storage.exists(arquivo1_path))
        self.assertFalse(default_storage.exists(arquivo2_path))

    def test_cancelar_solicitacao_nao_pendente_retorna_400(self):
        """Testar que cancelar solicitação não-pendente retorna 400."""
        from rest_framework.test import APIClient

        # Criar solicitação e aceitar
        solicitacao = SolicitacaoOrientacao.objects.create(
            tcc=self.tcc,
            professor=self.professor,
            mensagem='Teste'
        )
        solicitacao.status = StatusSolicitacao.ACEITA
        solicitacao.save()

        # Tentar cancelar
        client = APIClient()
        client.force_authenticate(user=self.aluno)
        response = client.delete(f'/api/solicitacoes/{solicitacao.id}/cancelar/')

        # Verificar erro 400
        self.assertEqual(response.status_code, 400)
        self.assertIn('detail', response.data)

        # Verificar que TCC não foi deletado
        self.assertEqual(TCC.objects.filter(id=self.tcc.id).count(), 1)

    def test_cancelar_solicitacao_outro_aluno_retorna_403_ou_404(self):
        """Testar que aluno não pode cancelar solicitação de outro aluno."""
        from rest_framework.test import APIClient

        # Criar outro aluno
        aluno2 = Usuario.objects.create_user(
            email='aluno2@test.com',
            nome_completo='Aluno 2',
            tipo_usuario='ALUNO',
            curso='ENGENHARIA_ELETRICA',
            password='senha123'
        )

        # Criar solicitação
        solicitacao = SolicitacaoOrientacao.objects.create(
            tcc=self.tcc,
            professor=self.professor,
            mensagem='Teste'
        )

        # Aluno 2 tenta cancelar solicitação do aluno 1
        client = APIClient()
        client.force_authenticate(user=aluno2)
        response = client.delete(f'/api/solicitacoes/{solicitacao.id}/cancelar/')

        # Verificar erro 403 ou 404 (ambos são válidos por segurança)
        # 404 é retornado quando o queryset filtra a solicitação
        # 403 seria retornado se has_object_permission fosse chamado
        self.assertIn(response.status_code, [403, 404])

        # Verificar que TCC não foi deletado
        self.assertEqual(TCC.objects.filter(id=self.tcc.id).count(), 1)


class DocumentoTCCTest(TestCase):
    """Testes para DocumentoTCC."""

    def setUp(self):
        """Configurar dados de teste."""
        self.aluno = Usuario.objects.create_user(
            email='aluno@test.com',
            nome_completo='Aluno Teste',
            tipo_usuario='ALUNO',
            curso='ENGENHARIA_ELETRICA',
            password='senha123'
        )
        self.tcc = TCC.objects.create(
            aluno=self.aluno,
            titulo='TCC Teste',
            semestre='2025.1'
        )

    def test_upload_documento_valido(self):
        """Testar upload de documento PDF válido."""
        # Criar arquivo PDF fake
        arquivo = SimpleUploadedFile(
            "documento.pdf",
            b"conteudo do pdf",
            content_type="application/pdf"
        )

        documento = DocumentoTCC.objects.create(
            tcc=self.tcc,
            tipo_documento=TipoDocumento.PLANO_DESENVOLVIMENTO,
            arquivo=arquivo,
            enviado_por=self.aluno
        )

        self.assertEqual(documento.versao, 1)
        self.assertEqual(documento.tipo_documento, TipoDocumento.PLANO_DESENVOLVIMENTO)
        self.assertGreater(documento.tamanho, 0)

    def test_versao_automatica(self):
        """Testar que versão é incrementada automaticamente."""
        arquivo1 = SimpleUploadedFile("doc1.pdf", b"conteudo 1", content_type="application/pdf")
        arquivo2 = SimpleUploadedFile("doc2.pdf", b"conteudo 2", content_type="application/pdf")

        doc1 = DocumentoTCC.objects.create(
            tcc=self.tcc,
            tipo_documento=TipoDocumento.PLANO_DESENVOLVIMENTO,
            arquivo=arquivo1,
            enviado_por=self.aluno
        )

        doc2 = DocumentoTCC.objects.create(
            tcc=self.tcc,
            tipo_documento=TipoDocumento.PLANO_DESENVOLVIMENTO,
            arquivo=arquivo2,
            enviado_por=self.aluno
        )

        self.assertEqual(doc1.versao, 1)
        self.assertEqual(doc2.versao, 2)

    def test_manager_oficiais(self):
        """Testar manager .oficiais() retorna apenas documentos aprovados."""
        from .constants import StatusDocumento

        arquivo = SimpleUploadedFile("doc.pdf", b"conteudo", content_type="application/pdf")

        # Documento pendente
        doc1 = DocumentoTCC.objects.create(
            tcc=self.tcc,
            tipo_documento=TipoDocumento.PLANO_DESENVOLVIMENTO,
            arquivo=arquivo,
            enviado_por=self.aluno,
            status=StatusDocumento.PENDENTE
        )

        # Documento aprovado
        arquivo2 = SimpleUploadedFile("doc2.pdf", b"conteudo 2", content_type="application/pdf")
        doc2 = DocumentoTCC.objects.create(
            tcc=self.tcc,
            tipo_documento=TipoDocumento.TERMO_ACEITE,
            arquivo=arquivo2,
            enviado_por=self.aluno,
            status=StatusDocumento.APROVADO
        )

        oficiais = DocumentoTCC.objects.oficiais()
        self.assertEqual(oficiais.count(), 1)
        self.assertEqual(oficiais.first(), doc2)


class EventoTimelineTest(TestCase):
    """Testes para EventoTimeline."""

    def setUp(self):
        """Configurar dados de teste."""
        self.aluno = Usuario.objects.create_user(
            email='aluno@test.com',
            nome_completo='Aluno Teste',
            tipo_usuario='ALUNO',
            curso='ENGENHARIA_ELETRICA',
            password='senha123'
        )
        self.tcc = TCC.objects.create(
            aluno=self.aluno,
            titulo='TCC Teste',
            semestre='2025.1'
        )

    def test_criar_evento(self):
        """Testar criação de evento na timeline."""
        from .constants import TipoEvento, Visibilidade

        evento = EventoTimeline.objects.create(
            tcc=self.tcc,
            usuario=self.aluno,
            tipo_evento=TipoEvento.CRIACAO_TCC,
            descricao='TCC criado',
            visibilidade=Visibilidade.TODOS
        )

        self.assertEqual(evento.tcc, self.tcc)
        self.assertEqual(evento.tipo_evento, TipoEvento.CRIACAO_TCC)
        self.assertIsNotNone(evento.timestamp)


class ResetEndpointTest(TestCase):
    """Testes para endpoint de reset do ambiente de TCC."""

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
            departamento='Departamento de Engenharia Elétrica',
            password='senha123'
        )

    def test_reset_limpa_todos_dados_tcc(self):
        """Testar que reset remove todos os dados de TCC mas mantém usuários."""
        from rest_framework.test import APIClient
        from .constants import TipoEvento, Visibilidade
        from django.test import override_settings

        # Criar dados de teste
        tcc = TCC.objects.create(
            aluno=self.aluno,
            titulo='TCC Teste',
            semestre='2025.1'
        )

        solicitacao = SolicitacaoOrientacao.objects.create(
            tcc=tcc,
            professor=self.professor,
            mensagem='Teste'
        )

        arquivo = SimpleUploadedFile("doc.pdf", b"conteudo", content_type="application/pdf")
        documento = DocumentoTCC.objects.create(
            tcc=tcc,
            tipo_documento=TipoDocumento.PLANO_DESENVOLVIMENTO,
            arquivo=arquivo,
            enviado_por=self.aluno
        )

        EventoTimeline.objects.create(
            tcc=tcc,
            usuario=self.aluno,
            tipo_evento=TipoEvento.CRIACAO_TCC,
            descricao='TCC criado',
            visibilidade=Visibilidade.TODOS
        )

        # Verificar que existem dados
        self.assertEqual(TCC.objects.count(), 1)
        self.assertEqual(SolicitacaoOrientacao.objects.count(), 1)
        self.assertEqual(DocumentoTCC.objects.count(), 1)
        # Pode ter mais de 1 evento (criação manual + eventos automáticos de signals)
        self.assertGreaterEqual(EventoTimeline.objects.count(), 1)

        # Chamar endpoint de reset (com DEBUG=True)
        client = APIClient()
        client.force_authenticate(user=self.aluno)

        with override_settings(DEBUG=True):
            response = client.post('/api/tccs/reset/')

        # Verificar resposta
        self.assertEqual(response.status_code, 200)
        self.assertIn('message', response.data)
        self.assertGreaterEqual(response.data['deletados']['tccs'], 1)

        # Verificar que dados foram removidos
        self.assertEqual(TCC.objects.count(), 0)
        self.assertEqual(SolicitacaoOrientacao.objects.count(), 0)
        self.assertEqual(DocumentoTCC.objects.count(), 0)
        self.assertEqual(EventoTimeline.objects.count(), 0)

        # Verificar que usuários foram mantidos
        self.assertEqual(Usuario.objects.count(), 2)


class CriarComSolicitacaoTest(TestCase):
    """Testes para endpoint POST /api/tccs/criar_com_solicitacao/ (Checklist 11)."""

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
            departamento='Departamento de Engenharia Elétrica',
            password='senha123'
        )
        self.coordenador = Usuario.objects.create_user(
            email='coord@test.com',
            nome_completo='Coordenador Teste',
            tipo_usuario='COORDENADOR',
            departamento='Departamento de Engenharia Elétrica',
            password='senha123'
        )

    def test_criar_com_solicitacao_sucesso(self):
        """Testar criação de TCC com solicitação de orientação."""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.aluno)

        payload = {
            'titulo': 'Meu TCC sobre IoT',
            'resumo': 'Estudo sobre IoT industrial',
            'semestre': '2025.1',
            'professor': self.professor.id,
            'mensagem': 'Gostaria que fosse meu orientador'
        }

        response = client.post('/api/tccs/criar_com_solicitacao/', payload)

        # Verificar resposta
        self.assertEqual(response.status_code, 201)
        self.assertIn('tcc', response.data)
        self.assertIn('solicitacao', response.data)
        self.assertIn('documentos_obrigatorios', response.data)
        self.assertIn('pendencias', response.data)
        self.assertIn('message', response.data)

        # Verificar documentos_obrigatorios
        docs_obrigatorios = response.data['documentos_obrigatorios']
        self.assertEqual(len(docs_obrigatorios), 2)
        self.assertIn('PLANO_DESENVOLVIMENTO', [d['tipo'] for d in docs_obrigatorios])
        self.assertIn('TERMO_ACEITE', [d['tipo'] for d in docs_obrigatorios])

        # Verificar pendencias (como não enviamos documentos, devem ter 2 pendências)
        pendencias = response.data['pendencias']
        self.assertEqual(len(pendencias), 2)

        # Verificar que TCC foi criado
        tcc = TCC.objects.get(id=response.data['tcc']['id'])
        self.assertEqual(tcc.aluno, self.aluno)
        self.assertEqual(tcc.titulo, 'Meu TCC sobre IoT')
        self.assertEqual(tcc.etapa_atual, EtapaTCC.INICIALIZACAO)

        # Verificar que solicitação foi criada
        solicitacao = SolicitacaoOrientacao.objects.get(id=response.data['solicitacao']['id'])
        self.assertEqual(solicitacao.tcc, tcc)
        self.assertEqual(solicitacao.professor, self.professor)
        self.assertEqual(solicitacao.status, StatusSolicitacao.PENDENTE)

    def test_criar_com_solicitacao_duplicada_retorna_400(self):
        """Testar que não permite criar segunda solicitação se já existe uma pendente."""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.aluno)

        payload = {
            'titulo': 'Meu TCC sobre IoT',
            'semestre': '2025.1',
            'professor': self.professor.id,
            'mensagem': 'Primeira solicitação'
        }

        # Criar primeira solicitação (deve funcionar)
        response1 = client.post('/api/tccs/criar_com_solicitacao/', payload)
        self.assertEqual(response1.status_code, 201)

        # Guardar ID do TCC e da solicitação criada
        tcc_id = response1.data['tcc']['id']
        solicitacao_id = response1.data['solicitacao']['id']

        # Tentar criar segunda solicitação (usar semestre diferente para passar validação de semestre)
        # mas ainda deve falhar por causa da solicitação pendente
        payload2 = {
            'titulo': 'Outro TCC',
            'semestre': '2025.2',  # Semestre diferente
            'professor': self.professor.id,
            'mensagem': 'Segunda solicitação'
        }

        response2 = client.post('/api/tccs/criar_com_solicitacao/', payload2)

        # Verificar erro 400
        self.assertEqual(response2.status_code, 400)
        self.assertIn('detail', response2.data)
        self.assertIn('solicitacao_pendente_id', response2.data)
        self.assertIn('tcc_id', response2.data)

        # Verificar que os IDs retornados correspondem à solicitação pendente
        self.assertEqual(response2.data['solicitacao_pendente_id'], solicitacao_id)
        self.assertEqual(response2.data['tcc_id'], tcc_id)

        # Verificar que apenas 1 TCC foi criado (com solicitação pendente)
        self.assertEqual(TCC.objects.filter(aluno=self.aluno).count(), 1)
        self.assertEqual(SolicitacaoOrientacao.objects.filter(tcc__aluno=self.aluno, status=StatusSolicitacao.PENDENTE).count(), 1)

    def test_criar_com_solicitacao_com_coorientador(self):
        """Testar criação com dados de coorientador externo."""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.aluno)

        payload = {
            'titulo': 'TCC com coorientador',
            'semestre': '2025.1',
            'professor': self.professor.id,
            'mensagem': 'Gostaria que fosse meu orientador',
            'coorientador_nome': 'Dr. João Silva',
            'coorientador_titulacao': 'Dr.',
            'coorientador_afiliacao': 'UFPE',
            'coorientador_lattes': 'http://lattes.cnpq.br/123456'
        }

        response = client.post('/api/tccs/criar_com_solicitacao/', payload)

        self.assertEqual(response.status_code, 201)

        # Verificar que dados do coorientador foram salvos no TCC
        tcc = TCC.objects.get(id=response.data['tcc']['id'])
        self.assertEqual(tcc.coorientador_nome, 'Dr. João Silva')
        self.assertEqual(tcc.coorientador_titulacao, 'Dr.')
        self.assertEqual(tcc.coorientador_afiliacao, 'UFPE')
        self.assertEqual(tcc.coorientador_lattes, 'http://lattes.cnpq.br/123456')


class SolicitacoesPendentesTest(TestCase):
    """Testes para endpoint GET /api/solicitacoes/pendentes/ (Checklist 11)."""

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
            departamento='Departamento de Engenharia Elétrica',
            password='senha123'
        )
        self.coordenador = Usuario.objects.create_user(
            email='coord@test.com',
            nome_completo='Coordenador Teste',
            tipo_usuario='COORDENADOR',
            departamento='Departamento de Engenharia Elétrica',
            password='senha123'
        )

        # Criar TCC e solicitação pendente
        self.tcc = TCC.objects.create(
            aluno=self.aluno,
            titulo='TCC Teste',
            semestre='2025.1'
        )
        self.solicitacao = SolicitacaoOrientacao.objects.create(
            tcc=self.tcc,
            professor=self.professor,
            mensagem='Gostaria que fosse meu orientador'
        )

    def test_coordenador_lista_solicitacoes_pendentes(self):
        """Testar que coordenador vê todas as solicitações pendentes."""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.coordenador)

        response = client.get('/api/solicitacoes/pendentes/')

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 1)

        # Verificar campos enriquecidos do Checklist 11
        solicitacao_data = response.data[0]
        self.assertIn('aluno_nome', solicitacao_data)
        self.assertIn('aluno_curso', solicitacao_data)
        self.assertIn('documentos', solicitacao_data)

        self.assertEqual(solicitacao_data['aluno_nome'], 'Aluno Teste')
        self.assertIsInstance(solicitacao_data['documentos'], list)

    def test_professor_lista_apenas_suas_solicitacoes(self):
        """Testar que professor vê apenas solicitações enviadas a ele (informativo)."""
        from rest_framework.test import APIClient

        # Criar outro professor e solicitação para ele
        professor2 = Usuario.objects.create_user(
            email='prof2@test.com',
            nome_completo='Professor 2',
            tipo_usuario='PROFESSOR',
            departamento='Departamento de Engenharia Elétrica',
            password='senha123'
        )

        aluno2 = Usuario.objects.create_user(
            email='aluno2@test.com',
            nome_completo='Aluno 2',
            tipo_usuario='ALUNO',
            curso='ENGENHARIA_ELETRICA',
            password='senha123'
        )

        tcc2 = TCC.objects.create(
            aluno=aluno2,
            titulo='TCC 2',
            semestre='2025.1'
        )

        SolicitacaoOrientacao.objects.create(
            tcc=tcc2,
            professor=professor2,
            mensagem='Outra solicitação'
        )

        # Professor 1 deve ver apenas sua solicitação (informativo, sem ações)
        client = APIClient()
        client.force_authenticate(user=self.professor)

        response = client.get('/api/solicitacoes/pendentes/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['professor_dados']['email'], 'prof@test.com')

    def test_solicitacoes_pendentes_inclui_documentos_anexados(self):
        """Testar que endpoint retorna documentos anexados ao TCC."""
        from rest_framework.test import APIClient

        # Anexar documentos ao TCC
        arquivo = SimpleUploadedFile("plano.pdf", b"conteudo", content_type="application/pdf")
        DocumentoTCC.objects.create(
            tcc=self.tcc,
            tipo_documento=TipoDocumento.PLANO_DESENVOLVIMENTO,
            arquivo=arquivo,
            enviado_por=self.aluno
        )

        arquivo2 = SimpleUploadedFile("termo.pdf", b"conteudo 2", content_type="application/pdf")
        DocumentoTCC.objects.create(
            tcc=self.tcc,
            tipo_documento=TipoDocumento.TERMO_ACEITE,
            arquivo=arquivo2,
            enviado_por=self.aluno
        )

        # Listar solicitações pendentes
        client = APIClient()
        client.force_authenticate(user=self.coordenador)

        response = client.get('/api/solicitacoes/pendentes/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

        # Verificar que documentos estão presentes
        documentos = response.data[0]['documentos']
        self.assertEqual(len(documentos), 2)

        # Verificar estrutura dos documentos
        for doc in documentos:
            self.assertIn('tipo', doc)
            self.assertIn('tipo_display', doc)
            self.assertIn('nome_original', doc)
            self.assertIn('versao', doc)
            self.assertIn('url', doc)
            self.assertIn('criado_em', doc)
