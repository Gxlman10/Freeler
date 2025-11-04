declare module 'xlsx' {
  const XLSX: any;
  export = XLSX;
}

declare module 'fast-csv' {
  export function parse(options?: Record<string, unknown>): any;
}
