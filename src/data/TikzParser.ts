// @ts-ignore - webpack will handle this
import { createToken, Lexer, EmbeddedActionsParser } from "chevrotain";
import Graph from "./Graph";
import { Coord, Data, EdgeData, NodeData, PathData, StyleData } from "./Data";
import Styles from "./Styles";

function matchDelimString(text: string, startOffset: number): [string] | null {
  let endOffset = startOffset;
  let depth = 0;

  if (endOffset < text.length && text[endOffset] === "{") {
    depth++;
    endOffset++;
  } else {
    return null;
  }

  let escape = false;
  while (endOffset < text.length) {
    if (escape) {
      escape = false;
    } else if (text[endOffset] === "\\") {
      escape = true;
    } else if (text[endOffset] === "{") {
      depth++;
    } else if (text[endOffset] === "}") {
      depth--;
      if (depth === 0) {
        return [text.slice(startOffset, endOffset + 1)];
      }
    }
    endOffset++;
  }

  return null;
}

function stripBraces(s: string) {
  if (s.startsWith("{") && s.endsWith("}")) {
    return s.slice(1, -1);
  } else {
    return s;
  }
}

const WhiteSpace = createToken({ name: "WhiteSpace", pattern: /[ \t\n\r]+/, group: Lexer.SKIPPED });
const Comment = createToken({ name: "Comment", pattern: /%[^\n]*/, group: Lexer.SKIPPED });

const BeginTikzPictureCmd = createToken({
  name: "BeginTikzPictureCmd",
  pattern: /\\begin\{tikzpicture\}/,
});
const EndTikzPictureCmd = createToken({
  name: "EndTikzPictureCmd",
  pattern: /\\end\{tikzpicture\}/,
});
const BeginLayerCmd = createToken({ name: "BeginLayerCmd", pattern: /\\begin\{pgfonlayer\}/ });
const EndLayerCmd = createToken({ name: "EndLayerCmd", pattern: /\\end\{pgfonlayer\}/ });
const TikzStyleCmd = createToken({ name: "TikzStyleCmd", pattern: /\\tikzstyle/ });

const LParen = createToken({ name: "LParen", pattern: /\(/ });
const RParen = createToken({ name: "RParen", pattern: /\)/ });
const LBracket = createToken({ name: "LBracket", pattern: /\[/ });
const RBracket = createToken({ name: "RBracket", pattern: /\]/ });
const Semicolon = createToken({ name: "Semicolon", pattern: /;/ });
const Comma = createToken({ name: "Comma", pattern: /,/ });
const Period = createToken({ name: "Period", pattern: /\./ });
const Equals = createToken({ name: "Equals", pattern: /=/ });

const DrawCmd = createToken({ name: "DrawCmd", pattern: /\\draw/ });
const NodeCmd = createToken({ name: "NodeCmd", pattern: /\\node/ });
const PathCmd = createToken({ name: "PathCmd", pattern: /\\path/ });
const Node = createToken({ name: "Node", pattern: /node/ });
const Rectangle = createToken({ name: "Rectangle", pattern: /rectangle/ });
const At = createToken({ name: "At", pattern: /at/ });
const To = createToken({ name: "To", pattern: /to/ });
const Cycle = createToken({ name: "Cycle", pattern: /cycle/ });

const DelimString = createToken({
  name: "DelimString",
  pattern: matchDelimString,
  line_breaks: true,
});
// const ArrowDef = createToken({ name: "ArrowDef", pattern: /[a-zA-Z<>|]*-[a-zA-Z<>|]*/ });
const Int = createToken({ name: "Int", pattern: /-?\d+/ });
const Float = createToken({ name: "Float", pattern: /-?\d+\.\d+/ });
const Identifier = createToken({ name: "Identifier", pattern: /[a-zA-Z0-9_\-<>]+/ });

const allTokens = [
  DelimString,
  WhiteSpace,
  Comment,
  BeginTikzPictureCmd,
  EndTikzPictureCmd,
  BeginLayerCmd,
  EndLayerCmd,
  TikzStyleCmd,
  LParen,
  RParen,
  LBracket,
  RBracket,
  Semicolon,
  Comma,
  Period,
  Equals,
  DrawCmd,
  NodeCmd,
  PathCmd,
  Node,
  Rectangle,
  At,
  To,
  Cycle,
  Float,
  Int,
  Identifier,
];

