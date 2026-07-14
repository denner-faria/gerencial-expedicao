const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);
const { poolPromise, sql } = require('../config/database');

class PdfService {
    constructor() {
        this.templateCache = null;
    }

    async getTemplate() {
        if (!this.templateCache) {
            const templatePath = path.join(__dirname, '../templates/relatorio_carga.hbs');
            const templateStr = fs.readFileSync(templatePath, 'utf8');
            this.templateCache = handlebars.compile(templateStr);
        }
        return this.templateCache;
    }

    formatTime(dateStr) {
        if (!dateStr) return '';
        return dayjs(dateStr).utc().format('HH:mm');
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        return dayjs(dateStr).utc().format('DD/MM/YYYY');
    }

    async generateCargaPdf(idCarga) {
        try {
            const pool = await poolPromise;

            // 1. Fetch Carga
            const cargaResult = await pool.request()
                .input('ID_Carga', sql.Int, idCarga)
                .query(`
                    SELECT c.*, 
                           cl.Razao_Social as Cliente_Nome, 
                           t.Razao_Social as Transportadora_Nome,
                           s.Nome as Status_Nome,
                           u.Nome as Usuario_Nome
                    FROM Cargas c
                    LEFT JOIN Clientes cl ON c.ID_Cliente = cl.ID_Cliente
                    LEFT JOIN Transportadoras t ON c.ID_Transportadora = t.ID_Transportadora
                    LEFT JOIN Status_Carga s ON c.ID_Status = s.ID_Status
                    LEFT JOIN Usuarios u ON c.Criado_Por = u.ID_Usuario
                    WHERE c.ID_Carga = @ID_Carga
                `);

            const carga = cargaResult.recordset[0];
            if (!carga) throw new Error('Carga não encontrada para gerar PDF');

            // 2. Fetch Pecas
            const pecasResult = await pool.request()
                .input('ID_Carga', sql.Int, idCarga)
                .input('ID_Cliente', sql.Int, carga.ID_Cliente)
                .query(`
                    SELECT p.Quantidade_Pecas, p.Quantidade_Embalagem, 
                           ISNULL(p.Cod_Olimpo, pco.Cod_Olimpo) as Codigo_Olimpo, pec.Nome_Peca,
                           emb.Codigo_Olimpo as Codigo_Embalagem, emb.Nome_Embalagem
                    FROM Pecas p
                    LEFT JOIN Cadastro_Pecas pec ON p.ID_Cadastro_Peca = pec.ID_Cadastro_Peca
                    LEFT JOIN Cadastro_Embalagens emb ON p.ID_Cadastro_Embalagem = emb.ID_Cadastro_Embalagem
                    LEFT JOIN Peca_Cliente_Olimpo pco ON p.ID_Cadastro_Peca = pco.ID_Cadastro_Peca AND pco.ID_Cliente = @ID_Cliente
                    WHERE p.ID_Carga = @ID_Carga
                    ORDER BY p.Cod_Olimpo ASC
                `);

            const pecas = pecasResult.recordset.map(p => ({
                Codigo_Olimpo: p.Codigo_Olimpo || '',
                Nome_Peca: p.Nome_Peca || '',
                Quantidade: p.Quantidade_Pecas || 0,
                Codigo_Embalagem: p.Codigo_Embalagem || '',
                Nome_Embalagem: p.Nome_Embalagem || '',
                Quantidade_Rack: p.Quantidade_Embalagem || 0
            }));

            // 3. Totais
            const totalPecas = pecas.reduce((acc, p) => acc + p.Quantidade, 0);
            const totalRack = pecas.reduce((acc, p) => acc + p.Quantidade_Rack, 0);

            // 4. Assinatura base64 or URL
            // Se c.Assinatura contém um base64, usamos direto. Se for path, carregamos.
            let assinaturaUrl = carga.Assinatura || '';
            if (assinaturaUrl && !assinaturaUrl.startsWith('data:image')) {
                // If it's a relative URL to the static server, we need to convert it to a full local URL or Base64 so Puppeteer can read it.
                // Assuming it might be a relative path like /uploads/signatures/xxx.png
                try {
                    const absPath = path.join(__dirname, '../../', assinaturaUrl);
                    if (fs.existsSync(absPath)) {
                        const ext = path.extname(absPath).substring(1);
                        const b64 = fs.readFileSync(absPath, 'base64');
                        assinaturaUrl = `data:image/${ext};base64,${b64}`;
                    }
                } catch (e) {
                    console.error("Erro ao carregar assinatura:", e);
                }
            }

            // 5. Data prep
            const dataToRender = {
                dataGeracao: dayjs().format('DD/MM/YYYY HH:mm:ss'),
                Nome_Carga: carga.Nome_Carga || '',
                Data: this.formatDate(carga.Data),
                Cliente: carga.Cliente_Nome || '',
                Veiculo: carga.Veiculo || '',
                Transportadora: carga.Transportadora_Nome || '',
                Placa: carga.Placa || '',
                Hora_Prevista_Chegada: this.formatTime(carga.Hora_Prevista_Chegada),
                Hora_Prevista_Saida: this.formatTime(carga.Hora_Prevista_Saida),
                Hora_Chegada: this.formatTime(carga.Data_Inicio_Carregamento || carga.Data_Liberacao_Veiculo), // using liberacao as fallback
                Hora_Saida: this.formatTime(carga.Hora_Liberada || carga.Data_Fim_Carregamento),
                Responsavel: carga.Quem_Liberou_Veiculo || carga.Usuario_Nome || '',
                NF: [carga.NFs_Pecas, carga.NFs_Embalagens].filter(Boolean).join(' / '),
                Status: carga.Status_Nome || '',
                Faturamento: carga.Status_Faturamento || '',
                Pecas: pecas,
                Total_Pecas: totalPecas,
                Total_Rack: totalRack,
                Peso_Total_Pecas: carga.Peso_Total_Pecas ? carga.Peso_Total_Pecas.toFixed(2) : '0.00',
                Peso_Total_Embalagens: (carga.Peso_Total_Bruto - carga.Peso_Total_Pecas) > 0 ? (carga.Peso_Total_Bruto - carga.Peso_Total_Pecas).toFixed(2) : '0.00',
                Peso_Total_Carga: carga.Peso_Total_Bruto ? carga.Peso_Total_Bruto.toFixed(2) : '0.00',
                Observacao: carga.Observacoes || carga.Observacao || '',
                AssinaturaUrl: assinaturaUrl
            };

            // Ler logo sideral
            let logoBase64 = '';
            try {
                const logoPath = path.join(__dirname, '../../..', 'logo-sideral.png');
                if (fs.existsSync(logoPath)) {
                    logoBase64 = 'data:image/png;base64,' + fs.readFileSync(logoPath, 'base64');
                }
            } catch(e) {}
            
            dataToRender.logoBase64 = logoBase64;

            const template = await this.getTemplate();
            const html = template(dataToRender);

            // 6. Generate PDF
            const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--hide-scrollbars'] });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            
            // 7. Save Path
            const dateObj = carga.Data ? new Date(carga.Data) : new Date();
            const year = dateObj.getFullYear().toString();
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const day = dateObj.getDate().toString().padStart(2, '0');
            
            const pdfDir = path.join(__dirname, `../../uploads/pdfs/${year}/${month}/${day}`);
            if (!fs.existsSync(pdfDir)) {
                fs.mkdirSync(pdfDir, { recursive: true });
            }

            // Safe filename
            const safeName = (carga.Nome_Carga || 'carga').replace(/[^a-z0-9]/gi, '_');
            const fileName = `${safeName}.pdf`;
            const filePath = path.join(pdfDir, fileName);

            await page.pdf({ path: filePath, format: 'A4', printBackground: true });
            await browser.close();

            // 8. Update DB with PDF path
            const relativePath = `/uploads/pdfs/${year}/${month}/${day}/${fileName}`;
            await pool.request()
                .input('ID_Carga', sql.Int, idCarga)
                .input('PDF_Carga', sql.VarChar, relativePath)
                .query(`UPDATE Cargas SET PDF_Carga = @PDF_Carga WHERE ID_Carga = @ID_Carga`);

            console.log(`PDF gerado e salvo em: ${relativePath}`);
            return relativePath;

        } catch (error) {
            console.error(`Erro ao gerar PDF para a carga ${idCarga}:`, error);
            // Non-blocking, so we just log and don't throw up to the controller if we don't want to break the app
        }
    }
}

module.exports = new PdfService();
