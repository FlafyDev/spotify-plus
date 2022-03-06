import { CommunicationServer, Config, Injector } from '@spotify-plus/tools';

const main = async () => {
  console.log("Verifying config folder...");

  const config = new Config(String.raw`C:\Users\flafy\AppData\Roaming\Spotify`);
  const configErr = await config.verify();

  if (configErr) {
    console.error(`Exiting with error: ${configErr}`);
  }

  console.log(`Spotify+ v${config.version}`);
  const injector = new Injector(config, false);
  await injector.inject();
  console.log("Hi!");

  const server = new CommunicationServer(config, 'D:\\spotify-plus\\extensions', false);
  server.start();

}

main();