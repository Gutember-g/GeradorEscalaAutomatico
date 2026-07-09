export const formatarDataComDiaSemana = (dataStr: string): string => {
  if (!dataStr) return '';
  const date = new Date(dataStr + 'T00:00:00');
  const diasSemana = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  const diaSemana = diasSemana[date.getDay()];
  return `${dia}/${mes}/${ano} - ${diaSemana}`;
};

export const obterDatasMesAtual = () => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth(); // 0-indexed
  
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  
  const formatar = (d: Date) => {
    const dia = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${dia}`;
  };
  
  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  const nomeMes = mesesNomes[mes];
  
  return {
    inicio: formatar(primeiroDia),
    fim: formatar(ultimoDia),
    nomeEscala: `Escala ${nomeMes}/${ano}`
  };
};
