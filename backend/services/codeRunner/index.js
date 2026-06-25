const JSExecutor = require('./jsExecutor');

const executors = {
  javascript: new JSExecutor(),
  // Python and Java executors can be registered here in the future
};

/**
 * Executes user code in the specified language against the given test cases.
 * @param {string} language - The programming language (e.g., 'javascript')
 * @param {string} code - The user's code submission
 * @param {Array} testCases - The test cases to execute
 * @returns {Promise<Object>} - Detailed execution result
 */
const runCode = async (language, code, testCases) => {
  const langKey = language.toLowerCase();
  const executor = executors[langKey];
  
  if (!executor) {
    return {
      success: false,
      verdict: 'UNSUPPORTED_LANGUAGE',
      message: `Unsupported language: ${language}. Only JavaScript is supported initially.`,
      passedTests: 0,
      totalTests: testCases.length,
      executionTime: 0,
      testCaseResults: []
    };
  }

  return await executor.execute(code, testCases);
};

module.exports = {
  runCode,
  executors
};
