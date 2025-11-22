/**
 * Formata uma data para o formato curto dd/MM/yyyy
 * @param valor Data no formato ISO (YYYY-MM-DD) ou null/undefined
 * @returns Data formatada ou "--" se vazio
 */
export const formatarDataCurta = (valor?: string | null): string => {
  if (!valor) return '--';

  try {
    const [ano, mes, dia] = valor.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
  } catch {
    return '--';
  }
};

/**
 * Formata intervalo de datas
 * @param dataInicio Data inicial
 * @param dataFim Data final
 * @returns Intervalo formatado ou "--" se ambas vazias
 */
export const formatarIntervalo = (dataInicio?: string | null, dataFim?: string | null): string => {
  const inicio = formatarDataCurta(dataInicio);
  const fim = formatarDataCurta(dataFim);

  if (inicio === '--' && fim === '--') return '--';
  if (inicio === '--') return `até ${fim}`;
  if (fim === '--') return `a partir de ${inicio}`;

  return `${inicio} → ${fim}`;
};
