import { useEffect, useRef } from 'react';

/**
 * Hook para fazer textarea crescer automaticamente conforme o conteúdo
 * Mantém um tamanho mínimo de 3 linhas e permite resize manual
 */
export function useAutoResizeTextarea(value: string) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height para calcular scrollHeight corretamente
    textarea.style.height = 'auto';

    // Calcula a altura mínima (3 linhas)
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
    const minHeight = lineHeight * 3 + parseInt(window.getComputedStyle(textarea).paddingTop) * 2;

    // Define a altura como o maior entre scrollHeight e minHeight
    const newHeight = Math.max(textarea.scrollHeight, minHeight);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  return textareaRef;
}
