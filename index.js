// import { grammar as makeGrammar } from "ohm-js";
const { grammar: makeGrammar } = require("ohm-js");
const { format } = require("prettier");

const grammar = makeGrammar(require("fs").readFileSync("./grammar.ohm"));

const semantics = grammar
  .createSemantics()
  .addOperation("identifierValue", {
    identifier(value) {
      return value.sourceString;
    },
  })
  .addOperation("declVariable", {
    setCommand(_set, _spaces1, lhs, _spaces2, _to, _spaces3, expr) {
      return lhs.identifierValue();
    },
    statementList(firstStatement, _newLines, _spaces, restStatements) {
      return [
        firstStatement.declVariable(),
        ...restStatements.children.map((x) => x.declVariable()),
      ];
    },
    onStatementMultipleLine(
      _on,
      _spaces,
      eventName,
      _spaces2,
      stlist,
      _spaces3,
      _end
    ) {
      return null;
    },
    qString(lQuote, value, rQuote) {
      return null;
    },
    functionCall(functionName, _lCurly, argsList, _rCurly) {
      return null;
    },
    argumentList(firstArgument, _commas, _spaces, restArguments) {
      return null;
    },
    onStatementOneLine(_on, _spaces1, eventName, _spaces2, statement, _spaces) {
      return null;
    },
    callCommand(_cmd, _space, fnCall) {
      return null;
    },
    logCommand(_log, _space, toLog) {
      return null;
    },
    thenCommand(statementOne, _space1, _then, _space2, statementTwo) {
      return null;
    },
    object(_lCurly, optionalPropertyList, _rCurly) {
      return null;
    },
    objectPropertiesList(
      firstObjectProperty,
      _commas,
      _spaces,
      restObjectProperties
    ) {
      return null;
    },
    objectProperty(key, _spaces1, _colon, _spaces2, expression) {
      return null;
    },
    possessiveExpression(baseObject, _spaces1, _apostropheS, _spaces2, key) {
      return null;
    },
    closure(
      _slash,
      _spaces,
      optionalParamList,
      _spaces1,
      _arrow,
      _spaces3,
      expr
    ) {
      return null;
    },

    parameterList(firstParam, _commas, _spaces, restParams) {
      return null;
    },
  })
  .addOperation("transpile", {
    file(_spaces1, stlist, _spaces2) {
      return "let it;const globals = {};\n" + stlist.transpile();
    },
    statementList(firstStatement, _newLines, _spaces, restStatements) {
      return [
        firstStatement.transpile(),
        ...restStatements.children.map((x) => x.transpile()),
      ].join("\n\n");
    },
    onStatementMultipleLine(
      _on,
      _spaces,
      eventName,
      _spaces2,
      stlist,
      _spaces3,
      _end
    ) {
      let variablesToDeclSet = new Set(stlist.declVariable());
      let shouldDeclVariables = variablesToDeclSet.size > 0;
      return `register(${eventName.transpile()}, (my) => {
      ${shouldDeclVariables ? `let ${[...variablesToDeclSet].join(", ")};` : ""}
      ${stlist.transpile()}
    })`;
    },
    qString(lQuote, value, rQuote) {
      return lQuote.sourceString + value.sourceString + rQuote.sourceString;
    },
    functionCall(functionName, _lCurly, argsList, _rCurly) {
      return `${functionName.transpile()}(${argsList.transpile()})`;
    },
    optionalArgumentList(maybeArgumentList) {
      // if the argumentList exists, children.length=1
      return maybeArgumentList.children.map((x) => x.transpile());
    },
    argumentList(firstArgument, _commas, _spaces, restArguments) {
      return [
        firstArgument.transpile(),
        ...restArguments.children.map((x) => x.transpile()),
      ]
        .map((x) => `(${x})`)
        .join(", ");
    },
    onStatementOneLine(_on, _spaces1, eventName, _spaces2, statement, _spaces) {
      return `register(${eventName.transpile()}, (my) => {
        ${statement.transpile()}
      })`;
    },
    callCommand(_cmd, _space, fnCall) {
      return `it = ${fnCall.transpile()}`;
    },
    logCommand(_log, _space, toLog) {
      return `ChatLib.chat(${toLog.transpile()})`;
    },
    thenCommand(statementOne, _space1, _then, _space2, statementTwo) {
      let variablesToDecl = [];
      if (statementOne.declVariable()) {
        variablesToDecl.push(statementOne.declVariable());
      }
      if (statementTwo.declVariable()) {
        variablesToDecl.push(statementTwo.declVariable());
      }
      let variablesToDeclSet = new Set(variablesToDecl);
      let shouldDeclVariables = variablesToDeclSet.size > 0;
      return `(() => {
        ${shouldDeclVariables ? `let ${[...variablesToDeclSet].join(", ")};` : ""}
        ${statementOne.transpile()}
        ${statementTwo.transpile()}
      })()`;
    },
    identifier(alnums) {
      const value = alnums.sourceString;
      switch (value) {
        case "result":
        case "it":
        case "its":
          return "it";
        default:
          return value;
      }
    },
    setCommand(_set, _spaces1, lhs, _spaces2, _to, _spaces3, expr) {
      return `${lhs.transpile()} = ${expr.transpile()}`;
    },
    object(_lCurly, optionalPropertyList, _rCurly) {
      return `{${optionalPropertyList.transpile()}}`;
    },
    optionalObjectPropertiesList(objectPropertiesList) {
      // if the objectPropertiesList exists, children.length=1
      return objectPropertiesList.children.map((x) => x.transpile());
    },
    objectPropertiesList(
      firstObjectProperty,
      _commas,
      _spaces,
      restObjectProperties
    ) {
      return [
        firstObjectProperty.transpile(),
        ...restObjectProperties.children.map((x) => x.transpile()),
      ].join(",\n");
    },
    objectProperty(key, _spaces1, _colon, _spaces2, expression) {
      return `${key.sourceString}: ${expression.transpile()}`;
    },
    possessiveExpression(baseObject, _spaces1, _apostropheS, _spaces2, key) {
      return `${baseObject.transpile()}.${key.sourceString}`;
    },
    closure(
      _slash,
      _spaces,
      optionalParamList,
      _spaces1,
      _arrow,
      _spaces3,
      expr
    ) {
      return `(${optionalParamList.transpile()}) => ${expr.transpile()}`;
    },
    optionalParameterList(parameterList) {
      // if the parameterList exists, children.length=1
      return parameterList.children.map((x) => x.transpile());
    },

    parameterList(firstParam, _commas, _spaces, restParams) {
      return [
        firstParam.transpile(),
        ...restParams.children.map((x) => x.transpile()),
      ].join(",\n");
    },

    parameter(name) {
      return name.sourceString;
    },
  });

module.exports = {
  async run(input) {
    return await format(semantics(grammar.match(input)).transpile(), {
      semi: false,
      parser: "babel",
    });
  },
};

async function main() {
  const matched = grammar.match(`
  on "
  `);

  const generated = semantics(matched).transpile();
  console.log(await format(generated, { semi: false, parser: "babel" }));
}

main();
