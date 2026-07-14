-- Tabelas para o Sistema de Lembretes

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Lembretes_Config' AND xtype='U')
BEGIN
    CREATE TABLE Lembretes_Config (
        ID_Config INT IDENTITY(1,1) PRIMARY KEY,
        ID_Usuario INT FOREIGN KEY REFERENCES Usuarios(ID_Usuario) ON DELETE CASCADE,
        
        -- Lembretes do Sistema (Pre-configurados pelo admin)
        Notificar_Carregando BIT DEFAULT 0,
        Notificar_Carregada BIT DEFAULT 0,
        Notificar_Faturada BIT DEFAULT 0,
        Notificar_Faturamento_Liberado BIT DEFAULT 0,
        Notificar_Atraso_Carregamento BIT DEFAULT 0,
        
        -- Lembrete Customizado (Definido pelo próprio usuário)
        Customizado_Ativo BIT DEFAULT 0,
        Customizado_Mensagem VARCHAR(255),
        Customizado_Intervalo_Minutos INT,
        Customizado_Ultimo_Envio DATETIME,
        
        Data_Atualizacao DATETIME DEFAULT GETDATE(),
        
        CONSTRAINT UQ_Usuario_Config UNIQUE(ID_Usuario)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Lembretes_Historico' AND xtype='U')
BEGIN
    CREATE TABLE Lembretes_Historico (
        ID_Lembrete INT IDENTITY(1,1) PRIMARY KEY,
        ID_Usuario INT FOREIGN KEY REFERENCES Usuarios(ID_Usuario) ON DELETE CASCADE,
        Mensagem VARCHAR(500) NOT NULL,
        Tipo VARCHAR(50) DEFAULT 'SISTEMA', -- 'SISTEMA' ou 'CUSTOMIZADO'
        Lida BIT DEFAULT 0,
        Data_Criacao DATETIME DEFAULT GETDATE()
    );
END
GO
