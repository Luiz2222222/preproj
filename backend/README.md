# Portal TCC - Backend

Backend do Portal TCC desenvolvido com Django REST Framework.

## Configuração Inicial

### 1. Ativar ambiente virtual e instalar dependências

```bash
# Windows
.\venv\Scripts\activate
pip install -r requirements.txt

# Linux/Mac
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Criar banco de dados e executar migrations

```bash
python manage.py migrate
```

### 3. Criar usuário administrador e códigos de cadastro

```bash
python manage.py setup_initial_data
```

**Credenciais do administrador:**
- Email: `admin`
- Senha: `senhaesenha`

**Códigos de cadastro padrão:**
- Aluno: `ALUNO2025`
- Professor: `PROF2025`
- Avaliador: `AVAL2025`

### 4. Executar servidor na porta 8111

```bash
python manage.py runserver 8111
```

Ou usando o script:

```bash
python run_server.py
```

## Endpoints Disponíveis

### Autenticação

- **POST** `/api/auth/login/` - Login (retorna access e refresh tokens)
- **POST** `/api/auth/refresh/` - Renovar access token

### Cadastro de Usuários

- **POST** `/api/auth/registro/aluno/` - Cadastro de aluno
- **POST** `/api/auth/registro/professor/` - Cadastro de professor
- **POST** `/api/auth/registro/avaliador/` - Cadastro de avaliador externo

### Gerenciamento de Códigos (Coordenador apenas)

- **GET** `/api/config/codigos/` - Listar códigos de cadastro
- **PUT/PATCH** `/api/config/codigos/{id}/` - Atualizar código

## Exemplos de Uso

### Cadastrar Aluno

```bash
curl -X POST http://localhost:8111/api/auth/registro/aluno/ \
  -H "Content-Type: application/json" \
  -d '{
    "nome_completo": "João Silva",
    "email": "joao@example.com",
    "curso": "ENGENHARIA_ELETRICA",
    "codigo_cadastro": "ALUNO2025",
    "senha": "senhaForte123!",
    "confirmar_senha": "senhaForte123!"
  }'
```

### Fazer Login

```bash
curl -X POST http://localhost:8111/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senhaForte123!"
  }'
```

### Listar Códigos (como coordenador)

```bash
curl -X GET http://localhost:8111/api/config/codigos/ \
  -H "Authorization: Bearer {seu_access_token}"
```

## Executar Testes

```bash
python manage.py test users
```

## Acessar Admin

http://localhost:8111/admin/

Use as credenciais do administrador para acessar o painel.

## Estrutura do Projeto

```
backend/
├── portal_tcc/          # Configurações do projeto
│   ├── settings.py
│   └── urls.py
├── users/               # App de usuários
│   ├── models.py        # Usuario, PerfilProfessor, CodigoCadastro
│   ├── serializers.py   # Serializers para API
│   ├── views.py         # Views da API
│   ├── admin.py         # Configuração do admin
│   └── tests.py         # Testes automatizados
├── manage.py
├── run_server.py        # Script para rodar na porta 8111
└── requirements.txt
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do backend:

