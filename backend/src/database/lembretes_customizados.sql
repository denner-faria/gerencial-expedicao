IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Lembretes_Customizados' AND xtype='U')
BEGIN
    CREATE TABLE Lembretes_Customizados (
        ID_Customizado INT IDENTITY(1,1) PRIMARY KEY,
        ID_Usuario INT FOREIGN KEY REFERENCES Usuarios(ID_Usuario) ON DELETE CASCADE,
        Mensagem VARCHAR(255) NOT NULL,
        Intervalo_Minutos INT NOT NULL,
        Ativo BIT DEFAULT 1,
        Ultimo_Envio DATETIME,
        Data_Criacao DATETIME DEFAULT GETDATE()
    );
END
GO
