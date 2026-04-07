#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");

const projectRoot = process.cwd();
const nextDir = path.join(projectRoot, ".next");
const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const port = Number(process.env.PORT || 8081);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const canConnect = (host, targetPort, timeoutMs = 400) =>
  new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (result) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(targetPort, host);
  });

const isLocalServerRunning = async () => {
  const [ipv4, ipv6] = await Promise.all([
    canConnect("127.0.0.1", port),
    canConnect("::1", port),
  ]);
  return ipv4 || ipv6;
};

const removeNextWithRetry = async () => {
  if (!fs.existsSync(nextDir)) {
    console.log("[clean:next] .next 폴더가 없어 정리할 항목이 없습니다.");
    return;
  }

  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      fs.rmSync(nextDir, { recursive: true, force: true });
      console.log("[clean:next] .next 폴더 정리를 완료했습니다.");
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await delay(220 * attempt);
    }
  }
};

const run = async () => {
  const running = await isLocalServerRunning();
  if (running && !force) {
    console.error(
      `[clean:next] 포트 ${port}에서 서버가 실행 중이라 .next를 지우지 않습니다. 먼저 서버를 종료하세요.`
    );
    console.error("[clean:next] 강제 실행이 필요하면: npm run clean:next:force");
    process.exitCode = 1;
    return;
  }

  if (running && force) {
    console.warn(`[clean:next] 경고: 포트 ${port} 서버 실행 중 강제 정리를 진행합니다.`);
  }

  await removeNextWithRetry();
};

run().catch((error) => {
  console.error("[clean:next] 정리 중 오류가 발생했습니다.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
