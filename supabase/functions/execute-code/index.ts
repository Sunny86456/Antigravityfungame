import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Piston API for secure code execution
const PISTON_API = "https://emkc.org/api/v2/piston";

interface ExecuteRequest {
  code: string;
  language: 'javascript' | 'python' | 'cpp' | 'java';
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
  timeoutMs?: number;
}

interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
  executionTime?: number;
}

interface ExecuteResponse {
  success: boolean;
  verdict: 'accepted' | 'wrong_answer' | 'compilation_error' | 'runtime_error' | 'time_limit_exceeded' | 'empty_code';
  results: TestResult[];
  compilationError?: string;
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
}

// Language configurations for Piston
const languageConfig: Record<string, { language: string; version: string; extension: string }> = {
  javascript: { language: 'javascript', version: '18.15.0', extension: 'js' },
  python: { language: 'python', version: '3.10.0', extension: 'py' },
  cpp: { language: 'c++', version: '10.2.0', extension: 'cpp' },
  java: { language: 'java', version: '15.0.2', extension: 'java' },
};

// Generate complete executable code for each test
function generateExecutableCode(userCode: string, language: string, input: string): string {
  // Detect which function is defined in the code
  const detectFunction = (code: string, lang: string): string => {
    const jsPatterns = [
      { pattern: /function\s+findMax\s*\(/, name: 'findMax' },
      { pattern: /function\s+reverseArray\s*\(/, name: 'reverseArray' },
      { pattern: /function\s+sumArray\s*\(/, name: 'sumArray' },
      { pattern: /function\s+countOccurrences\s*\(/, name: 'countOccurrences' },
      { pattern: /function\s+isPalindrome\s*\(/, name: 'isPalindrome' },
      { pattern: /function\s+twoSum\s*\(/, name: 'twoSum' },
      { pattern: /function\s+isValid\s*\(/, name: 'isValid' },
      { pattern: /function\s+fibonacci\s*\(/, name: 'fibonacci' },
      { pattern: /function\s+binarySearch\s*\(/, name: 'binarySearch' },
      { pattern: /function\s+mergeSortedArrays\s*\(/, name: 'mergeSortedArrays' },
    ];
    
    const pyPatterns = [
      { pattern: /def\s+find_max\s*\(/, name: 'find_max' },
      { pattern: /def\s+reverse_array\s*\(/, name: 'reverse_array' },
      { pattern: /def\s+sum_array\s*\(/, name: 'sum_array' },
      { pattern: /def\s+count_occurrences\s*\(/, name: 'count_occurrences' },
      { pattern: /def\s+is_palindrome\s*\(/, name: 'is_palindrome' },
      { pattern: /def\s+two_sum\s*\(/, name: 'two_sum' },
      { pattern: /def\s+is_valid\s*\(/, name: 'is_valid' },
      { pattern: /def\s+fibonacci\s*\(/, name: 'fibonacci' },
      { pattern: /def\s+binary_search\s*\(/, name: 'binary_search' },
      { pattern: /def\s+merge_sorted_arrays\s*\(/, name: 'merge_sorted_arrays' },
    ];
    
    const patterns = lang === 'python' ? pyPatterns : jsPatterns;
    
    for (const { pattern, name } of patterns) {
      if (pattern.test(code)) {
        return name;
      }
    }
    return '';
  };

  const funcName = detectFunction(userCode, language);
  
  switch (language) {
    case 'javascript': {
      // Parse the input to determine how to call the function
      let callCode = '';
      if (funcName === 'countOccurrences') {
        callCode = `const input = ${input}; console.log(JSON.stringify(${funcName}(input.arr, input.target)));`;
      } else if (funcName === 'twoSum') {
        callCode = `const input = ${input}; console.log(JSON.stringify(${funcName}(input.nums, input.target)));`;
      } else if (funcName === 'binarySearch') {
        callCode = `const input = ${input}; console.log(JSON.stringify(${funcName}(input.arr, input.target)));`;
      } else if (funcName === 'mergeSortedArrays') {
        callCode = `const input = ${input}; console.log(JSON.stringify(${funcName}(input.arr1, input.arr2)));`;
      } else if (funcName) {
        callCode = `const input = ${input}; console.log(JSON.stringify(${funcName}(input)));`;
      } else {
        callCode = `console.log("ERROR: No recognized function found");`;
      }
      
      return `${userCode}\n\n${callCode}`;
    }

    case 'python': {
      let callCode = '';
      if (funcName === 'count_occurrences') {
        callCode = `import json\ninput_data = ${input}\nresult = ${funcName}(input_data['arr'], input_data['target'])\nprint(json.dumps(result))`;
      } else if (funcName === 'two_sum') {
        callCode = `import json\ninput_data = ${input}\nresult = ${funcName}(input_data['nums'], input_data['target'])\nprint(json.dumps(result))`;
      } else if (funcName === 'binary_search') {
        callCode = `import json\ninput_data = ${input}\nresult = ${funcName}(input_data['arr'], input_data['target'])\nprint(json.dumps(result))`;
      } else if (funcName === 'merge_sorted_arrays') {
        callCode = `import json\ninput_data = ${input}\nresult = ${funcName}(input_data['arr1'], input_data['arr2'])\nprint(json.dumps(result))`;
      } else if (funcName) {
        callCode = `import json\ninput_data = ${input}\nresult = ${funcName}(input_data)\nprint(json.dumps(result))`;
      } else {
        callCode = `print("ERROR: No recognized function found")`;
      }
      
      return `${userCode}\n\n${callCode}`;
    }

    case 'cpp':
      return `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <stack>
#include <unordered_map>
using namespace std;

${userCode}

int main() {
    // C++ execution is limited in this sandbox
    cout << "CPP_NOT_FULLY_SUPPORTED" << endl;
    return 0;
}`;

    case 'java':
      return `
import java.util.*;

public class Main {
    ${userCode}
    
    public static void main(String[] args) {
        // Java execution is limited in this sandbox
        System.out.println("JAVA_NOT_FULLY_SUPPORTED");
    }
}`;

    default:
      return userCode;
  }
}

async function executeWithPiston(
  code: string, 
  language: string, 
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; error?: string; timedOut?: boolean }> {
  const config = languageConfig[language];
  if (!config) {
    return { stdout: '', stderr: '', error: `Unsupported language: ${language}` };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs + 5000);

    const response = await fetch(`${PISTON_API}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: config.language,
        version: config.version,
        files: [{ name: `main.${config.extension}`, content: code }],
        run_timeout: timeoutMs,
        compile_timeout: 10000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return { stdout: '', stderr: '', error: `Piston API error: ${errorText}` };
    }

    const result = await response.json();
    
    // Check for compilation errors
    if (result.compile && result.compile.code !== 0) {
      return { 
        stdout: '', 
        stderr: result.compile.stderr || result.compile.output || 'Compilation failed',
        error: 'compilation_error'
      };
    }

    // Check for runtime errors (non-zero exit code with no output)
    if (result.run && result.run.code !== 0 && !result.run.stdout) {
      return {
        stdout: '',
        stderr: result.run.stderr || 'Runtime error',
        error: 'runtime_error'
      };
    }

    // Check for timeout
    if (result.run && result.run.signal === 'SIGKILL') {
      return { stdout: '', stderr: '', timedOut: true };
    }

    return {
      stdout: result.run?.stdout || '',
      stderr: result.run?.stderr || '',
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { stdout: '', stderr: '', timedOut: true };
    }
    return { stdout: '', stderr: '', error: String(error) };
  }
}

function normalizeOutput(output: string): string {
  // Remove whitespace and normalize
  return output.trim().replace(/\s+/g, '');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: ExecuteRequest = await req.json();
    const { code, language, testCases, timeoutMs = 5000 } = body;

    console.log(`[execute-code] Received request for ${language} with ${testCases.length} test cases`);

    // VALIDATION 1: Check for empty code
    const trimmedCode = code.trim();
    if (!trimmedCode || trimmedCode.length < 10) {
      console.log('[execute-code] Rejected: Empty or too short code');
      return new Response(JSON.stringify({
        success: false,
        verdict: 'empty_code',
        results: [{
          input: 'N/A',
          expected: 'N/A',
          actual: 'Code is empty or too short',
          passed: false,
          error: 'empty_code'
        }],
        allPassed: false,
        passedCount: 0,
        totalCount: testCases.length,
      } as ExecuteResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // VALIDATION 2: Check for TODO comments still present (incomplete code)
    if (trimmedCode.includes('// TODO') || trimmedCode.includes('# TODO')) {
      console.log('[execute-code] Rejected: TODO comments still present');
      return new Response(JSON.stringify({
        success: false,
        verdict: 'empty_code',
        results: [{
          input: 'N/A',
          expected: 'N/A',
          actual: 'Code contains TODO comments - please complete the solution',
          passed: false,
          error: 'incomplete_code'
        }],
        allPassed: false,
        passedCount: 0,
        totalCount: testCases.length,
      } as ExecuteResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for unsupported languages with clear message
    if (language === 'cpp' || language === 'java') {
      return new Response(JSON.stringify({
        success: false,
        verdict: 'runtime_error',
        results: [{
          input: 'N/A',
          expected: 'N/A',
          actual: `${language === 'cpp' ? 'C++' : 'Java'} execution is not fully supported in this sandbox. Please use JavaScript or Python.`,
          passed: false,
          error: 'unsupported_language'
        }],
        allPassed: false,
        passedCount: 0,
        totalCount: testCases.length,
      } as ExecuteResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: TestResult[] = [];
    let compilationError: string | undefined;
    let hasRuntimeError = false;
    let hasTimeout = false;

    // Execute each test case separately with small delay to avoid rate limiting
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const executableCode = generateExecutableCode(trimmedCode, language, testCase.input);
      const startTime = Date.now();
      
      console.log(`[execute-code] Running test case ${i + 1}/${testCases.length} with input: ${testCase.input}`);
      
      // Add small delay between requests to avoid Piston rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const execResult = await executeWithPiston(executableCode, language, timeoutMs);
      const executionTime = Date.now() - startTime;

      if (execResult.error === 'compilation_error') {
        compilationError = execResult.stderr;
        results.push({
          input: testCase.input,
          expected: testCase.expectedOutput,
          actual: `Compilation Error: ${execResult.stderr.substring(0, 200)}`,
          passed: false,
          error: 'compilation_error',
          executionTime,
        });
        break; // Stop on compilation error
      }

      if (execResult.timedOut) {
        hasTimeout = true;
        results.push({
          input: testCase.input,
          expected: testCase.expectedOutput,
          actual: 'Time Limit Exceeded',
          passed: false,
          error: 'time_limit_exceeded',
          executionTime,
        });
        continue;
      }

      if (execResult.error === 'runtime_error') {
        hasRuntimeError = true;
        results.push({
          input: testCase.input,
          expected: testCase.expectedOutput,
          actual: `Runtime Error: ${execResult.stderr.substring(0, 200)}`,
          passed: false,
          error: 'runtime_error',
          executionTime,
        });
        continue;
      }

      // Check stderr for runtime errors even if we got output
      if (execResult.stderr && execResult.stderr.trim()) {
        hasRuntimeError = true;
        results.push({
          input: testCase.input,
          expected: testCase.expectedOutput,
          actual: `Runtime Error: ${execResult.stderr.substring(0, 200)}`,
          passed: false,
          error: 'runtime_error',
          executionTime,
        });
        continue;
      }

      // Compare output strictly
      const actualOutput = execResult.stdout.trim();
      const expectedNormalized = normalizeOutput(testCase.expectedOutput);
      const actualNormalized = normalizeOutput(actualOutput);
      const passed = actualNormalized === expectedNormalized;

      console.log(`[execute-code] Expected: "${expectedNormalized}", Actual: "${actualNormalized}", Passed: ${passed}`);

      results.push({
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: actualOutput || '(no output)',
        passed,
        executionTime,
      });
    }

    // Determine verdict
    let verdict: ExecuteResponse['verdict'];
    const passedCount = results.filter(r => r.passed).length;
    const allPassed = passedCount === testCases.length && passedCount > 0;

    if (compilationError) {
      verdict = 'compilation_error';
    } else if (hasTimeout) {
      verdict = 'time_limit_exceeded';
    } else if (hasRuntimeError) {
      verdict = 'runtime_error';
    } else if (allPassed) {
      verdict = 'accepted';
    } else {
      verdict = 'wrong_answer';
    }

    console.log(`[execute-code] Final verdict: ${verdict}, ${passedCount}/${testCases.length} passed`);

    return new Response(JSON.stringify({
      success: verdict === 'accepted',
      verdict,
      results,
      compilationError,
      allPassed,
      passedCount,
      totalCount: testCases.length,
    } as ExecuteResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[execute-code] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      verdict: 'runtime_error',
      results: [{
        input: 'N/A',
        expected: 'N/A',
        actual: `Server Error: ${error.message}`,
        passed: false,
        error: 'server_error'
      }],
      allPassed: false,
      passedCount: 0,
      totalCount: 0,
    } as ExecuteResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
