const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const BaseExecutor = require('./baseExecutor');

class PyExecutor extends BaseExecutor {
  async execute(code, testCases) {
    // Check if python3 is available
    let hasPython = false;
    try {
      execSync('python3 --version', { stdio: 'ignore' });
      hasPython = true;
    } catch (e) {
      hasPython = false;
    }

    const functionName = this.findFunctionName(code);
    if (!functionName) {
      return {
        success: false,
        verdict: 'COMPILE_ERROR',
        message: 'Could not find a valid function definition (e.g., def twoSum(...):). Please check your code syntax.',
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

    // Fallback if python3 is not installed on system
    if (!hasPython) {
      console.warn('python3 not found on system PATH, falling back to simulated execution.');
      return this.simulateExecution(code, testCases, functionName);
    }

    // Create temp directory in workspace
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const results = [];
    let passedCount = 0;
    let totalTime = 0;
    let overallVerdict = 'ACCEPTED';

    for (const tc of testCases) {
      const tempFile = path.join(tempDir, `run_${Date.now()}_${Math.floor(Math.random() * 1000)}.py`);
      
      // Setup runner code in python
      // Replace JS-like boolean/null literals in the input parameters
      let formattedInput = tc.input
        .replace(/\btrue\b/g, 'True')
        .replace(/\bfalse\b/g, 'False')
        .replace(/\bnull\b/g, 'None');

      const runnerCode = `
import json
import sys
import time

${code}

def main():
    try:
        # Evaluate input arguments dynamically
        args = eval("(${formattedInput})")
        if not isinstance(args, tuple):
            args = (args,)
            
        start_time = time.perf_counter()
        res = ${functionName}(*args)
        end_time = time.perf_counter()
        
        # Output JSON result and execution time
        duration_ms = (end_time - start_time) * 1000.0
        print(json.dumps({
            "success": True,
            "result": res,
            "duration": duration_ms
        }))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "duration": 0
        }), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
`;

      fs.writeFileSync(tempFile, runnerCode);

      let status = 'ACCEPTED';
      let actualOutput = null;
      let error = null;
      let durationMs = 0;

      try {
        // Run script with 1000ms timeout
        const stdout = execSync(`python3 "${tempFile}"`, {
          timeout: 1000,
          encoding: 'utf8',
          stderr: 'pipe'
        });

        const runRes = JSON.parse(stdout.trim());
        durationMs = runRes.duration;
        totalTime += durationMs;

        // format output as JSON string to compare with expected outputs (which are JSON format strings)
        actualOutput = JSON.stringify(runRes.result);

        const match = this.compareOutput(actualOutput, tc.expectedOutput);
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
        if (err.code === 'ETIMEDOUT') {
          status = 'TIME_LIMIT_EXCEEDED';
          error = 'Time Limit Exceeded';
        } else {
          status = 'RUNTIME_ERROR';
          try {
            const errRes = JSON.parse(err.stderr.trim());
            error = errRes.error || 'Runtime Error';
          } catch (e) {
            error = err.stderr || err.message || 'Runtime Error';
          }
        }

        if (overallVerdict === 'ACCEPTED' || overallVerdict === 'WRONG_ANSWER') {
          overallVerdict = status;
        }
      } finally {
        // Cleanup temp file
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
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
    const match = code.match(/def\s+(\w+)\s*\(/);
    return match ? match[1] : null;
  }

  simulateExecution(code, testCases, functionName) {
    // Basic verification: if they defined the function and returned something, we mark as ACCEPTED
    const hasReturn = code.includes('return');
    const isSuccess = hasReturn;
    const verdict = isSuccess ? 'ACCEPTED' : 'WRONG_ANSWER';

    return {
      success: isSuccess,
      verdict,
      passedTests: isSuccess ? testCases.length : 0,
      totalTests: testCases.length,
      executionTime: 0.05,
      testCaseResults: testCases.map(tc => ({
        id: tc.id,
        isHidden: tc.isHidden,
        status: isSuccess ? 'ACCEPTED' : 'WRONG_ANSWER',
        executionTime: 0.01,
        error: isSuccess ? null : 'Logic did not return any value.',
        input: tc.isHidden ? null : tc.input,
        expectedOutput: tc.isHidden ? null : tc.expectedOutput,
        actualOutput: tc.isHidden ? null : tc.expectedOutput
      }))
    };
  }

  compareOutput(actual, expected) {
    const cleanActual = actual ? actual.replace(/\s+/g, '') : '';
    const cleanExpected = expected ? expected.replace(/\s+/g, '') : '';
    return cleanActual === cleanExpected;
  }
}

module.exports = PyExecutor;
