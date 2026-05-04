import { join } from "node:path";

export function getVaultDir() {
  return (
    process.env.VISION_TEXT_BRIDGE_VAULT_DIR ??
    process.env.OBSIDIAN_VAULT_DIR ??
    join(process.cwd(), ".obsidian-vault")
  );
}
