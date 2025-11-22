from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Usuario
from definicoes.models import CodigoCadastro


class RegistroAlunoTests(APITestCase):
    """Testes para registro de alunos."""

    def setUp(self):
        CodigoCadastro.objects.create(tipo='ALUNO', codigo='ALUNO2025')

    def test_registro_aluno_sucesso(self):
        data = {
            'nome_completo': 'Joao Silva',
            'email': 'joao@example.com',
            'curso': 'ENGENHARIA_ELETRICA',
            'codigo_cadastro': 'ALUNO2025',
            'senha': 'senhaForte123!',
            'confirmar_senha': 'senhaForte123!'
        }
        response = self.client.post('/api/auth/registro/aluno/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Usuario.objects.filter(email='joao@example.com').exists())

    def test_registro_codigo_invalido(self):
        data = {
            'nome_completo': 'Maria Santos',
            'email': 'maria@example.com',
            'curso': 'ENGENHARIA_ELETRICA',
            'codigo_cadastro': 'CODIGO_ERRADO',
            'senha': 'senhaForte123!',
            'confirmar_senha': 'senhaForte123!'
        }
        response = self.client.post('/api/auth/registro/aluno/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('codigo_cadastro', response.data)

    def test_registro_senhas_diferentes(self):
        data = {
            'nome_completo': 'Pedro Oliveira',
            'email': 'pedro@example.com',
            'curso': 'ENGENHARIA_ELETRICA',
            'codigo_cadastro': 'ALUNO2025',
            'senha': 'senhaForte123!',
            'confirmar_senha': 'senhaDiferente123!'
        }
        response = self.client.post('/api/auth/registro/aluno/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('confirmar_senha', response.data)

    def test_registro_email_duplicado(self):
        Usuario.objects.create_user(
            email='duplicado@example.com',
            password='senha123',
            nome_completo='Usuario Existente',
            tipo_usuario='ALUNO',
            curso='ENGENHARIA_ELETRICA'
        )

        data = {
            'nome_completo': 'Novo Usuario',
            'email': 'duplicado@example.com',
            'curso': 'ENGENHARIA_ELETRICA',
            'codigo_cadastro': 'ALUNO2025',
            'senha': 'senhaForte123!',
            'confirmar_senha': 'senhaForte123!'
        }
        response = self.client.post('/api/auth/registro/aluno/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class RegistroProfessorTests(APITestCase):
    """Testes para registro de professores."""

    def setUp(self):
        CodigoCadastro.objects.create(tipo='PROFESSOR', codigo='PROF2025')

    def test_registro_professor_sucesso(self):
        data = {
            'nome_completo': 'Dr. Carlos Pereira',
            'email': 'carlos@example.com',
            'tratamento': 'Dr.',
            'departamento': 'Departamento de Engenharia Elétrica',
            'codigo_cadastro': 'PROF2025',
            'senha': 'senhaForte123!',
            'confirmar_senha': 'senhaForte123!'
        }
        response = self.client.post('/api/auth/registro/professor/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        usuario = Usuario.objects.get(email='carlos@example.com')
        self.assertEqual(usuario.tipo_usuario, 'PROFESSOR')
        self.assertEqual(usuario.departamento, 'Departamento de Engenharia Elétrica')


class CodigoCadastroTests(TestCase):
    """Testes para o modelo CodigoCadastro."""

    def test_validar_codigo_correto(self):
        CodigoCadastro.objects.create(tipo='ALUNO', codigo='TESTE123')
        self.assertTrue(CodigoCadastro.validar_codigo('ALUNO', 'TESTE123'))

    def test_validar_codigo_incorreto(self):
        CodigoCadastro.objects.create(tipo='ALUNO', codigo='TESTE123')
        self.assertFalse(CodigoCadastro.validar_codigo('ALUNO', 'ERRADO'))

    def test_validar_codigo_inexistente(self):
        self.assertFalse(CodigoCadastro.validar_codigo('ALUNO', 'QUALQUER'))


class ListarProfessoresTests(APITestCase):
    """Testes para endpoint de listagem de professores."""

    def setUp(self):
        # Criar usuario aluno para autenticacao
        self.aluno = Usuario.objects.create_user(
            email='aluno@example.com',
            password='senha123',
            nome_completo='Aluno Teste',
            tipo_usuario='ALUNO',
            curso='ENGENHARIA_ELETRICA'
        )

        # Criar professores
        self.prof1 = Usuario.objects.create_user(
            email='prof1@example.com',
            password='senha123',
            nome_completo='Prof. Ana Silva',
            tipo_usuario='PROFESSOR',
            tratamento='Prof. Dr.',
            departamento='Departamento de Engenharia Elétrica'
        )

        self.prof2 = Usuario.objects.create_user(
            email='prof2@example.com',
            password='senha123',
            nome_completo='Prof. Carlos Santos',
            tipo_usuario='PROFESSOR',
            tratamento='Prof. Ms.',
            departamento='Departamento de Controle e Automação'
        )

    def test_listar_professores_autenticado(self):
        """Testa que usuario autenticado pode listar professores."""
        self.client.force_authenticate(user=self.aluno)
        response = self.client.get('/api/professores/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Dois professores cadastrados

    def test_listar_professores_campos_corretos(self):
        """Testa que os campos retornados estao corretos."""
        self.client.force_authenticate(user=self.aluno)
        response = self.client.get('/api/professores/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        prof_data = response.data[0]

        # Verificar que os campos necessarios estao presentes
        self.assertIn('id', prof_data)
        self.assertIn('nome_completo', prof_data)
        self.assertIn('email', prof_data)
        self.assertIn('tratamento', prof_data)
        self.assertIn('tratamento_customizado', prof_data)
        self.assertIn('departamento', prof_data)

    def test_listar_professores_nao_autenticado(self):
        """Testa que usuario nao autenticado nao pode listar professores."""
        response = self.client.get('/api/professores/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
