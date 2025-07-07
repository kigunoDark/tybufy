import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { HelpCircle } from "lucide-react";

// Решение 1: Tooltip с порталом (рекомендуемое)
export const HelpButtonWithTooltip = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);

  const tooltipContent = `Горячие клавиши:
• Ctrl + Колесо мыши - Зум (фокус на курсор)
• Shift + Колесо мыши - Горизонтальная прокрутка
• Колесо мыши - Вертикальная прокрутка
• Двойной клик - Добавить элемент в позицию клика
• Ctrl + C - Копировать
• Ctrl + V - Вставить
• Ctrl + B - Разрезать
• Del/Backspace - Удалить
• + - Приблизить
• - - Отдалить
• 0 - Сбросить зум

Умное размещение:
• Видео → Main дорожка
• Аудио → Audio дорожка  
• Картинки/Текст → Overlay дорожка
• Автоматический поиск лучшей позиции
• Размещение в текущем времени или после последнего элемента`;

  const updateTooltipPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8, // немного выше кнопки
      });
    }
  };

  const handleMouseEnter = () => {
    updateTooltipPosition();
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (showTooltip) {
        updateTooltipPosition();
      }
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [showTooltip]);

  const tooltip = showTooltip && (
    <div
      className="fixed z-[9999] p-6 w-[400px] pointer-events-none"
      style={{
        left: tooltipPosition.x,
        top: tooltipPosition.y,
        transform: "translate(-80%, -100%)",
      }}
    >
      <div className="bg-gray-900 text-white text-sm rounded-lg p-3 shadow-xl max-w-md whitespace-pre-line">
        {tooltipContent}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
      >
        <HelpCircle size={16} />
      </button>

      {/* Рендерим tooltip в body через портал */}
      {typeof document !== "undefined" && createPortal(tooltip, document.body)}
    </>
  );
};