class ParseError extends Error {
  public line: number;
  public column: number;
  constructor(line: number, column: number, message: string) {
    super(message);
    this.line = line;
    this.column = column;
  }
}

class TikzParser extends EmbeddedActionsParser {
  private graph?: Graph;
  private styles?: Styles;
  private d?: Data;
  private nodeTab?: Map<string, number>;
  private currentPath?: PathData;

  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  public tikz = this.RULE("tikz", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.tikzPicture) },
      { ALT: () => this.SUBRULE(this.tikzStyles) },
    ]);
  });

  public tikzPicture = this.RULE("tikzPicture", () => {
    this.ACTION(() => {
      this.graph = new Graph();
      this.nodeTab = new Map();
      this.d = this.graph.graphData;
    });

    this.CONSUME(BeginTikzPictureCmd);
    this.SUBRULE(this.optProperties);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.node) },
        { ALT: () => this.SUBRULE(this.edge) },
        { ALT: () => this.SUBRULE(this.boundingBox) },
        { ALT: () => this.SUBRULE(this.ignore) },
      ]);
    });
    this.CONSUME(EndTikzPictureCmd);

    return this.graph;
  });

  public tikzStyles = this.RULE("tikzStyles", () => {
    this.MANY(() => {
      this.SUBRULE(this.style);
    });

    return this.styles;
  });

  public style = this.RULE("style", () => {
    this.CONSUME(TikzStyleCmd);
    const name = stripBraces(this.CONSUME(DelimString).image);
    this.CONSUME(Equals);

    this.ACTION(() => {
      if (this.styles !== undefined) {
        const d = new StyleData(this.styles.numStyles());
        d.name = name;
        this.d = d;
      }
    });

    this.SUBRULE(this.properties);

    this.ACTION(() => {
      this.styles?.addStyle(this.d as StyleData);
    });
  });

  private optProperties = this.RULE("optProperties", () => {
    this.OPTION(() => {
      this.SUBRULE(this.properties);
    });
  });

  private properties = this.RULE("properties", () => {
    this.CONSUME(LBracket);
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => this.SUBRULE(this.property),
    });
    this.CONSUME(RBracket);
  });

  private property = this.RULE("property", () => {
    let key: string;
    this.OR([
      { ALT: () => (key = stripBraces(this.CONSUME(DelimString).image)) },
      { ALT: () => (key = this.SUBRULE(this.propertyVal)) },
    ]);
    let val: string | undefined;
    this.OPTION(() => {
      this.CONSUME(Equals);
      this.OR1([
        { ALT: () => (val = stripBraces(this.CONSUME1(DelimString).image)) },
        { ALT: () => (val = this.SUBRULE1(this.propertyVal)) },
      ]);
    });

    this.ACTION(() => {
      if (this.d !== undefined) {
        if (val !== undefined) {
          this.d.setProperty(key, val);
        } else {
          this.d.setAtom(key);
        }
      }
    });
  });

  public propertyVal = this.RULE("propertyVal", () => {
    let s = "";
    this.MANY(() => {
      this.OR([
        { ALT: () => (s += (s === "" ? "" : " ") + this.CONSUME(Identifier).image) },
        { ALT: () => (s += (s === "" ? "" : " ") + this.CONSUME(Int).image) },
        { ALT: () => (s += (s === "" ? "" : " ") + this.CONSUME(Float).image) },
        // since we only have one lexer context, we need to include all the keyword tokens here
        { ALT: () => (s += (s === "" ? "" : " ") + this.CONSUME(Node).image) },
        { ALT: () => (s += (s === "" ? "" : " ") + this.CONSUME(Rectangle).image) },
        { ALT: () => (s += (s === "" ? "" : " ") + this.CONSUME(At).image) },
        { ALT: () => (s += (s === "" ? "" : " ") + this.CONSUME(To).image) },
        { ALT: () => (s += (s === "" ? "" : " ") + this.CONSUME(Cycle).image) },
      ]);
    });
    return s;
  });

  private nodeName = this.RULE("nodeName", () => {
    return this.OR([{ ALT: () => this.CONSUME(Identifier) }, { ALT: () => this.CONSUME(Int) }]);
  });

  private nodeAnchor = this.RULE("nodeAnchor", () => {
    return this.OR([
      { ALT: () => this.CONSUME(Identifier).image },
      { ALT: () => this.CONSUME(Int).image },
    ]);
  });

  private node = this.RULE("node", () => {
    let d: NodeData | undefined;
    this.CONSUME(NodeCmd);

    this.ACTION(() => {
      d = new NodeData(-1);
      this.d = d;
    });

    this.SUBRULE(this.optProperties);

    this.CONSUME(LParen);
    const name = this.SUBRULE(this.nodeName).image;
    this.CONSUME(RParen);
    this.CONSUME(At);
    const coord = this.SUBRULE(this.coord);
    const labelToken = this.CONSUME(DelimString);
    this.CONSUME(Semicolon);

    this.ACTION(() => {
      if (d !== undefined && this.graph !== undefined) {
        const parsed = parseInt(name, 10);
        d.id = isNaN(parsed) ? this.graph.freshNodeId() : parsed;
        this.nodeTab?.set(name, d.id);
        d.coord = coord;
        d.label = stripBraces(labelToken.image);
        d.labelStart = labelToken.startOffset;
        d.labelEnd = labelToken.endOffset;
        this.graph.addNodeWithData(d);
      }
    });
  });

  private coord = this.RULE("coord", () => {
    this.CONSUME(LParen);
    const x = this.SUBRULE(this.num);
    this.CONSUME(Comma);
    const y = this.SUBRULE1(this.num);
    this.CONSUME(RParen);

    return [x, y] as Coord;
  });

  private num = this.RULE("num", () => {
    return this.OR([
      { ALT: () => parseInt(this.CONSUME(Int).image, 10) },
      { ALT: () => parseFloat(this.CONSUME(Float).image) },
    ]);
  });

  private nodeRef = this.RULE("nodeRef", () => {
    this.CONSUME(LParen);
    const nameToken = this.SUBRULE(this.nodeName);
    const name = nameToken.image;
    let id = 0;
    const anchor = this.OPTION(() => {
      this.CONSUME(Period);
      return this.SUBRULE1(this.nodeAnchor);
    });
    this.CONSUME(RParen);

    this.ACTION(() => {
      if (this.nodeTab?.has(name)) {
        id = this.nodeTab?.get(name) ?? 0;
      } else {
        throw new ParseError(
          nameToken.startLine ?? 1,
          nameToken.startColumn ?? 1,
          `Node reference not found: ${name}`
        );
      }
    });

    return [id, anchor] as [number, string?];
  });

  private optEdgeNode = this.RULE("optEdgeNode", () => {
    this.OPTION(() => {
      let ed: EdgeData | undefined;
      let d: NodeData | undefined;

      this.ACTION(() => {
        ed = this.d as EdgeData;
        d = new NodeData(-1);
        this.d = d;
      });

      this.CONSUME(Node);
      this.SUBRULE(this.optProperties);
      const label = stripBraces(this.CONSUME(DelimString).image);

      this.ACTION(() => {
        if (d !== undefined && ed !== undefined) {
          d.label = label;
          ed.edgeNode = d;
          this.d = ed;
        }
      });
    });
  });

  private edgeSource = this.RULE("edgeSource", () => {
    let d: EdgeData | undefined;

    this.ACTION(() => {
      d = new EdgeData(this.graph?.freshEdgeId() ?? 0);
      this.d = d;
    });

    this.SUBRULE(this.optProperties);
    const nodeRef = this.SUBRULE(this.nodeRef);

    this.ACTION(() => {
      if (d !== undefined) {
        d.source = nodeRef[0];
        d.sourceAnchor = nodeRef[1];
      }
    });
  });

  private edgeTarget = this.RULE("edgeTarget", () => {
    this.CONSUME(To);
    this.SUBRULE(this.optProperties);
    this.SUBRULE(this.optEdgeNode);

    this.OR([
      {
        ALT: () => {
          const nodeRef = this.SUBRULE(this.nodeRef);

          this.ACTION(() => {
            const d = this.d as EdgeData;
            d.target = nodeRef[0];
            d.targetAnchor = nodeRef[1];
          });
        },
      },
      {
        ALT: () => {
          this.CONSUME(LParen);
          this.CONSUME(RParen);

          this.ACTION(() => {
            const d = this.d as EdgeData;
            d.target = d.source;
            d.targetAnchor = d.sourceAnchor;
          });
        },
      },
      {
        ALT: () => {
          const cycleToken = this.CONSUME(Cycle);

          this.ACTION(() => {
            const d = this.d as EdgeData;
            if (this.currentPath && this.currentPath.edges.length > 0) {
              this.currentPath.isCycle = true;
              d.target = this.graph?.edgeData.get(this.currentPath.edges[0])?.source ?? -1;
            } else {
              throw new ParseError(
                cycleToken.startLine ?? 1,
                cycleToken.startColumn ?? 1,
                "'cycle' can only be used in paths of length 2 or more"
              );
            }
          });
        },
      },
    ]);

    this.ACTION(() => {
      const d = this.d as EdgeData;
      if (this.graph !== undefined && this.currentPath !== undefined) {
        this.graph.addEdgeWithData(d);
        this.currentPath.edges.push(d.id);
        d.path = this.currentPath.id;
        const d1 = new EdgeData(this.graph.freshEdgeId());
        d1.source = d.target;
        this.d = d1;
      }
    });
  });

  private edge = this.RULE("edge", () => {
    this.CONSUME(DrawCmd);

    this.ACTION(() => {
      this.currentPath = new PathData(this.graph?.freshPathId() ?? 0);
    });

    this.SUBRULE(this.edgeSource);
    this.AT_LEAST_ONE(() => this.SUBRULE(this.edgeTarget));
    this.CONSUME(Semicolon);

    this.ACTION(() => {
      if (this.currentPath !== undefined) {
        this.graph?.addPathWithData(this.currentPath);
        this.currentPath = undefined;
      }
    });
  });

  private boundingBox = this.RULE("boundingBox", () => {
    this.CONSUME(PathCmd);
    this.SUBRULE(this.optProperties);
    this.SUBRULE(this.coord);
    this.CONSUME(Rectangle);
    this.SUBRULE1(this.coord);
    this.CONSUME(Semicolon);
  });

  private ignore = this.RULE("ignore", () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(BeginLayerCmd);
          this.CONSUME(DelimString);
        },
      },
      { ALT: () => this.CONSUME(EndLayerCmd) },
    ]);
  });
}