```
SECRET_KEY=sua-chave-secreta-aqui
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Endpoints do Módulo TCCs

### TCCs

- **GET** `/api/tccs/meu/` - Retorna TCC do aluno ou lista de orientandos do professor
- **POST** `/api/tccs/criar_com_solicitacao/` - Cria TCC e envia solicitação de orientação (apenas aluno)
- **GET** `/api/tccs/{id}/` - Detalhes do TCC
- **GET** `/api/tccs/` - Lista TCCs (filtrado por permissão)

**Rotas Aninhadas:**
- **POST** `/api/tccs/{id}/solicitacoes/` - Cria solicitação de orientação para este TCC
- **GET** `/api/tccs/{id}/documentos/` - Lista documentos deste TCC
- **POST** `/api/tccs/{id}/documentos/` - Upload de documento para este TCC
- **GET** `/api/tccs/{id}/timeline/` - Timeline de eventos deste TCC

### Solicitacoes de Orientacao

- **GET** `/api/solicitacoes/pendentes/` - Solicitacoes pendentes (coordenador ve todas; professor ve apenas as enviadas a ele)
- **POST** `/api/solicitacoes/{id}/aceitar/` - Coordenador aprova solicitacao (apenas coordenador)
- **POST** `/api/solicitacoes/{id}/recusar/` - Coordenador recusa solicitacao (apenas coordenador)
- **DELETE** `/api/solicitacoes/{id}/cancelar/` - Aluno cancela solicitacao pendente
- **GET** `/api/solicitacoes/` - Lista solicitacoes (filtrado por permissao)

### Documentos

- **GET** `/api/documentos/` - Lista documentos do TCC
- **POST** `/api/documentos/` - Upload de documento (Monografia: Word .doc/.docx; Outros: PDF; max 10MB)
- **GET** `/api/documentos/{id}/` - Detalhes do documento

### Timeline

- **GET** `/api/timeline/` - Lista eventos (filtrado por permissão e visibilidade)
- **GET** `/api/timeline/por_tcc/?tcc_id={id}` - Eventos de um TCC específico

## Regras de Negócio

### TCC

- Aluno pode ter apenas **1 TCC por semestre**
- Etapa inicial: `INICIALIZACAO`
- Orientador/coorientador deve ser PROFESSOR ou COORDENADOR

### Solicitacao de Orientacao

- Apenas **1 solicitacao PENDENTE** por vez
- **Aprovacao/recusa feita exclusivamente pelo COORDENADOR** (nao mais pelo orientador)
- Ao aprovar: TCC → etapa `DESENVOLVIMENTO`, orientador atribuido automaticamente, flags resetadas
- Ao recusar: TCC volta para `INICIALIZACAO`, orientador removido, flags resetadas
- Ao cancelar (aluno): TCC volta para `INICIALIZACAO`, orientador = null, flags resetadas

### Documentos

- **Monografia**: apenas arquivos **Word (.doc, .docx)**
- **Outros tipos** (Termo de Aceite, Apresentação, etc.): apenas arquivos **PDF**
- Tamanho máximo: **10MB**
- Versão incrementada automaticamente por tipo de documento
- Manager `.oficiais()`: retorna apenas documentos com status `APROVADO`

### Timeline

- Eventos criados automaticamente em ações importantes
- 3 níveis de visibilidade:
  - `TODOS`: aluno, orientador, coordenador
  - `ORIENTADOR_COORDENADOR`: orientador e coordenador
  - `COORDENADOR_APENAS`: apenas coordenador

## Matriz de Permissoes

| Recurso | Aluno | Professor | Coordenador |
|---------|-------|-----------|-------------|
| **TCC** | Apenas seus TCCs | TCCs onde e orientador/coorientador | Todos |
| **Solicitacao** | Criar, cancelar suas | Visualizar recebidas (somente leitura) | Ver todas, aprovar/recusar |
| **Documento** | Upload/visualizar seus | Visualizar de orientandos | Todos |
| **Timeline** | Eventos TODOS do seu TCC | Eventos TODOS + ORIENTADOR_COORDENADOR | Todos eventos |

## Testes

```bash
# Rodar testes do modulo TCCs
python manage.py test tccs

# 15 testes implementados cobrindo:
# - Criacao de TCC
# - Validacoes de negocio
# - Solicitacoes de orientacao (aprovacao/recusa por coordenador)
# - Permissoes de professor vs coordenador
# - Documentos e versionamento
# - Timeline e eventos
# - Endpoint de reset (desenvolvimento)
```

## Notas Importantes

- O backend roda na porta **8111**
- O frontend (quando criado) deve rodar na porta **5400**
- Coordenadores só podem ser criados via admin ou management command
- Todos os endpoints (exceto registro e login) exigem autenticação JWT
- Arquivos de upload são salvos em `media/tccs/{tcc_id}/documentos/`
