const fs = require("fs/promises");
const path = require("path");

exports.default = async params => {
    if (params.electronPlatformName !== "linux") return;
    if (!params.packager.executableName) {
        throw new Error("This packer's executableName isn't available; is this Linux + AppImage?");
    }
	const exec = path.join(params.appOutDir, params.packager.executableName);
    const renamedExec = `${exec}.bin`;
	const shim = `#!/usr/bin/env bash
set -u

ALLOWS_UNPRIVILEGED=$(cat /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null)
EXEC_DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"

if [ "$EXEC_DIR" == "/usr/bin" ]; then
	EXEC_DIR="/opt/${params.packager.appInfo.productName}"
fi

exec "$EXEC_DIR/${params.packager.executableName}" "$([ "$ALLOWS_UNPRIVILEGED" != 1 ] && echo '--no-sandbox')" "$@"
`;

	try {
		await fs.rename(exec, renamedExec);
		await fs.writeFile(exec, shim);
		await fs.chmod(exec, 0o755);
	} catch (e) {
        throw new Error(e);
	}
    /* eslint-disable no-console */
	console.log("  • added `--no-sandbox` shim");
};
