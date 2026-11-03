"""One fixed Apple xcresult query/export under exact direct-write restrictions.

This module is a process guard, not a bundle parser. A Node parent owns the
detached process group, stdout/stderr limits and deadline. Platform compatibility
and OS enforcement must be independently probed; a failed guard never retries
without the sandbox or falls back to a directory export.
"""
from pathlib import Path
import argparse
import json
import os
import re
import resource
import stat
import sys

NAMES = {"failure.png", "context.txt", "geometry.json", "hierarchy.txt"}
DEVELOPERS = {"/Applications/Xcode_16.4.app/Contents/Developer", "/Applications/Xcode.app/Contents/Developer"}
REF = re.compile(r"0~[A-Za-z0-9_-]{1,150}={0,2}\Z")


def ordinary(path, directory=False):
    value = path.lstat()
    assert not path.is_symlink() and path.resolve() == path
    assert stat.S_ISDIR(value.st_mode) if directory else stat.S_ISREG(value.st_mode)


def quoted(value):
    # Only canonical paths built below reach the profile, never an attachment name.
    return '"' + value.replace('\\', '\\\\').replace('"', '\\"') + '"'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--workspace-root', required=True)
    parser.add_argument('--developer-dir', required=True, choices=sorted(DEVELOPERS))
    parser.add_argument('--mode', required=True, choices=['root', 'object', 'export'])
    parser.add_argument('--id')
    parser.add_argument('--output-name', choices=sorted(NAMES))
    parser.add_argument('--limit-bytes', type=int)
    args = parser.parse_args()
    assert sys.platform == 'darwin'
    root = Path(args.workspace_root)
    assert root.is_absolute()
    ordinary(root, True)
    bundle = root / '.local/ios-ci/evidence/ui.xcresult'
    ordinary(bundle, True)
    tool = Path(args.developer_dir) / 'usr/bin/xcresulttool'
    ordinary(tool)
    assert os.access(tool, os.X_OK)
    for ancestor in bundle.parents:
        assert not ancestor.is_symlink()
    if args.mode == 'root':
        assert args.id is None
    else:
        assert isinstance(args.id, str) and REF.fullmatch(args.id)
    policy = '(version 1) (deny default) (allow file-read*) (allow process-exec (literal ' + quoted(str(tool)) + ')) (allow sysctl-read)'
    if args.mode == 'export':
        assert args.output_name in NAMES and isinstance(args.limit_bytes, int) and 1 <= args.limit_bytes <= 1048576
        output = root / '.local/ios-ci/native-failure-compact/exports' / args.output_name
        ordinary(output.parent, True)
        assert not output.exists() and not output.is_symlink()
        policy += ' (allow file-write* (literal ' + quoted(str(output)) + '))'
        command = [str(tool), 'export', 'object', '--legacy', '--type', 'file', '--path', str(bundle), '--id', args.id, '--output-path', str(output)]
        limit = args.limit_bytes
    else:
        assert args.output_name is None and args.limit_bytes is None
        command = [str(tool), 'get', 'object', '--legacy', '--format', 'json', '--path', str(bundle)]
        if args.id is not None:
            command += ['--id', args.id]
        limit = 0
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    resource.setrlimit(resource.RLIMIT_FSIZE, (limit, limit))
    # No wildcard writes, mach lookup, process-fork or network permissions.
    environment = {'PATH': '/usr/bin:/bin:/usr/sbin:/sbin', 'LANG': 'C', 'LC_ALL': 'C'}
    os.execve('/usr/bin/sandbox-exec', ['/usr/bin/sandbox-exec', '-p', policy, *command], environment)


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print(json.dumps({'diagnostic_only': True, 'status': 'incomplete', 'reason': 'export_guard_preflight_failed'}), file=sys.stderr)
        sys.exit(2)
