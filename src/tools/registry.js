export function createToolRegistry() {
  const tools = new Map();
  function registerTool(tool) {
    tools.set(tool.name, tool);
  }
  function getTool(name) {
    return tools.get(name);
  }
  function listTools() {
    return Array.from(tools.values());
  }
  return { registerTool, getTool, listTools };
}
export default createToolRegistry;
