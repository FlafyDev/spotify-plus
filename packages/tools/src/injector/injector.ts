import fs from 'fs/promises';
import StreamZip from 'node-stream-zip';
import path from "path";
import Config from "../config";
import fileExists from '../utils/fileExists';
import XpuiInjector from './xpuiInjector';

// const flowParser = require('flow-parser')

class Injector {
  xpuiDir;
  xpuiSpa;
  xpuiSpaBackup;
  private spotifyPlusVersionFilePath: string;


  constructor(public config: Config, public force: boolean) {
    this.xpuiDir = path.join(this.config.spotifyDirectory, 'Apps/xpui');
    this.xpuiSpa = path.join(this.config.spotifyDirectory, "Apps/xpui.spa");;
    this.xpuiSpaBackup = path.join(this.config.spotifyDirectory, "Apps/xpui.backup.spa");
    this.spotifyPlusVersionFilePath = path.join(this.xpuiDir, 'spotifyPlusVersion');
  }

  async inject(inject: boolean = true) {
    if (inject) {
      if (this.force || await this.needInjecting()) {
        console.log("Extracting...");

        await this.unInject()

        await this.extractXpui();

        console.log("Injecting... (May take some time...)");
        await this.injectXpui();

        fs.rename(this.xpuiSpa, this.xpuiSpaBackup);

        // TODO automatically add(and maybe also compile) SPApiCore.js
      }

      await this.setServerInfo();
      await fs.writeFile(this.spotifyPlusVersionFilePath, this.config.version);
    } else {
      await this.unInject();
    }
  }

  async unInject() {
    if (await fileExists(this.xpuiDir)) {
      await fs.rm(this.xpuiDir, { recursive: true, force: true })
    }
    if (await fileExists(this.xpuiSpaBackup)) {
      if (await fileExists(this.xpuiSpa)) {
        await fs.rm(this.xpuiSpaBackup);
      } else {
        await fs.rename(this.xpuiSpaBackup, this.xpuiSpa);
      }
    }
  }

  // If (xpui.spa doesn't exists && xpui.backup.spa exists) then { there is no need to inject }.
  // If (the injected injector version is the same as this injector) then { there is no need to inject }.
  async needInjecting() {
    let sameInjectedInjectorVersion = false;

    if (await fileExists(this.xpuiDir)) {
      if (!this.force && await fileExists(this.spotifyPlusVersionFilePath)) {
        let injectedInjectorVersion = (await fs.readFile(this.spotifyPlusVersionFilePath)).toString();

        if (injectedInjectorVersion === this.config.version) {
          sameInjectedInjectorVersion = true;
        }
      }
    }

    return !sameInjectedInjectorVersion || !(!(await fileExists(this.xpuiSpa)) && await fileExists(this.xpuiSpaBackup));
  }

  async setServerInfo() {
    await fs.writeFile(path.join(this.xpuiDir, 'serverInfo'), `${this.config.settings.port}:${this.config.settings.accessKey}`);
  }

  async blockUpdates(block: boolean = true) {
    // if (block) {
    //   process.env.LOCALAPPDATA

    // }

    // throw "Can only block updates in Windows."
  }

  private async extractXpui() {
    this.inject(false);

    await fs.mkdir(this.xpuiDir);
    const zip = new StreamZip.async({ file: this.xpuiSpa });
    await zip.extract(null, this.xpuiDir);
    await zip.close();
  }

  private async injectXpui() {
    if (await fileExists(this.spotifyPlusVersionFilePath)) {
      return;
    }
    const xpuiJSPath = path.join(this.xpuiDir, 'xpui.js');
    const vXpuiJSPath = path.join(this.xpuiDir, 'vendor~xpui.js');
    const xpuiInjector = new XpuiInjector(xpuiJSPath, vXpuiJSPath, 'globalThis.SPApiTemp');

    await xpuiInjector.injectSPInit();
    xpuiInjector.injectNamedComponents();
    xpuiInjector.injectMenu();
    xpuiInjector.injectMenuItem();
    xpuiInjector.injectSubMenu();
    xpuiInjector.injectPopup();
    xpuiInjector.injectGetShowFeedback();
    xpuiInjector.injectPlatform();
    xpuiInjector.injectReact();
    xpuiInjector.injectReactDOM();
    await xpuiInjector.applyInjections();
  }
};


export default Injector;