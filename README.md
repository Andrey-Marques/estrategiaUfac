# Estratégia UFAC

Sistema para consulta pública e gerenciamento e monitoramento de projetos, iniciativas e indicadores estratégicos da UFAC. A área restrita possui os perfis administrador, gestor e servidor.

Este guia descreve a instalação e a execução local conforme a configuração atual do repositório.

## Tecnologias e estrutura

| Tecnologia | Versão utilizada pelo projeto |
| --- | --- |
| Angular | 22 |
| Django | 6.0.5 |
| Django REST Framework | 3.17.1 |
| Python | 3.13 na imagem Docker |
| Node.js | 24 na imagem de compilação |
| PostgreSQL | 17 |
| Nginx | Imagem `stable-alpine` |

```text
estrategiaUfac/
├── compose.yaml              # Serviços e volume do Docker
├── estrategia-api/           # Backend Django
│   ├── .env                  # Configuração local; criar manualmente
│   ├── manage.py
│   ├── requirements.txt      # Dependências do backend
│   └── Dockerfile
├── estrategia-app/           # Frontend Angular
│   ├── package.json          # Scripts e dependências do frontend
│   ├── package-lock.json
│   ├── nginx.conf            # Frontend e encaminhamento de /api/
│   └── Dockerfile
└── artefatos/                # Modelagem e outros documentos
```

Para instalar as dependências, utilize os arquivos de `estrategia-api/` e `estrategia-app/`, conforme os comandos abaixo. Existem também arquivos de dependências na raiz, que não são usados pelos Dockerfiles.

## 1. Pré-requisitos

### Execução completa com Docker

- Docker com Docker Compose v2.
- No Windows, Docker Desktop iniciado e configurado para containers Linux.
- Git, caso obtenha o projeto por clonagem, ou uma cópia do código-fonte.
- Acesso à internet na primeira compilação para baixar imagens e dependências.
- Portas locais `8080`, `8000` e `5433` disponíveis.

Não é necessário instalar Python, Node.js ou PostgreSQL no computador para usar esta opção.

### Desenvolvimento fora dos containers

Além do Docker para o banco, instale Python 3.13 e Node.js 24 com npm. O frontend declara npm `11.16.0` em `packageManager`.

Os exemplos deste documento usam PowerShell. Abra o terminal na raiz do projeto, onde está `compose.yaml`.

## 2. Configurar o ambiente

Crie o arquivo **`estrategia-api/.env`**, ao lado de `manage.py`. Se ele já existir, preserve os valores configurados; não substitua credenciais de um banco já inicializado.

Exemplo para um ambiente novo:

```dotenv
# PostgreSQL
DB_NAME=estrategia_ufac
DB_USER=estrategia
DB_PASSWORD="SUBSTITUA_POR_UMA_SENHA_FORTE"
DB_HOST=127.0.0.1
DB_PORT=5433

# Frontend utilizado nos links de recuperação de senha
FRONTEND_URL=http://localhost:4200
PASSWORD_RESET_TIMEOUT=1800

# Execução local direta: não confiar em cabeçalhos de proxies
TRUSTED_PROXY_HOSTS=

# SMTP: preencha para habilitar o envio de e-mails
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER="SEU_LOGIN_SMTP"
EMAIL_HOST_PASSWORD="SUA_CHAVE_SMTP"
DEFAULT_FROM_EMAIL="Estratégia UFAC <remetente@exemplo.com>"
```

- Substitua os valores de exemplo antes de usar o banco ou testar e-mails.
- Para a Brevo, utilize o login SMTP e a chave SMTP, além de um remetente verificado. A chave SMTP é diferente da senha de acesso ao painel.
- O envio de e-mail é necessário para concluir a recuperação de senha. As demais funcionalidades podem ser usadas sem SMTP configurado.
- O `.env` está no `.gitignore`; não envie credenciais para o repositório.
- `PASSWORD_RESET_TIMEOUT` é medido em segundos: `1800` equivale a 30 minutos.

O mesmo arquivo atende à execução local e ao Docker. Dentro do container, o Compose substitui `DB_HOST` por `db`, `DB_PORT` por `5432`, `FRONTEND_URL` por `http://localhost:8080` e `TRUSTED_PROXY_HOSTS` por `frontend`.

## 3. Instalação e execução com Docker

Execute os comandos desta seção na **raiz do projeto**.

### 3.1. Iniciar o PostgreSQL

```powershell
docker compose --env-file estrategia-api/.env up -d db
docker compose --env-file estrategia-api/.env ps
```

Aguarde o banco apresentar o estado `healthy`.

Na primeira inicialização com volume vazio, o PostgreSQL cria o banco e o usuário definidos no `.env`. Ele ainda não cria as tabelas do Django nem os dados de exemplo.

### 3.2. Compilar e iniciar backend e frontend

```powershell
docker compose --env-file estrategia-api/.env up -d --build backend frontend
```

A primeira compilação pode demorar. O frontend é compilado pelo Node.js e servido pelo Nginx; o backend utiliza a imagem Python.

### 3.3. Verificar o backend e criar as tabelas

