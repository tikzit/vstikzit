import Editor from "@monaco-editor/react";
import { editorOptions } from "./editorSetup";

interface CodeEditorProps {
  content: string;
  onChange: (value: string | undefined) => void;
  onMount: (editor: any, monaco: any) => void;
}

const CodeEditor = ({ content, onChange, onMount }: CodeEditorProps) => {
  return (
    <div style={{ height: "100%", overflow: "hidden" }}>
      <Editor
        height="100%"
        defaultLanguage="tex"
        value={content}
        onChange={onChange}
        theme="vs"
        loading="Loading TikZ Editor..."
        options={editorOptions}
        onMount={onMount}
      />
    </div>
  );
};

export default CodeEditor;
