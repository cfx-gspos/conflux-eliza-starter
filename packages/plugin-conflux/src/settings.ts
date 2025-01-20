
export const settings = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key.startsWith("CONFLUX_"))
  );

export default settings;
