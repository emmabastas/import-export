'use babel';

import util from './util.js';
import jsonfile from 'jsonfile';

export default {
    export: export_,
    deltas: deltas
}

async function export_(filepath) {
    let packagesList = [];
    getInstalledPackages().forEach(package => {
        packagesList.push({
            name: package.metadata.name,
            version: package.metadata.version
        });
    });

    await new Promise((resolve, reject) => {
        jsonfile.writeFile(filepath, packagesList, err => {
            if(err)
                reject(err)
            else
                resolve();
        });
    });
}

async function deltas(filepath) {
    const packagesListRemote = await new Promise((resolve, reject) => {
        jsonfile.readFile(filepath, (err, packagesListRemote) => {
            if(err)
                reject(err);
            else
                resolve(packagesListRemote);
        })
    });

    const packagesLocal = getInstalledPackages();

    let deltas = {};

    packagesListRemote.forEach(package => {
        deltas[package.name] = {
            remote: {
                version: package.version
            }
        }
    });

    packagesLocal.forEach(package => {
        deltas[package.metadata.name] = {
            local: {
                version: package.metadata.version
            },
            ...deltas[package.metadata.name]
        }
    });

    let deltasList = []

    for (var key in deltas) {
        if (deltas.hasOwnProperty(key)) {
            deltasList.push({name: key, ...deltas[key]});
        }
    }

    return deltasList.filter(delta => {
        return typeof delta.local !== typeof delta.remote
        || delta.local.version !== delta.remote.version;
    });
}

function getInstalledPackages() {
    return atom.packages.getActivePackages().filter(isCorePackage);

}

function isCorePackage(package) {
    if(package.path.indexOf(util.getUserConfigDir()) === 0)
        return true;
    else
        return false;
}
