const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const nodeModules = path.join(projectRoot, "node_modules");

const PLATFORM = process.platform;
const ARCH = process.arch;

function getBinaryInfo() {
  if (PLATFORM === "win32" && ARCH === "x64") {
    return {
      packageName: "lightningcss-win32-x64-msvc",
      fileName: "lightningcss.win32-x64-msvc.node",
    };
  }
  return null;
}

function copyBinary() {
  const info = getBinaryInfo();
  if (!info) {
    return;
  }

  const source = path.join(
    nodeModules,
    info.packageName,
    info.fileName
  );
  const destination = path.join(
    nodeModules,
    "lightningcss",
    info.fileName
  );

  if (!fs.existsSync(source)) {
    console.warn(
      `[setup-lightningcss] Source binary not found: ${source}`
    );
    return;
  }

  if (fs.existsSync(destination)) {
    return;
  }

  fs.copyFileSync(source, destination);
  console.log(
    `[setup-lightningcss] Copied ${info.fileName} to lightningcss package`
  );
}

try {
  copyBinary();
} catch (error) {
  console.warn(
    "[setup-lightningcss] Failed to copy lightningcss native binary:",
    error
  );
}


