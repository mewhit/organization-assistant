export function toCamelCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((token) => token.toLowerCase())
    .map((token, index) => (index === 0 ? token : token.charAt(0).toUpperCase() + token.slice(1)))
    .join("");
}

export function toPascalCase(value: string) {
  const camelCaseValue = toCamelCase(value);

  if (!camelCaseValue) {
    return "";
  }

  return camelCaseValue.charAt(0).toUpperCase() + camelCaseValue.slice(1);
}

export function toSnakeCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

export function pluralize(name: string) {
  if (name.endsWith("ch") || name.endsWith("sh") || /[sxz]$/.test(name)) {
    return `${name}es`;
  }

  if (/[^aeiou]y$/.test(name)) {
    return `${name.slice(0, -1)}ies`;
  }

  return `${name}s`;
}
