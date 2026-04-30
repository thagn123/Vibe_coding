import { Challenge } from './types';

export const SAMPLE_CHALLENGES: Challenge[] = [
  {
    id: 'bugxml-001',
    title: 'The Unending Loop',
    description: 'This function should calculate the sum of all even numbers up to N, but it never seems to return. Can you find why?',
    difficulty: 'Easy',
    language: 'TypeScript',
    buggyCode: `function sumEvens(n: number): number {
  let sum = 0;
  for (let i = 0; i <= n; i) {
    if (i % 2 === 0) {
      sum += i;
    }
  }
  return sum;
}`,
    solution: `function sumEvens(n: number): number {
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    if (i % 2 === 0) {
      sum += i;
    }
  }
  return sum;
}`,
    testCases: `expect(sumEvens(10)).toBe(30);
expect(sumEvens(5)).toBe(6);`,
    points: 10
  },
  {
    id: 'bugxml-002',
    title: 'Ghost Keys',
    description: 'The object mapping is failing for certain keys. Is it an off-by-one error or something more sinister?',
    difficulty: 'Medium',
    language: 'JavaScript',
    buggyCode: `function mapUserRoles(users) {
  const result = {};
  for (let i = 1; i <= users.length; i++) {
    const user = users[i];
    result[user.id] = user.role;
  }
  return result;
}`,
    solution: `function mapUserRoles(users) {
  const result = {};
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    result[user.id] = user.role;
  }
  return result;
}`,
    testCases: `const users = [{id: 1, role: 'admin'}, {id: 2, role: 'user'}];
expect(mapUserRoles(users)).toEqual({1: 'admin', 2: 'user'});`,
    points: 25
  },
  {
    id: 'bugxml-003',
    title: 'Race Condition',
    description: 'This async function sometimes returns outdated data because it doesn\'t wait properly.',
    difficulty: 'Hard',
    language: 'JavaScript',
    buggyCode: `async function fetchData(urls) {
  const data = [];
  urls.forEach(async (url) => {
    const res = await fetch(url);
    const json = await res.json();
    data.push(json);
  });
  return data;
}`,
    solution: `async function fetchData(urls) {
  const promises = urls.map(async (url) => {
    const res = await fetch(url);
    return res.json();
  });
  return Promise.all(promises);
}`,
    testCases: `// Test case here`,
    points: 50
  }
];
