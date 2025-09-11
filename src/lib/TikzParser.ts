import { createToken, Lexer, EmbeddedActionsParser } from "chevrotain";
import Graph from "./Graph";
import { Coord, GraphData, EdgeData, NodeData, PathData, StyleData } from "./Data";
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
const LBracket = createToken({ name: "LBracket", pattern: /\[/, push_mode: "properties" });
const RBracket = createToken({ name: "RBracket", pattern: /\]/, pop_mode: true });
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
const Length = createToken({ name: "Length", pattern: /-?\d+(.\d+)?[a-zA-Z]+/ });
const Int = createToken({ name: "Int", pattern: /-?\d+/ });
const Float = createToken({ name: "Float", pattern: /-?\d+\.\d+/ });
const Identifier = createToken({ name: "Identifier", pattern: /[0-9a-zA-Z\-']+/ });

const PropertyVal = createToken({ name: "PropertyVal", pattern: /[0-9a-zA-Z<>\-'.]+/ });

const allTokens = {
  modes: {
    global: [
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
      Length,
      Float,
      Int,
      Identifier,
    ],
    properties: [DelimString, WhiteSpace, PropertyVal, Equals, Comma, RBracket],
  },
  defaultMode: "global",
};

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
  public graph?: Graph;
  public styles?: Styles;

  // field holds the current data for parsing properties. Can be NodeData, EdgeData, StyleData, or GraphData
  private d?: any;
  // the parser allows arbitrary node names in tikz files, but only stores ids. This field maps names to generated ids
  private nodeIds?: Map<string, number>;
  // the current path being parsed, used for multi-part edges
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
      this.nodeIds = new Map();
      this.d = this.graph.graphData;
    });

    this.CONSUME(BeginTikzPictureCmd);
    this.SUBRULE(this.optProperties);

    this.ACTION(() => {
      this.graph = this.graph?.setGraphData(this.d as GraphData);
    });

    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.node) },
        { ALT: () => this.SUBRULE(this.edge) },
        { ALT: () => this.SUBRULE(this.boundingBox) },
        { ALT: () => this.SUBRULE(this.ignore) },
      ]);
    });
    this.CONSUME(EndTikzPictureCmd);
  });

  public tikzStyles = this.RULE("tikzStyles", () => {
    this.ACTION(() => {
      // initialise styles and make sure the "none" style is included
      this.styles = new Styles().addStyle(new StyleData());
    });

    this.MANY(() => {
      this.SUBRULE(this.style);
    });
  });

  public style = this.RULE("style", () => {
    const tok = this.CONSUME(TikzStyleCmd);
    const name = stripBraces(this.CONSUME(DelimString).image);
    this.CONSUME(Equals);

    this.ACTION(() => {
      if (this.styles !== undefined) {
        if (this.styles.hasStyle(name)) {
          throw new ParseError(
            tok.startLine ?? 1,
            tok.startColumn ?? 1,
            `Style '${name}' is already defined`
          );
        }
        const d = new StyleData().setId(this.styles.numStyles()).setName(name);
        this.d = d;
      }
    });

    this.SUBRULE(this.properties);

    this.ACTION(() => {
      this.styles = this.styles?.addStyle(this.d as StyleData);
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
          this.d = this.d.setProperty(key, val);
        } else {
          this.d = this.d.setAtom(key);
        }
      }
    });
  });

  public propertyVal = this.RULE("propertyVal", () => {
    let s = "";
    this.MANY(() => {
      this.OR([{ ALT: () => (s += (s === "" ? "" : " ") + this.CONSUME(PropertyVal).image) }]);
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
    this.CONSUME(NodeCmd);

    this.ACTION(() => {
      this.d = new NodeData();
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
      if (this.graph !== undefined && coord !== undefined) {
        const parsed = parseInt(name, 10);
        const d = (this.d as NodeData)
          .setId(isNaN(parsed) ? this.graph.freshNodeId : parsed)
          .setCoord(coord)
          .setLabel(stripBraces(labelToken.image));
        this.nodeIds?.set(name, d.id);
        this.graph = this.graph.addNodeWithData(d);
      }
    });
  });

  private coord = this.RULE("coord", () => {
    this.CONSUME(LParen);
    const x = this.SUBRULE(this.num);
    this.CONSUME(Comma);
    const y = this.SUBRULE1(this.num);
    this.CONSUME(RParen);

    let c: Coord | undefined;
    this.ACTION(() => {
      c = new Coord(x, y);
    });

    return c;
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
      if (this.nodeIds?.has(name)) {
        id = this.nodeIds?.get(name) ?? 0;
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
        this.d = new NodeData();
      });

      this.CONSUME(Node);
      this.SUBRULE(this.optProperties);
      const label = stripBraces(this.CONSUME(DelimString).image);

      this.ACTION(() => {
        if (d !== undefined && ed !== undefined) {
          const d = (this.d as NodeData).setLabel(label);
          ed = ed.setEdgeNode(d);
          this.d = ed;
        }
      });
    });
  });

  private edgeSource = this.RULE("edgeSource", () => {
    this.ACTION(() => {
      this.d = new EdgeData().setId(this.graph?.freshEdgeId ?? 0);
    });

    this.SUBRULE(this.optProperties);
    const nodeRef = this.SUBRULE(this.nodeRef);

    this.ACTION(() => {
      this.d = (this.d as EdgeData).setSource(nodeRef[0]).setSourceAnchor(nodeRef[1]);
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
            this.d = (this.d as EdgeData).setTarget(nodeRef[0]).setTargetAnchor(nodeRef[1]);
          });
        },
      },
      {
        ALT: () => {
          this.CONSUME(LParen);
          this.CONSUME(RParen);

          this.ACTION(() => {
            this.d = (this.d as EdgeData)
              .setTarget(this.d.source)
              .setTargetAnchor(this.d.sourceAnchor);
          });
        },
      },
      {
        ALT: () => {
          const cycleToken = this.CONSUME(Cycle);

          this.ACTION(() => {
            const d = this.d as EdgeData;
            if (this.currentPath && this.currentPath.edges.length > 0) {
              this.currentPath = this.currentPath.setIsCycle(true);
              const firstEdge = this.currentPath.edges[0];
              this.d = d.setTarget(this.graph?.edge(firstEdge)?.source ?? -1);
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
      let d = this.d as EdgeData;
      if (this.graph !== undefined && this.currentPath !== undefined) {
        d = d.setPath(this.currentPath.id);
        this.currentPath = this.currentPath.addEdge(d.id);
        this.graph = this.graph.addEdgeWithData(d);
        const d1 = new EdgeData().setId(this.graph.freshEdgeId).setSource(d.target);
        this.d = d1;
      }
    });
  });

  private edge = this.RULE("edge", () => {
    this.CONSUME(DrawCmd);

    this.ACTION(() => {
      this.currentPath = new PathData().setId(this.graph?.freshPathId ?? 0);
    });

    this.SUBRULE(this.edgeSource);
    this.AT_LEAST_ONE(() => this.SUBRULE(this.edgeTarget));
    this.CONSUME(Semicolon);

    this.ACTION(() => {
      if (this.currentPath !== undefined) {
        this.graph = this.graph?.addPathWithData(this.currentPath);
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
    if (parseStyles) {
      parser.tikzStyles();
    } else {
      parser.tikzPicture();
    }

    if (parser.errors.length > 0) {
      return {
        errors: parser.errors.map(
          e => new ParseError(e.token?.startLine || 1, e.token?.startColumn || 1, e.message)
        ),
      };
    }

    return parseStyles
      ? { result: parser.styles, errors: [] }
      : {
          result: parser.graph,
          errors: [],
        };
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
  // const lexResult = lexer.tokenize(value, "properties");
  // if (lexResult.errors.length > 0) {
  //   return false;
  // }
  // parser.input = lexResult.tokens;
  // parser.propertyVal();
  // return parser.errors.length === 0;

  // pattern should be (PropertyVal | Whitespace)+
  const pattern = /^[0-9a-zA-Z<>\-'. \t\n\r]+$/;
  return pattern.test(value);
}

function isValidDelimString(value: string): boolean {
  const result = matchDelimString(value, 0);
  return result !== null && result[0] === value;
}

export {
  parseTikzPicture,
  ParseTikzPictureResult,
  parseTikzStyles,
  ParseTikzStylesResult,
  isValidPropertyVal,
  isValidDelimString,
};
