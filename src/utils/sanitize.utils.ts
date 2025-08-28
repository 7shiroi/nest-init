/**
 * Sanitizes an input object by only allowing specified properties
 * @param input The input object to sanitize
 * @param allowedProperties Array of property names that are allowed
 * @returns A new object containing only the allowed properties
 */
export function sanitizeInput<T extends object>(
  input: T,
  allowedProperties: string[],
): Partial<T> {
  return Object.keys(input)
    .filter((key) => allowedProperties.includes(key))
    .reduce((obj, key) => {
      obj[key] = input[key];
      return obj;
    }, {} as Partial<T>);
}
