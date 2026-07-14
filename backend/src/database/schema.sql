-- Banco de Dados para Controle de Expedição

-- 1. Tabelas de Acesso e Segurança
CREATE TABLE Perfis (
    ID_Perfil INT IDENTITY(1,1) PRIMARY KEY,
    Nome VARCHAR(50) NOT NULL UNIQUE,
    Descricao VARCHAR(255)
);

CREATE TABLE Permissoes (
    ID_Permissao INT IDENTITY(1,1) PRIMARY KEY,
    Chave VARCHAR(100) NOT NULL UNIQUE,
    Descricao VARCHAR(255)
);

CREATE TABLE Perfil_Permissao (
    ID_Perfil INT FOREIGN KEY REFERENCES Perfis(ID_Perfil) ON DELETE CASCADE,
    ID_Permissao INT FOREIGN KEY REFERENCES Permissoes(ID_Permissao) ON DELETE CASCADE,
    PRIMARY KEY (ID_Perfil, ID_Permissao)
);

CREATE TABLE Usuarios (
    ID_Usuario INT IDENTITY(1,1) PRIMARY KEY,
    Nome VARCHAR(100) NOT NULL,
    Login VARCHAR(50) NOT NULL UNIQUE,
    SenhaHash VARCHAR(255) NOT NULL,
    ID_Perfil INT FOREIGN KEY REFERENCES Perfis(ID_Perfil),
    Ativo BIT DEFAULT 1,
    Data_Criacao DATETIME DEFAULT GETDATE(),
    Data_Atualizacao DATETIME DEFAULT GETDATE()
);

-- 2. Tabela de Auditoria
CREATE TABLE Auditoria (
    ID_Log INT IDENTITY(1,1) PRIMARY KEY,
    ID_Usuario INT FOREIGN KEY REFERENCES Usuarios(ID_Usuario) NULL,
    DataHora DATETIME DEFAULT GETDATE(),
    IP VARCHAR(50),
    Acao VARCHAR(50) NOT NULL,
    Tabela_Afetada VARCHAR(100),
    ID_Registro INT,
    Valores_Antigos NVARCHAR(MAX),
    Valores_Novos NVARCHAR(MAX)
);

-- 3. Tabelas de Domínio (Apoio e Cadastros Base)
CREATE TABLE Clientes (
    ID_Cliente INT IDENTITY(1,1) PRIMARY KEY,
    Razao_Social VARCHAR(200) NOT NULL,
    Ativo BIT DEFAULT 1
);

CREATE TABLE Transportadoras (
    ID_Transportadora INT IDENTITY(1,1) PRIMARY KEY,
    Razao_Social VARCHAR(200) NOT NULL,
    Ativo BIT DEFAULT 1
);

CREATE TABLE Status_Carga (
    ID_Status INT IDENTITY(1,1) PRIMARY KEY,
    Nome VARCHAR(50) NOT NULL UNIQUE,
    Cor_Kanban VARCHAR(20),
    Ordem INT NOT NULL
);

-- Cadastro Mestre de Peças
CREATE TABLE Cadastro_Pecas (
    ID_Cadastro_Peca INT IDENTITY(1,1) PRIMARY KEY,
    Nome_Peca VARCHAR(200) NOT NULL,
    Cod_Olimpo VARCHAR(100),
    Peso_Liquido DECIMAL(10,2) NOT NULL DEFAULT 0,
    Ativo BIT DEFAULT 1
);

-- Cadastro Mestre de Embalagens
CREATE TABLE Cadastro_Embalagens (
    ID_Cadastro_Embalagem INT IDENTITY(1,1) PRIMARY KEY,
    Nome_Embalagem VARCHAR(100) NOT NULL,
    Peso_Tara DECIMAL(10,2) DEFAULT 0, -- Peso da embalagem vazia
    Ativo BIT DEFAULT 1
);

