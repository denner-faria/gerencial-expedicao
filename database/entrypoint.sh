#!/bin/bash
# Inicia o SQL Server em background
/opt/mssql/bin/sqlservr &

# Aguarda o SQL Server subir
echo "Aguardando o SQL Server iniciar..."
sleep 20

# Executa o script SQL
echo "Rodando o script de criação do banco de dados..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -i /tmp/Criar_Banco_ExpedicaoDB.sql

echo "Banco de dados inicializado com sucesso!"

# Mantém o container rodando
wait
