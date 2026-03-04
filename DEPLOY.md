# Deploy em Produção (Docker)

## Arquitetura
- `backend` (Django + Gunicorn)
- `frontend` (React/Vite build estático em Nginx)
- `nginx` (reverse proxy)
- `db` (PostgreSQL)

## 1. Preparar variáveis
```bash
cp .env.prod.example .env.prod
```
Ajuste pelo menos:
- `SECRET_KEY`
- `ALLOWED_HOSTS`
- `DB_PASSWORD`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `BACKEND_EXTERNAL_PORT`
- `FRONTEND_EXTERNAL_PORT`

## 2. Subir stack
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## 3. Logs
```bash
docker compose -f docker-compose.prod.yml logs -f backend nginx
```

## 4. Atualização
```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## Observações
- Migrations e `collectstatic` são executados automaticamente no `entrypoint` do backend.
- Frontend usa `/api` e `/media` em produção (mesmo domínio), evitando CORS complexo.
- Para HTTPS, coloque um terminador TLS (Nginx com certbot, Caddy ou proxy da sua plataforma).
- Exposição externa direta:
  - backend: `http://IP_DO_SERVIDOR:${BACKEND_EXTERNAL_PORT}`
  - frontend: `http://IP_DO_SERVIDOR:${FRONTEND_EXTERNAL_PORT}`
  - proxy unificado: `http://IP_DO_SERVIDOR` (porta 80)
