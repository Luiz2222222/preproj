# Checklist Backend 1 - Cadastros ✓

## Status: CONCLUÍDO

Todas as tarefas solicitadas foram implementadas com sucesso.

---

## ✅ Tarefas Implementadas

### 1. Projeto Django/DRF criado
- ✓ Projeto `portal_tcc` criado
- ✓ App `users` criado e configurado
- ✓ Estrutura seguindo documentos de planejamento

### 2. Cadastro de Aluno
- ✓ Endpoint: `POST /api/auth/registro/aluno/`
- ✓ Campos obrigatórios: nome_completo, email, curso, codigo_cadastro, senha, confirmar_senha
- ✓ Validação de código de cadastro implementada
- ✓ Validação de confirmação de senha
- ✓ Validação de força de senha (Django password validators)

### 3. Cadastro de Professor
- ✓ Endpoint: `POST /api/auth/registro/professor/`
- ✓ Campos: nome_completo, email, tratamento, departamento, codigo_cadastro, senha, confirmar_senha
- ✓ Criação automática de PerfilProfessor ao registrar
- ✓ Validações implementadas

### 4. Cadastro de Avaliador Externo
- ✓ Endpoint: `POST /api/auth/registro/avaliador/`
- ✓ Campos: nome_completo, email, tratamento, afiliacao, codigo_cadastro, senha, confirmar_senha
- ✓ Validações implementadas

### 5. Coordenador via Admin
- ✓ Coordenador só pode ser criado via painel admin
- ✓ Campos configurados no admin: nome_completo, email, tratamento, departamento, senha
- ✓ Sem endpoint público de cadastro

### 6. Usuário Administrador Padrão
- ✓ Management command `setup_initial_data` criado
- ✓ Credenciais: `admin` / `senhaesenha`
- ✓ Execução automática cria admin e códigos padrão

### 7. Modelo CodigoCadastro
- ✓ Modelo criado com campos: tipo, codigo, atualizado_em, atualizado_por
- ✓ Códigos únicos persistidos: ALUNO2025, PROF2025, AVAL2025
- ✓ Sem validade automática (conforme especificado)

### 8. API de Gerenciamento de Códigos
- ✓ Endpoint protegido: `GET/PUT /api/config/codigos/`
- ✓ Permissão apenas para coordenadores (IsCoordenador)
- ✓ Registro automático de quem atualizou o código

### 9. Validação de Código nos Registros
- ✓ Todos os endpoints de registro validam código antes de criar usuário
- ✓ Validação por tipo (ALUNO, PROFESSOR, AVALIADOR)
- ✓ Mensagens de erro claras

### 10. Testes Básicos
- ✓ Testes de registro com código válido
- ✓ Testes de validação de código inválido
- ✓ Testes de confirmação de senha
- ✓ Testes de duplicidade de email
- ✓ Testes do modelo CodigoCadastro
- ✓ **8 testes passando com sucesso**

### 11. Porta 8111
- ✓ Servidor configurado para rodar na porta 8111
- ✓ Script `run_server.py` criado para facilitar execução
- ✓ Comando: `python manage.py runserver 8111`

---

## 📁 Arquivos Criados/Modificados

### Models
- `users/models.py` - Usuario, PerfilProfessor, CodigoCadastro

### Serializers
- `users/serializers.py` - RegistroAlunoSerializer, RegistroProfessorSerializer, RegistroAvaliadorSerializer, CodigoCadastroSerializer

### Views
- `users/views.py` - RegistroAlunoView, RegistroProfessorView, RegistroAvaliadorView, CodigoCadastroViewSet

### URLs
- `users/urls.py` - Rotas de autenticação e registro
- `portal_tcc/urls.py` - Configuração principal

### Admin
- `users/admin.py` - UsuarioAdmin, PerfilProfessorAdmin, CodigoCadastroAdmin

### Management Commands
- `users/management/commands/setup_initial_data.py` - Setup inicial

### Testes
- `users/tests.py` - 8 testes automatizados

### Configuração
- `portal_tcc/settings.py` - Configuração completa (JWT, CORS, REST Framework)
- `.env.example` - Template de variáveis de ambiente
- `requirements.txt` - Dependências do projeto

### Documentação
- `README.md` - Instruções completas de uso
- `.gitignore` - Arquivos ignorados pelo git
- `run_server.py` - Script para executar servidor

---

## 🔧 Configurações Importantes

### JWT
- Access token: 60 minutos
- Refresh token: 7 dias
- Rotação automática de tokens

### CORS
- Frontend configurado para porta 5400
- Credenciais habilitadas

### Internacionalização
- Idioma: pt-br
- Timezone: America/Recife

---

## 🧪 Testes Executados

```bash
$ python manage.py test users
Found 8 test(s).
........
Ran 8 tests in 1.181s
OK
```

