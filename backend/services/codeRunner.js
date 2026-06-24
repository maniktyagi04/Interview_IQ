const vm = require('vm');

/**
 * Executes JS code in a secure sandbox and evaluates it against sample input/output.
 * @param {string} code - The user's code submission
 * @param {string} sampleInput - Comma separated arguments representation, e.g. "[2,7,11,15], 9"
 * @param {string} sampleOutput - Expected output representation, e.g. "[0,1]"
 * @returns {object} - Status of the run containing success, status, expectedOutput, actualOutput, and message
 */
const runJS = (code, sampleInput, sampleOutput) => {
  // Find function name from the code
  let functionName = null;
  const funcMatch = code.match(/function\s+(\w+)/);
  if (funcMatch) {
    functionName = funcMatch[1];
  } else {
    const arrowMatch = code.match(/(?:const|let|var)?\s*(\w+)\s*=\s*(?:\([^)]*\)|[^\s=]+)\s*=>/);
    if (arrowMatch) {
      functionName = arrowMatch[1];
    }
  }

  if (!functionName) {
    return {
      success: false,
      status: 'Compilation Error',
      message: 'Could not find a valid function definition (e.g. function twoSum() { ... }). Please ensure your code has a function declaration.'
    };
  }

  const runnerScript = `
    ${code}
    (function() {
      try {
        const args = [${sampleInput}];
        const result = ${functionName}(...args);
        return result === undefined ? "undefined" : JSON.stringify(result);
      } catch (err) {
        throw err;
      }
    })()
  `;

  try {
    const context = vm.createContext({});
    let script;
    try {
      script = new vm.Script(runnerScript);
    } catch (compileErr) {
      return {
        success: false,
        status: 'Compilation Error',
        message: compileErr.message
      };
    }

    // Run the code with a 1 second execution limit
    const executionResultStr = script.runInContext(context, { timeout: 1000 });

    const normalizedExpected = sampleOutput.trim();
    const normalizedActual = executionResultStr ? executionResultStr.trim() : 'undefined';

    // JSON comparisons
    let parsedExpected = null;
    let parsedActual = null;
    let isJson = false;

    try {
      parsedExpected = JSON.parse(normalizedExpected);
      parsedActual = JSON.parse(normalizedActual);
      isJson = true;
    } catch (e) {
      isJson = false;
    }

    let match = false;
    if (isJson) {
      match = JSON.stringify(parsedExpected) === JSON.stringify(parsedActual);
      // For arrays/objects, check permutation/elements order ignoring variations if applicable
      if (!match && Array.isArray(parsedExpected) && Array.isArray(parsedActual)) {
        if (parsedExpected.length === parsedActual.length) {
          match = parsedExpected.every(val => parsedActual.includes(val));
        }
      }
    } else {
      match = normalizedExpected === normalizedActual;
    }

    if (match) {
      return {
        success: true,
        status: 'Accepted',
        actualOutput: normalizedActual,
        expectedOutput: normalizedExpected
      };
    } else {
      return {
        success: false,
        status: 'Wrong Answer',
        actualOutput: normalizedActual,
        expectedOutput: normalizedExpected
      };
    }
  } catch (error) {
    return {
      success: false,
      status: 'Runtime Error',
      message: error.message
    };
  }
};

module.exports = {
  runJS
};
