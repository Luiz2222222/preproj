import { useRef, useEffect, useState, type TextareaHTMLAttributes } from 'react';

interface TextareaAutoResizeProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'ref'> {
  value: string;
}

/**
 * Textarea com auto-resize e redimensionamento pela borda inferior inteira
 */
export function TextareaAutoResize({ value, className = '', ...props }: TextareaAutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Auto-resize baseado no conteúdo
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

  // Handle resize manual pela borda inferior
  useEffect(() => {
    const container = containerRef.current;
    const textarea = textareaRef.current;
    if (!container || !textarea) return;

    let startY = 0;
    let startHeight = 0;

    const handleMouseDown = (e: MouseEvent) => {
      // Verificar se clicou na área da borda inferior (últimos 8px)
      const rect = container.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const containerHeight = rect.height;

      if (clickY >= containerHeight - 8) {
        e.preventDefault();
        setIsResizing(true);
        startY = e.clientY;
        startHeight = textarea.offsetHeight;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const delta = e.clientY - startY;
      const newHeight = Math.max(startHeight + delta, 60); // mínimo de 60px
      textarea.style.height = `${newHeight}px`;
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    container.addEventListener('mousedown', handleMouseDown);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ cursor: isResizing ? 'row-resize' : 'default' }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        className={`${className} resize-none`}
        {...props}
      />
      {/* Borda inferior interativa para resize */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-row-resize hover:bg-blue-500/10 transition-colors"
        style={{ pointerEvents: isResizing ? 'none' : 'auto' }}
      />
    </div>
  );
}
