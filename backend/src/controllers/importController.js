const { poolPromise, sql } = require('../config/database');
const xlsx = require('xlsx');

class ImportController {
    async downloadTemplate(req, res) {
        try {
            const { entidade } = req.params;
            let headers = [];

            switch (entidade.toLowerCase()) {
                case 'transportadoras':
                    headers = ['Codigo_Olimpo', 'Razao_Social', 'Ativo'];
                    break;
                case 'clientes':
                    headers = ['Codigo_Olimpo', 'Razao_Social', 'Ativo'];
                    break;
                case 'pecas':
                    headers = ['Nome_Peca', 'Peso_Liquido', 'Ativo', 'Cliente_Codigo_Olimpo', 'Peca_Codigo_Olimpo', 'Embalagem_Nome', 'Quantidade_Por_Embalagem'];
                    break;
                case 'embalagens':
                    headers = ['Codigo_Olimpo', 'Nome_Embalagem', 'Peso_Tara', 'Ativo'];
                    break;
                case 'usuarios':
                    headers = ['Codigo_Olimpo', 'Nome', 'Login', 'Senha', 'Perfil', 'Ativo'];
                    break;
                default:
                    return res.status(400).json({ message: 'Entidade inválida' });
            }

            const ws = xlsx.utils.aoa_to_sheet([headers]);
            const wb = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(wb, ws, 'Template');

            const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Disposition', `attachment; filename=template_${entidade}.xlsx`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        } catch (error) {
            console.error('Erro no downloadTemplate:', error);
            res.status(500).json({ message: 'Erro ao gerar template', error: error.message });
        }
    }

    async importExcel(req, res) {
        try {
            if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado' });

            const { entidade } = req.params;
            const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });

            if (data.length === 0) return res.status(400).json({ message: 'A planilha está vazia' });

            let successCount = 0;
            let failCount = 0;
            const pool = await poolPromise;

