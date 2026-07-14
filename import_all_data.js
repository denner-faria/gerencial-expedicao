require('dotenv').config();
const sql = require('mssql');
const XLSX = require('xlsx');
const path = require('path');
const { buildGroups } = require('./group_helper');

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

function excelDateToJSDate(excelDate) {
  if (!excelDate) return null;
  if (typeof excelDate === 'number') {
    const d = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    return d.toISOString().split('T')[0];
  }
  return String(excelDate);
}

function excelTimeToString(excelTime) {
  if (excelTime === undefined || excelTime === null || excelTime === '') return null;
  if (typeof excelTime === 'number') {
    let totalSeconds = Math.round(excelTime * 86400);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  return String(excelTime);
}

function parseBool(val) {
  if (!val) return 0;
  if (String(val).trim().toUpperCase() === 'X') return 1;
  return 0;
}

function parseFloatSafe(val) {
  if (val === undefined || val === null || val === '') return 0;
  return parseFloat(val) || 0;
}

function parseStringSafe(val) {
  if (val === undefined || val === null) return null;
  return String(val);
}

async function run() {
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(dbConfig);
    
    console.log('Clearing existing data (DELETE FROM folhas_corrida cascades)...');
    await pool.request().query('DELETE FROM folhas_corrida');
    
    // Reseed identities for child tables
    const tables = ['rastreabilidade', 'enfornamento', 'correcao_metal', 'analise_termica', 'ligas', 'saidas', 'tratamento_metal', 'energia'];
    for (let table of tables) {
      try {
        await pool.request().query(`DBCC CHECKIDENT('${table}', RESEED, 0)`);
      } catch (e) {
        // ignore if identity not found
      }
    }

    const basePath = path.join(__dirname, '..');
    const validFolhas = new Set();

    // 1. folhas_corrida
    console.log('Importing folhas_corrida.xlsx...');
    const fcWb = XLSX.readFile(path.join(basePath, 'folhas_corrida.xlsx'));
    const fcData = XLSX.utils.sheet_to_json(fcWb.Sheets[fcWb.SheetNames[0]]);
    for (let row of fcData) {
      if (!row['ID']) continue;
      const id = String(row['ID']);
      validFolhas.add(id);
      await pool.request()
        .input('id', sql.VarChar, id)
        .input('data', sql.VarChar, excelDateToJSDate(row['Data']))
        .input('forneiro', sql.VarChar, parseStringSafe(row['Forneiro']))
        .input('supervisor', sql.VarChar, parseStringSafe(row['Ass. Supervisor']))
        .input('turno', sql.VarChar, parseStringSafe(row['TURNO']))
        .input('solido', sql.VarChar, parseStringSafe(row['Sólido']))
        .input('liquido', sql.VarChar, parseStringSafe(row['Líquido']))
        .input('corrida', sql.VarChar, parseStringSafe(row['Corrida']))
        .input('corrida_forno_1', sql.VarChar, parseStringSafe(row['Forno1']))
        .input('corrida_forno_2', sql.VarChar, parseStringSafe(row['Forno2']))
        .input('forno_ligou', sql.VarChar, excelTimeToString(row['Forno Ligou']))
        .input('desligou', sql.VarChar, excelTimeToString(row['Forno Desligou']))
        .input('inicio_vazamento', sql.VarChar, excelTimeToString(row['Inicio Vazamento']))
        .input('final_vazamento', sql.VarChar, excelTimeToString(row['Final']))
        .input('alto_forno', sql.Bit, parseBool(row['alto forno']))
        .input('cubilo', sql.Bit, parseBool(row['cubilô']))
        .input('destino_f1', sql.Bit, parseBool(row['Fundição I']))
        .input('destino_f2', sql.Bit, parseBool(row['Fundição II']))
        .input('destino_f3', sql.Bit, parseBool(row['Fundição III']))
        .input('destino_f4', sql.Bit, parseBool(row['Fundição IV']))
        .input('assinado_por', sql.VarChar, parseStringSafe(row['Assinado por']))
        .input('peso_total', sql.Float, 0)
        .input('rendimento', sql.Float, 0)
        .query(`
          INSERT INTO folhas_corrida (
            id, data, forneiro, supervisor, turno, solido, liquido, corrida, corrida_forno_1, corrida_forno_2,
            forno_ligou, desligou, inicio_vazamento, final_vazamento, alto_forno, cubilo,
            destino_f1, destino_f2, destino_f3, destino_f4, assinado_por, peso_total, rendimento,
            created_at, updated_at
          ) VALUES (
            @id, @data, @forneiro, @supervisor, @turno, @solido, @liquido, @corrida, @corrida_forno_1, @corrida_forno_2,
            @forno_ligou, @desligou, @inicio_vazamento, @final_vazamento, @alto_forno, @cubilo,
            @destino_f1, @destino_f2, @destino_f3, @destino_f4, @assinado_por, @peso_total, @rendimento,
            GETDATE(), GETDATE()
          )
        `);
    }

    // 2. Rastreabilidade
    console.log('Importing Rastreabilidade.xlsx...');
    const rasWb = XLSX.readFile(path.join(basePath, 'Rastreabilidade.xlsx'));
    const rasData = XLSX.utils.sheet_to_json(rasWb.Sheets[rasWb.SheetNames[0]]);
    for (let row of rasData) {
      if (!row['folha_id'] || !validFolhas.has(String(row['folha_id']))) continue;
      await pool.request()
        .input('folha_id', sql.VarChar, String(row['folha_id']))
        .input('linha', sql.Int, 1)
        .input('num_peca', sql.VarChar, parseStringSafe(row['N° da Peça']))
        .input('rastreabilidade', sql.VarChar, parseStringSafe(row['Rastreabilidade']))
        .input('panela', sql.Int, row['Panela'] || null)
        .input('quant_molde', sql.Int, row['Quant.\r\nMolde vazado'] || null)
        .input('temp_forno', sql.Float, parseFloatSafe(row['Temperatura do\r\nForno']))
        .input('inicio_tratam', sql.VarChar, excelTimeToString(row['Início de tratamento ( nodul./ inoculação)']))
        .input('tempo_enchim', sql.VarChar, typeof row['Tempo de enchimento panela (s)'] === 'number' ? excelTimeToString(row['Tempo de enchimento panela (s)']) : parseStringSafe(row['Tempo de enchimento panela (s)']))
        .input('peso_metal', sql.Float, parseFloatSafe(row['Peso do metal (Kg)']))
        .input('reacao_inicio', sql.VarChar, excelTimeToString(row['Início']))
        .input('reacao_fim', sql.VarChar, excelTimeToString(row['Fim']))
        .input('temp_vaz_inicial', sql.Float, parseFloatSafe(row['Temperatura de vazamento inicial']))
        .input('temp_vaz_final', sql.Float, parseFloatSafe(row['Temperatura de vazamento final']))
        .input('final_vaz', sql.VarChar, excelTimeToString(row['Final Vazamento']))
        .input('fading', sql.VarChar, parseStringSafe(row['Fading(min)']))
        .input('fundicao', sql.VarChar, parseStringSafe(row['Fundição']))
        .query(`
          INSERT INTO rastreabilidade (
            folha_id, linha, num_peca, rastreabilidade, panela, quant_molde, temp_forno,
            inicio_tratam, tempo_enchim, peso_metal, reacao_inicio, reacao_fim,
            temp_vaz_inicial, temp_vaz_final, final_vaz, fading, fundicao
          ) VALUES (
            @folha_id, @linha, @num_peca, @rastreabilidade, @panela, @quant_molde, @temp_forno,
            @inicio_tratam, @tempo_enchim, @peso_metal, @reacao_inicio, @reacao_fim,
            @temp_vaz_inicial, @temp_vaz_final, @final_vaz, @fading, @fundicao
          )
        `);
    }

    // 3. Enfornamento
    console.log('Importing enfornamento.xlsx (grouped by linha)...');
    const enfWb = XLSX.readFile(path.join(basePath, 'enfornamento.xlsx'));
    const enfDataRaw = XLSX.utils.sheet_to_json(enfWb.Sheets[enfWb.SheetNames[0]]);
    const enfCols = [
      'Gusa Nodular_lote', 'gusa_nodular_peso', 'Canal Nodular_lote', 'canal_nodular_peso',
      'Ferro Gusa Sólido\r\nAciaria (AF – interno)_lote', 'ferro_gusa_peso', 'sucata_peca_peso',
      'Gusa Líquido_lote', 'gusa_liquido_peso', 'lingote_peso',
      'Sucata Oxicorte_lote', 'sucata_oxicorte_peso', 'Sucata de Aço_lote', 'sucata_aco_peso'
    ];
    const enfData = buildGroups(enfDataRaw, 'ID', 'Linha', enfCols).filter(r => validFolhas.has(r.folha_id));
    
    for (let row of enfData) {
      await pool.request()
        .input('folha_id', sql.VarChar, row.folha_id)
        .input('linha', sql.Int, row.linha)
        .input('gusa_nodular_lote', sql.VarChar, parseStringSafe(row['Gusa Nodular_lote']))
        .input('gusa_nodular_peso', sql.Float, parseFloatSafe(row['gusa_nodular_peso']))
        .input('canal_nodular_lote', sql.VarChar, parseStringSafe(row['Canal Nodular_lote']))
        .input('canal_nodular_peso', sql.Float, parseFloatSafe(row['canal_nodular_peso']))
        .input('ferro_gusa_lote', sql.VarChar, parseStringSafe(row['Ferro Gusa Sólido\r\nAciaria (AF – interno)_lote']))
        .input('ferro_gusa_peso', sql.Float, parseFloatSafe(row['ferro_gusa_peso']))
        .input('sucata_peca_peso', sql.Float, parseFloatSafe(row['sucata_peca_peso']))
        .input('gusa_liquido_lote', sql.VarChar, parseStringSafe(row['Gusa Líquido_lote']))
        .input('gusa_liquido_peso', sql.Float, parseFloatSafe(row['gusa_liquido_peso']))
        .input('lingote_peso', sql.Float, parseFloatSafe(row['lingote_peso']))
        .input('sucata_oxicorte_lote', sql.VarChar, parseStringSafe(row['Sucata Oxicorte_lote']))
        .input('sucata_oxicorte_peso', sql.Float, parseFloatSafe(row['sucata_oxicorte_peso']))
        .input('sucata_aco_lote', sql.VarChar, parseStringSafe(row['Sucata de Aço_lote']))
        .input('sucata_aco_peso', sql.Float, parseFloatSafe(row['sucata_aco_peso']))
        .query(`
          INSERT INTO enfornamento (
            folha_id, linha,
            gusa_nodular_lote, gusa_nodular_peso,
            canal_nodular_lote, canal_nodular_peso,
            ferro_gusa_lote, ferro_gusa_peso,
            sucata_peca_peso,
            gusa_liquido_lote, gusa_liquido_peso,
            lingote_peso,
            sucata_oxicorte_lote, sucata_oxicorte_peso,
            sucata_aco_lote, sucata_aco_peso
          ) VALUES (
            @folha_id, @linha,
            @gusa_nodular_lote, @gusa_nodular_peso,
            @canal_nodular_lote, @canal_nodular_peso,
            @ferro_gusa_lote, @ferro_gusa_peso,
            @sucata_peca_peso,
            @gusa_liquido_lote, @gusa_liquido_peso,
            @lingote_peso,
            @sucata_oxicorte_lote, @sucata_oxicorte_peso,
            @sucata_aco_lote, @sucata_aco_peso
          )
        `);
    }

    // 4. Correcao Metal
    console.log('Importing correcao_metal.xlsx (grouped by linha)...');
    const corrWb = XLSX.readFile(path.join(basePath, 'correcao_metal.xlsx'));
    const corrDataRaw = XLSX.utils.sheet_to_json(corrWb.Sheets[corrWb.SheetNames[0]]);
    const corrCols = [
      'sucata_aco_lote', 'sucata_aco_peso', 'femn_lote', 'femn_peso',
      'fesi_pedra_lote', 'fesi_pedra_peso', 'fecr_lote', 'fecr_peso',
      'carburante_lote', 'carburante_peso', 'sn_lote', 'sn_peso',
      'cu_lote', 'cu_peso', 'pirita_s_lote', 'pirita_s_peso',
      'nucleante_lote', 'nucleante_peso'
    ];
    const corrData = buildGroups(corrDataRaw, 'ID', 'Linha', corrCols).filter(r => validFolhas.has(r.folha_id));
    
    for (let row of corrData) {
      await pool.request()
        .input('folha_id', sql.VarChar, row.folha_id)
        .input('linha', sql.Int, row.linha)
        .input('sucata_aco_lote', sql.VarChar, parseStringSafe(row['sucata_aco_lote']))
        .input('sucata_aco_peso', sql.Float, parseFloatSafe(row['sucata_aco_peso']))
        .input('femn_lote', sql.VarChar, parseStringSafe(row['femn_lote']))
        .input('femn_peso', sql.Float, parseFloatSafe(row['femn_peso']))
        .input('fesi_pedra_lote', sql.VarChar, parseStringSafe(row['fesi_pedra_lote']))
        .input('fesi_pedra_peso', sql.Float, parseFloatSafe(row['fesi_pedra_peso']))
        .input('fecr_lote', sql.VarChar, parseStringSafe(row['fecr_lote']))
        .input('fecr_peso', sql.Float, parseFloatSafe(row['fecr_peso']))
        .input('carburante_lote', sql.VarChar, parseStringSafe(row['carburante_lote']))
        .input('carburante_peso', sql.Float, parseFloatSafe(row['carburante_peso']))
        .input('sn_lote', sql.VarChar, parseStringSafe(row['sn_lote']))
        .input('sn_peso', sql.Float, parseFloatSafe(row['sn_peso']))
        .input('cu_lote', sql.VarChar, parseStringSafe(row['cu_lote']))
        .input('cu_peso', sql.Float, parseFloatSafe(row['cu_peso']))
        .input('pirita_s_lote', sql.VarChar, parseStringSafe(row['pirita_s_lote']))
        .input('pirita_s_peso', sql.Float, parseFloatSafe(row['pirita_s_peso']))
        .input('nucleante_lote', sql.VarChar, parseStringSafe(row['nucleante_lote']))
        .input('nucleante_peso', sql.Float, parseFloatSafe(row['nucleante_peso']))
        .query(`
          INSERT INTO correcao_metal (
            folha_id, linha,
            sucata_aco_lote, sucata_aco_peso,
            femn_lote, femn_peso,
            fesi_pedra_lote, fesi_pedra_peso,
            fecr_lote, fecr_peso,
            carburante_lote, carburante_peso,
            sn_lote, sn_peso,
            cu_lote, cu_peso,
            pirita_s_lote, pirita_s_peso,
            nucleante_lote, nucleante_peso
          ) VALUES (
            @folha_id, @linha,
            @sucata_aco_lote, @sucata_aco_peso,
            @femn_lote, @femn_peso,
            @fesi_pedra_lote, @fesi_pedra_peso,
            @fecr_lote, @fecr_peso,
            @carburante_lote, @carburante_peso,
            @sn_lote, @sn_peso,
            @cu_lote, @cu_peso,
            @pirita_s_lote, @pirita_s_peso,
            @nucleante_lote, @nucleante_peso
          )
        `);
    }

    // 5. Analise Termica
    console.log('Importing analise_termica.xlsx (Acrescentar1)...');
    const analiseWb = XLSX.readFile(path.join(basePath, 'analise_termica.xlsx'));
    if (analiseWb.Sheets['Acrescentar1']) {
      const analiseData = XLSX.utils.sheet_to_json(analiseWb.Sheets['Acrescentar1']);
      for (let row of analiseData) {
        if (!row['folha_id'] || !validFolhas.has(String(row['folha_id']))) continue;
        let recVal = parseStringSafe(row['rec']);
        if (recVal) recVal = recVal.replace(/\./g, ',');
        let tseVal = parseStringSafe(row['tse']);
        if (tseVal) tseVal = tseVal.replace(/\./g, ',');

        await pool.request()
          .input('folha_id', sql.VarChar, String(row['folha_id']))
          .input('tipo', sql.VarChar, parseStringSafe(row['tipo']))
          .input('linha', sql.Int, 1)
          .input('familia', sql.VarChar, parseStringSafe(row['familia']))
          .input('tse', sql.VarChar, tseVal)
          .input('rec', sql.VarChar, recVal)
          .query(`
            INSERT INTO analise_termica (folha_id, tipo, linha, familia, tse, rec)
            VALUES (@folha_id, @tipo, @linha, @familia, @tse, @rec)
          `);
      }
    }

    // 6. Ligas
    console.log('Importing ligas.xlsx (grouped by linha)...');
    const ligasWb = XLSX.readFile(path.join(basePath, 'ligas.xlsx'));
    const ligasDataRaw = XLSX.utils.sheet_to_json(ligasWb.Sheets[ligasWb.SheetNames[0]]);
    const ligasCols = [
      'fesi_pedra_lote', 'fesi_pedra_peso', 'FeMn_lote', 'FeMn_peso',
      'FeCr_lote', 'FeCr_peso', 'Pirita_s_lote', 'Pirita_s_peso',
      'Cu_lote', 'Cu_peso', 'Sn_lote', 'Sn_peso',
      'Consumo_lote', 'Consumo_peso', 'carburante_lote', 'Carburante_peso'
    ];
    const ligasData = buildGroups(ligasDataRaw, 'ID', 'Linha', ligasCols).filter(r => validFolhas.has(r.folha_id));

    for (let row of ligasData) {
      await pool.request()
        .input('folha_id', sql.VarChar, row.folha_id)
        .input('linha', sql.Int, row.linha)
        .input('fesi_pedra_lote', sql.VarChar, parseStringSafe(row['fesi_pedra_lote']))
        .input('fesi_pedra_peso', sql.Float, parseFloatSafe(row['fesi_pedra_peso']))
        .input('femn_lote', sql.VarChar, parseStringSafe(row['FeMn_lote']))
        .input('femn_peso', sql.Float, parseFloatSafe(row['FeMn_peso']))
        .input('fecr_lote', sql.VarChar, parseStringSafe(row['FeCr_lote']))
        .input('fecr_peso', sql.Float, parseFloatSafe(row['FeCr_peso']))
        .input('pirita_s_lote', sql.VarChar, parseStringSafe(row['Pirita_s_lote']))
        .input('pirita_s_peso', sql.Float, parseFloatSafe(row['Pirita_s_peso']))
        .input('cu_lote', sql.VarChar, parseStringSafe(row['Cu_lote']))
        .input('cu_peso', sql.Float, parseFloatSafe(row['Cu_peso']))
        .input('sn_lote', sql.VarChar, parseStringSafe(row['Sn_lote']))
        .input('sn_peso', sql.Float, parseFloatSafe(row['Sn_peso']))
        .input('consumo_lote', sql.VarChar, parseStringSafe(row['Consumo_lote']))
        .input('consumo_peso', sql.Float, parseFloatSafe(row['Consumo_peso']))
        .input('carburante_lote', sql.VarChar, parseStringSafe(row['carburante_lote']))
        .input('carburante_peso', sql.Float, parseFloatSafe(row['Carburante_peso']))
        .query(`
          INSERT INTO ligas (
            folha_id, linha,
            fesi_pedra_lote, fesi_pedra_peso,
            femn_lote, femn_peso,
            fecr_lote, fecr_peso,
            pirita_s_lote, pirita_s_peso,
            cu_lote, cu_peso,
            sn_lote, sn_peso,
            consumo_lote, consumo_peso,
            carburante_lote, carburante_peso
          ) VALUES (
            @folha_id, @linha,
            @fesi_pedra_lote, @fesi_pedra_peso,
            @femn_lote, @femn_peso,
            @fecr_lote, @fecr_peso,
            @pirita_s_lote, @pirita_s_peso,
            @cu_lote, @cu_peso,
            @sn_lote, @sn_peso,
            @consumo_lote, @consumo_peso,
            @carburante_lote, @carburante_peso
          )
        `);
    }

    // 7. Saidas
    console.log('Importing saidas.xlsx...');
    const saidasWb = XLSX.readFile(path.join(basePath, 'saidas.xlsx'));
    const saidasData = XLSX.utils.sheet_to_json(saidasWb.Sheets[saidasWb.SheetNames[0]]);
    for (let row of saidasData) {
      if (!row['ID'] || !validFolhas.has(String(row['ID']))) continue;
      let tipo = parseStringSafe(row['Produto']);
      if (tipo) {
        if (tipo.toLowerCase() === 'sobra de metal') tipo = 'sobra_metal';
        else if (tipo.toLowerCase() === 'lingotamento') tipo = 'lingotamento';
      }
      await pool.request()
        .input('folha_id', sql.VarChar, String(row['ID']))
        .input('tipo', sql.VarChar, tipo)
        .input('peso_kg', sql.Float, parseFloatSafe(row['Peso (kg)']))
        .input('linha', sql.Int, parseInt(row['Linha'] || 1))
        .query(`
          INSERT INTO saidas (folha_id, tipo, peso_kg, linha)
          VALUES (@folha_id, @tipo, @peso_kg, @linha)
        `);
    }

    // 8. Tratamento Metal
    console.log('Importing tratamento_metal.xlsx...');
    const tmWb = XLSX.readFile(path.join(basePath, 'tratamento_metal.xlsx'));
    const tmData = XLSX.utils.sheet_to_json(tmWb.Sheets[tmWb.SheetNames[0]]);
    for (let row of tmData) {
      if (!row['folha_id'] || !validFolhas.has(String(row['folha_id']))) continue;
      await pool.request()
        .input('folha_id', sql.VarChar, String(row['folha_id']))
        .input('panela_num', sql.Int, parseInt(row['Linha'] || row['linha']) || 1)
        .input('inoculante', sql.VarChar, parseStringSafe(row['Inoculante']))
        .input('inoc_lote', sql.VarChar, parseStringSafe(row['inoc_lote']))
        .input('inoc_peso', sql.Float, parseFloatSafe(row['inoc_peso']))
        .input('nodularizante', sql.VarChar, parseStringSafe(row['Nodularizante']))
        .input('nodul_lote', sql.VarChar, parseStringSafe(row['nodul_lote']))
        .input('nodul_peso', sql.Float, parseFloatSafe(row['nodul_peso']))
        .input('peso_sucatinha', sql.Float, parseFloatSafe(row['peso_sucatinha']))
        .input('peso_metal', sql.Float, parseFloatSafe(row['peso_metal']))
        .input('familia', sql.VarChar, parseStringSafe(row['Familia']))
        .input('carbomax', sql.VarChar, parseStringSafe(row['% CarboMax'] || row['%CarboMax']))
        .input('hora', sql.VarChar, typeof row['hora'] === 'number' ? excelTimeToString(row['hora']) : parseStringSafe(row['hora']))
        .query(`
          INSERT INTO tratamento_metal (
            folha_id, panela_num, inoculante, inoc_lote, inoc_peso,
            nodularizante, nodul_lote, nodul_peso, peso_sucatinha, peso_metal,
            familia, carbomax, hora
          ) VALUES (
            @folha_id, @panela_num, @inoculante, @inoc_lote, @inoc_peso,
            @nodularizante, @nodul_lote, @nodul_peso, @peso_sucatinha, @peso_metal,
            @familia, @carbomax, @hora
          )
        `);
    }

    console.log('Calculating peso_total and rendimento...');
    await pool.request().query(`
      UPDATE folhas_corrida
      SET peso_total = COALESCE((
          SELECT SUM(gusa_nodular_peso + canal_nodular_peso + ferro_gusa_peso + sucata_peca_peso + 
                     gusa_liquido_peso + lingote_peso + sucata_oxicorte_peso + 
                     sucata_aco_peso)
          FROM enfornamento WHERE folha_id = folhas_corrida.id
        ), 0) +
        COALESCE((
          SELECT SUM(fesi_pedra_peso + femn_peso + fecr_peso + pirita_s_peso +
                     cu_peso + sucata_cu_peso + sn_peso + consumo_peso + carburante_peso)
          FROM ligas WHERE folha_id = folhas_corrida.id
        ), 0) +
        COALESCE((
          SELECT SUM(nucleante_peso + sucata_aco_peso + femn_peso + fesi_pedra_peso +
                     fecr_peso + carburante_peso + sn_peso + cu_peso + pirita_s_peso +
                     sucata_oxicorte_peso + sucata_cu_peso)
          FROM correcao_metal WHERE folha_id = folhas_corrida.id
        ), 0) +
        COALESCE((
          SELECT SUM(inoc_peso + nodul_peso + peso_sucatinha)
          FROM tratamento_metal WHERE folha_id = folhas_corrida.id
        ), 0)
    `);

    await pool.request().query(`
      UPDATE folhas_corrida
      SET rendimento = 
      CASE WHEN peso_total > 0 THEN
        ((
          COALESCE((SELECT SUM(peso_metal) FROM rastreabilidade WHERE folha_id = folhas_corrida.id), 0) +
          COALESCE((SELECT SUM(peso_kg) FROM saidas WHERE folha_id = folhas_corrida.id), 0)
        ) / peso_total) * 100
      ELSE 0 END
    `);

    console.log('Data import complete!');

  } catch (e) {
    console.error('Error during import:', e);
  } finally {
    sql.close();
  }
}

run();
