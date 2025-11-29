/**
 * Case conversion utilities
 */

export function toCamelCase(str: string): string {
  if (!str) return '';
  
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '')
    .replace(/[_-]/g, '');
}

export function toPascalCase(str: string): string {
  if (!str) return '';
  
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
    .replace(/\s+/g, '')
    .replace(/[_-]/g, '');
}

export function toSnakeCase(str: string): string {
  if (!str) return '';
  
  return str
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

export function toKebabCase(str: string): string {
  if (!str) return '';
  
  return str
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function toTitleCase(str: string): string {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function toSentenceCase(str: string): string {
  if (!str) return '';
  if (str.length === 1) return str.toUpperCase();
  
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function toConstantCase(str: string): string {
  return toSnakeCase(str).toUpperCase();
}

export function toDotCase(str: string): string {
  if (!str) return '';
  
  return str
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1.$2')
    .replace(/[\s_-]+/g, '.')
    .toLowerCase();
}