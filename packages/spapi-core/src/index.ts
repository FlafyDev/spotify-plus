import SPApi from "./SPApi";

const main = async () => {
  // TODO do it differently!
  // An idea: document all of the properties that SPApiTemp should have in SPApiTemp and wait for them. 
  while (!(
    (globalThis as any).SPApiTemp.React &&
    (globalThis as any).SPApiTemp.ReactDOM &&
    (globalThis as any).SPApiTemp.platform &&
    (globalThis as any).SPApiTemp.GenericModal &&
    (globalThis as any).SPApiTemp.getShowFeedback
  )) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  const [port, accessKey] = (await fetch('serverInfo').then(data => data.text())).split(":", 2);
  const spapi = new SPApi(port, accessKey,
    (globalThis as any).SPApiTemp
  );
  await spapi.initialize();
  await spapi.connect();

  (globalThis as any).SPApi = spapi;
}

main();