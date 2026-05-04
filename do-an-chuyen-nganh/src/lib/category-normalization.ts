export function normalizeCategoryName(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function cleanCategoryName(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ')
}

export function getCategoryIdentityKey(name: string, type: string): string {
  return `${normalizeCategoryName(name)}|${type}`
}
