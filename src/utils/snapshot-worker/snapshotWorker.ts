import { takeConnectionSnapshots } from "./connectionSnapshot";
import { takeQuerySnapshots } from "./querySnapshot";

const start = async () => {
  console.log(`Starting snapshot worker`);

  void takeConnectionSnapshots();
  void takeQuerySnapshots();

  setInterval(() => {
    void takeConnectionSnapshots();
  }, 60_000);

  setInterval(() => {
    void takeQuerySnapshots();
  }, 30_000);
};

// @ts-ignore
await start().catch((err) => {
  console.error(err);
  process.exit(1);
});
