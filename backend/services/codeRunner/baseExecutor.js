class BaseExecutor {
  /**
   * Execute code against a list of test cases
   * @param {string} code - The user's submitted code
   * @param {Array} testCases - Array of testcase objects { id, input, expectedOutput, isHidden }
   * @returns {Promise<Object>} - Execution result including success, verdict, passedTests, totalTests, executionTime, testCaseResults
   */
  async execute(code, testCases) {
    throw new Error('Method execute() must be implemented.');
  }
}

module.exports = BaseExecutor;
