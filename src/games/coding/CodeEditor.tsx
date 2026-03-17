import { useState, useEffect } from 'react';
import { Language } from './levels';
import { cn } from '@/shared/lib/utils';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  language: Language;
  readOnly?: boolean;
}

const languageKeywords: Record<Language, string[]> = {
  javascript: ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'true', 'false', 'null', 'undefined', 'new', 'this'],
  python: ['def', 'if', 'else', 'elif', 'for', 'while', 'return', 'True', 'False', 'None', 'in', 'not', 'and', 'or', 'import', 'from', 'class', 'pass'],
  cpp: ['int', 'void', 'bool', 'char', 'float', 'double', 'if', 'else', 'for', 'while', 'return', 'true', 'false', 'nullptr', 'class', 'struct', 'vector', 'string'],
  java: ['public', 'private', 'class', 'int', 'void', 'boolean', 'String', 'if', 'else', 'for', 'while', 'return', 'true', 'false', 'null', 'new', 'this', 'static']
};

export function CodeEditor({ code, onChange, language, readOnly = false }: CodeEditorProps) {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    setLines(code.split('\n'));
  }, [code]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      onChange(newCode);
      // Reset cursor position
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const highlightCode = (line: string): JSX.Element[] => {
    const keywords = languageKeywords[language];
    const parts: JSX.Element[] = [];
    
    // Simple tokenizer
    let remaining = line;
    let key = 0;
    
    while (remaining.length > 0) {
      // Check for TODO comments
      if (remaining.includes('// TODO') || remaining.includes('# TODO')) {
        const todoIndex = remaining.indexOf('// TODO') !== -1 
          ? remaining.indexOf('// TODO') 
          : remaining.indexOf('# TODO');
        if (todoIndex > 0) {
          parts.push(<span key={key++}>{remaining.substring(0, todoIndex)}</span>);
        }
        parts.push(
          <span key={key++} className="text-coin font-semibold animate-pulse">
            {remaining.substring(todoIndex)}
          </span>
        );
        break;
      }
      
      // Check for string
      const stringMatch = remaining.match(/^(['"`])(.*?)\1/);
      if (stringMatch) {
        parts.push(
          <span key={key++} className="text-success">
            {stringMatch[0]}
          </span>
        );
        remaining = remaining.substring(stringMatch[0].length);
        continue;
      }
      
      // Check for comment
      if (remaining.startsWith('//') || remaining.startsWith('#')) {
        parts.push(
          <span key={key++} className="text-muted-foreground italic">
            {remaining}
          </span>
        );
        break;
      }
      
      // Check for keyword
      let foundKeyword = false;
      for (const keyword of keywords) {
        const regex = new RegExp(`^\\b${keyword}\\b`);
        if (regex.test(remaining)) {
          parts.push(
            <span key={key++} className="text-primary font-medium">
              {keyword}
            </span>
          );
          remaining = remaining.substring(keyword.length);
          foundKeyword = true;
          break;
        }
      }
      
      if (!foundKeyword) {
        // Check for number
        const numMatch = remaining.match(/^\d+/);
        if (numMatch) {
          parts.push(
            <span key={key++} className="text-accent">
              {numMatch[0]}
            </span>
          );
          remaining = remaining.substring(numMatch[0].length);
          continue;
        }
        
        // Regular character
        parts.push(<span key={key++}>{remaining[0]}</span>);
        remaining = remaining.substring(1);
      }
    }
    
    return parts;
  };

  return (
    <div className="relative rounded-xl border border-border bg-muted/30 overflow-hidden font-mono text-sm">
      {/* Line numbers and highlighted code (display layer) */}
      <div className="flex pointer-events-none absolute inset-0 overflow-auto">
        {/* Line numbers */}
        <div className="flex-shrink-0 py-4 px-2 bg-muted/50 text-muted-foreground text-right select-none border-r border-border">
          {lines.map((_, i) => (
            <div key={i} className="leading-6 h-6">
              {i + 1}
            </div>
          ))}
        </div>
        
        {/* Highlighted code */}
        <div className="flex-grow py-4 px-4 overflow-auto">
          {lines.map((line, i) => (
            <div key={i} className="leading-6 h-6 whitespace-pre text-foreground">
              {highlightCode(line)}
            </div>
          ))}
        </div>
      </div>
      
      {/* Actual textarea (input layer) */}
      <textarea
        value={code}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        className={cn(
          "w-full min-h-[400px] py-4 pl-12 pr-4 bg-transparent text-transparent caret-foreground resize-none outline-none font-mono text-sm leading-6",
          readOnly && "cursor-not-allowed"
        )}
        spellCheck={false}
        style={{ tabSize: 2 }}
      />
    </div>
  );
}
