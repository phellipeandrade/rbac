export const loadOptionalDriver = <T>(moduleName: string, adapterName: string): T => {
  try {
    return require(moduleName) as T;
  } catch {
    throw new Error(`Please install "${moduleName}" to use ${adapterName}`);
  }
};

// Share a pending connection attempt across callers, allowing retries on failure.
export const connectOnce = <T>(connect: () => Promise<T>): (() => Promise<T>) => {
  let pending: Promise<T> | undefined;
  return () => {
    if (!pending) {
      pending = connect().catch(error => {
        pending = undefined;
        throw error;
      });
    }
    return pending;
  };
};
