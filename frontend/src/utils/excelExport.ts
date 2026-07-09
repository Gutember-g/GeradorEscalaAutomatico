import ExcelJS from 'exceljs';
import { formatarDataComDiaSemana } from './dateUtils';

export interface ExcelEventData {
  data: string;       // YYYY-MM-DD
  horaInicio: string; // HH:MM:SS or HH:MM
  corLiturgica?: string;
  nome: string;       // Programação Paroquial
  ministros: string[];
}

export const exportarEscalaParaExcel = async (nomeEscala: string, eventos: ExcelEventData[]) => {
  if (eventos.length === 0) return;

  // Deduplicar eventos por data, hora de início e nome para evitar repetições no Excel
  const eventosUnicos = eventos.filter((e, idx, self) =>
    self.findIndex(x =>
      x.data === e.data &&
      x.horaInicio.slice(0, 5) === e.horaInicio.slice(0, 5) &&
      x.nome.toLowerCase().trim() === e.nome.toLowerCase().trim()
    ) === idx
  );

  // Ordenar os eventos por data e depois por hora de início
  const eventosOrdenados = [...eventosUnicos].sort(
    (a, b) => a.data.localeCompare(b.data) || a.horaInicio.localeCompare(b.horaInicio)
  );

  // Extrair o Mês/Ano do nome da escala para o título (ex: "JULHO/2026")
  const mesAno = nomeEscala.replace(/escala\s+/i, '').toUpperCase();

  // Calcular número máximo de ministros para dimensionar colunas
  const maxMinistros = Math.max(...eventosOrdenados.map(e => e.ministros.length), 1);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Escala');

  // Configurar largura das colunas
  worksheet.getColumn(1).width = 14; // Data
  worksheet.getColumn(2).width = 16; // Dia da Semana
  worksheet.getColumn(3).width = 10; // Horário
  worksheet.getColumn(4).width = 15; // Cor Litúrgica
  worksheet.getColumn(5).width = 30; // Programação Paroquial
  for (let m = 0; m < maxMinistros; m++) {
    worksheet.getColumn(6 + m).width = 18; // Ministro colunas
  }

  // 1. Cabeçalho do documento (Linhas 1 e 2)
  const totalColunas = 5 + maxMinistros;
  worksheet.mergeCells(1, 1, 1, totalColunas);
  worksheet.mergeCells(2, 1, 2, totalColunas);

  const celulaTitulo1 = worksheet.getCell(1, 1);
  celulaTitulo1.value = 'ESCALA DE MINISTROS EXTRAORDINÁRIOS';
  celulaTitulo1.font = { name: 'Arial', size: 14, bold: true, color: { argb: '000000' } };
  celulaTitulo1.alignment = { horizontal: 'center', vertical: 'middle' };

  const celulaTitulo2 = worksheet.getCell(2, 1);
  celulaTitulo2.value = mesAno;
  celulaTitulo2.font = { name: 'Arial', size: 11, bold: true, color: { argb: '555555' } };
  celulaTitulo2.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.getRow(1).height = 28;
  worksheet.getRow(2).height = 20;

  // 2. Cabeçalho da Tabela (Linhas 3 e 4)
  worksheet.mergeCells(3, 1, 4, 1); // Data
  worksheet.mergeCells(3, 2, 4, 2); // Dia da Semana
  worksheet.mergeCells(3, 3, 4, 3); // Horário
  worksheet.mergeCells(3, 4, 4, 4); // Cor Litúrgica
  worksheet.mergeCells(3, 5, 4, 5); // Programação Paroquial

  if (maxMinistros > 1) {
    worksheet.mergeCells(3, 6, 3, 5 + maxMinistros); // Ministros
  }

  const r3 = worksheet.getRow(3);
  r3.getCell(1).value = 'Data';
  r3.getCell(2).value = 'Dia da Semana';
  r3.getCell(3).value = 'Horário';
  r3.getCell(4).value = 'Cor Litúrgica';
  r3.getCell(5).value = 'Programação Paroquial';
  r3.getCell(6).value = 'Ministros';

  const r4 = worksheet.getRow(4);
  for (let m = 0; m < maxMinistros; m++) {
    r4.getCell(6 + m).value = maxMinistros === 1 ? 'Ministro' : `Ministro ${m + 1}`;
  }

  // Estilo do cabeçalho da tabela
  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '800000' } // Vermelho escuro
  };
  const headerFont = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  const headerAlignment = { horizontal: 'center', vertical: 'middle', wrapText: true } as any;
  const headerBorder = {
    top: { style: 'thin', color: { argb: 'CCCCCC' } },
    left: { style: 'thin', color: { argb: 'CCCCCC' } },
    bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
    right: { style: 'thin', color: { argb: 'CCCCCC' } }
  } as any;

  [3, 4].forEach(rowNum => {
    const row = worksheet.getRow(rowNum);
    row.height = 22;
    for (let col = 1; col <= totalColunas; col++) {
      const cell = row.getCell(col);
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = headerAlignment;
      cell.border = headerBorder;
    }
  });

  // 3. Preencher dados dos Eventos
  const startRow = 5;
  const borderStyle = {
    top: { style: 'thin', color: { argb: 'E0E0E0' } },
    left: { style: 'thin', color: { argb: 'E0E0E0' } },
    bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
    right: { style: 'thin', color: { argb: 'E0E0E0' } }
  } as any;

  const getCorStyle = (cor?: string) => {
    switch (cor) {
      case 'Branco': return { fg: 'FFFFFF', text: '333333' };
      case 'Vermelho': return { fg: 'D9534F', text: 'FFFFFF' };
      case 'Verde': return { fg: '5CB85C', text: 'FFFFFF' };
      case 'Roxo': return { fg: '6F42C1', text: 'FFFFFF' };
      case 'Rosa': return { fg: 'F06292', text: 'FFFFFF' };
      case 'Dourado': return { fg: 'FFC107', text: '000000' };
      default: return { fg: 'F8F9FA', text: '666666' };
    }
  };

  eventosOrdenados.forEach((e, idx) => {
    const rowNum = startRow + idx;
    const row = worksheet.getRow(rowNum);
    row.height = 24;

    const dataFormatada = new Date(e.data + 'T00:00:00').toLocaleDateString('pt-BR');
    const diaSemanaStr = formatarDataComDiaSemana(e.data).split(' - ')[1] || '';

    row.getCell(1).value = dataFormatada;
    row.getCell(2).value = diaSemanaStr;
    row.getCell(3).value = e.horaInicio.slice(0, 5);
    row.getCell(4).value = e.corLiturgica || 'Branco';
    row.getCell(5).value = e.nome;

    // Preencher ministros
    for (let m = 0; m < maxMinistros; m++) {
      row.getCell(6 + m).value = e.ministros[m] || '';
    }

    // Estilizar células da linha de dados
    for (let col = 1; col <= totalColunas; col++) {
      const cell = row.getCell(col);
      cell.border = borderStyle;
      cell.font = { name: 'Arial', size: 10 };

      // Alinhamento padrão
      if (col <= 4) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }

      // Estilizar cor litúrgica
      if (col === 4) {
        const { fg, text } = getCorStyle(e.corLiturgica);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: fg }
        };
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: text } };
      }
    }
  });

  // 4. Mesclagem Vertical para Data e Dia da Semana
  let i = startRow;
  while (i < startRow + eventosOrdenados.length) {
    let j = i + 1;
    while (
      j < startRow + eventosOrdenados.length &&
      eventosOrdenados[j - startRow].data === eventosOrdenados[i - startRow].data
    ) {
      j++;
    }

    if (j - i > 1) {
      // Mesclar coluna Data (1)
      worksheet.mergeCells(i, 1, j - 1, 1);
      const cellData = worksheet.getCell(i, 1);
      cellData.alignment = { horizontal: 'center', vertical: 'middle' };

      // Mesclar coluna Dia da Semana (2)
      worksheet.mergeCells(i, 2, j - 1, 2);
      const cellDia = worksheet.getCell(i, 2);
      cellDia.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    i = j;
  }

  // 5. Escrever buffer e disparar download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  
  // Nome do arquivo amigável: Escala_Ministros_Julho_2026.xlsx
  const cleanName = nomeEscala
    .replace(/escala\s+/i, '')
    .replace(/[\/\s]+/g, '_');
  anchor.download = `Escala_Ministros_${cleanName}.xlsx`;
  
  anchor.click();
  window.URL.revokeObjectURL(url);
};
