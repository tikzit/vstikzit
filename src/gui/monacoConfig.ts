import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

// Configure the loader to use the webpack bundled monaco-editor
// instead of loading from CDN
loader.config({ monaco });

export default monaco;
