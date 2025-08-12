import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

interface TikZEditorProps {
  initialContent: string;
}

const TikZEditor: React.FC<TikZEditorProps> = ({ initialContent }) => {
  const [content, setContent] = useState(initialContent);
  const vscode = useRef(acquireVsCodeApi());

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case 'update':
          setContent(message.content);
          break;
        case 'getFileData':
          vscode.current.postMessage({
            type: 'getFileData',
            content: content
          });
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [content]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
      vscode.current.postMessage({
        type: 'edit',
        content: value
      });
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <Editor
        height="100%"
        defaultLanguage="latex"
        defaultValue={content}
        value={content}
        onChange={handleEditorChange}
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
          // Ensure the editor is focused and ready
          editor.focus();
        }}
      />
    </div>
  );
};

export default TikZEditor;
