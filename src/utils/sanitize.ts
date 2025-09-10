export function sanitizeInput(input: string): string {
  return input.replace(/[^\w\s\-.,!?]/g, '').trim();
}

export function validatePromptLength(input: string, maxLength = 4000): void {
  if (input.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
  }
}
