import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidV4 } from 'uuid';
import { version } from "../package.json";
import fileExists from './utils/fileExists';

const appDataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");

interface ISettings {
  accessKey: string;
  port: number;
}

const allowedSettingsKeys: string[] = [
  "accessKey",
  "port",
]

const defaultSettings: ISettings = {
  accessKey: uuidV4(),
  port: 45565
}

class Config {
  configDirectory = path.join(appDataDirectory, 'SpotifyPlus');
  settingsPath = path.join(this.configDirectory, 'settings.json');
  settings: ISettings = defaultSettings;
  version = version;


  constructor(public spotifyDirectory: string) { }

  // TODO check if key doesn't exists.
  async verify() {
    try {
      if (!await fileExists(this.configDirectory)) {
        await fs.mkdir(this.configDirectory);
      }
      if (!await fileExists(this.settingsPath)) {
        await fs.writeFile(this.settingsPath, JSON.stringify(defaultSettings, undefined, 2));
      }

      this.settings = JSON.parse((await fs.readFile(this.settingsPath)).toString());

      // Check if all of the settings' keys are valid.
      const invalidSettingsKeys = Object.keys(this.settings!).filter(key => !allowedSettingsKeys.includes(key));
      if (invalidSettingsKeys.length) {
        return `Invalid settings keys: ${invalidSettingsKeys}`;
      }
    } catch (e) {
      return e;
    }
  }
}

export { ISettings };
export default Config;