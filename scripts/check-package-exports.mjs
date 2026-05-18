#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const PACKAGES_DIR = resolve(process.cwd(), "packages");

const PACKAGES_TO_CHECK = [
  "config",
  "shared",
  "db",
  "auth",
  "payment",
  "credits",
  "mail",
  "newsletter",
  "notification",
  "storage",
  "analytics",
  "env",
  "ai",
];

let hasErrors = false;

function checkPackageExports(packageName) {
  const packageDir = join(PACKAGES_DIR, packageName);
  const packageJsonPath = join(packageDir, "package.json");

  if (!existsSync(packageJsonPath)) {
    console.error(`❌ ${packageName}: package.json not found`);
    hasErrors = true;
    return;
  }

  let packageJson;
  try {
    const content = readFileSync(packageJsonPath, "utf-8");
    packageJson = JSON.parse(content);
  } catch (error) {
    console.error(`❌ ${packageName}: Failed to parse package.json`);
    hasErrors = true;
    return;
  }

  const pkgName = packageJson.name || packageName;

  if (!packageJson.exports) {
    console.error(`❌ ${pkgName}: Missing "exports" field`);
    hasErrors = true;
    return;
  }

  const exports = packageJson.exports;
  const exportEntries = Object.entries(exports);

  for (const [exportKey, exportPath] of exportEntries) {
    const fullPath = join(packageDir, exportPath);

    if (!existsSync(fullPath)) {
      console.error(
        `❌ ${pkgName}: Export "${exportKey}" -> "${exportPath}" file not found`
      );
      hasErrors = true;
    } else {
      console.log(
        `✅ ${pkgName}: Export "${exportKey}" -> "${exportPath}" OK`
      );
    }
  }

  if (packageJson.types) {
    const typesPath = join(packageDir, packageJson.types);
    if (!existsSync(typesPath)) {
      console.error(
        `❌ ${pkgName}: Types "${packageJson.types}" file not found`
      );
      hasErrors = true;
    } else {
      console.log(`✅ ${pkgName}: Types "${packageJson.types}" OK`);
    }
  }

  const srcIndexPath = join(packageDir, "src", "index.ts");
  if (!existsSync(srcIndexPath)) {
    console.error(`❌ ${pkgName}: src/index.ts not found`);
    hasErrors = true;
  } else {
    console.log(`✅ ${pkgName}: src/index.ts OK`);
  }
}

console.log("Checking package exports...\n");

for (const packageName of PACKAGES_TO_CHECK) {
  checkPackageExports(packageName);
  console.log("");
}

if (hasErrors) {
  console.error("❌ Package exports check failed");
  process.exit(1);
} else {
  console.log("✅ All package exports checks passed");
  process.exit(0);
}
