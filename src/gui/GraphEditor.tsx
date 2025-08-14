import { useMemo } from 'react';
import { parseTikzPicture } from '../data/TikzParser';

interface GraphEditorProps {
  code: string;
}

const GraphEditor = ({ code }: GraphEditorProps) => {
  const parseResult = useMemo(() => parseTikzPicture(code), [code]);

  return (
    <div style={{ height: "100%", padding: "10px", overflow: "auto" }}>
      <h3>TikZ Parse Tree</h3>

      {parseResult.result != null ? (
        <pre style={{
          padding: '10px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          Parsed!
        </pre>
      ) : (
        <div>
          <h4 style={{ color: 'red' }}>Parse Errors:</h4>
          <pre style={{
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            {parseResult.errors?.map(e => `${e.line} (${e.column}): ${e.message}`).join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
};

export default GraphEditor;
