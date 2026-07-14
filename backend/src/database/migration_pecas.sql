-- Limpar dados para evitar falhas de chave estrangeira (ambiente de homologação)
DELETE FROM Peca_Embalagem;
DELETE FROM Pecas; -- Remove peças das cargas
DELETE FROM Cadastro_Pecas;

-- Dropar coluna Cod_Olimpo da Cadastro_Pecas
ALTER TABLE Cadastro_Pecas DROP COLUMN Cod_Olimpo;

-- Tabela Associativa Peça -> Cliente -> Codigo Olimpo
CREATE TABLE Peca_Cliente_Olimpo (
    ID_Cadastro_Peca INT FOREIGN KEY REFERENCES Cadastro_Pecas(ID_Cadastro_Peca) ON DELETE CASCADE,
    ID_Cliente INT FOREIGN KEY REFERENCES Clientes(ID_Cliente) ON DELETE CASCADE,
    Cod_Olimpo VARCHAR(100) NOT NULL,
    PRIMARY KEY (ID_Cadastro_Peca, ID_Cliente)
);