Todos os testes passaram com sucesso!

---

## 🚀 Como Executar

```bash
# 1. Ativar ambiente virtual
.\venv\Scripts\activate

# 2. Aplicar migrations
python manage.py migrate

# 3. Criar admin e códigos
python manage.py setup_initial_data

# 4. Executar servidor
python manage.py runserver 8111
```

---

## 📊 Endpoints Disponíveis

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/api/auth/login/` | Login (JWT) | Não |
| POST | `/api/auth/refresh/` | Refresh token | Não |
| POST | `/api/auth/registro/aluno/` | Cadastrar aluno | Não |
| POST | `/api/auth/registro/professor/` | Cadastrar professor | Não |
| POST | `/api/auth/registro/avaliador/` | Cadastrar avaliador | Não |
| GET | `/api/config/codigos/` | Listar códigos | Coordenador |
| PUT/PATCH | `/api/config/codigos/{id}/` | Atualizar código | Coordenador |

---

## ✨ Funcionalidades Extras Implementadas

Além do solicitado, também foram implementados:

1. **PerfilProfessor** - Criado automaticamente ao registrar professor
2. **Validação de força de senha** - Usando Django password validators
3. **Tratamento de erros** - Mensagens claras em português
4. **Documentação completa** - README detalhado
5. **Admin customizado** - Interface administrativa configurada
6. **Testes abrangentes** - Cobertura dos casos principais

---

## 🎯 Próximos Passos (Sprint 2)

Conforme planejamento, as próximas tarefas seriam:

1. Implementar autenticação completa (login, logout, perfil)
2. Criar endpoints para professores disponíveis
3. Iniciar app de TCCs
4. Implementar solicitação de orientação

---

**Status Final:** ✅ TODAS AS TAREFAS CONCLUÍDAS COM SUCESSO

O backend está pronto, testado e documentado. Rodando na porta 8111 conforme especificado.

---

# Sistema de Calendário e Controle de Prazos ✓

## Status: CONCLUÍDO

Sistema completo de controle de prazos acadêmicos com liberações manuais implementado.

---

## ✅ Tarefas Implementadas

### 1. Modelo CalendarioSemestre
- ✓ Modelo criado em `definicoes/models.py`
- ✓ Campos: semestre, inicio_periodo_letivo, envio_documentos_fim, avaliacao_continuidade_fim, submissao_monografia_fim, avaliacao_fase1_inicio/fim, defesas_inicio/fim, ajustes_finais_fim
- ✓ Campo `ativo` para ativar/desativar calendários
- ✓ Auditoria: atualizado_em, atualizado_por
- ✓ Método classmethod `obter_calendario_atual(semestre=None)` para buscar calendário ativo

### 2. Campos de Liberação no TCC
- ✓ Adicionados 6 campos booleanos no modelo TCC:
  - `liberar_envio_documentos` - Libera envio de documentos iniciais
  - `liberar_desenvolvimento` - Libera fase de desenvolvimento
  - `liberar_continuidade` - Libera confirmação de continuidade
  - `liberar_fase1` - Libera Avaliação Fase I
  - `liberar_defesas` - Libera Período de Defesas
  - `liberar_ajustes_finais` - Libera Ajustes Finais
- ✓ Campos de auditoria: liberacoes_atualizadas_em, liberacoes_atualizadas_por

### 3. Serializers e ViewSets
- ✓ `CalendarioSemestreSerializer` criado em `definicoes/serializers.py`
- ✓ `CalendarioSemestreViewSet` criado em `definicoes/views.py`
- ✓ Permissão `IsCoordenadorOrReadOnly` - leitura para todos, escrita só coordenador
- ✓ Action customizada `/atual/` para retornar calendário ativo
- ✓ Rotas registradas em `users/urls.py`: `/api/config/calendario/`

### 4. Serviço de Cálculo de Permissões
- ✓ Arquivo `tccs/services.py` criado
- ✓ Função `obter_calendario_para_tcc(tcc)` - busca calendário do semestre
- ✓ Função `calcular_permissoes_tcc(tcc)` - calcula permissões baseadas em:
  - Prazos do calendário acadêmico
  - Liberações manuais por TCC (flags booleanas)
  - Data atual
- ✓ Retorna dict com permissões: `pode_enviar_documentos_iniciais`, `pode_enviar_monografia`, `pode_solicitar_avaliacao`, `pode_confirmar_continuidade`, `pode_editar_fase1`, `pode_registrar_defesa`, `pode_enviar_ajustes`

### 5. Integração no TCCSerializer
- ✓ Campo `permissoes` adicionado (SerializerMethodField)
- ✓ Campo `calendario_semestre` adicionado (SerializerMethodField)
- ✓ Frontend recebe automaticamente as permissões calculadas e calendário

### 6. Validações de Prazo nas Views
- ✓ **criar_com_solicitacao** (tccs/views.py:135-143): Valida prazo de envio de documentos
- ✓ **confirmar_continuidade** (tccs/views.py:407-413): Valida prazo de confirmação de continuidade
- ✓ **enviar_termo_avaliacao** (tccs/views.py:481-487): Valida prazo de solicitação de avaliação
- ✓ **DocumentoTCCViewSet.perform_create** (tccs/views.py:912-927): Valida prazos baseados no tipo de documento
  - Documentos iniciais: valida `pode_enviar_documentos_iniciais`
  - Monografia: valida `pode_enviar_monografia`
  - Coordenador bypassa validações

### 7. Setup Inicial
- ✓ `setup_initial_data.py` atualizado para criar calendário padrão
- ✓ Calendário criado automaticamente no semestre atual
- ✓ Datas calculadas com timedelta a partir de hoje:
  - 30 dias: documentos iniciais
  - 120 dias: monografia
  - 150 dias: continuidade
  - 160-180 dias: fase I
  - 190-210 dias: defesas
  - 240 dias: ajustes finais

### 8. Migrations
- ✓ Migration `definicoes/0003_calendariosemestre.py` criada
- ✓ Migration `tccs/0004_tcc_liberacoes_atualizadas_em_and_more.py` criada
- ✓ Todas as migrations aplicadas com sucesso

### 9. Admin
- ✓ CalendarioSemestre registrado no admin com fieldsets organizados
- ✓ Campos de auditoria exibidos como readonly

---

## 📁 Arquivos Criados/Modificados

### Models
- `definicoes/models.py` - CalendarioSemestre
- `tccs/models.py` - Campos de liberação adicionados ao TCC

### Serializers
- `definicoes/serializers.py` - CalendarioSemestreSerializer
- `tccs/serializers.py` - Campos permissoes e calendario_semestre adicionados

### Views
- `definicoes/views.py` - CalendarioSemestreViewSet, IsCoordenadorOrReadOnly
- `tccs/views.py` - Validações de prazo adicionadas em 4 métodos

### Services
- `tccs/services.py` - Lógica de cálculo de permissões

### Admin
- `definicoes/admin.py` - CalendarioSemestreAdmin

### URLs
- `users/urls.py` - Rotas de calendário registradas

### Management Commands
- `users/management/commands/setup_initial_data.py` - Criação de calendário padrão

### Migrations
- `definicoes/migrations/0003_calendariosemestre.py`
- `tccs/migrations/0004_tcc_liberacoes_atualizadas_em_and_more.py`

---

## 🔧 Como Funciona

### Regra de Validação
Para cada ação, o sistema verifica nesta ordem:

1. **Liberação Manual**: Se o TCC tem liberação manual para a fase (`liberar_*` = True), permite
2. **Sem Calendário**: Se não existe calendário configurado, permite
3. **Prazo do Calendário**: Compara data atual com prazo do calendário

### Exemplo de Fluxo

```python
# Aluno tenta enviar monografia
permissoes = calcular_permissoes_tcc(tcc)

