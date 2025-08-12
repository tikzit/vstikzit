import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  content: string;
  onChange: (value: string | undefined) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ content, onChange }) => {
  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      <Editor
        height="100%"
        defaultLanguage="tex"
        value={content}
        onChange={onChange}
        theme="vs-dark"
        loading="Loading TikZ Editor..."
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          lineNumbers: 'on',
          folding: true,
          matchBrackets: 'always',
          autoIndent: 'full',
          formatOnType: true,
          formatOnPaste: true,
        }}
        onMount={(editor, monaco) => {
          console.log('Monaco editor mounted successfully');
          
          // Register TikZ/LaTeX language if not already registered
          if (!monaco.languages.getLanguages().find(lang => lang.id === 'tikz')) {
            monaco.languages.register({ id: 'tikz' });
            
            // Define TikZ syntax highlighting
            monaco.languages.setMonarchTokensProvider('tikz', {
              tokenizer: {
                root: [
                  // Comments
                  [/%.*$/, 'comment'],
                  
                  // TikZ commands
                  [/\\(begin|end)\{tikzpicture\}/, 'keyword'],
                  [/\\(node|draw|path|fill|coordinate|pic)/, 'keyword'],
                  [/\\(foreach|let|pgfmathsetmacro)/, 'keyword'],
                  
                  // General LaTeX commands
                  [/\\[a-zA-Z@]+/, 'type'],
                  
                  // Options in square brackets
                  [/\[/, { token: 'delimiter.bracket', next: '@options' }],
                  
                  // Math mode
                  [/\$/, { token: 'string', next: '@math' }],
                  
                  // Braces
                  [/[{}]/, 'delimiter.curly'],
                  
                  // Coordinates
                  [/\(([^)]*)\)/, 'number'],
                  
                  // Numbers
                  [/-?\d*\.?\d+/, 'number'],
                  
                  // Strings
                  [/"([^"\\]|\\.)*$/, 'string.invalid'],
                  [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
                ],
                
                options: [
                  [/[^\]]+/, 'attribute.name'],
                  [/\]/, { token: 'delimiter.bracket', next: '@pop' }],
                ],
                
                math: [
                  [/[^$]+/, 'string'],
                  [/\$/, { token: 'string', next: '@pop' }],
                ],
                
                string: [
                  [/[^\\"]+/, 'string'],
                  [/\\./, 'string.escape.invalid'],
                  [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
                ],
              },
            });
            
            // Set language to tikz
            monaco.editor.setModelLanguage(editor.getModel()!, 'tikz');
          }
          
          // Ensure the editor is focused and ready
          editor.focus();
        }}
      />
    </div>
  );
};

export default CodeEditor;
