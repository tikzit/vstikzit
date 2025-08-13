import { useState, useEffect, useRef } from 'react';
import Split from 'react-split';
import CodeEditor from './CodeEditor';
import GraphEditor from './GraphEditor';

interface TikZEditorProps {
  initialContent: string;
}

const TikzEditor = ({ initialContent }: TikZEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const vscode = useRef<any>(null);

  // Lazy initialization of VS Code API
  if (vscode.current === null) {
    vscode.current = acquireVsCodeApi();
  }

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
      <Split
        sizes={[70, 30]}
        minSize={0}
        expandToMin={false}
        gutterSize={10}
        gutterAlign="center"
        snapOffset={30}
        dragInterval={1}
        direction="vertical"
        cursor="row-resize"
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <GraphEditor />
        <CodeEditor
          content={content}
          onChange={handleEditorChange}
        />
      </Split>
    </div>
  );
};

export default TikzEditor;