if tcc.liberar_desenvolvimento:
    return True  # Liberação manual
elif not calendario or not calendario.submissao_monografia_fim:
    return True  # Sem calendário configurado
else:
    return hoje <= calendario.submissao_monografia_fim  # Verifica prazo
```

### Coordenador Bypass
- Coordenador pode enviar documentos a qualquer momento
- Coordenador pode conceder liberações manuais por TCC
- Coordenador gerencia calendários acadêmicos

---

## 📊 Endpoints Adicionados

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/api/config/calendario/` | Listar calendários | Autenticado |
| GET | `/api/config/calendario/atual/` | Calendário ativo | Autenticado |
| GET | `/api/config/calendario/{id}/` | Detalhes calendário | Autenticado |
| PUT/PATCH | `/api/config/calendario/{id}/` | Atualizar calendário | Coordenador |

---

## 🎯 Benefícios Implementados

1. **Controle Fino de Prazos**: Cada fase do TCC tem prazo configurável
2. **Flexibilidade**: Coordenador pode liberar manualmente casos excepcionais
3. **Auditoria**: Registra quem e quando fez liberações
4. **Transparência**: Frontend recebe permissões calculadas automaticamente
5. **Validação em Múltiplas Camadas**:
   - Backend valida nas views (segurança)
   - Frontend recebe permissões para UI (UX)
6. **Sem Calendário = Sem Restrições**: Sistema funciona mesmo sem calendário configurado

---

**Status:** ✅ SISTEMA DE PRAZOS IMPLEMENTADO E TESTADO

Todas as validações estão funcionando. Migrations aplicadas. Pronto para uso.
