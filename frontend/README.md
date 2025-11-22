# Frontend - Portal TCC

Sistema de gerenciamento de Trabalhos de Conclusão de Curso (TCC) para alunos, professores e coordenação.

## Requisitos

- Node.js 18 ou superior
- npm ou yarn
- Backend rodando em `http://localhost:8111` (ou configurado via .env)

## Instalação

```bash
npm install
```

## Configuração

### Arquivo .env

Copie o arquivo `.env.example` para `.env` e ajuste as variáveis conforme necessário:

```bash
cp .env.example .env
```

Variáveis disponíveis:

- `VITE_API_BASE_URL`: URL base da API (padrão: `http://localhost:8111/api`)
- `VITE_MEDIA_URL`: URL base para arquivos de mídia (padrão: `http://localhost:8111/media`)

### Configuração da API

O frontend usa Axios com interceptors para:
- Adicionar automaticamente o token JWT em todas as requisições
- Renovar tokens expirados usando refresh token
- Redirecionar para login quando a sessão expirar

A configuração está em `src/servicos/api.ts`.

## Desenvolvimento

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5400`.

## Build

Gere a versão de produção:

```bash
npm run build
```

Os arquivos otimizados serão gerados em `dist/`.

## Testes

### Executar todos os testes

```bash
npm run test
```

### Executar testes em modo watch

```bash
npm run test -- --watch
```

### Executar testes com coverage

```bash
npm run test -- --coverage
```

### Estrutura de testes

- `src/hooks/*.test.ts`: Testes unitários dos hooks customizados
- `src/test/validacoes.test.ts`: Testes de validação de formulários
- `src/test/setup.ts`: Configuração global dos testes (mocks, cleanup)
- `vitest.config.ts`: Configuração do Vitest

Os testes utilizam:
- **Vitest**: Test runner e assertions
- **@testing-library/react**: Testes de componentes e hooks
- **jsdom**: Ambiente de navegador simulado

## Estrutura do Projeto

```
src/
├── autenticacao/          # Contexto e hooks de autenticação
│   ├── ProvedorAutenticacao.tsx
│   └── useAutenticacao.ts
├── componentes/           # Componentes reutilizáveis
│   ├── Alerta.tsx
│   ├── Badge.tsx         # Badges de status (novo, pendente, aprovado, etc.)
│   ├── Botao.tsx
│   ├── CampoTexto.tsx
│   ├── Cartao.tsx
│   ├── Modal.tsx
│   ├── Skeleton.tsx      # Loading states (text, circular, rectangular)
│   └── Tipografia.tsx
├── estrutura/             # Layout e estrutura base
│   ├── EstruturaApp.tsx
│   ├── MenuAluno.tsx
│   ├── MenuCoordenacao.tsx
│   └── MenuProfessor.tsx
├── hooks/                 # Custom React hooks
│   ├── useDocumentosTCC.ts      # Gerenciamento de documentos
│   ├── useMeuTCC.ts             # Dados do TCC do aluno
│   └── useTimelineTCC.ts        # Timeline de eventos
├── paginas/               # Páginas da aplicação
│   ├── aluno/
│   │   ├── DashboardAluno.tsx   # Dashboard com resumo e próximos prazos
│   │   ├── Documentos.tsx       # Upload e listagem de documentos (com filtros)
│   │   ├── Informacoes.tsx      # Regulamento e informações
│   │   ├── IniciarTCC.tsx       # Formulário de solicitação inicial
│   │   └── MeuTCC.tsx           # Detalhes do TCC e timeline
│   ├── coordenacao/
│   │   └── DashboardCoordenacao.tsx
│   ├── professor/
│   │   └── DashboardProfessor.tsx
│   ├── PaginaLogin.tsx
│   └── PaginaNaoEncontrada.tsx
├── servicos/              # Serviços e utilitários
│   └── api.ts            # Configuração Axios com interceptors JWT
├── tema/                  # Tema e tokens de design
│   ├── ProvedorTema.tsx
│   └── useTema.ts
├── test/                  # Configuração e mocks de testes
│   ├── mocks/
│   │   └── mockData.ts   # Dados mockados para testes
│   ├── setup.ts          # Setup global do Vitest
│   └── validacoes.test.ts
├── types/                 # TypeScript types e interfaces
│   ├── enums.ts          # Enums (TipoDocumento, StatusDocumento, EtapaTCC, etc.)
│   ├── index.ts
│   ├── solicitacao.ts
│   └── tcc.ts
├── App.tsx               # Componente raiz com rotas
└── main.tsx              # Entry point
```

## Funcionalidades Implementadas

### Aluno

- **Dashboard**: Resumo do TCC, próximos prazos e ações rápidas
- **Iniciar TCC**: Formulário para solicitar orientação
- **Meu TCC**: Detalhes do TCC, timeline de eventos e status
- **Documentos**: Upload, listagem e filtros por tipo/status
- **Informações**: Regulamento e prazos importantes

### Professor

- **Dashboard**: Visão geral de solicitações e orientações

### Coordenação

- **Dashboard**: Gerenciamento geral do sistema

## Tecnologias

- **React 19**: Biblioteca UI
- **TypeScript**: Tipagem estática
- **Vite**: Build tool e dev server
- **React Router 7**: Roteamento
- **Axios**: Cliente HTTP com interceptors JWT
- **Tailwind CSS**: Estilização
- **Lucide React**: Ícones
- **Vitest**: Testes unitários
- **@testing-library/react**: Testes de componentes

## Autenticação e Autorização

### Fluxo de autenticação

1. Usuário acessa `/login` e preenche email e senha
2. POST para `/api/auth/login/` retorna tokens JWT
3. Tokens são salvos no localStorage:
   - `tokenAcesso`: JWT access token
   - `tokenAtualizacao`: JWT refresh token
4. Todas as requisições incluem o token no header `Authorization: Bearer {token}`
5. Quando o token expira, o interceptor tenta renová-lo automaticamente
6. Se a renovação falhar, usuário é redirecionado para login

### Proteção de rotas

As rotas são protegidas por tipo de usuário:
- `/aluno/*`: Apenas alunos autenticados
- `/professor/*`: Apenas professores autenticados
- `/coordenacao/*`: Apenas coordenação autenticada

## Enums e Tipos

O sistema usa enums alinhados com o backend Django:

- **TipoDocumento**: PLANO_DESENVOLVIMENTO, TERMO_ACEITE, MONOGRAFIA, APRESENTACAO, ATA, OUTRO
- **StatusDocumento**: PENDENTE, EM_ANALISE, APROVADO, REJEITADO
- **EtapaTCC**: INICIALIZACAO, DESENVOLVIMENTO, FORMACAO_BANCA_FASE_1, etc. (13 etapas)
- **TipoEvento**: SOLICITACAO_ENVIADA, UPLOAD_DOCUMENTO, APROVACAO_DOCUMENTO, etc. (18 eventos)
- **StatusSolicitacao**: PENDENTE, ACEITA, RECUSADA

Todos os enums estão definidos em `src/types/enums.ts` e sincronizados com `backend/tccs/constants.py`.

## Tema e Design System

O sistema suporta:
- **Temas**: Claro e escuro
- **Tamanhos de fonte**: Pequeno, médio, grande

As preferências são salvas no localStorage e sincronizadas com o backend (quando implementado).

Consulte `../docs/design-system.md` para tokens de cores e tipografia.

## Troubleshooting

### Erro de CORS

Se encontrar erros de CORS, verifique:
1. Backend está rodando em `http://localhost:8111`
2. CORS está configurado no Django (`settings.py`)
3. `.env` aponta para a URL correta

### Erro 401 Unauthorized

1. Verifique se o token está salvo no localStorage
2. Tente fazer logout e login novamente
3. Verifique se o backend está rejeitando o token

### Testes falhando

1. Certifique-se de que todos os mocks estão configurados corretamente
2. Verifique `src/test/setup.ts` para mocks globais
3. Use `vi.mock()` antes de importar módulos nos testes

## Contribuindo

1. Crie uma branch para sua feature: `git checkout -b feature/nome-da-feature`
2. Faça commit das mudanças: `git commit -m 'Adiciona nova feature'`
3. Execute os testes: `npm run test`
4. Push para a branch: `git push origin feature/nome-da-feature`
5. Abra um Pull Request

## Licença

Este projeto é desenvolvido como Trabalho de Conclusão de Curso.
