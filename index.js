// import { grammar as makeGrammar } from "ohm-js";
const { grammar: makeGrammar } = require("ohm-js");
const { format } = require("prettier");

const grammar = makeGrammar(require("fs").readFileSync("./grammar.ohm"));

const semantics = grammar.createSemantics().addOperation("transpile()", {
  File(statements, a) {
    return statements.transpile();
  },
  _iter(...children) {
    return children.map((x) => x.transpile());
  },
  StatementWithPrependedNewline(a, statement) {
    return statement.transpile();
  },
  StatementList(statements) {
    return statements.asIteration().transpile().join("\n\n");
  },
  SetStatement_set(_set, lhs, _to, expr) {
    return `${lhs.transpile()} = ${expr.transpile()};`;
  },
  standaloneIdentifier(firstLetter, restLetters) {
    return `${firstLetter.sourceString}${restLetters.sourceString}`;
  },
  Closure_closure(_slashes, params, _arrow, expr) {
    return `(${params
      .asIteration()
      .children.map((x) => `${x.transpile()}`)
      .join(",")}) => ${expr.transpile()}`;
  },
  OnStatementMultipleLines_onmultiline(
    _on,
    eventName,
    _nl,
    statementList,
    _nl2,
    _end
  ) {
    return `register(${eventName.transpile()}, (its) => {
      ${statementList.transpile()}
    });`;
  },
  StandaloneFunctionCall(base, _lParen, args, _rParen) {
    return `${base.transpile()}(${args
      .asIteration()
      .children.map((x) => `${x.transpile()}`)
      .join(",")})`;
  },
  standaloneDQString(a, b, c) {
    return `"${b.sourceString}"`;
  },
  OnStatementOneLine_ononeline(_on, eventName, statement) {
    return `register(${eventName.transpile()}, (its) => {
      ${statement.transpile()}
    });`;
  },
  CallStatement_call(_call, fnCall) {
    return fnCall.transpile();
  },
  LogStatement_log(_log, expr) {
    return `ChatLib.chat(${expr.transpile()});`;
  },
  standaloneQString(lQuote, str, rQuote) {
    return lQuote.sourceString + str.sourceString + rQuote.sourceString;
  },
  ThenStatement_then(stmtA, _then, stmtB) {
    return `(() => {
      ${stmtA.transpile()}
      ${stmtB.transpile()}
    })();`;
  },
  number(nums) {
    return nums.sourceString;
  },
  Object_object(_lParen, properties, _rParen) {
    return `{${properties
      .asIteration()
      .children.map((x) => x.transpile())
      .join(",")}}`;
  },
  ObjectProperty(property, _colon, expr) {
    return `${property.transpile()}: ${expr.transpile()}`;
  },
  StandalonePossessive(expr, _aposS, ident) {
    return `${expr.transpile()}.${ident.transpile()}`;
  },
  BinaryOp_binop(l, op, r) {
    return `${l.transpile()} ${op.sourceString} ${r.transpile()}`;
  },
  Parenthesized_parenthesized(_lParen, expr, _rParen) {
    return `(${expr.transpile()})`;
  },
});

module.exports = {
  async run(input) {
    const transpiledCode = semantics(grammar.match(input)).transpile();
    try {
      return await format(transpiledCode, {
        semi: false,
        parser: "babel",
      });
    } catch (e) {
      console.log(transpiledCode[0]);
      throw e;
    }
  },
};

async function main() {
  // const fs = require("fs");
  // fs.watchFile("./code._hs", { interval: 5 }, async () => {
  //   try {
  //     const matched = grammar.match(fs.readFileSync("./code._hs"));
  //     const generated = semantics(matched).transpile();
  //     fs.writeFileSync(
  //       "out.js",
  //       await format(generated, { semi: false, parser: "babel" })
  //     );
  //   } catch (e) {
  //     console.error(e);
  //   }
  // });
  // const matched = grammar.match(`
  // on "click" log "hello" then log "world"
  // `);
  // const generated = semantics(matched).transpile();
  // console.log(await format(generated, { semi: false, parser: "babel" }));
}

main();
