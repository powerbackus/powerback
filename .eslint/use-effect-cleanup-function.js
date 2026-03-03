module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'enforce that useEffect cleanup must be a function',
    },
    schema: [], // no options
    messages: {
      badReturn: 'useEffect cleanup must be a function.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.name === 'useEffect' &&
          node.arguments[0] &&
          (node.arguments[0].type === 'ArrowFunctionExpression' ||
            node.arguments[0].type === 'FunctionExpression')
        ) {
          const fn = node.arguments[0];
          if (fn.body && fn.body.type === 'BlockStatement') {
            fn.body.body.forEach((stmt) => {
              if (
                stmt.type === 'ReturnStatement' &&
                stmt.argument &&
                ![
                  'ArrowFunctionExpression',
                  'FunctionExpression',
                ].includes(stmt.argument.type)
              ) {
                context.report({
                  node: stmt,
                  messageId: 'badReturn',
                });
              }
            });
          }
        }
      },
    };
  },
};
