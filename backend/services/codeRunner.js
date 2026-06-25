const { runCode } = require('./codeRunner/index');
const JSExecutor = require('./codeRunner/jsExecutor');

/**
 * Executes JS code in a secure sandbox and evaluates it against sample input/output.
 * (Legacy method kept for backward compatibility).
 */
const runJS = (code, sampleInput, sampleOutput) => {
  const executor = new JSExecutor();
  let functionName = executor.findFunctionName(code);
  if (!functionName) {
    return {
      success: false,
      status: 'Compilation Error',
      message: 'Could not find a valid function definition (e.g. function twoSum() { ... }). Please ensure your code has a function declaration.'
    };
  }

  const vm = require('vm');
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
    const script = new vm.Script(runnerScript);
    const executionResultStr = script.runInContext(context, { timeout: 1000 });
    const match = executor.compareOutput(executionResultStr, sampleOutput);
    if (match) {
      return {
        success: true,
        status: 'Accepted',
        actualOutput: executionResultStr,
        expectedOutput: sampleOutput
      };
    } else {
      return {
        success: false,
        status: 'Wrong Answer',
        actualOutput: executionResultStr,
        expectedOutput: sampleOutput
      };
    }
  } catch (error) {
    return {
      success: false,
      status: error.message && error.message.includes('Script execution timed out') ? 'Time Limit Exceeded' : 'Runtime Error',
      message: error.message
    };
  }
};

module.exports = {
  runCode,
  runJS
};
