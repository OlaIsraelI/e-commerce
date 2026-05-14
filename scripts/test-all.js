const { spawnSync } = require("child_process");

const run = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 0;
};

const main = () => {
  const upStatus = run("docker", ["compose", "up", "-d", "mongo"]);

  if (upStatus !== 0) {
    process.exit(upStatus);
  }

  let testStatus = 0;

  try {
    testStatus = run("npm", ["run", "test:integration"]);
  } finally {
    run("docker", ["compose", "stop", "mongo"]);
  }

  process.exit(testStatus);
};

main();
