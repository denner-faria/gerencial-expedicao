ALTER TABLE Portaria ADD Carga_Sugerida VARCHAR(100);
GO
ALTER TABLE Lembretes_Config ADD Notificar_Entrada_Portaria BIT DEFAULT 0;
GO
UPDATE Lembretes_Config SET Notificar_Entrada_Portaria = 0;
GO
