export const prettyPrint = (o: any): string =>
  JSON.stringify(o, (_, v) => (v.toFixed ? Number(v.toFixed(2)) : v), '  ');
