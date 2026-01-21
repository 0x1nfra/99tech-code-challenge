/**
 * Implementation A: Mathematical Formula (Gauss's Formula)
 * Uses the formula n * (n + 1) / 2 to calculate the sum directly.
 * This avoids the need to loop through all numbers.
 */
function sum_to_n_a(n: number): number {
  return (n * (n + 1)) / 2;
}

/**
 * Implementation B: Iterative Loop
 * Uses a loop to add each number from 1 to n.
 * Straightforward approach that handles both positive and negative numbers.
 */
function sum_to_n_b(n: number): number {
  let sum = 0;
  if (n >= 0) {
    for (let i = 1; i <= n; i++) {
      sum += i;
    }
  } else {
    for (let i = n; i < 0; i++) {
      sum += i;
    }
  }
  return sum;
}

/**
 * Implementation C: Recursive
 * Breaks down the problem by having the function call itself.
 * Each call adds the current number to the sum of all smaller numbers.
 */
function sum_to_n_c(n: number): number {
  if (n === 0) {
    return 0;
  }
  if (n > 0) {
    return n + sum_to_n_c(n - 1);
  } else {
    return n + sum_to_n_c(n + 1);
  }
}

// Example usage and verification
console.log("Testing sum_to_n functions:");
console.log("sum_to_n_a(5):", sum_to_n_a(5)); // 15
console.log("sum_to_n_b(5):", sum_to_n_b(5)); // 15
console.log("sum_to_n_c(5):", sum_to_n_c(5)); // 15

console.log("\nTesting with negative numbers:");
console.log("sum_to_n_a(-5):", sum_to_n_a(-5)); // -15
console.log("sum_to_n_b(-5):", sum_to_n_b(-5)); // -15
console.log("sum_to_n_c(-5):", sum_to_n_c(-5)); // -15
