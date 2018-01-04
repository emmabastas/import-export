'use babel';

import path from 'path';

export default {
    getUserConfigDir: getUserConfigDir
}

function getUserConfigDir() {
    return path.dirname(atom.config.getUserConfigPath());
}
