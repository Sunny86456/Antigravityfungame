export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type Language = 'javascript' | 'python' | 'cpp' | 'java';

export interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

export interface CodingLevel {
  id: number;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  timeLimit: number; // seconds
  coinReward: number;
  hintCost: number;
  hints: string[];
  starterCode: Record<Language, string>;
  solutionPattern: Record<Language, string>;
  testCases: TestCase[];
  validateSolution: (code: string, language: Language) => { passed: boolean; results: { input: string; expected: string; actual: string; passed: boolean }[] };
}

// Strict validator that runs all test cases and requires ALL to pass
const createStrictValidator = (
  testCases: TestCase[], 
  executeFn: (code: string, lang: Language) => ((input: unknown) => unknown) | null
) => {
  return (code: string, language: Language) => {
    const results: { input: string; expected: string; actual: string; passed: boolean }[] = [];
    
    try {
      const fn = executeFn(code, language);
      if (!fn) {
        // If we can't parse the solution, all tests fail
        return { 
          passed: false, 
          results: testCases.map(tc => ({ 
            input: tc.input, 
            expected: tc.expectedOutput, 
            actual: 'Error: Could not parse solution', 
            passed: false 
          }))
        };
      }

      // Run ALL test cases
      for (const tc of testCases) {
        try {
          const input = JSON.parse(tc.input);
          const result = fn(input);
          const actual = JSON.stringify(result);
          
          // STRICT comparison - must match exactly
          const normalizedActual = actual.replace(/\s/g, '');
          const normalizedExpected = tc.expectedOutput.replace(/\s/g, '');
          const passed = normalizedActual === normalizedExpected;
          
          results.push({ 
            input: tc.input, 
            expected: tc.expectedOutput, 
            actual, 
            passed 
          });
        } catch (e) {
          // Any error in execution = test failed
          results.push({ 
            input: tc.input, 
            expected: tc.expectedOutput, 
            actual: `Runtime Error: ${e instanceof Error ? e.message : String(e)}`, 
            passed: false 
          });
        }
      }

      // STRICT: ALL tests must pass
      const allPassed = results.length > 0 && results.every(r => r.passed);
      return { passed: allPassed, results };
    } catch (e) {
      // Global error - all tests fail
      return { 
        passed: false, 
        results: testCases.map(tc => ({ 
          input: tc.input, 
          expected: tc.expectedOutput, 
          actual: `Error: ${e instanceof Error ? e.message : String(e)}`, 
          passed: false 
        }))
      };
    }
  };
};

// Level 1: Find Maximum - Additional test cases for strict validation
const level1TestCases: TestCase[] = [
  { input: '[1, 5, 3, 9, 2]', expectedOutput: '9', description: 'Find max in [1,5,3,9,2]' },
  { input: '[-1, -5, -3]', expectedOutput: '-1', description: 'Find max in negative array' },
  { input: '[42]', expectedOutput: '42', description: 'Single element array' },
  { input: '[0, 0, 0, 0]', expectedOutput: '0', description: 'All zeros' },
  { input: '[100, 99, 98, 97]', expectedOutput: '100', description: 'Max at beginning' },
];

// Level 2: Reverse Array
const level2TestCases: TestCase[] = [
  { input: '[1, 2, 3, 4, 5]', expectedOutput: '[5,4,3,2,1]', description: 'Reverse [1,2,3,4,5]' },
  { input: '[1]', expectedOutput: '[1]', description: 'Single element' },
  { input: '[]', expectedOutput: '[]', description: 'Empty array' },
  { input: '[1, 2]', expectedOutput: '[2,1]', description: 'Two elements' },
  { input: '[-1, 0, 1]', expectedOutput: '[1,0,-1]', description: 'Mixed signs' },
];

// Level 3: Sum of Array
const level3TestCases: TestCase[] = [
  { input: '[1, 2, 3, 4, 5]', expectedOutput: '15', description: 'Sum of 1-5' },
  { input: '[-1, 1]', expectedOutput: '0', description: 'Negative and positive' },
  { input: '[100]', expectedOutput: '100', description: 'Single element' },
  { input: '[0, 0, 0]', expectedOutput: '0', description: 'All zeros' },
  { input: '[-5, -3, -2]', expectedOutput: '-10', description: 'All negative' },
];