const lexer = new Lexer(allTokens);
const parser = new TikzParser();

interface ParseTikzPictureResult {
  result?: Graph;
  errors: ParseError[];
}

interface ParseTikzStylesResult {
  result?: Styles;
  errors: ParseError[];
}

function parseTikz(
  input: string,
  parseStyles: boolean
): ParseTikzPictureResult | ParseTikzStylesResult {
  const lexResult = lexer.tokenize(input);
  if (lexResult.errors.length > 0) {
    return {
      errors: lexResult.errors.map(e => new ParseError(e.line || 1, e.column || 1, e.message)),
    };
  }

  parser.input = lexResult.tokens;

  try {
    const res = parseStyles ? parser.tikzStyles() : parser.tikzPicture();

    if (parser.errors.length > 0) {
      return {
        errors: parser.errors.map(
          e => new ParseError(e.token?.startLine || 1, e.token?.startColumn || 1, e.message)
        ),
      };
    }

    return parseStyles
      ? { result: res as Styles, errors: [] }
      : { result: res as Graph, errors: [] };
  } catch (e) {
    if (e instanceof ParseError) {
      return {
        errors: [e],
      };
    } else {
      throw e;
    }
  }
}

function parseTikzPicture(input: string): ParseTikzPictureResult {
  return parseTikz(input, false) as ParseTikzPictureResult;
}

function parseTikzStyles(input: string): ParseTikzStylesResult {
  return parseTikz(input, true) as ParseTikzStylesResult;
}

function isValidPropertyVal(value: string): boolean {
  const lexResult = lexer.tokenize(value);
  if (lexResult.errors.length > 0) {
    return false;
  }
  parser.input = lexResult.tokens;
  parser.propertyVal();
  return parser.errors.length === 0;
}

export {
  parseTikzPicture,
  ParseTikzPictureResult,
  parseTikzStyles,
  ParseTikzStylesResult,
  isValidPropertyVal,
};
