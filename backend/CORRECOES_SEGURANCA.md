# Correções de Segurança - Checklist 07

## Problemas Identificados e Corrigidos

### ✅ HIGH - Permissões de Solicitação (RESOLVIDO)

**Problema:** POST /api/solicitacoes/ aceitava qualquer usuário autenticado criar solicitações em nome de qualquer TCC.

**Correção:** Adicionado `perform_create()` em `SolicitacaoOrientacaoViewSet` (views.py:156-170) que:
- Valida que apenas ALUNO pode criar solicitações
- Valida que o TCC pertence ao aluno logado
- Levanta PermissionDenied se validações falharem

**Arquivo:** `backend/tccs/views.py`

---

### ✅ HIGH - Permissões de Documento (RESOLVIDO)

**Problema:** POST /api/documentos/ permitia qualquer autenticado enviar arquivos para TCCs alheios.

**Correção:** Atualizado `perform_create()` em `DocumentoTCCViewSet` (views.py:359-378) que:
- Valida relação do usuário com o TCC antes de permitir upload
- Coordenador: acesso total
- Aluno: apenas seu próprio TCC
- Professor: apenas TCCs onde é orientador/coorientador
- Levanta PermissionDenied se não tiver permissão

**Arquivo:** `backend/tccs/views.py`

---

### ✅ MEDIUM - Lógica Duplicada em /api/tccs/meu/ (RESOLVIDO)

**Problema:** O elif `usuario.tipo_usuario in ['PROFESSOR', 'COORDENADOR']` capturava coordenador antes do bloco específico, impedindo retorno de todos os TCCs.

**Correção:** Reordenado os blocos condicionais (views.py:55-85):
1. ALUNO primeiro
2. COORDENADOR segundo (retorna todos)
3. PROFESSOR terceiro (retorna orientandos)

**Arquivo:** `backend/tccs/views.py`

---

### ✅ MEDIUM - Rotas Aninhadas (IMPLEMENTADO)

**Problema:** Checklist previa rotas aninhadas mas apenas endpoints planos estavam expostos.

**Correção:** Implementadas 3 actions aninhadas em `TCCViewSet`:

1. **POST /api/tccs/{id}/solicitacoes/** (views.py:148-214)
   - Cria solicitação de orientação para TCC específico
   - Valida que aluno é dono do TCC
   - Valida que não existe solicitação pendente
   - Cria evento na timeline

2. **GET/POST /api/tccs/{id}/documentos/** (views.py:216-267)
   - GET: lista documentos do TCC
   - POST: upload de documento para o TCC
   - Validações de permissão integradas
   - Cria evento de upload

3. **GET /api/tccs/{id}/timeline/** (views.py:269-301)
   - Retorna eventos do TCC
   - Filtra por visibilidade conforme tipo de usuário
   - Coordenador vê tudo
   - Aluno vê apenas eventos TODOS
   - Orientador vê TODOS + ORIENTADOR_COORDENADOR

**Arquivo:** `backend/tccs/views.py`

---

## Validação

**Testes:** Todos os 11 testes continuam passando ✅

```bash
$ python manage.py test tccs
Ran 11 tests in 8.939s
OK
```

---

## Documentação Atualizada

- README.md atualizado com rotas aninhadas
- Matriz de permissões mantida consistente
- Exemplos de uso documentados

---

## Resumo das Mudanças

| Arquivo | Linhas Modificadas | Tipo |
|---------|-------------------|------|
| tccs/views.py | 156-170 | Validação de permissão |
| tccs/views.py | 359-378 | Validação de permissão |
| tccs/views.py | 55-85 | Correção de lógica |
| tccs/views.py | 148-301 | Novas rotas aninhadas |
| README.md | 154-158 | Documentação |

---

**Data:** 2025-10-05
**Status:** ✅ TODAS AS CORREÇÕES APLICADAS E TESTADAS