            for (const row of data) {
                try {
                    const codigo = row['Codigo_Olimpo'] != null ? String(row['Codigo_Olimpo']).trim() : null;
                    if (!codigo && entidade !== 'pecas') {
                        failCount++;
                        continue;
                    }

                    const ativo = (row['Ativo'] !== undefined && row['Ativo'] !== null) 
                        ? (String(row['Ativo']).toLowerCase() === 'sim' || String(row['Ativo']).toLowerCase() === 'true' || row['Ativo'] === 1 ? 1 : 0) 
                        : 1;

                    if (entidade === 'transportadoras') {
                        if (!row['Razao_Social']) { failCount++; continue; }
                        await pool.request()
                            .input('Codigo', sql.VarChar, codigo)
                            .input('Razao', sql.VarChar, String(row['Razao_Social']))
                            .input('Ativo', sql.Bit, ativo)
                            .query(`
                                IF EXISTS (SELECT 1 FROM Transportadoras WHERE Codigo_Olimpo = @Codigo)
                                    UPDATE Transportadoras SET Razao_Social = @Razao, Ativo = @Ativo WHERE Codigo_Olimpo = @Codigo;
                                ELSE
                                    INSERT INTO Transportadoras (Codigo_Olimpo, Razao_Social, Ativo) VALUES (@Codigo, @Razao, @Ativo);
                            `);
                        successCount++;
                    } 
                    else if (entidade === 'clientes') {
                        if (!row['Razao_Social']) { failCount++; continue; }
                        await pool.request()
                            .input('Codigo', sql.VarChar, codigo)
                            .input('Razao', sql.VarChar, String(row['Razao_Social']))
                            .input('Ativo', sql.Bit, ativo)
                            .query(`
                                IF EXISTS (SELECT 1 FROM Clientes WHERE Codigo_Olimpo = @Codigo)
                                    UPDATE Clientes SET Razao_Social = @Razao, Ativo = @Ativo WHERE Codigo_Olimpo = @Codigo;
                                ELSE
                                    INSERT INTO Clientes (Codigo_Olimpo, Razao_Social, Ativo) VALUES (@Codigo, @Razao, @Ativo);
                            `);
                        successCount++;
                    }
                    else if (entidade === 'pecas') {
                        if (!row['Nome_Peca']) { failCount++; continue; }
                        
                        const nomePeca = String(row['Nome_Peca']).trim();
                        const peso = row['Peso_Liquido'] || 0;
                        const clienteCodigo = row['Cliente_Codigo_Olimpo'] ? String(row['Cliente_Codigo_Olimpo']).trim() : null;
                        const pecaCodigo = row['Peca_Codigo_Olimpo'] ? String(row['Peca_Codigo_Olimpo']).trim() : null;
                        const embalagemNome = row['Embalagem_Nome'] ? String(row['Embalagem_Nome']).trim() : null;
                        const qtdEmbalagem = row['Quantidade_Por_Embalagem'] || 0;

                        // 1. Upsert da Peça
                        const resPeca = await pool.request()
                            .input('Nome', sql.VarChar, nomePeca)
                            .input('Peso', sql.Decimal(10,3), peso)
                            .input('Ativo', sql.Bit, ativo)
                            .query(`
                                DECLARE @PecaID INT;
                                SELECT @PecaID = ID_Cadastro_Peca FROM Cadastro_Pecas WHERE Nome_Peca = @Nome;
                                
                                IF @PecaID IS NOT NULL
                                BEGIN
                                    UPDATE Cadastro_Pecas SET Peso_Liquido = @Peso, Ativo = @Ativo WHERE ID_Cadastro_Peca = @PecaID;
                                END
                                ELSE
                                BEGIN
                                    INSERT INTO Cadastro_Pecas (Nome_Peca, Peso_Liquido, Ativo) VALUES (@Nome, @Peso, @Ativo);
                                    SET @PecaID = SCOPE_IDENTITY();
                                END
                                
                                SELECT @PecaID as ID;
                            `);
                        
                        const pecaId = resPeca.recordset[0].ID;

                        // 2. Vínculo com Cliente (se fornecido)
                        if (clienteCodigo && pecaCodigo) {
                            await pool.request()
                                .input('PecaID', sql.Int, pecaId)
                                .input('ClienteOlimpo', sql.VarChar, clienteCodigo)
                                .input('CodOlimpoPeca', sql.VarChar, pecaCodigo)
                                .query(`
                                    DECLARE @ClienteID INT;
                                    SELECT @ClienteID = ID_Cliente FROM Clientes WHERE Codigo_Olimpo = @ClienteOlimpo;
                                    
                                    IF @ClienteID IS NOT NULL
                                    BEGIN
                                        IF EXISTS (SELECT 1 FROM Peca_Cliente_Olimpo WHERE ID_Cadastro_Peca = @PecaID AND ID_Cliente = @ClienteID)
                                            UPDATE Peca_Cliente_Olimpo SET Cod_Olimpo = @CodOlimpoPeca WHERE ID_Cadastro_Peca = @PecaID AND ID_Cliente = @ClienteID;
                                        ELSE
                                            INSERT INTO Peca_Cliente_Olimpo (ID_Cadastro_Peca, ID_Cliente, Cod_Olimpo) VALUES (@PecaID, @ClienteID, @CodOlimpoPeca);
                                    END
                                `);
                        }

                        // 3. Vínculo com Embalagem (se fornecido)
                        if (embalagemNome && qtdEmbalagem > 0) {
                            await pool.request()
                                .input('PecaID', sql.Int, pecaId)
                                .input('EmbalagemNome', sql.VarChar, embalagemNome)
                                .input('Qtd', sql.Int, qtdEmbalagem)
                                .query(`
                                    DECLARE @EmbID INT;
                                    SELECT @EmbID = ID_Cadastro_Embalagem FROM Cadastro_Embalagens WHERE Nome_Embalagem = @EmbalagemNome;
                                    
                                    IF @EmbID IS NOT NULL
                                    BEGIN
                                        IF EXISTS (SELECT 1 FROM Peca_Embalagem WHERE ID_Cadastro_Peca = @PecaID AND ID_Cadastro_Embalagem = @EmbID)
                                            UPDATE Peca_Embalagem SET Quantidade_Por_Embalagem = @Qtd WHERE ID_Cadastro_Peca = @PecaID AND ID_Cadastro_Embalagem = @EmbID;
                                        ELSE
                                            INSERT INTO Peca_Embalagem (ID_Cadastro_Peca, ID_Cadastro_Embalagem, Quantidade_Por_Embalagem) VALUES (@PecaID, @EmbID, @Qtd);
                                    END
                                `);
                        }

                        successCount++;
                    }
                    else if (entidade === 'embalagens') {
                        if (!row['Nome_Embalagem']) { failCount++; continue; }
                        await pool.request()
                            .input('Codigo', sql.VarChar, codigo)
                            .input('Nome', sql.VarChar, String(row['Nome_Embalagem']))
                            .input('Peso', sql.Decimal(10,3), row['Peso_Tara'] || 0)
                            .input('Ativo', sql.Bit, ativo)
                            .query(`
                                IF EXISTS (SELECT 1 FROM Cadastro_Embalagens WHERE Codigo_Olimpo = @Codigo)
                                    UPDATE Cadastro_Embalagens SET Nome_Embalagem = @Nome, Peso_Tara = @Peso, Ativo = @Ativo WHERE Codigo_Olimpo = @Codigo;
                                ELSE
                                    INSERT INTO Cadastro_Embalagens (Codigo_Olimpo, Nome_Embalagem, Peso_Tara, Ativo) VALUES (@Codigo, @Nome, @Peso, @Ativo);
                            `);
                        successCount++;
                    }
                    else if (entidade === 'usuarios') {
                        if (!row['Nome'] || !row['Login'] || !row['Senha'] || !row['Perfil']) { failCount++; continue; }
                        const idPerfil = String(row['Perfil']).toLowerCase() === 'admin' ? 1 : (String(row['Perfil']).toLowerCase() === 'lider' ? 2 : 3);
                        const bcrypt = require('bcrypt');
                        const hash = await bcrypt.hash(String(row['Senha']), 10);
                        
                        await pool.request()
                            .input('Codigo', sql.VarChar, codigo)
                            .input('Nome', sql.VarChar, String(row['Nome']))
                            .input('Login', sql.VarChar, String(row['Login']))
                            .input('SenhaHash', sql.VarChar, hash)
                            .input('ID_Perfil', sql.Int, idPerfil)
                            .input('Ativo', sql.Bit, ativo)
                            .query(`
                                IF EXISTS (SELECT 1 FROM Usuarios WHERE Codigo_Olimpo = @Codigo)
                                    UPDATE Usuarios SET Nome = @Nome, Login = @Login, SenhaHash = @SenhaHash, ID_Perfil = @ID_Perfil, Ativo = @Ativo, Data_Atualizacao = GETDATE() WHERE Codigo_Olimpo = @Codigo;
                                ELSE
                                    INSERT INTO Usuarios (Codigo_Olimpo, Nome, Login, SenhaHash, ID_Perfil, Ativo) VALUES (@Codigo, @Nome, @Login, @SenhaHash, @ID_Perfil, @Ativo);
                            `);
                        successCount++;
                    }
                } catch (err) {
                    console.error('Erro na linha:', row, err);
                    failCount++;
                }
            }

            res.json({ successCount, failCount });
        } catch (error) {
            console.error('Erro no importExcel:', error);
            res.status(500).json({ message: 'Erro ao processar importação', error: error.message });
        }
    }
}

module.exports = new ImportController();
