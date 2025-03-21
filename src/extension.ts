import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export function activate(context: vscode.ExtensionContext) {
  const cover = (cmd: string, gocmd: string) => {
    const disposable = vscode.commands.registerCommand(cmd, async () => {
      try {
        const goFlags = vscode.workspace.getConfiguration("go").get<string[]>("testFlags", []);
        const coverFlag = `-coverpkg=${(
          await execAsync("go list -m", {
            cwd: vscode.window.activeTextEditor
              ? path.dirname(vscode.window.activeTextEditor.document.uri.fsPath)
              : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ??
                (() => {
                  throw new Error("No workspace folder found");
                })(),
          })
        ).stdout.trim()}/...`;
        await vscode.commands.executeCommand(gocmd, { flags: [...goFlags, coverFlag] });
      } catch (error) {
        if (error instanceof Error) {
          vscode.window.showErrorMessage(`Error running gocover test: ${error.message}`);
        }
      }
    });
    return disposable;
  };

  context.subscriptions.push(
    cover("gocover.test.cursor", "go.test.cursor"),
    cover("gocover.test.file", "go.test.file"),
    cover("gocover.test.package", "go.test.package")
  );
}

export function deactivate() {}
