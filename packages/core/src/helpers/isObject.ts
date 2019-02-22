export default function isObject(value: unknown): value is object {
  return value !== null && !Array.isArray(value) && typeof value === 'object';
}