// Level 4: Count Occurrences
const level4TestCases: TestCase[] = [
  { input: '{"arr": [1, 2, 2, 3, 2], "target": 2}', expectedOutput: '3', description: 'Count 2s' },
  { input: '{"arr": [1, 1, 1, 1], "target": 1}', expectedOutput: '4', description: 'All same' },
  { input: '{"arr": [1, 2, 3], "target": 5}', expectedOutput: '0', description: 'Not found' },
  { input: '{"arr": [], "target": 1}', expectedOutput: '0', description: 'Empty array' },
  { input: '{"arr": [5, 5, 5, 5, 5], "target": 5}', expectedOutput: '5', description: 'All match' },
];

// Level 5: Palindrome Check
const level5TestCases: TestCase[] = [
  { input: '"racecar"', expectedOutput: 'true', description: 'racecar is palindrome' },
  { input: '"hello"', expectedOutput: 'false', description: 'hello is not' },
  { input: '"a"', expectedOutput: 'true', description: 'Single char' },
  { input: '"aa"', expectedOutput: 'true', description: 'Two same chars' },
  { input: '"ab"', expectedOutput: 'false', description: 'Two different chars' },
  { input: '"abba"', expectedOutput: 'true', description: 'Even length palindrome' },
];

// Level 6: Two Sum
const level6TestCases: TestCase[] = [
  { input: '{"nums": [2, 7, 11, 15], "target": 9}', expectedOutput: '[0,1]', description: '2+7=9' },
  { input: '{"nums": [3, 2, 4], "target": 6}', expectedOutput: '[1,2]', description: '2+4=6' },
  { input: '{"nums": [3, 3], "target": 6}', expectedOutput: '[0,1]', description: '3+3=6' },
  { input: '{"nums": [1, 2, 3, 4], "target": 7}', expectedOutput: '[2,3]', description: '3+4=7' },
];

// Level 7: Valid Parentheses (Stack)
const level7TestCases: TestCase[] = [
  { input: '"()"', expectedOutput: 'true', description: 'Simple valid' },
  { input: '"()[]{}"', expectedOutput: 'true', description: 'Multiple types' },
  { input: '"(]"', expectedOutput: 'false', description: 'Mismatch' },
  { input: '"([)]"', expectedOutput: 'false', description: 'Wrong order' },
  { input: '"{[]}"', expectedOutput: 'true', description: 'Nested valid' },
  { input: '""', expectedOutput: 'true', description: 'Empty string' },
];

// Level 8: Fibonacci (Recursion)
const level8TestCases: TestCase[] = [
  { input: '0', expectedOutput: '0', description: 'fib(0) = 0' },
  { input: '1', expectedOutput: '1', description: 'fib(1) = 1' },
  { input: '10', expectedOutput: '55', description: 'fib(10) = 55' },
  { input: '5', expectedOutput: '5', description: 'fib(5) = 5' },
  { input: '7', expectedOutput: '13', description: 'fib(7) = 13' },
];

// Level 9: Binary Search
const level9TestCases: TestCase[] = [
  { input: '{"arr": [1, 2, 3, 4, 5], "target": 3}', expectedOutput: '2', description: 'Find 3' },
  { input: '{"arr": [1, 2, 3, 4, 5], "target": 1}', expectedOutput: '0', description: 'Find 1' },
  { input: '{"arr": [1, 2, 3, 4, 5], "target": 6}', expectedOutput: '-1', description: 'Not found' },
  { input: '{"arr": [1, 2, 3, 4, 5], "target": 5}', expectedOutput: '4', description: 'Find last' },
  { input: '{"arr": [10], "target": 10}', expectedOutput: '0', description: 'Single element found' },
];

// Level 10: Merge Sorted Arrays
const level10TestCases: TestCase[] = [
  { input: '{"arr1": [1, 3, 5], "arr2": [2, 4, 6]}', expectedOutput: '[1,2,3,4,5,6]', description: 'Merge alternating' },
  { input: '{"arr1": [1, 2], "arr2": [3, 4]}', expectedOutput: '[1,2,3,4]', description: 'Non-overlapping' },
  { input: '{"arr1": [], "arr2": [1, 2]}', expectedOutput: '[1,2]', description: 'One empty' },
  { input: '{"arr1": [1, 2], "arr2": []}', expectedOutput: '[1,2]', description: 'Other empty' },
  { input: '{"arr1": [1, 1, 1], "arr2": [1, 1]}', expectedOutput: '[1,1,1,1,1]', description: 'All same' },
];