-- Relacionamento: Peça <-> Embalagens (N para N)
CREATE TABLE Peca_Embalagem (
    ID_Cadastro_Peca INT FOREIGN KEY REFERENCES Cadastro_Pecas(ID_Cadastro_Peca) ON DELETE CASCADE,
    ID_Cadastro_Embalagem INT FOREIGN KEY REFERENCES Cadastro_Embalagens(ID_Cadastro_Embalagem) ON DELETE CASCADE,
    Quantidade_Por_Embalagem INT NOT NULL, -- Ex: 50 peças cabem nesta embalagem
    PRIMARY KEY (ID_Cadastro_Peca, ID_Cadastro_Embalagem)
);

-- 4. Tabelas Principais (Expedição)
CREATE TABLE Cargas (
    ID_Carga INT IDENTITY(1,1) PRIMARY KEY,
    Data DATE NOT NULL,
    Nome_Carga VARCHAR(100) NOT NULL,
    
    ID_Cliente INT FOREIGN KEY REFERENCES Clientes(ID_Cliente),
    ID_Transportadora INT FOREIGN KEY REFERENCES Transportadoras(ID_Transportadora),
    ID_Status INT FOREIGN KEY REFERENCES Status_Carga(ID_Status),
    
    Quantidade_Total_Pecas INT DEFAULT 0,
    Peso_Total_Pecas DECIMAL(10,2) DEFAULT 0,
    Peso_Total_Bruto DECIMAL(10,2) DEFAULT 0,
    
    Hora_Prevista_Chegada DATETIME,
    Hora_Prevista_Saida DATETIME,
    Hora_Chegada DATETIME,
    Hora_Saida DATETIME,
    
    Criticidade VARCHAR(20),
    Veiculo VARCHAR(100),
    Placa VARCHAR(20),
    NF VARCHAR(50),
    Motivo_Nao_Carregamento VARCHAR(500),
    Assinatura VARCHAR(MAX),
    
    Sequencia_Dia INT,
    Status_Faturamento VARCHAR(50) DEFAULT 'Não Liberada',
    Hora_Liberada DATETIME,
    
    OF_Num VARCHAR(100),
    PDF_Fotos VARCHAR(500),
    PDF_Carga VARCHAR(500),
    
    Observacao VARCHAR(MAX),
    Responsabilidade_Atraso VARCHAR(100),
    Motivo_Atraso VARCHAR(500),
    TMPV VARCHAR(50),
    Tipo_Carregamento VARCHAR(100),
    Atraso_Cliente BIT DEFAULT 0,
    
    Criado_Por INT FOREIGN KEY REFERENCES Usuarios(ID_Usuario),
    Data_Criacao DATETIME DEFAULT GETDATE(),
    Data_Atualizacao DATETIME DEFAULT GETDATE()
);

-- Itens da Carga (Peças na Carga)
CREATE TABLE Pecas (
    ID_Item_Carga INT IDENTITY(1,1) PRIMARY KEY,
    ID_Carga INT FOREIGN KEY REFERENCES Cargas(ID_Carga) ON DELETE CASCADE,
    
    ID_Cadastro_Peca INT FOREIGN KEY REFERENCES Cadastro_Pecas(ID_Cadastro_Peca),
    Nome_Peca VARCHAR(200) NOT NULL,
    Quantidade_Pecas INT NOT NULL DEFAULT 1,
    Peso_Peca DECIMAL(10,2) NOT NULL DEFAULT 0,
    Peso_Total_Pecas DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    ID_Cadastro_Embalagem INT FOREIGN KEY REFERENCES Cadastro_Embalagens(ID_Cadastro_Embalagem),
    Embalagem VARCHAR(100),
    Opcao VARCHAR(100),
    
    Quantidade_Embalagem INT DEFAULT 0,
    Peso_Total_Embalagem DECIMAL(10,2) DEFAULT 0,
    Peso_Total_Bruto DECIMAL(10,2) DEFAULT 0,
    
    Status_Peca VARCHAR(50),
    Cod_Olimpo VARCHAR(100),
    
    Data_Criacao DATETIME DEFAULT GETDATE(),
    Data_Atualizacao DATETIME DEFAULT GETDATE()
);
