import SPApi from "./SPApi";

const main = async () => {
  while (!(
    (globalThis as any).SPApiTemp.React &&
    (globalThis as any).SPApiTemp.ReactDOM &&
    (globalThis as any).SPApiTemp.platform)) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  const [port, accessKey] = (await fetch('serverInfo').then(data => data.text())).split(":");
  const spapi = new SPApi(port, accessKey,
    (globalThis as any).SPApiTemp
  );

  (globalThis as any).SPApi = spapi;
}

main();