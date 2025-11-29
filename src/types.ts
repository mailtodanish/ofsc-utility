export interface StringValidationResult {
  isValid: boolean;
  message?: string;
}

export interface TruncateOptions {
  ellipsis?: string;
  preserveWords?: boolean;
}

export interface CaseConverter {
  toCamelCase: (str: string) => string;
  toPascalCase: (str: string) => string;
  toSnakeCase: (str: string) => string;
  toKebabCase: (str: string) => string;
  toTitleCase: (str: string) => string;
}

export interface StringValidator {
  isEmail: (str: string) => boolean;
  isURL: (str: string) => boolean;
  isStrongPassword: (str: string) => StringValidationResult;
  isPalindrome: (str: string) => boolean;
  hasSpecialChars: (str: string) => boolean;
}

export interface StringTransformer {
  reverse: (str: string) => string;
  shuffle: (str: string) => string;
  slugify: (str: string) => string;
  htmlEscape: (str: string) => string;
  htmlUnescape: (str: string) => string;
}

export interface StringUtility {
  truncate: (str: string, maxLength: number, options?: TruncateOptions) => string;
  countWords: (str: string) => number;
  countCharacters: (str: string, includeSpaces?: boolean) => number;
  extractEmails: (str: string) => string[];
  extractNumbers: (str: string) => number[];
  generateRandom: (length: number, options?: { includeNumbers?: boolean; includeSpecialChars?: boolean }) => string;
}