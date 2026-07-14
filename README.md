# Portal de Expedição 🚚

Sistema robusto de gestão logística, portaria e faturamento projetado para automatizar, monitorar e otimizar o fluxo de cargas em tempo real. O foco principal é a **redução de gargalos**, acompanhamento de **SLA de atrasos** e rastreabilidade ponta a ponta desde a chegada do veículo até a saída com a nota fiscal.

## 🚀 Principais Features

- **Kanban Interativo de Expedição**: Fluxo visual completo com drag-and-drop para mover cargas entre status (Aguardando, No Pátio, Carregando, Carregada, Faturada, Liberação de Saída, etc.).
- **Dashboard de Atrasos e SLA**: Monitoramento avançado e cálculo automático de minutos úteis, separando a responsabilidade dos atrasos (Ex: "Atraso Cliente" vs "Atraso Sideral").
- **Painéis de Gestão e Performance**: 
  - Gestão de clientes com gráficos de volumetria e responsabilidades.
  - KPI de eficiência do time de expedição e portaria.
- **Portaria Integrada**: Controle de acesso, verificação de placa, motorista e tempos de espera antes e depois do carregamento.
- **RBAC (Controle de Acesso Baseado em Cargos)**: Permissões granulares garantindo que cada usuário (Porteiro, Operador, Líder, Faturamento) veja e atue apenas nas etapas pertinentes ao seu cargo.
- **Alertas e PWA**: Suporte nativo a Progressive Web App com Push Notifications automáticas quando o SLA da carga é excedido ou uma nova ação é necessária.
- **Auditoria**: Log automático de quem mudou a carga de status, quem liberou o veículo e histórico de edições.

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** com **Express**
- **SQL Server (MSSQL)** com stored procedures e triggers para auto-preenchimento e garantia de consistência.
- Autenticação JWT
- Notificações Web Push (Vapid Keys)

### Frontend
- **React.js** (Vite)
- **Bootstrap 5** para UI responsiva e moderna.
- **Recharts** para gráficos gerenciais dinâmicos.
- **React Data Table Component**
- PWA e Service Workers configurados com Vite PWA Plugin.

## 📦 Como Rodar Localmente (Via Docker - Recomendado para Avaliadores)

A forma mais fácil de testar o projeto inteiro sem instalar o banco de dados na sua máquina é utilizando o **Docker**.

### Pré-requisitos
- [Docker](https://www.docker.com/products/docker-desktop) instalado na sua máquina.

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/denner-faria/gerencial-expedicao.git
   cd gerencial-expedicao
   ```

2. **Suba os contêineres:**
   ```bash
   docker-compose up --build
   ```

3. **Pronto!** O Docker vai automaticamente:
   - Baixar a imagem do **SQL Server 2022**.
   - Criar as tabelas, triggers e as procedures (como as regras de negócio de SLA de atraso).
   - Iniciar o **Backend** na porta `4000`.
   - Iniciar o **Frontend** na porta `80` (usando Nginx).

4. Acesse no seu navegador: `http://localhost`

## 🔒 Segurança e Boas Práticas
Para garantir a segurança, todos os dados sensíveis (IPs internos de infraestrutura, strings de conexão, chaves do VAPID e JWT) foram extraídos do código-fonte e são geridos por arquivos `.env`. Nunca faça commit das suas variáveis de ambiente!

---
*Desenvolvido com foco em alta performance e experiência de usuário premium.*
