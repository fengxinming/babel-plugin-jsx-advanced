'use strict';

const eslintScope = require('eslint-scope');

module.exports = {
  isVariable(str) {
    if (typeof str !== 'string') {
      return false;
    }

    if (str.trim() !== str) {
      return false;
    }

    try {
      new Function(str, `var ${str}`);
    } catch (_) {
      return false;
    }

    return true;
  },

  addDeclaredVariables(context, vars) {
    const globalScope = context.getScope();
    vars.forEach(id => {
      let variable = globalScope.set.get(id);

      if (!variable) {
        variable = new eslintScope.Variable(id, globalScope);
        variable.eslintUsed = true;

        globalScope.variables.push(variable);
        globalScope.set.set(id, variable);
      }
    });

    globalScope.through = globalScope.through.filter(reference => {
      const name = reference.identifier.name;
      const variable = globalScope.set.get(name);

      if (variable) {
        reference.resolved = variable;
        variable.references.push(reference);

        return false;
      }

      return true;
    });
  }
};
