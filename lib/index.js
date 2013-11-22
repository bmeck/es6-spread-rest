function processFn(fnExpr) {  
  if (fnExpr.rest) {
    var arity = fnExpr.params.length;
    var body = fnExpr.body
    if (body.type != 'BlockStatement') {
      if (/Statement$/.test(body.type) == false) {
        body = {
          type: 'ExpressionStatement',
          expression: body
        }
      }
      body = fnExpr.body = {
        type: 'BlockStatement',
        body: [body]
      }
      fnExpr.expression = false;
    }
    fnExpr.params.push(fnExpr.rest);
    body.body.unshift(
      {
        type: 'VariableDeclaration',
        declarations: [
          {
            type: 'VariableDeclarator',
            id: { type: 'Identifier', name: fnExpr.rest.name },
            init: {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                computed: false,
                object: {
                  type: 'MemberExpression',
                  computed: false,
                  object: {
                    type: 'ArrayExpression',
                    elements: []
                  },
                  property: {
                    type: 'Identifier',
                    name: 'slice'
                  }
                },
                property: {
                  type: 'Identifier',
                  name: 'call'
                }
              },
              arguments: [
                {
                  type: 'Identifier',
                  name: 'arguments'
                },
                {
                  type: 'Literal',
                  value: arity
                }
              ]
            }
          }
        ],
        kind: 'var'
      }      
    );
  }
  return fnExpr;
}

// SETUP THE APPLY
var arr_iife = "("+(function _(args, spreads) {
  return args.reduce(function (current, arg, i) {
    if (spreads.indexOf(i) < 0) current.push(arg);
    else if (typeof arg == 'object' && arg.length) {
      for (var ii = 0; ii < arg.length; ii++) {
        current.push(arg[ii]);
      }
    }
    else current = current.concat(arg);
    return current;
  },[]);
}).toString()+")()";

function processArray(arrExpr) {
  var args = arrExpr.elements;
  var overrides = [];
  var values = [];
  for (var i = 0; i < args.length; i++) {
    var arg = args[i];
    if (arg.type == 'SpreadElement') {
      overrides.push(i);
      values.push(arg.argument);
    }
    else {
      values.push(arg);
    }
  }
  if (overrides.length) {
    var ast = require('esprima').parse(arr_iife).body[0].expression;
    ast.arguments = [
      {
        type: 'ArrayExpression',
        elements: values.map(function (node) {
          return types.traverse(node, visitNode)
        })
      },
      {
        type: 'ArrayExpression',
        elements: overrides.map(function (arg) {
          return {
            type: 'Literal',
            value: arg
          }
        })
      }
    ]
    arrExpr = ast;
  }
  return arrExpr;
}


// SETUP THE APPLY
var call_iife = "("+(function _(holder, prop, args, spreads) {
  return _.apply.call(prop ? holder[prop] : prop, holder, args.reduce(function (current, arg, i) {
    if (spreads.indexOf(i) < 0) current.push(arg);
    else if (typeof arg == 'object' && arg.length) {
      for (var ii = 0; ii < arg.length; ii++) {
        current.push(arg[ii]);
      }
    }
    else current = current.concat(arg);
    return current;
  },[]));
}).toString()+")()";


function processCall(callExpr) {
  var args = callExpr.arguments;
  var overrides = [];
  var values = [];
  for (var i = 0; i < args.length; i++) {
    var arg = args[i];
    if (arg.type == 'SpreadElement') {
      overrides.push(i);
      values.push(arg.argument);
    }
    else {
      values.push(arg);
    }
  }
  if (overrides.length) {
    var ast = require('esprima').parse(call_iife).body[0].expression;
    ast.arguments = [
      callExpr.callee.type == "MemberExpression" ? callExpr.callee.object : callExpr.callee,
      callExpr.callee.type == "MemberExpression" ? (
        callExpr.callee.property.type == 'Identifier' ?
        { type: 'Literal', value: callExpr.callee.property.name } :
        callExpr.callee.property)
      : null,
      {
        type: 'ArrayExpression',
        elements: values.map(function (node) {
          return types.traverse(node, visitNode)
        })
      },
      {
        type: 'ArrayExpression',
        elements: overrides.map(function (arg) {
          return {
            type: 'Literal',
            value: arg
          }
        })
      }
    ]
    callExpr = ast;
  }
  return callExpr;
}

var types = require('ast-types');

function visitNode(node) {
  if (node.type === 'ArrayExpression') {
    this.replace(processArray(node));
    return;
  }
  if (node.type === 'CallExpression') {
    this.replace(processCall(node));
    return;
  }
  if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
    this.replace(processFn(node));
    return;
  }
}

var through = require('through');
module.exports = function (file) {
  var data = '';
  return through(write, end);

  function write (buf) { data += buf }
  function end () {
      var out = compile(data);
      this.queue(out);
      this.queue(null);
  }
}

process.stdin.pipe(module.exports()).pipe(process.stdout);

//module.exports.compile = compile;
function compile(src) {
  return transform(require('esprima').parse(src));
}

//module.exports.transform = transform;
function transform(node) {
  return require('escodegen').generate(types.traverse(node, visitNode));
}