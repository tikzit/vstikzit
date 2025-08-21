// VSCode WebView API types
interface VsCodeApi {
  postMessage(message: any): void;
  setState(state: any): void;
  getState(): any;
}

declare function acquireVsCodeApi(): VsCodeApi;

// SVG module declarations
declare module "*.svg" {
  const content: string;
  export default content;
}
