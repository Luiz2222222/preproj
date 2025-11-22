/**
 * Formata uma data em formato relativo (ex: "há 5 minutos", "há 2 horas", "há 3 dias")
 */
export function formatarDataRelativa(dataISO: string): string {
  const agora = new Date();
  const data = new Date(dataISO);
  const diferencaMs = agora.getTime() - data.getTime();
  const diferencaSeg = Math.floor(diferencaMs / 1000);
  const diferencaMin = Math.floor(diferencaSeg / 60);
  const diferencaHora = Math.floor(diferencaMin / 60);
  const diferencaDia = Math.floor(diferencaHora / 24);
  const diferencaSemana = Math.floor(diferencaDia / 7);
  const diferencaMes = Math.floor(diferencaDia / 30);
  const diferencaAno = Math.floor(diferencaDia / 365);

  if (diferencaSeg < 60) {
    return 'agora mesmo';
  } else if (diferencaMin < 60) {
    return `há ${diferencaMin} minuto${diferencaMin > 1 ? 's' : ''}`;
  } else if (diferencaHora < 24) {
    return `há ${diferencaHora} hora${diferencaHora > 1 ? 's' : ''}`;
  } else if (diferencaDia < 7) {
    return `há ${diferencaDia} dia${diferencaDia > 1 ? 's' : ''}`;
  } else if (diferencaSemana < 4) {
    return `há ${diferencaSemana} semana${diferencaSemana > 1 ? 's' : ''}`;
  } else if (diferencaMes < 12) {
    return `há ${diferencaMes} ${diferencaMes === 1 ? 'mês' : 'meses'}`;
  } else {
    return `há ${diferencaAno} ano${diferencaAno > 1 ? 's' : ''}`;
  }
}

/**
 * Formata o código de curso para o nome amigável com acentuação
 */
export function formatarCurso(codigo: string | null | undefined): string {
  if (!codigo) return '';

  const cursos: Record<string, string> = {
    'ENGENHARIA_ELETRICA': 'Engenharia Elétrica',
    'ENGENHARIA_CONTROLE_AUTOMACAO': 'Engenharia de Controle e Automação',
  };

  return cursos[codigo] || codigo;
}
