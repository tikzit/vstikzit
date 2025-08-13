// @ts-ignore - esbuild handles ES module conversion
import { createToken, Lexer, CstParser } from "chevrotain";

function matchDelimString(text: string, startOffset: number): [string] | null {
    let endOffset = startOffset;
    let depth = 0;

    if (endOffset < text.length && text[endOffset] === "{") {
        depth++;
        endOffset++;
    } else {
        return null;
    }

    while (endOffset < text.length) {
        if (text[endOffset] === "{") {
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

const WhiteSpace = createToken({ name: "WhiteSpace", pattern: /[ \t\n\r]+/, group: Lexer.SKIPPED });

const BeginTikzPictureCmd = createToken({ name: "BeginTikzPictureCmd", pattern: /\\begin\{tikzpicture\}/ });
const EndTikzPictureCmd = createToken({ name: "EndTikzPictureCmd", pattern: /\\end\{tikzpicture\}/ });
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
const Rectangle = createToken({ name: "Rectangle", pattern: /rectangle/ });
const At = createToken({ name: "At", pattern: /at/ });
const To = createToken({ name: "To", pattern: /to/ });
const Cycle = createToken({ name: "Cycle", pattern: /cycle/ });

const DelimString = createToken({ name: "DelimString", pattern: matchDelimString });
const ArrowDef = createToken({ name: "ArrowDef", pattern: /[a-zA-Z<>|]*-[a-zA-Z<>|]*/ });
const Identifier = createToken({ name: "Identifier", pattern: /[a-zA-Z_][a-zA-Z0-9_]*/ });
const Int = createToken({ name: "Int", pattern: /-?\d+/ });
const Float = createToken({ name: "Float", pattern: /-?\d+\.\d+/ });

const allTokens = [
    WhiteSpace,
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
    Rectangle,
    At,
    To,
    Cycle,
    DelimString,
    ArrowDef,
    Identifier,
    Int,
    Float
];

class TikzParser extends CstParser {
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
    });

    public tikzStyles = this.RULE("tikzStyles", () => {
        this.CONSUME(TikzStyleCmd);
        this.CONSUME(DelimString);
        this.CONSUME(Equals);
        this.SUBRULE(this.properties);
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
        this.SUBRULE(this.propertyVal);
        this.OPTION(() => {
            this.CONSUME(Equals);
            this.OR([
                { ALT: () => this.CONSUME(DelimString) },
                { ALT: () => this.SUBRULE(this.propertyVal) },
            ]);
        });
    });

    private propertyVal = this.RULE("propertyVal", () => {
        this.MANY(() => {
            this.OR([
                { ALT: () => this.CONSUME(Identifier) },
                { ALT: () => this.CONSUME(Int) },
                { ALT: () => this.CONSUME(Float) },
                { ALT: () => this.CONSUME(ArrowDef) },
            ]);
        });
    });

    private node = this.RULE("node", () => {
        this.CONSUME(NodeCmd);
        this.SUBRULE(this.optProperties);
        this.CONSUME(LParen);
        this.CONSUME(Identifier);
        this.CONSUME(RParen);
        this.CONSUME(At);
        this.SUBRULE(this.coord);
        this.CONSUME(DelimString);
        this.CONSUME(Semicolon);
    });

    private coord = this.RULE("coord", () => {
        this.CONSUME(LParen);
        this.SUBRULE(this.num);
        this.CONSUME(Comma);
        this.SUBRULE(this.num);
        this.CONSUME(RParen);
    });

    private num = this.RULE("num", () => {
        this.OR([
            { ALT: () => this.CONSUME(Int) },
            { ALT: () => this.CONSUME(Float) },
        ]);
    });

    private nodeRef = this.RULE("nodeRef", () => {
        this.CONSUME(LParen);
        this.CONSUME(Identifier);
        this.OPTION(() => {
            this.CONSUME(Period);
            this.CONSUME(Identifier);
        });
        this.CONSUME(RParen);
    });

    private optNodeRef = this.RULE("optNodeRef", () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.nodeRef) },
            { ALT: () => { this.CONSUME(LParen); this.CONSUME(RParen); } },
            { ALT: () => this.CONSUME(Cycle) },
        ]);
    });

    private optEdgeNode = this.RULE("optEdgeNode", () => {
        this.OPTION(() => {
            this.CONSUME(Node);
            this.SUBRULE(this.optProperties);
            this.CONSUME(DelimString);
        });
    });

    private edgeSource = this.RULE("edgeSource", () => {
        this.SUBRULE(this.optProperties);
        this.SUBRULE(this.nodeRef);
    });

    private edgeTarget = this.RULE("edgeTarget", () => {
        this.CONSUME(To);
        this.SUBRULE(this.optProperties);
        this.SUBRULE(this.optEdgeNode);
        this.SUBRULE(this.optNodeRef);
    });

    private edge = this.RULE("edge", () => {
        this.CONSUME(DrawCmd);
        this.SUBRULE(this.edgeSource);
        this.AT_LEAST_ONE(() => this.SUBRULE(this.edgeTarget));
        this.CONSUME(Semicolon);
    });

    private boundingBox = this.RULE("boundingBox", () => {
        this.CONSUME(PathCmd);
        this.SUBRULE(this.optProperties);
        this.SUBRULE(this.coord);
        this.CONSUME(Rectangle);
        this.SUBRULE(this.coord);
        this.CONSUME(Semicolon);
    });

    private ignore = this.RULE("ignore", () => {
        this.OR([
            { ALT: () => { this.CONSUME(BeginLayerCmd); this.CONSUME(DelimString); } },
            { ALT: () => this.CONSUME(EndLayerCmd) },
        ]);
    });

}

export default TikzParser;