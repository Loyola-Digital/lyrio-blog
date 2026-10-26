export function wrapSelection(value: string, start: number, end: number, before: string, after = ''): { value: string; cursor: number } {
  return {
    value: value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end),
    cursor: end + before.length + after.length,
  }
}
