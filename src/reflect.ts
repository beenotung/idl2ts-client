export function getMethodNames (o): string[] {
  return Object.keys(o.constructor.prototype);
}
