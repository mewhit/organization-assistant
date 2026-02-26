export function toCamelCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((token) => token.toLowerCase())
    .map((token, index) => (index === 0 ? token : token.charAt(0).toUpperCase() + token.slice(1)))
    .join("");
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
