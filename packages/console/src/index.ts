import { CommunicationServer, Config, Injector } from "@spotify-plus/tools";

const main = async () => {
  console.log("Verifying config folder...");

  const config = new Config(String.raw`/usr/share/spotify/`);
  const configErr = await config.verify();

  if (configErr) {
    console.error(`Exiting with error: ${configErr}`);
  }

  console.log(`Spotify+ v${config.version}`);
  const injector = new Injector(config, true);
  await injector.inject();
  console.log("Hi!");

  const server = new CommunicationServer(
    config,
    "/home/flafy/Conan/more/for-cloud/spotify/spotify-plus/extensions/",
    false
  );
  server.start();
};

main();
