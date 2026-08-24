import { Sandbox } from "@vercel/sandbox";

export const SANDBOX_NAME = "admin-agent-sandbox";
export const SANDBOX_TIMEOUT_MS = 2700000; // 45 minutes
export const SANDBOX_TIMEOUT_WARNING_MS = 2400000; // 40 minutes (warn 5 min before timeout)

let sandboxCreationTime: number | null = null;

export const createOrGetSandbox = async (name: string) => {
  try {
    const sandbox = await Sandbox.get({ name });
    // Reset creation time when getting existing sandbox
    sandboxCreationTime = Date.now();
    return sandbox;
  } catch {
    const sandbox = await Sandbox.create({
      name,
      // persistent: true is the beta default; auto-snapshots on stop, auto-resumes on next get
      snapshotExpiration: 7 * 24 * 60 * 60 * 1000, // 7 days
      timeout: SANDBOX_TIMEOUT_MS,
    });
    sandboxCreationTime = Date.now();
    return sandbox;
  }
};

export const getSandboxTimeRemaining = (): number | null => {
  if (!sandboxCreationTime) return null;
  const elapsed = Date.now() - sandboxCreationTime;
  const remaining = SANDBOX_TIMEOUT_MS - elapsed;
  return Math.max(0, remaining);
};

export const isSandboxNearTimeout = (): boolean => {
  const remaining = getSandboxTimeRemaining();
  if (remaining === null) return false;
  return remaining < (SANDBOX_TIMEOUT_MS - SANDBOX_TIMEOUT_WARNING_MS);
};