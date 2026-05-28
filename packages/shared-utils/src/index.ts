export const toIsoNow = (): string => new Date().toISOString();

export const assertUnreachable = (value: never): never => {
  void value;
  throw new Error('Unhandled value reached');
};
