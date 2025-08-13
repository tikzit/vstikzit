import { useMemo } from 'react';
import TikzParser, { Lexer } from '../data/TikzParser';

interface GraphEditorProps {
  code: string;
}

const GraphEditor = ({ code }: GraphEditorProps) => {
  const parseResult = useMemo(() => {
    try {
      const parser = new TikzParser();
      const lexer = new Lexer(parser.getAllTokens());

      const lexingResult = lexer.tokenize(code);

      if (lexingResult.errors.length > 0) {
        return {
          success: false,
          errors: lexingResult.errors.map(e => {
            const line = e.line || 1;
            const column = e.column || 1;
            return `Line ${line}, Column ${column}: ${e.message}`;
          })
        };
      }

      parser.input = lexingResult.tokens;
      const cst = parser.tikz();

      if (parser.errors.length > 0) {
        return {
          success: false,
          errors: parser.errors.map(e => {
            const token = e.token;
            const line = token?.startLine || 1;
            const column = token?.startColumn || 1;
            return `Line ${line}, Column ${column}: ${e.message}`;
          })
        };
      }

      return {
        success: true,
        cst: cst
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }, [code]);

  return (
    <div style={{ height: "100%", padding: "10px", overflow: "auto" }}>
      <h3>TikZ Parse Tree</h3>

      {parseResult.success ? (
        <pre style={{
          padding: '10px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          {JSON.stringify(parseResult.cst, null, 2)}
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
            {parseResult.errors?.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
};

export default GraphEditor;
