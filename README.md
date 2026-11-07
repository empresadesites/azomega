# ANTI ZARALHO OMEGA (AZO) — SISTEMA ADMINISTRATIVO

Sistema administrativo completo para gerenciamento de pasta de GTA RP, desenvolvido com React, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts e Express (com suporte a Supabase/PostgreSQL).

## Hierarquia Oficial (Respeitada Rigorosamente)

1. **ADM DA PASTA** (Administrador principal com acesso total)
2. **AUXILIAR**
3. **LÍDER**
4. **SUB**
5. **AZO**
6. **AZO-T** (Recruta)

## Funcionalidades Principais

- **Autenticação & Cadastro**: O primeiro usuário cadastrado torna-se automaticamente o **ADM DA PASTA**. Demais cadastros entram como pendentes para aprovação administrativa.
- **Dashboard**: Visão geral com indicadores em tempo real, gráficos de cargos e status, e feed de atividades administrativas recentes.
- **Gerenciamento de Membros**: Ficha individual detalhada (Geral, Advertências, Histórico, Promoções, Atividades, Observações).
- **Solicitações de Cadastro**: Aprovação com escolha de cargo ou recusa com justificativa.
- **Sistema de Advertências**: Tipos VERBAL, FORMAL e GRAVE com rastreabilidade completa.
- **Blacklist Oficial**: Controle de indivíduos banidos com registro de evidências e remoção justificada.
- **Hierarquia & Promoções**: Promoções e rebaixamentos com verificação rigorosa de cargos.
- **Registro de Atividades**: Acompanhamento de operações, serviços e ausências.
- **Logs de Auditoria**: Registro imutável de todas as ações administrativas.
- **Relatórios & Exportação**: Impressão e exportação de dados em CSV.
- **Controle de Permissões**: Matriz personalizável de permissões por cargo.

## Instalação e Execução Local

1. Instalar dependências:
   ```bash
   npm install
   ```

2. Executar em modo de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Compilar para produção:
   ```bash
   npm run build
   ```
