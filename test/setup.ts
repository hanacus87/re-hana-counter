import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register({ url: "http://localhost/" });

const { cleanup } = await import("@testing-library/react");
const { afterEach } = await import("bun:test");

afterEach(() => {
  cleanup();
});
