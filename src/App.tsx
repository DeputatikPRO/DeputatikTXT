import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FolderOpen,
  Download,
  Sun,
  Moon,
  Trash2,
  FileText,
  Settings,
  X,
  Search,
  Replace,
  Printer,
  ChevronUp,
  ChevronDown,
  CaseSensitive
} from 'lucide-react';

export default function App() {
  const [fileName, setFileName] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<number>(15);
  const [wordWrap, setWordWrap] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Состояния для поиска и замены
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [showReplaceRow, setShowReplaceRow] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const charCount = content.length;
  const wordCount = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
  const lineCount = content === '' ? 1 : content.split(/\r\n|\r|\n/).length;

  const showToast = (msg: string) => {
    setStatusMessage(msg);
  };

  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  // Находим все совпадения в тексте
  const matches = useMemo(() => {
    if (!searchQuery) return [];
    const results: number[] = [];
    const source = caseSensitive ? content : content.toLowerCase();
    const target = caseSensitive ? searchQuery : searchQuery.toLowerCase();
    if (!target) return [];

    let pos = 0;
    while (pos <= source.length - target.length) {
      const idx = source.indexOf(target, pos);
      if (idx === -1) break;
      results.push(idx);
      pos = idx + Math.max(1, target.length);
    }
    return results;
  }, [content, searchQuery, caseSensitive]);

  // Корректируем индекс активного совпадения при изменении списка
  useEffect(() => {
    if (matches.length === 0) {
      setCurrentMatchIndex(0);
    } else if (currentMatchIndex >= matches.length) {
      setCurrentMatchIndex(0);
    }
  }, [matches.length, currentMatchIndex]);

  // Выделение найденного фрагмента в textarea
  const focusMatchInTextarea = (matchIdx: number, keepSearchFocus = false) => {
    if (matches.length === 0 || !textareaRef.current) return;
    const start = matches[matchIdx];
    if (start === undefined) return;
    const end = start + searchQuery.length;

    const textarea = textareaRef.current;
    textarea.focus();
    textarea.setSelectionRange(start, end);

    // Прокручиваем textarea к найденной строке
    const textBefore = content.slice(0, start);
    const linesBefore = textBefore.split(/\r\n|\r|\n/).length - 1;
    const approxLineHeight = fontSize * 1.65;
    const targetScroll = Math.max(0, linesBefore * approxLineHeight - textarea.clientHeight / 3);
    textarea.scrollTop = targetScroll;

    if (keepSearchFocus && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    const next = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(next);
    focusMatchInTextarea(next);
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    const prev = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(prev);
    focusMatchInTextarea(prev);
  };

  // Заменить текущее совпадение
  const handleReplaceSingle = () => {
    if (!searchQuery || matches.length === 0) {
      showToast('Совпадений не найдено');
      return;
    }

    const activeIdx = currentMatchIndex < matches.length ? currentMatchIndex : 0;
    const start = matches[activeIdx];
    const end = start + searchQuery.length;

    const updated = content.slice(0, start) + replaceQuery + content.slice(end);
    setContent(updated);
    showToast('Заменено 1 совпадение');

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start, start + replaceQuery.length);
      }
    });
  };

  // Заменить все совпадения
  const handleReplaceAll = () => {
    if (!searchQuery || matches.length === 0) {
      showToast('Совпадений не найдено');
      return;
    }

    const count = matches.length;
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
    const updated = content.replace(regex, () => replaceQuery);

    setContent(updated);
    setCurrentMatchIndex(0);
    showToast(`Заменено совпадений: ${count}`);
  };

  // Печать документа
  const handlePrint = () => {
    window.print();
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const el = e.target;
    const isCursorAtEnd = el.selectionStart >= newValue.length - 2;

    setContent(newValue);

    if (isCursorAtEnd) {
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
      });
    }
  };

  const handleOpenClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      const text = typeof result === 'string' ? result : '';
      setContent(text);

      const nameWithoutExt = file.name.replace(/\.txt$/i, '');
      setFileName(nameWithoutExt);
      showToast(`Открыт файл «${file.name}»`);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
          textareaRef.current.focus();
        }
      });
    };

    reader.onerror = () => {
      showToast('Ошибка при чтении файла');
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleDownloadTxt = () => {
    const cleanName = fileName.trim().replace(/\.txt$/i, '') || 'document';
    const finalFileName = `${cleanName}.txt`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = finalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Сохранен «${finalFileName}»`);
  };

  const handleClear = () => {
    setContent('');
    setFileName('');
    showToast('Очищено');
    textareaRef.current?.focus();
  };

  const openFindPanel = (withReplace: boolean) => {
    setIsSearchOpen(true);
    setShowReplaceRow(withReplace);
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleDownloadTxt();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpenClick();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        openFindPanel(false);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        openFindPanel(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      } else if (e.key === 'Escape') {
        if (isSettingsOpen) setIsSettingsOpen(false);
        else if (isSearchOpen) setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <>
      {/* Основной интерфейс (скрывается при печати) */}
      <div
        className={`print:hidden min-h-dvh flex flex-col transition-colors duration-200 ${
          isDark ? 'bg-[#090d16] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
        }`}
      >
        {/* Шапка приложения */}
        <header
          className={`flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5 border-b transition-colors ${
            isDark ? 'border-slate-800/90 bg-[#0d1320]' : 'border-slate-200 bg-white'
          }`}
        >
          <span className="text-base sm:text-lg font-bold tracking-tight whitespace-nowrap shrink-0">
            DeputatikTXT
          </span>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Настройки"
              className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg border transition-all active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2 ${
                isDark
                  ? 'bg-slate-800/90 hover:bg-slate-800 text-slate-100 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-800 border-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Настройки</span>
            </button>
          </div>
        </header>

        {/* Модальное окно настроек */}
        {isSettingsOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setIsSettingsOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl border p-5 sm:p-6 shadow-xl transition-colors ${
                isDark
                  ? 'bg-[#111827] border-slate-800 text-slate-100'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">Настройки</h2>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  aria-label="Закрыть настройки"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-5 space-y-5">
                {/* Тема оформления */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">Тема оформления</div>
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Переключение между темным и светлым режимом
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDark(!isDark)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                    }`}
                  >
                    {isDark ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-blue-600" />
                    )}
                    <span>{isDark ? 'Темная' : 'Светлая'}</span>
                  </button>
                </div>

                {/* Размер шрифта */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">Размер текста</div>
                    <div
                      className={`text-xs tabular-nums ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      Текущий размер: {fontSize} px
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[13, 15, 18, 20].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setFontSize(size)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                          fontSize === size
                            ? 'bg-blue-600 text-white'
                            : isDark
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Перенос строк */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">Перенос строк</div>
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Автоматический перенос длинных строк
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWordWrap(!wordWrap)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      wordWrap
                        ? 'bg-blue-600 text-white border-blue-600'
                        : isDark
                        ? 'bg-slate-800 text-slate-300 border-slate-700'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {wordWrap ? 'Включен' : 'Выключен'}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700/40 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
                >
                  Готово
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Основная рабочая область */}
        <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-5 gap-3 min-h-0">
          {/* Поле ввода названия файла + кнопка Найти */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div
              className={`flex-1 flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl border transition-all ${
                isDark
                  ? 'bg-[#111827] border-slate-800 focus-within:border-blue-500/80'
                  : 'bg-white border-slate-200 focus-within:border-blue-600 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <FileText
                  className={`w-4 h-4 shrink-0 ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}
                />
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Введите название файла..."
                  aria-label="Название файла"
                  spellCheck={false}
                  autoComplete="off"
                  className={`w-full bg-transparent text-sm sm:text-base font-medium outline-none truncate ${
                    isDark
                      ? 'text-slate-100 placeholder:text-slate-500'
                      : 'text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span
                  className={`font-mono text-xs sm:text-sm select-none ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  .txt
                </span>

                {(content.length > 0 || fileName.length > 0) && (
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Очистить редактор"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isDark
                        ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Панель инструментов: Найти */}
            <div
              className={`flex items-center gap-1.5 p-1.5 rounded-xl border shrink-0 ${
                isDark
                  ? 'bg-[#111827] border-slate-800'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  if (isSearchOpen) {
                    setIsSearchOpen(false);
                  } else {
                    openFindPanel(false);
                  }
                }}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isSearchOpen
                    ? 'bg-blue-600 text-white'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Найти</span>
              </button>
            </div>
          </div>

          {/* Панель Найти и Заменить */}
          {isSearchOpen && (
            <div
              className={`flex flex-col gap-2.5 p-3 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-[#111827] border-slate-800'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              {/* Строка поиска */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <div
                  className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg border min-w-[180px] ${
                    isDark
                      ? 'bg-[#090d16] border-slate-800 focus-within:border-blue-500/70'
                      : 'bg-slate-50 border-slate-200 focus-within:border-blue-600'
                  }`}
                >
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentMatchIndex(0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.shiftKey) handlePrevMatch();
                        else handleNextMatch();
                      }
                    }}
                    placeholder="Найти в тексте..."
                    className="w-full bg-transparent text-xs sm:text-sm outline-none"
                  />
                  <span
                    className={`text-xs font-mono tabular-nums whitespace-nowrap shrink-0 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {searchQuery
                      ? matches.length > 0
                        ? `${currentMatchIndex + 1} / ${matches.length}`
                        : '0 / 0'
                      : ''}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCaseSensitive(!caseSensitive)}
                    title="Учитывать регистр"
                    className={`p-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      caseSensitive
                        ? 'bg-blue-600 text-white border-blue-600'
                        : isDark
                        ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <CaseSensitive className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handlePrevMatch}
                    disabled={matches.length === 0}
                    title="Предыдущее совпадение"
                    className={`p-2 rounded-lg border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDark
                        ? 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-800'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextMatch}
                    disabled={matches.length === 0}
                    title="Следующее совпадение"
                    className={`p-2 rounded-lg border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDark
                        ? 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-800'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReplaceRow(!showReplaceRow)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      showReplaceRow
                        ? 'bg-blue-600 text-white border-blue-600'
                        : isDark
                        ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    Замена
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    title="Закрыть панель поиска"
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      isDark
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Строка замены */}
              {showReplaceRow && (
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <div
                    className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg border min-w-[180px] ${
                      isDark
                        ? 'bg-[#090d16] border-slate-800 focus-within:border-blue-500/70'
                        : 'bg-slate-50 border-slate-200 focus-within:border-blue-600'
                    }`}
                  >
                    <Replace className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={replaceQuery}
                      onChange={(e) => setReplaceQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleReplaceSingle();
                        }
                      }}
                      placeholder="Заменить на..."
                      className="w-full bg-transparent text-xs sm:text-sm outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleReplaceSingle}
                      disabled={matches.length === 0}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                      }`}
                    >
                      Заменить
                    </button>

                    <button
                      type="button"
                      onClick={handleReplaceAll}
                      disabled={matches.length === 0}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Заменить все
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Основное текстовое поле */}
          <div
            className={`flex-1 flex flex-col rounded-xl border overflow-hidden transition-colors min-h-[55dvh] ${
              isDark
                ? 'bg-[#111827] border-slate-800 focus-within:border-blue-500/70'
                : 'bg-white border-slate-200 focus-within:border-blue-600 shadow-xs'
            }`}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextChange}
              placeholder="Введите текст..."
              aria-label="Содержимое текстового файла"
              wrap={wordWrap ? 'soft' : 'off'}
              className={`flex-1 w-full p-4 sm:p-6 bg-transparent font-mono leading-relaxed resize-none outline-none overflow-y-auto ${
                wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
              } ${
                fontSize === 13
                  ? 'text-[13px]'
                  : fontSize === 18
                  ? 'text-[18px]'
                  : fontSize === 20
                  ? 'text-[20px]'
                  : 'text-sm sm:text-[15px]'
              } ${
                isDark
                  ? 'text-slate-100 placeholder:text-slate-600'
                  : 'text-slate-800 placeholder:text-slate-400'
              }`}
            />
          </div>

          {/* Нижняя панель с кнопками "Открыть файл" и "Скачать" */}
          <footer
            className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors ${
              isDark
                ? 'bg-[#111827] border-slate-800'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div
              className={`flex items-center justify-between sm:justify-start gap-2 text-xs tabular-nums ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              <span>
                Строк: <strong className="font-medium">{lineCount}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Слов: <strong className="font-medium">{wordCount}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Символов: <strong className="font-medium">{charCount}</strong>
              </span>
              {statusMessage && (
                <>
                  <span aria-hidden="true" className="hidden md:inline">
                    ·
                  </span>
                  <span
                    className={`hidden md:inline font-medium ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`}
                  >
                    {statusMessage}
                  </span>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,text/plain"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleOpenClick}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer ${
                  isDark
                    ? 'bg-slate-800/90 hover:bg-slate-800 text-slate-100 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-800 border-slate-200'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                <span>Открыть файл</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Скачать</span>
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* Версия для печати (отображается только при вызове печати) */}
      <div className="hidden print:block p-8 text-black bg-white">
        <h1 className="text-lg font-bold mb-4 pb-2 border-b border-gray-300">
          {fileName.trim() ? `${fileName.trim().replace(/\.txt$/i, '')}.txt` : 'document.txt'}
        </h1>
        <pre className="font-mono text-sm whitespace-pre-wrap break-words leading-relaxed">
          {content}
        </pre>
      </div>
    </>
  );
}