```powershell
docker compose --env-file estrategia-api/.env exec backend python manage.py check
docker compose --env-file estrategia-api/.env exec backend python manage.py migrate
```

Use `migrate` na instalação e depois de alterações que adicionem migrations. Não é necessário executar `makemigrations` para uma instalação normal: as migrations devem acompanhar o código-fonte.

### 3.4. Popular o ambiente de demonstração

Para instalar os dados de exemplo:

```powershell
docker compose --env-file estrategia-api/.env exec backend python manage.py seed
```

O seed cria unidades, usuários, objetivos, projetos, iniciativas e indicadores, com cenários de aprovação, rejeição, espera, descontinuação, atrasos e usuários inativos.

**Use o seed em desenvolvimento ou demonstração.** Ele também atualiza determinados dados existentes; não o execute em um banco com dados reais para apenas iniciar a aplicação. Senhas de usuários já existentes são preservadas.

Algumas contas de exemplo, quando criadas pelo seed:

| Perfil | Usuário | Senha inicial |
| --- | --- | --- |
| Administrador | `admin` | `123456` |
| Gestor | `gestorproplan` | `123456` |
| Servidor | `servidorproaes` | `123456` |

As contas `servidorinativo` e `gestorinativo` são exemplos inativos e não devem conseguir entrar. Não publique as contas de demonstração com as senhas padrão.

### 3.5. Acessar

| Serviço | Endereço |
| --- | --- |
| Sistema completo | http://localhost:8080 |
| API Django | http://localhost:8000/api/ |
| Consulta pública da API, para conferir a conexão | http://localhost:8000/api/acoes-estrategicas/ |
| PostgreSQL no computador | `127.0.0.1:5433` |

Rotas privadas da API exigem autenticação; uma resposta `401` nelas, sem token, é esperada. Não há uma página de listagem de todas as rotas em `/api/`.

## 4. Desenvolvimento local com PostgreSQL no Docker

Nesta opção, somente o banco fica no Docker. O backend e o frontend executam no computador e acompanham as alterações do código.

Se os containers da aplicação já estiverem rodando, pare-os para liberar a porta `8000` e evitar confusão entre as duas versões:

```powershell
docker compose --env-file estrategia-api/.env stop backend frontend
docker compose --env-file estrategia-api/.env up -d db
```

No `.env`, mantenha `DB_HOST=127.0.0.1`, `DB_PORT=5433`, `FRONTEND_URL=http://localhost:4200` e `TRUSTED_PROXY_HOSTS=` vazio.

### 4.1. Backend — primeiro terminal

A partir da raiz:

```powershell
cd estrategia-api
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py migrate
```

Se este banco ainda não tiver os dados de demonstração e você quiser utilizá-los:

```powershell
.\venv\Scripts\python.exe manage.py seed
```

Inicie o backend:

```powershell
.\venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

Os comandos chamam o Python do ambiente virtual diretamente e não exigem ativação do `Activate.ps1`, evitando o bloqueio de scripts do PowerShell.

No Linux/macOS, a chamada equivalente é `./venv/bin/python`, após criar o ambiente com Python 3.13.

### 4.2. Frontend — segundo terminal

Abra outro terminal na raiz e execute:

```powershell
cd estrategia-app
npm ci
npm start
```

Acesse **http://localhost:4200**. O ambiente de desenvolvimento aponta para `http://127.0.0.1:8000/api`; a configuração CORS do backend permite `http://localhost:4200`.

Não é necessário instalar Angular CLI globalmente: os scripts npm usam a versão do projeto.

### 4.3. Encerrar

Use `Ctrl+C` nos terminais do backend e do frontend. Para parar o banco, volte à raiz:

```powershell
docker compose --env-file estrategia-api/.env stop db
```

## 5. Atualizar a aplicação no Docker

Os containers atuais não possuem montagem do código-fonte nem recarregamento automático. Depois de alterar arquivos, reconstrua o serviço correspondente.

Na raiz, para atualizar apenas o frontend:

```powershell
docker compose --env-file estrategia-api/.env up -d --no-deps --build frontend
```

Para atualizar o backend:

```powershell
docker compose --env-file estrategia-api/.env up -d --build backend
```

Se o backend tiver sido recriado, reinicie o frontend para o Nginx resolver novamente o endereço dele:

```powershell
docker compose --env-file estrategia-api/.env restart frontend
```

Para atualizar ambos:

```powershell
docker compose --env-file estrategia-api/.env up -d --build backend frontend
```

Se houver novas migrations:

```powershell
docker compose --env-file estrategia-api/.env exec backend python manage.py migrate
```

Não é necessário executar o seed novamente em toda atualização. Ao alterar o `.env`, recrie o backend com `docker compose --env-file estrategia-api/.env up -d --force-recreate backend` e reinicie o frontend; apenas `restart` não reaplica variáveis de ambiente do container.

## 6. Banco e persistência

O PostgreSQL mantém seus arquivos no volume Docker `postgres_data`, cujo nome efetivo recebe o prefixo do projeto, por exemplo `estrategiaufac_postgres_data`.

