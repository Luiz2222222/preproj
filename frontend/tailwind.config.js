/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'cor-fundo': 'rgb(var(--cor-fundo) / <alpha-value>)',
        'cor-superficie': 'rgb(var(--cor-superficie) / <alpha-value>)',
        'cor-texto': 'rgb(var(--cor-texto) / <alpha-value>)',
        'cor-texto-medio': 'rgb(var(--cor-texto-medio) / <alpha-value>)',
        'cor-destaque': 'rgb(var(--cor-destaque) / <alpha-value>)',
        'cor-sucesso': 'rgb(var(--cor-sucesso) / <alpha-value>)',
        'cor-alerta': 'rgb(var(--cor-alerta) / <alpha-value>)',
        'cor-erro': 'rgb(var(--cor-erro) / <alpha-value>)',
        'cor-borda': 'rgb(var(--cor-borda) / <alpha-value>)',
        'cor-fase1-cabecalho': 'rgb(var(--cor-fase1-cabecalho) / <alpha-value>)',
        'cor-fase1-linha': 'rgb(var(--cor-fase1-linha) / <alpha-value>)',
        'cor-fase2-cabecalho': 'rgb(var(--cor-fase2-cabecalho) / <alpha-value>)',
        'cor-fase2-linha': 'rgb(var(--cor-fase2-linha) / <alpha-value>)',
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e'
        },
        secondary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843'
        },
      },
      fontSize: {
        pequeno: 'var(--tamanho-fonte-pequeno)',
        medio: 'var(--tamanho-fonte-medio)',
        grande: 'var(--tamanho-fonte-grande)',
      },
      borderRadius: {
        padrao: 'var(--raio-borda-padrao)',
      },
      spacing: {
        xxs: 'var(--espacamento-xxs)',
        xs: 'var(--espacamento-xs)',
        sm: 'var(--espacamento-sm)',
        md: 'var(--espacamento-md)',
        lg: 'var(--espacamento-lg)',
        xl: 'var(--espacamento-xl)',
      },
    },
  },
  plugins: [],
}
