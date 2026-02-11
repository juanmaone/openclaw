import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RuntimeEnv } from "../runtime.js";
import type { WizardPrompter } from "../wizard/prompts.js";
import { applyAuthChoice } from "./auth-choice.js";

const noopAsync = async () => {};
const noop = () => {};
const authProfilePathFor = (agentDir: string) => path.join(agentDir, "auth-profiles.json");
const requireAgentDir = () => {
  const agentDir = process.env.OPENCLAW_AGENT_DIR;
  if (!agentDir) {
    throw new Error("OPENCLAW_AGENT_DIR not set");
  }
  return agentDir;
};

describe("applyAuthChoice (nvidia)", () => {
  const previousStateDir = process.env.OPENCLAW_STATE_DIR;
  const previousAgentDir = process.env.OPENCLAW_AGENT_DIR;
  const previousPiAgentDir = process.env.PI_CODING_AGENT_DIR;
  const previousNvidiaKey = process.env.NVIDIA_API_KEY;
  let tempStateDir: string | null = null;

  afterEach(async () => {
    if (tempStateDir) {
      await fs.rm(tempStateDir, { recursive: true, force: true });
      tempStateDir = null;
    }
    if (previousStateDir === undefined) {
      delete process.env.OPENCLAW_STATE_DIR;
    } else {
      process.env.OPENCLAW_STATE_DIR = previousStateDir;
    }
    if (previousAgentDir === undefined) {
      delete process.env.OPENCLAW_AGENT_DIR;
    } else {
      process.env.OPENCLAW_AGENT_DIR = previousAgentDir;
    }
    if (previousPiAgentDir === undefined) {
      delete process.env.PI_CODING_AGENT_DIR;
    } else {
      process.env.PI_CODING_AGENT_DIR = previousPiAgentDir;
    }
    if (previousNvidiaKey === undefined) {
      delete process.env.NVIDIA_API_KEY;
    } else {
      process.env.NVIDIA_API_KEY = previousNvidiaKey;
    }
  });

  it("stores the API key and configures provider when setDefaultModel is false", async () => {
    tempStateDir = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-auth-"));
    process.env.OPENCLAW_STATE_DIR = tempStateDir;
    process.env.OPENCLAW_AGENT_DIR = path.join(tempStateDir, "agent");
    process.env.PI_CODING_AGENT_DIR = process.env.OPENCLAW_AGENT_DIR;
    delete process.env.NVIDIA_API_KEY;

    const text = vi.fn().mockResolvedValue("nvapi-test-key-abc123");
    const prompter: WizardPrompter = {
      intro: vi.fn(noopAsync),
      outro: vi.fn(noopAsync),
      note: vi.fn(noopAsync),
      select: vi.fn(async () => "" as never),
      multiselect: vi.fn(async () => []),
      text,
      confirm: vi.fn(async () => false),
      progress: vi.fn(() => ({ update: noop, stop: noop })),
    };
    const runtime: RuntimeEnv = {
      log: vi.fn(),
      error: vi.fn(),
      exit: vi.fn((code: number) => {
        throw new Error(`exit:${code}`);
      }),
    };

    const result = await applyAuthChoice({
      authChoice: "nvidia-api-key",
      config: {
        agents: {
          defaults: {
            model: { primary: "anthropic/claude-opus-4-5" },
          },
        },
      },
      prompter,
      runtime,
      setDefaultModel: false,
    });

    expect(text).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Enter NVIDIA API key" }),
    );
    expect(result.config.agents?.defaults?.model?.primary).toBe("anthropic/claude-opus-4-5");
    expect(result.config.models?.providers?.nvidia?.baseUrl).toBe(
      "https://integrate.api.nvidia.com/v1",
    );
    expect(result.agentModelOverride).toBe("nvidia/moonshot/kimi-2-5");

    const authProfilePath = authProfilePathFor(requireAgentDir());
    const raw = await fs.readFile(authProfilePath, "utf8");
    const parsed = JSON.parse(raw) as {
      profiles?: Record<string, { key?: string }>;
    };
    expect(parsed.profiles?.["nvidia:default"]?.key).toBe("nvapi-test-key-abc123");
  });

  it("sets the default model when setDefaultModel is true", async () => {
    tempStateDir = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-auth-"));
    process.env.OPENCLAW_STATE_DIR = tempStateDir;
    process.env.OPENCLAW_AGENT_DIR = path.join(tempStateDir, "agent");
    process.env.PI_CODING_AGENT_DIR = process.env.OPENCLAW_AGENT_DIR;
    delete process.env.NVIDIA_API_KEY;

    const text = vi.fn().mockResolvedValue("nvapi-test-key-xyz789");
    const prompter: WizardPrompter = {
      intro: vi.fn(noopAsync),
      outro: vi.fn(noopAsync),
      note: vi.fn(noopAsync),
      select: vi.fn(async () => "" as never),
      multiselect: vi.fn(async () => []),
      text,
      confirm: vi.fn(async () => false),
      progress: vi.fn(() => ({ update: noop, stop: noop })),
    };
    const runtime: RuntimeEnv = {
      log: vi.fn(),
      error: vi.fn(),
      exit: vi.fn((code: number) => {
        throw new Error(`exit:${code}`);
      }),
    };

    const result = await applyAuthChoice({
      authChoice: "nvidia-api-key",
      config: {},
      prompter,
      runtime,
      setDefaultModel: true,
    });

    expect(result.config.agents?.defaults?.model?.primary).toBe("nvidia/moonshot/kimi-2-5");
    expect(result.config.models?.providers?.nvidia?.baseUrl).toBe(
      "https://integrate.api.nvidia.com/v1",
    );
    expect(result.agentModelOverride).toBeUndefined();

    const authProfilePath = authProfilePathFor(requireAgentDir());
    const raw = await fs.readFile(authProfilePath, "utf8");
    const parsed = JSON.parse(raw) as {
      profiles?: Record<string, { key?: string }>;
    };
    expect(parsed.profiles?.["nvidia:default"]?.key).toBe("nvapi-test-key-xyz789");
  });
});
