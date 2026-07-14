FROM mcr.microsoft.com/mssql/server:2022-latest

USER root

# Copiar o script de inicialização e o schema do banco
COPY database/entrypoint.sh /tmp/
# Nota: Como o arquivo SQL está na raiz do contexto docker-compose, copiaremos direto da raiz
COPY Criar_Banco_ExpedicaoDB.sql /tmp/

# Dar permissão de execução e garantir que as quebras de linha estejam no formato Linux (LF)
USER root
RUN sed -i 's/\r$//' /tmp/entrypoint.sh && chmod +x /tmp/entrypoint.sh

# Retorna para o usuário padrão do mssql (recomendado)
USER mssql

ENTRYPOINT ["/bin/bash", "/tmp/entrypoint.sh"]