- Recriar as imagens ou os containers não apaga esse volume.
- `docker compose --env-file estrategia-api/.env down` encerra e remove os containers e a rede, preservando o volume.
- **Não use `down -v` se precisar manter os dados:** a opção `-v` remove o volume do banco.
- Mudar `DB_NAME`, `DB_USER` ou `DB_PASSWORD` no `.env` não reconfigura automaticamente um PostgreSQL já inicializado. É necessário administrar a alteração no banco existente.
- O arquivo antigo `estrategia-api/db.sqlite3`, se presente, não é usado pela configuração atual. Os dados não são copiados automaticamente dele para o PostgreSQL.
- A execução local e a execução pelo Docker acessam o mesmo banco quando utilizam as configurações deste guia.

### Acessar pelo DBeaver

Crie uma conexão PostgreSQL com:

| Campo | Valor |
| --- | --- |
| Host | `127.0.0.1` |
| Porta | `5433` |
| Banco | Valor de `DB_NAME` do `.env` |
| Usuário | Valor de `DB_USER` do `.env` |
| Senha | Valor de `DB_PASSWORD` do `.env` |

O serviço `db` precisa estar rodando. Dentro da rede Docker, o endereço é `db:5432`; esse não é o endereço utilizado pelo DBeaver no computador.

## 7. Verificações e testes

Backend no Docker, a partir da raiz:

```powershell
docker compose --env-file estrategia-api/.env exec backend python manage.py check
docker compose --env-file estrategia-api/.env exec backend python manage.py showmigrations
docker compose --env-file estrategia-api/.env exec backend python manage.py test usuarios objetivosEstrategicos
```

Essas suítes cobrem permissões de usuários e objetivos e o controle de tentativas de login. O Django cria um banco de testes separado e o remove ao terminar; o usuário do banco precisa ter permissão para criá-lo.

Frontend, dentro de `estrategia-app/`, após `npm ci`:

```powershell
npm run build -- --configuration production
npm test -- --watch=false --include="src/app/components/formularios/**/*.spec.ts"
```

O comando de testes acima seleciona os testes dos formulários. Ele não representa uma validação completa de todas as funcionalidades do sistema.

## 8. Comandos de operação

Execute na raiz:

```powershell
# Consultar estado dos serviços
docker compose --env-file estrategia-api/.env ps

# Acompanhar logs; Ctrl+C encerra apenas o acompanhamento
docker compose --env-file estrategia-api/.env logs -f backend frontend db

# Parar os serviços sem remover containers
docker compose --env-file estrategia-api/.env stop

# Iniciar containers já criados
docker compose --env-file estrategia-api/.env start

# Encerrar e remover containers, preservando o volume do banco
docker compose --env-file estrategia-api/.env down
```

## 9. Problemas comuns

| Problema | Verificação |
| --- | --- |
| Falha de conexão com a API do Docker / `docker_engine` | Inicie o Docker Desktop e aguarde o mecanismo ficar disponível. Confira com `docker info`. |
| Porta ocupada ou acesso ao socket proibido | Confira as portas `5433`, `8000` e `8080`. Se alterar a porta do banco no Compose, mantenha a porta interna `5432` e ajuste `DB_PORT` para a execução local e a conexão do DBeaver. |
| `ModuleNotFoundError: No module named 'dotenv'` | Instale `estrategia-api/requirements.txt` usando o Python do ambiente virtual. O pacote se chama `python-dotenv`. |
| `Activate.ps1` bloqueado no PowerShell | Use diretamente `.\venv\Scripts\python.exe`, conforme a instalação local. |
| Tabelas inexistentes | Execute `migrate` no banco utilizado pelo backend. |
| Dados de exemplo não aparecem | Confira se o seed foi executado no mesmo banco e se os filtros da interface estão ativos. |
| Alterações não aparecem em `localhost:8080` | Reconstrua a imagem correspondente e atualize o navegador com `Ctrl+F5`. |
| Erro `502` no frontend depois de recriar o backend | Aguarde o backend iniciar, verifique os logs e reinicie o serviço `frontend`. |
| Login retorna `429` | O limite é de 5 falhas por conta ou 20 por IP, com bloqueio de 15 minutos. |
| SMTP retorna `535 Authentication failed` | Confira o login SMTP e a chave SMTP da Brevo, recrie o backend e teste novamente. Não utilize a senha do painel nem uma chave de API. |
| Link de recuperação aponta para a porta errada | Em execução local, confira `FRONTEND_URL` no `.env`. No Docker, o Compose define `http://localhost:8080`. |

## 10. Limites da configuração atual

Este Compose atende à execução local. Embora o frontend use uma compilação de produção, o backend ainda executa o servidor de desenvolvimento do Django (`runserver`), com `DEBUG=True` e chave secreta fixa no código.

Antes de publicar, ajuste esses pontos, configure um servidor de aplicação apropriado e HTTPS, revise contas de demonstração, credenciais, hosts permitidos e políticas de backup. Colocar a aplicação em containers, por si só, não configura um ambiente de produção.

## Imagem de referência

<img width="728" height="807" alt="Imagem de referência do projeto" src="https://github.com/user-attachments/assets/8f1935af-e657-4901-ae0f-bf416bea13eb" />
