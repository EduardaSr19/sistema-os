# Sistema de Ordem de Serviço — Assistência Técnica

Sistema web para gerenciar ordens de serviço de uma assistência técnica de celulares.

## Stack

| Camada    | Tecnologias                                      |
| --------- | ------------------------------------------------ |
| Frontend  | React + Vite, Tailwind CSS, Axios, React Router  |
| Backend   | Node + Express, Prisma ORM, JWT                  |
| Banco     | PostgreSQL                                       |

## Estrutura

```
meu-sistema/
├── backend/        API REST (Express + Prisma)
│   ├── prisma/     schema e seed
│   └── src/
│       ├── controllers/   regras de cada recurso
│       ├── middlewares/    auth JWT + tratamento de erros
│       ├── routes/         definição das rotas
│       ├── lib/            cliente Prisma
│       ├── app.js          configuração do Express
│       └── server.js       inicialização
└── frontend/       SPA (React + Vite)
    └── src/
        ├── api/        instância do Axios + JWT
        ├── components/ Layout, Modal, StatusBadge
        ├── context/    AuthContext
        ├── lib/        config de status da OS
        ├── pages/      Login, Dashboard, Clientes, Ordens
        └── routes/     rota protegida
```

## Pré-requisitos

- Node.js 20+
- PostgreSQL rodando localmente (ou um banco na nuvem)

## Passo a passo

### 1. Banco de dados

Crie um banco no PostgreSQL, por exemplo `ordem_servico`.

### 2. Backend

```bash
cd backend
cp .env.example .env        # ajuste DATABASE_URL e JWT_SECRET
npm install
npx prisma migrate dev --name init   # cria as tabelas
npm run seed                # cria admin@oficina.com / admin123 + dados de exemplo
npm run dev                 # API em http://localhost:3333
```

### 3. Frontend

Em outro terminal:

```bash
cd frontend
cp .env.example .env        # pode deixar VITE_API_URL em branco em dev
npm install
npm run dev                 # app em http://localhost:5173
```

Acesse http://localhost:5173 e entre com **admin@oficina.com** / **admin123**.

## Endpoints principais

| Método | Rota                      | Descrição                       |
| ------ | ------------------------- | ------------------------------- |
| POST   | /api/auth/register        | cria usuário                    |
| POST   | /api/auth/login           | login (retorna token JWT)       |
| GET    | /api/auth/me              | dados do usuário logado         |
| GET    | /api/clientes             | lista clientes (?busca=)        |
| POST   | /api/clientes             | cria cliente                    |
| GET    | /api/ordens               | lista ordens (?status=)         |
| POST   | /api/ordens               | cria ordem                      |
| PATCH  | /api/ordens/:id/status    | altera status da ordem          |
| GET    | /api/ordens/resumo        | totais para o painel            |

Todas as rotas de clientes e ordens exigem o header `Authorization: Bearer <token>`.

## Próximos passos sugeridos

- Geração de comprovante/PDF da OS para o cliente
- Histórico de mudanças de status (com data e responsável)
- Controle de papéis (ex.: só ADMIN exclui)
- Filtro por período e relatórios
- Notificação ao cliente (WhatsApp/e-mail) quando o aparelho fica pronto
```
