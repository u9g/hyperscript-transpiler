// import { grammar as makeGrammar } from "ohm-js";
const { grammar: makeGrammar } = require("ohm-js");
const { format } = require("prettier");

const grammar = makeGrammar(require("fs").readFileSync("./grammar.ohm"));

const scopeTree = []

const set_difference = (a, b) => [...a].filter(x => !b.has(x));

function makeScope(currScope) {
  let x = scopeTree;
  for (const scope of currScope) {
    x = x[scope]
  }
  x.push([])
  const newScope = currScope.slice(0)
  newScope.push(x.length - 1)
  return newScope
}

function addVarUsageToScope(currScope, identifierName) {
  let x = scopeTree;
  for (const scope of currScope) {
    x = x[scope]
  }
  x.push(identifierName)
}

function findIdentifiersUsedInThisScopeAndNotUpperScopes(currScope) {
  let x = scopeTree;
  for (const scope of currScope) {
    x = x[scope]
  }
  const identifiers = new Set()
  for (const maybeIdentifier of x) {
    if (typeof maybeIdentifier === 'string') {
      identifiers.add(maybeIdentifier)
    }
  }

  const prevUsedIdentifiers = new Set()

  let y = scopeTree;
  for (let j = 0; j < currScope.length; j++) {
    const scope = currScope[j]
    for (let i = 0; i < scope; i++) {
      if (typeof y[i] === 'string') {
        prevUsedIdentifiers.add(y[i])
      }
    }
    y = y[scope]
  }
  return [identifiers, prevUsedIdentifiers]
}

const semantics = grammar.createSemantics().addOperation("transpile(scope)", {
  File(statements, a) {
    return statements.transpile(this.args.scope);
  },
  _iter(...children) {
    return children.map((x) => x.transpile(this.args.scope));
  },
  StatementWithPrependedNewline(a, statement) {
    return statement.transpile(this.args.scope);
  },
  StatementList(statements) {
    const scope = makeScope(this.args.scope)
    const transpiledStatements = statements.asIteration().transpile(scope).join("\n\n");
    const [identifiers, prevUsedIdentifiers] = findIdentifiersUsedInThisScopeAndNotUpperScopes(scope)
    const identifiersThatNeedLet = set_difference(identifiers, prevUsedIdentifiers)
    const letStatement = identifiersThatNeedLet.length > 0 ? 'let ' + identifiersThatNeedLet.join(', ') + ';' : ''

    return letStatement + transpiledStatements //+ `\n//${JSON.stringify([...identifiersThatNeedLet])}\n`//+ `\n//identifiers=${JSON.stringify([...identifiers])} prevUsedIdentifiers=${JSON.stringify([...prevUsedIdentifiers])} scope=${JSON.stringify(scope)}\n`
  },
  SetStatement_set(_set, lhs, _to, expr) {
    if (lhs.children[0].ctorName === 'standaloneIdentifier') {
      addVarUsageToScope(this.args.scope, lhs.children[0].transpile(/*unused*/[]))
    }
    return `${lhs.transpile(this.args.scope)} = ${expr.transpile(this.args.scope)};`;
  },
  standaloneIdentifier(firstLetter, restLetters) {
    return `${firstLetter.sourceString}${restLetters.sourceString}`;
  },
  Closure_closure(_slashes, params, _arrow, expr) {
    return `(${params
      .asIteration()
      .children.map((x) => `${x.transpile(this.args.scope)}`)
      .join(",")}) => ${expr.transpile(this.args.scope)}`;
  },
  OnStatementMultipleLines_onmultiline(
    _on,
    eventName,
    _nl,
    statementList,
    _nl2,
    _end
  ) {
    return `register(${eventName.transpile(this.args.scope)}, (its) => {
      ${statementList.transpile(this.args.scope)}
    });`;
  },
  StandaloneFunctionCall(base, _lParen, args, _rParen) {
    return `${base.transpile(this.args.scope)}(${args
      .asIteration()
      .children.map((x) => `${x.transpile(this.args.scope)}`)
      .join(",")})`;
  },
  standaloneDQString(a, b, c) {
    return `"${b.sourceString}"`;
  },
  OnStatementOneLine_ononeline(_on, eventName, statement) {
    return `register(${eventName.transpile(this.args.scope)}, (its) => {
      ${statement.transpile(this.args.scope)}
    });`;
  },
  CallStatement_call(_call, fnCall) {
    return fnCall.transpile(this.args.scope);
  },
  LogStatement_log(_log, expr) {
    return `ChatLib.chat(${expr.transpile(this.args.scope)});`;
  },
  standaloneQString(lQuote, str, rQuote) {
    return lQuote.sourceString + str.sourceString + rQuote.sourceString;
  },
  ThenStatement_then(stmtA, _then, stmtB) {
    const scope = makeScope(this.args.scope)
    return `(() => {
      ${stmtA.transpile(scope)}
      ${stmtB.transpile(scope)}
    })();`;
  },
  number(nums) {
    return nums.sourceString;
  },
  Object_object(_lParen, properties, _rParen) {
    return `{${properties
      .asIteration()
      .children.map((x) => x.transpile(this.args.scope))
      .join(",")}}`;
  },
  ObjectProperty(property, _colon, expr) {
    return `${property.transpile(this.args.scope)}: ${expr.transpile(this.args.scope)}`;
  },
  StandalonePossessive(expr, _aposS, ident) {
    return `${expr.transpile(this.args.scope)}.${ident.transpile(this.args.scope)}`;
  },
  BinaryOp_binop(l, op, r) {
    return `${l.transpile(this.args.scope)} ${op.sourceString} ${r.transpile(this.args.scope)}`;
  },
  Parenthesized_parenthesized(_lParen, expr, _rParen) {
    return `(${expr.transpile(this.args.scope)})`;
  },
});

module.exports = {
  async run(input) {
    const transpiledCode = semantics(grammar.match(input)).transpile([]);
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
  const fs = require("fs");
  const cb = async () => {
    try {
      const matched = grammar.match(fs.readFileSync("./code._hs"));
      const generated = semantics(matched).transpile([]);
      fs.writeFileSync(
        "out.js",
        await format(generated, { semi: false, parser: "babel" })
      );
    } catch (e) {
      console.error(e);
    }
  }
  cb()
  fs.watchFile("./code._hs", { interval: 5 }, cb);
  // const matched = grammar.match(`
  // on "click" log "hello" then log "world"
  // `);
  // const generated = semantics(matched).transpile();
  // console.log(await format(generated, { semi: false, parser: "babel" }));
}

main();
