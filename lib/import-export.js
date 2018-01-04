'use babel';

import settings from './settings.js';
import packagesList from './packagesList.js';
import { CompositeDisposable, BufferedProcess } from 'atom';
import { dialog } from 'remote';
import path from 'path';
import compareVersions from 'compare-versions';

export default {
  activate: activate,
  deactivate: deactivate
}

var subscriptions = null;

function activate(state) {
  subscriptions = new CompositeDisposable();

  subscriptions.add(atom.commands.add('atom-workspace', {
    'import-export:import': import_,
    'import-export:export': export_
  }));
}

function deactivate() {
  subscriptions.dispose();
}

async function import_() {
  try {
    const importPath = await getImportPathFromUser();
    atom.notifications.addInfo("Importing settings");
    await settings.import(path.join(importPath, 'settings'));
    const deltas = await packagesList.deltas(path.join(importPath, 'packagesList.json'));
    await resolvePackageDeltas(deltas);
    atom.notifications.addSuccess("Reload atom for imported settings to take effect", {
      buttons: [{
        text: 'reload',
        onDidClick: () => atom.windowEventHandler.handleWindowReload()
      }],
        dismissable: true
    });
  }
  catch(err) {
    atom.notifications.addError("Error occured when importing settings", {
      'description': err.message
    });
    console.error(err);
  }
}

async function export_() {
  try {
    const exportPath = await getExportPathFromUser();
    atom.notifications.addInfo("Exporting settings");
    await settings.export(path.join(exportPath, 'settings'));
    await packagesList.export(path.join(exportPath, 'packagesList.json'));
    atom.notifications.addSuccess("Exported settings");
  }
  catch(err) {
    atom.notifications.addError("Error occured when exporting settings", {
      'description': err.message
    });
      console.error(err);
  }
}

async function resolvePackageDeltas(deltas) {
  for(let delta of deltas) {
    if(delta.local === undefined) {
      atom.notifications.addInfo(`Installing ${delta.name}`);
      await installPackage(delta.name, delta.remote.version);
    } else if(delta.remote === undefined) {
    } else if(compareVersions(delta.remote.version, delta.local.version) === 1) {
      atom.notifications.addInfo(`Updating ${delta.name}`);
      await installPackage(delta.name, delta.remote.version);
    } else if(compareVersions(delta.local.version, delta.remote.version) === 1) {
    }
  }
}

function getImportPathFromUser() {
  return getPathFromUser('select folder to import settings from', 'import');
}

function getExportPathFromUser() {
  return getPathFromUser('select folder to export settings into', 'export');
}

async function getPathFromUser(dialogTitle, dialogButtonLabel) {
  const pathname = await dialog.showOpenDialog({
    title: dialogTitle,
    buttonLabel: dialogButtonLabel,
    properties: ['openDirectory', 'showHiddenFiles']
  });

  if(pathname === undefined)
    throw new Error("No directory selected");

  return pathname[0];
}

function installPackage(name, version) {
  return new Promise((resolve, reject) => {
    let errorOutput = ''

    const command = atom.packages.getApmPath()
    const args = ['install', `${name}@${version}`, '--no-color']
    const stderr = output => { errorOutput += output }
    const options = {cwd: getActiveProjectPath(), env: Object.assign({}, process.env, {NODE_ENV: 'development'})}

    const exit = code => {
      if(code === 0)
        resolve();
      else
        throw new Error(errorOutput);
    }

    new BufferedProcess({command, args, stderr, exit, options})
  });
}

function getActiveProjectPath () {
  const activeItem = atom.workspace.getActivePaneItem()
  if (activeItem && typeof activeItem.getPath === 'function') {
  return atom.project.relativizePath(activeItem.getPath())[0]
  } else {
    return atom.project.getPaths()[0]
  }
}
