# 🎓 Portal TCC v2

> Versão melhorada do Portal TCC com autenticação segura (HttpOnly Cookies)

## 🔄 Diferenças da v1

### Autenticação
- ✅ **HttpOnly Cookies** (v1 usava localStorage)
- ✅ **CSRF Protection** (double submit cookie)
- ✅ **Access Token 10min** (v1 era 60min)
- ✅ **Rate Limiting** (proteção brute force)
- ✅ **Checagem `is_active`** (v1 não verificava)
- ✅ **"Lembrar-me" funcional** (v1 não funcionava)

### Segurança
- ✅ Proteção contra XSS
- ✅ Proteção contra CSRF
- ✅ Logging de eventos de segurança
- ✅ Refresh token rotation
- ✅ Token blacklist

## 🚀 Como Rodar

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📖 Documentação

Ver: `GUIA_REFACTOR_AUTENTICACAO_V2.md`

## 🔐 Segurança

Este projeto implementa as melhores práticas de autenticação web moderna:
- HttpOnly Cookies (tokens inacessíveis via JavaScript)
- CSRF protection com double-submit cookie
- Rate limiting em endpoints críticos
- Verificação de usuários ativos
- Tokens de curta duração

## 📝 Status

**Em desenvolvimento** - Aplicando correções de segurança
