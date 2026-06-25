const vm = require('vm');
const BaseExecutor = require('./baseExecutor');

class JSExecutor extends BaseExecutor {
  /**
   * Execute JS code against a list of test cases
   * @param {string} code - The user's submitted code
   * @param {Array} testCases - Array of test case objects { id, input, expectedOutput, isHidden }
   * @returns {Promise<Object>} - Execution result including success, verdict, passedTests, totalTests, executionTime, testCaseResults
   */
  async execute(code, testCases) {
    // Check syntax (compilation check)
    try {
      new vm.Script(code);
    } catch (compileErr) {
      return {
        success: false,
        verdict: 'COMPILE_ERROR',
        message: compileErr.message,
        passedTests: 0,
        totalTests: testCases.length,
        executionTime: 0,
        testCaseResults: testCases.map(tc => ({
          id: tc.id,
          isHidden: tc.isHidden,
          status: 'COMPILE_ERROR',
          executionTime: 0,
          error: tc.isHidden ? null : compileErr.message,
          input: tc.isHidden ? null : tc.input,
          expectedOutput: tc.isHidden ? null : tc.expectedOutput,
          actualOutput: null
        }))
      };
    }

    let functionName = this.findFunctionName(code);
    if (!functionName) {
      return {
        success: false,
        verdict: 'COMPILE_ERROR',
        message: 'Could not find a valid function definition (e.g. function twoSum() { ... }). Please ensure your code has a function declaration.',
        passedTests: 0,
        totalTests: testCases.length,
        executionTime: 0,
        testCaseResults: testCases.map(tc => ({
          id: tc.id,
          isHidden: tc.isHidden,
          status: 'COMPILE_ERROR',
          executionTime: 0,
          error: tc.isHidden ? null : 'Could not find a valid function definition.',
          input: tc.isHidden ? null : tc.input,
          expectedOutput: tc.isHidden ? null : tc.expectedOutput,
          actualOutput: null
        }))
      };
    }

    const results = [];
    let passedCount = 0;
    let totalTime = 0;
    let overallVerdict = 'ACCEPTED';

    for (const tc of testCases) {
      const runnerScript = `
        ${code}
        (function() {
          try {
            const args = [${tc.input}];
            const result = ${functionName}(...args);
            return result === undefined ? "undefined" : JSON.stringify(result);
          } catch (err) {
            throw err;
          }
        })()
      `;

      const startTime = process.hrtime.bigint();
      let status = 'ACCEPTED';
      let actualOutput = null;
      let error = null;
      let durationMs = 0;

      try {
        const context = vm.createContext({});
        const script = new vm.Script(runnerScript);
        
        // Execute inside sandbox with a timeout of 1000ms
        const executionResultStr = script.runInContext(context, { timeout: 1000 });
        
        const endTime = process.hrtime.bigint();
        durationMs = Number(endTime - startTime) / 1000000;
        totalTime += durationMs;

        actualOutput = executionResultStr;

        // Check if output matches expected output
        const match = this.compareOutput(executionResultStr, tc.expectedOutput);
        if (match) {
          passedCount++;
          status = 'ACCEPTED';
        } else {
          status = 'WRONG_ANSWER';
          if (overallVerdict === 'ACCEPTED') {
            overallVerdict = 'WRONG_ANSWER';
          }
        }
      } catch (err) {
        const endTime = process.hrtime.bigint();
        durationMs = Number(endTime - startTime) / 1000000;
        totalTime += durationMs;

        if (err.message && err.message.includes('Script execution timed out')) {
          status = 'TIME_LIMIT_EXCEEDED';
          error = 'Time Limit Exceeded';
        } else {
          status = 'RUNTIME_ERROR';
          error = err.message || 'Runtime Error';
        }

        // Set overall verdict based on first failing condition priority:
        // TIME_LIMIT_EXCEEDED / RUNTIME_ERROR take precedence over WRONG_ANSWER
        if (overallVerdict === 'ACCEPTED' || overallVerdict === 'WRONG_ANSWER') {
          overallVerdict = status;
        }
      }

      results.push({
        id: tc.id,
        isHidden: tc.isHidden,
        status,
        executionTime: durationMs,
        error: tc.isHidden ? null : error,
        input: tc.isHidden ? null : tc.input,
        expectedOutput: tc.isHidden ? null : tc.expectedOutput,
        actualOutput: tc.isHidden ? null : actualOutput
      });
    }

    return {
      success: overallVerdict === 'ACCEPTED',
      verdict: overallVerdict,
      passedTests: passedCount,
      totalTests: testCases.length,
      executionTime: totalTime,
      testCaseResults: results
    };
  }

  findFunctionName(code) {
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
    return functionName;
  }

  compareOutput(actual, expected) {
    const normalizedExpected = expected.trim();
    const normalizedActual = actual ? actual.trim() : 'undefined';

    let parsedExpected = null;
    let parsedActual = null;
    let expectedParsed = false;
    let actualParsed = false;

    try {
      parsedExpected = JSON.parse(normalizedExpected);
      expectedParsed = true;
    } catch (e) {
      parsedExpected = normalizedExpected;
    }

    try {
      parsedActual = JSON.parse(normalizedActual);
      actualParsed = true;
    } catch (e) {
      parsedActual = normalizedActual;
    }

    if (expectedParsed && actualParsed) {
      const match = JSON.stringify(parsedExpected) === JSON.stringify(parsedActual);
      if (!match && Array.isArray(parsedExpected) && Array.isArray(parsedActual)) {
        if (parsedExpected.length === parsedActual.length) {
          return parsedExpected.every(val => parsedActual.includes(val));
        }
      }
      return match;
    }

    return String(parsedExpected).trim() === String(parsedActual).trim();
  }
}

module.exports = JSExecutor;
