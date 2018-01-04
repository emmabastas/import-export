'use babel';

import util from './util.js';
import path from 'path';
import fs from 'fs-extra';

export default {
    import: import_,
    export: export_
}

async function import_(pathname) {
    pathname = path.resolve(pathname);
    const configPath = util.getUserConfigDir();

    await copyUserAgnosticFiles(pathname, configPath);
}

async function export_(pathname) {
    pathname = path.resolve(pathname);
    const configPath = util.getUserConfigDir();

    await copyUserAgnosticFiles(configPath, pathname);
}

async function copyUserAgnosticFiles(src, dest) {
    await fs.copy(src, dest, {
        dereference: true,
        filter: containsUserAgnostigFiles
    });
}

function containsUserAgnostigFiles(pathname) {
    pathname = path.relative(util.getUserConfigDir(), pathname);

    const excludes = [
        'blob-store', 'compile-cache', 'dev', 'storage', '.apm',
        '.node-gyp', '.npm', 'packages'
    ];

    if(excludes.includes(pathname))
        return false;

    return true;
}