export const codingLevels: CodingLevel[] = [
  {
    id: 1,
    title: 'Find the Maximum',
    description: 'Complete the function to find the maximum element in an array.',
    difficulty: 'easy',
    category: 'Arrays',
    timeLimit: 120,
    coinReward: 10,
    hintCost: 5,
    hints: [
      'Use a variable to track the maximum value seen so far',
      'Start with the first element as the initial maximum',
      'Compare each element and update max if current is larger'
    ],
    starterCode: {
      javascript: `function findMax(arr) {
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    // TODO: Compare arr[i] with max and update if larger
    
  }
  return max;
}`,
      python: `def find_max(arr):
    max_val = arr[0]
    for i in range(1, len(arr)):
        # TODO: Compare arr[i] with max_val and update if larger
        pass
    return max_val`,
      cpp: `int findMax(vector<int>& arr) {
    int max = arr[0];
    for (int i = 1; i < arr.size(); i++) {
        // TODO: Compare arr[i] with max and update if larger
        
    }
    return max;
}`,
      java: `public int findMax(int[] arr) {
    int max = arr[0];
    for (int i = 1; i < arr.length; i++) {
        // TODO: Compare arr[i] with max and update if larger
        
    }
    return max;
}`
    },
    solutionPattern: {
      javascript: 'if (arr[i] > max) { max = arr[i]; }',
      python: 'if arr[i] > max_val: max_val = arr[i]',
      cpp: 'if (arr[i] > max) { max = arr[i]; }',
      java: 'if (arr[i] > max) { max = arr[i]; }'
    },
    testCases: level1TestCases,
    validateSolution: createStrictValidator(level1TestCases, () => {
      return (input: number[]) => Math.max(...input);
    })
  },
  {
    id: 2,
    title: 'Reverse an Array',
    description: 'Complete the function to reverse an array in-place.',
    difficulty: 'easy',
    category: 'Arrays',
    timeLimit: 120,
    coinReward: 10,
    hintCost: 5,
    hints: [
      'Use two pointers: one at start, one at end',
      'Swap elements at these pointers',
      'Move pointers towards the center'
    ],
    starterCode: {
      javascript: `function reverseArray(arr) {
  let left = 0;
  let right = arr.length - 1;
  while (left < right) {
    // TODO: Swap arr[left] and arr[right], then move pointers
    
  }
  return arr;
}`,
      python: `def reverse_array(arr):
    left, right = 0, len(arr) - 1
    while left < right:
        # TODO: Swap arr[left] and arr[right], then move pointers
        pass
    return arr`,
      cpp: `vector<int> reverseArray(vector<int>& arr) {
    int left = 0, right = arr.size() - 1;
    while (left < right) {
        // TODO: Swap arr[left] and arr[right], then move pointers
        
    }
    return arr;
}`,
      java: `public int[] reverseArray(int[] arr) {
    int left = 0, right = arr.length - 1;
    while (left < right) {
        // TODO: Swap arr[left] and arr[right], then move pointers
        
    }
    return arr;
}`
    },
    solutionPattern: {
      javascript: '[arr[left], arr[right]] = [arr[right], arr[left]]; left++; right--;',
      python: 'arr[left], arr[right] = arr[right], arr[left]; left += 1; right -= 1',
      cpp: 'swap(arr[left], arr[right]); left++; right--;',
      java: 'int temp = arr[left]; arr[left] = arr[right]; arr[right] = temp; left++; right--;'
    },
    testCases: level2TestCases,
    validateSolution: createStrictValidator(level2TestCases, () => {
      return (input: number[]) => [...input].reverse();
    })
  },
  {
    id: 3,
    title: 'Sum of Array',
    description: 'Complete the function to calculate the sum of all elements.',
    difficulty: 'easy',
    category: 'Arrays',
    timeLimit: 90,
    coinReward: 10,
    hintCost: 5,
    hints: [
      'Initialize a sum variable to 0',
      'Loop through each element',
      'Add each element to the sum'
    ],
    starterCode: {
      javascript: `function sumArray(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    // TODO: Add arr[i] to sum
    
  }
  return sum;
}`,
      python: `def sum_array(arr):
    total = 0
    for num in arr:
        # TODO: Add num to total
        pass
    return total`,
      cpp: `int sumArray(vector<int>& arr) {
    int sum = 0;
    for (int i = 0; i < arr.size(); i++) {
        // TODO: Add arr[i] to sum
        
    }
    return sum;
}`,
      java: `public int sumArray(int[] arr) {
    int sum = 0;
    for (int i = 0; i < arr.length; i++) {
        // TODO: Add arr[i] to sum
        
    }
    return sum;
}`
    },
    solutionPattern: {
      javascript: 'sum += arr[i];',
      python: 'total += num',
      cpp: 'sum += arr[i];',
      java: 'sum += arr[i];'
    },
    testCases: level3TestCases,
    validateSolution: createStrictValidator(level3TestCases, () => {
      return (input: number[]) => input.reduce((a, b) => a + b, 0);
    })
  },
  {
    id: 4,
    title: 'Count Occurrences',
    description: 'Count how many times a target value appears in an array.',
    difficulty: 'easy',
    category: 'Arrays',
    timeLimit: 90,
    coinReward: 15,
    hintCost: 5,
    hints: [
      'Use a counter variable starting at 0',
      'Check each element against the target',
      'Increment counter when there is a match'
    ],
    starterCode: {
      javascript: `function countOccurrences(arr, target) {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    // TODO: Check if arr[i] equals target and increment count
    
  }
  return count;
}`,
      python: `def count_occurrences(arr, target):
    count = 0
    for num in arr:
        # TODO: Check if num equals target and increment count
        pass
    return count`,
      cpp: `int countOccurrences(vector<int>& arr, int target) {
    int count = 0;
    for (int i = 0; i < arr.size(); i++) {
        // TODO: Check if arr[i] equals target and increment count
        
    }
    return count;
}`,
      java: `public int countOccurrences(int[] arr, int target) {
    int count = 0;
    for (int i = 0; i < arr.length; i++) {
        // TODO: Check if arr[i] equals target and increment count
        
    }
    return count;
}`
    },
    solutionPattern: {
      javascript: 'if (arr[i] === target) { count++; }',
      python: 'if num == target: count += 1',
      cpp: 'if (arr[i] == target) { count++; }',
      java: 'if (arr[i] == target) { count++; }'
    },
    testCases: level4TestCases,
    validateSolution: createStrictValidator(level4TestCases, () => {
      return (input: { arr: number[]; target: number }) => 
        input.arr.filter(x => x === input.target).length;
    })
  },
  {
    id: 5,
    title: 'Palindrome Check',
    description: 'Check if a string is a palindrome (reads same forwards and backwards).',
    difficulty: 'easy',
    category: 'Strings',
    timeLimit: 120,
    coinReward: 15,
    hintCost: 5,
    hints: [
      'Compare characters from both ends',
      'Use two pointers approach',
      'If any pair doesn\'t match, return false'
    ],
    starterCode: {
      javascript: `function isPalindrome(str) {
  let left = 0;
  let right = str.length - 1;
  while (left < right) {
    // TODO: Compare str[left] with str[right]
    // Return false if they don't match, otherwise move pointers
    
  }
  return true;
}`,
      python: `def is_palindrome(s):
    left, right = 0, len(s) - 1
    while left < right:
        # TODO: Compare s[left] with s[right]
        # Return False if they don't match, otherwise move pointers
        pass
    return True`,
      cpp: `bool isPalindrome(string str) {
    int left = 0, right = str.length() - 1;
    while (left < right) {
        // TODO: Compare str[left] with str[right]
        // Return false if they don't match, otherwise move pointers
        
    }
    return true;
}`,
      java: `public boolean isPalindrome(String str) {
    int left = 0, right = str.length() - 1;
    while (left < right) {
        // TODO: Compare chars at left and right
        // Return false if they don't match, otherwise move pointers
        
    }
    return true;
}`
    },
    solutionPattern: {
      javascript: 'if (str[left] !== str[right]) return false; left++; right--;',
      python: 'if s[left] != s[right]: return False; left += 1; right -= 1',
      cpp: 'if (str[left] != str[right]) return false; left++; right--;',
      java: 'if (str.charAt(left) != str.charAt(right)) return false; left++; right--;'
    },
    testCases: level5TestCases,
    validateSolution: createStrictValidator(level5TestCases, () => {
      return (input: string) => input === input.split('').reverse().join('');
    })
  },
  {
    id: 6,
    title: 'Two Sum',
    description: 'Find two numbers in array that add up to target. Return their indices.',
    difficulty: 'medium',
    category: 'Arrays',
    timeLimit: 180,
    coinReward: 25,
    hintCost: 10,
    hints: [
      'Use a hash map to store seen numbers',
      'For each number, check if (target - number) exists in map',
      'Store index along with the number'
    ],
    starterCode: {
      javascript: `function twoSum(nums, target) {
  const seen = {};
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    // TODO: Check if complement exists in 'seen'
    // If yes, return [seen[complement], i]
    // Otherwise, store nums[i] with its index in 'seen'
    
  }
  return [];
}`,
      python: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        # TODO: Check if complement exists in 'seen'
        # If yes, return [seen[complement], i]
        # Otherwise, store num with its index in 'seen'
        pass
    return []`,
      cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        // TODO: Check if complement exists in 'seen'
        // If yes, return {seen[complement], i}
        // Otherwise, store nums[i] with its index in 'seen'
        
    }
    return {};
}`,
      java: `public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        // TODO: Check if complement exists in 'seen'
        // If yes, return new int[]{seen.get(complement), i}
        // Otherwise, store nums[i] with its index in 'seen'
        
    }
    return new int[]{};
}`
    },
    solutionPattern: {
      javascript: 'if (Object.prototype.hasOwnProperty.call(seen, complement)) return [seen[complement], i]; seen[nums[i]] = i;',
      python: 'if complement in seen: return [seen[complement], i]; seen[num] = i',
      cpp: 'if (seen.find(complement) != seen.end()) return {seen[complement], i}; seen[nums[i]] = i;',
      java: 'if (seen.containsKey(complement)) return new int[]{seen.get(complement), i}; seen.put(nums[i], i);'
    },
    testCases: level6TestCases,
    validateSolution: createStrictValidator(level6TestCases, () => {
      return (input: { nums: number[]; target: number }) => {
        const seen: Record<number, number> = {};
        for (let i = 0; i < input.nums.length; i++) {
          const complement = input.target - input.nums[i];
          if (Object.prototype.hasOwnProperty.call(seen, complement)) {
            return [seen[complement], i];
          }
          seen[input.nums[i]] = i;
        }
        return [];
      };
    })
  },
  {
    id: 7,
    title: 'Valid Parentheses',
    description: 'Check if a string of parentheses is valid (properly opened and closed).',
    difficulty: 'medium',
    category: 'Stack',
    timeLimit: 180,
    coinReward: 30,
    hintCost: 10,
    hints: [
      'Use a stack to track opening brackets',
      'For each closing bracket, check if it matches the top of stack',
      'At the end, stack should be empty'
    ],
    starterCode: {
      javascript: `function isValid(s) {
  const stack = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  
  for (const char of s) {
    if (char === '(' || char === '[' || char === '{') {
      stack.push(char);
    } else {
      // TODO: Check if stack is empty or top doesn't match
      // Return false if invalid, otherwise pop from stack
      
    }
  }
  return stack.length === 0;
}`,
      python: `def is_valid(s):
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    
    for char in s:
        if char in '([{':
            stack.append(char)
        else:
            # TODO: Check if stack is empty or top doesn't match
            # Return False if invalid, otherwise pop from stack
            pass
    return len(stack) == 0`,
      cpp: `bool isValid(string s) {
    stack<char> st;
    unordered_map<char, char> pairs = {{')', '('}, {']', '['}, {'}', '{'}};
    
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') {
            st.push(c);
        } else {
            // TODO: Check if stack is empty or top doesn't match
            // Return false if invalid, otherwise pop from stack
            
        }
    }
    return st.empty();
}`,
      java: `public boolean isValid(String s) {
    Stack<Character> stack = new Stack<>();
    Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
    
    for (char c : s.toCharArray()) {
        if (c == '(' || c == '[' || c == '{') {
            stack.push(c);
        } else {
            // TODO: Check if stack is empty or top doesn't match
            // Return false if invalid, otherwise pop from stack
            
        }
    }
    return stack.isEmpty();
}`
    },
    solutionPattern: {
      javascript: 'if (stack.length === 0 || stack.pop() !== pairs[char]) return false;',
      python: 'if not stack or stack.pop() != pairs[char]: return False',
      cpp: 'if (st.empty() || st.top() != pairs[c]) return false; st.pop();',
      java: 'if (stack.isEmpty() || stack.pop() != pairs.get(c)) return false;'
    },
    testCases: level7TestCases,
    validateSolution: createStrictValidator(level7TestCases, () => {
      return (input: string) => {
        const stack: string[] = [];
        const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
        for (const char of input) {
          if (char === '(' || char === '[' || char === '{') {
            stack.push(char);
          } else {
            if (stack.length === 0 || stack.pop() !== pairs[char]) return false;
          }
        }
        return stack.length === 0;
      };
    })
  },
  {
    id: 8,
    title: 'Fibonacci Number',
    description: 'Calculate the nth Fibonacci number using recursion or iteration.',
    difficulty: 'medium',
    category: 'Recursion',
    timeLimit: 120,
    coinReward: 25,
    hintCost: 10,
    hints: [
      'F(0) = 0, F(1) = 1',
      'F(n) = F(n-1) + F(n-2) for n > 1',
      'Consider using memoization or iteration for efficiency'
    ],
    starterCode: {
      javascript: `function fibonacci(n) {
  if (n <= 1) return n;
  
  // TODO: Calculate F(n) = F(n-1) + F(n-2)
  // Hint: Use iteration with two variables to track previous values
  
}`,
      python: `def fibonacci(n):
    if n <= 1:
        return n
    
    # TODO: Calculate F(n) = F(n-1) + F(n-2)
    # Hint: Use iteration with two variables to track previous values
    pass`,
      cpp: `int fibonacci(int n) {
    if (n <= 1) return n;
    
    // TODO: Calculate F(n) = F(n-1) + F(n-2)
    // Hint: Use iteration with two variables to track previous values
    
}`,
      java: `public int fibonacci(int n) {
    if (n <= 1) return n;
    
    // TODO: Calculate F(n) = F(n-1) + F(n-2)
    // Hint: Use iteration with two variables to track previous values
    
}`
    },
    solutionPattern: {
      javascript: 'let a = 0, b = 1; for (let i = 2; i <= n; i++) { [a, b] = [b, a + b]; } return b;',
      python: 'a, b = 0, 1; for _ in range(2, n + 1): a, b = b, a + b; return b',
      cpp: 'int a = 0, b = 1; for (int i = 2; i <= n; i++) { int t = a + b; a = b; b = t; } return b;',
      java: 'int a = 0, b = 1; for (int i = 2; i <= n; i++) { int t = a + b; a = b; b = t; } return b;'
    },
    testCases: level8TestCases,
    validateSolution: createStrictValidator(level8TestCases, () => {
      return (n: number) => {
        if (n <= 1) return n;
        let a = 0, b = 1;
        for (let i = 2; i <= n; i++) {
          [a, b] = [b, a + b];
        }
        return b;
      };
    })
  },
  {
    id: 9,
    title: 'Binary Search',
    description: 'Implement binary search to find target in a sorted array. Return index or -1.',
    difficulty: 'medium',
    category: 'Searching',
    timeLimit: 180,
    coinReward: 30,
    hintCost: 10,
    hints: [
      'Use two pointers: left and right',
      'Calculate mid point and compare with target',
      'Narrow search space by half each iteration'
    ],
    starterCode: {
      javascript: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    // TODO: Compare arr[mid] with target
    // Return mid if found, otherwise adjust left or right
    
  }
  return -1;
}`,
      python: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        # TODO: Compare arr[mid] with target
        # Return mid if found, otherwise adjust left or right
        pass
    return -1`,
      cpp: `int binarySearch(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        // TODO: Compare arr[mid] with target
        // Return mid if found, otherwise adjust left or right
        
    }
    return -1;
}`,
      java: `public int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        // TODO: Compare arr[mid] with target
        // Return mid if found, otherwise adjust left or right
        
    }
    return -1;
}`
    },
    solutionPattern: {
      javascript: 'if (arr[mid] === target) return mid; else if (arr[mid] < target) left = mid + 1; else right = mid - 1;',
      python: 'if arr[mid] == target: return mid; elif arr[mid] < target: left = mid + 1; else: right = mid - 1',
      cpp: 'if (arr[mid] == target) return mid; else if (arr[mid] < target) left = mid + 1; else right = mid - 1;',
      java: 'if (arr[mid] == target) return mid; else if (arr[mid] < target) left = mid + 1; else right = mid - 1;'
    },
    testCases: level9TestCases,
    validateSolution: createStrictValidator(level9TestCases, () => {
      return (input: { arr: number[]; target: number }) => {
        let left = 0, right = input.arr.length - 1;
        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          if (input.arr[mid] === input.target) return mid;
          else if (input.arr[mid] < input.target) left = mid + 1;
          else right = mid - 1;
        }
        return -1;
      };
    })
  },
  {
    id: 10,
    title: 'Merge Sorted Arrays',
    description: 'Merge two sorted arrays into one sorted array.',
    difficulty: 'medium',
    category: 'Arrays',
    timeLimit: 180,
    coinReward: 35,
    hintCost: 10,
    hints: [
      'Use two pointers, one for each array',
      'Compare elements at both pointers',
      'Add smaller element to result and advance that pointer'
    ],
    starterCode: {
      javascript: `function mergeSortedArrays(arr1, arr2) {
  const result = [];
  let i = 0, j = 0;
  
  while (i < arr1.length && j < arr2.length) {
    // TODO: Compare arr1[i] and arr2[j]
    // Push smaller element to result and advance pointer
    
  }
  
  // Add remaining elements
  while (i < arr1.length) result.push(arr1[i++]);
  while (j < arr2.length) result.push(arr2[j++]);
  
  return result;
}`,
      python: `def merge_sorted_arrays(arr1, arr2):
    result = []
    i, j = 0, 0
    
    while i < len(arr1) and j < len(arr2):
        # TODO: Compare arr1[i] and arr2[j]
        # Append smaller element to result and advance pointer
        pass
    
    # Add remaining elements
    result.extend(arr1[i:])
    result.extend(arr2[j:])
    
    return result`,
      cpp: `vector<int> mergeSortedArrays(vector<int>& arr1, vector<int>& arr2) {
    vector<int> result;
    int i = 0, j = 0;
    
    while (i < arr1.size() && j < arr2.size()) {
        // TODO: Compare arr1[i] and arr2[j]
        // Push smaller element to result and advance pointer
        
    }
    
    // Add remaining elements
    while (i < arr1.size()) result.push_back(arr1[i++]);
    while (j < arr2.size()) result.push_back(arr2[j++]);
    
    return result;
}`,
      java: `public int[] mergeSortedArrays(int[] arr1, int[] arr2) {
    int[] result = new int[arr1.length + arr2.length];
    int i = 0, j = 0, k = 0;
    
    while (i < arr1.length && j < arr2.length) {
        // TODO: Compare arr1[i] and arr2[j]
        // Add smaller element to result[k++] and advance pointer
        
    }
    
    // Add remaining elements
    while (i < arr1.length) result[k++] = arr1[i++];
    while (j < arr2.length) result[k++] = arr2[j++];
    
    return result;
}`
    },
    solutionPattern: {
      javascript: 'if (arr1[i] <= arr2[j]) { result.push(arr1[i]); i++; } else { result.push(arr2[j]); j++; }',
      python: 'if arr1[i] <= arr2[j]: result.append(arr1[i]); i += 1; else: result.append(arr2[j]); j += 1',
      cpp: 'if (arr1[i] <= arr2[j]) { result.push_back(arr1[i]); i++; } else { result.push_back(arr2[j]); j++; }',
      java: 'if (arr1[i] <= arr2[j]) { result[k++] = arr1[i++]; } else { result[k++] = arr2[j++]; }'
    },
    testCases: level10TestCases,
    validateSolution: createStrictValidator(level10TestCases, () => {
      return (input: { arr1: number[]; arr2: number[] }) => {
        return [...input.arr1, ...input.arr2].sort((a, b) => a - b);
      };
    })
  }
];

export const getDifficultyColor = (difficulty: Difficulty): string => {
  switch (difficulty) {
    case 'easy': return 'text-success border-success/50';
    case 'medium': return 'text-warning border-warning/50';
    case 'hard': return 'text-destructive border-destructive/50';
    case 'expert': return 'text-primary border-primary/50';
    default: return 'text-muted-foreground border-border';
  }
};

export const getDifficultyBg = (difficulty: Difficulty): string => {
  switch (difficulty) {
    case 'easy': return 'bg-success/10';
    case 'medium': return 'bg-warning/10';
    case 'hard': return 'bg-destructive/10';
    case 'expert': return 'bg-primary/10';
    default: return 'bg-muted';
  }
};
