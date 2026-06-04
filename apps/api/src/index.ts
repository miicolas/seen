import { app } from "./app";
import { env } from "./env";

app.listen(env.port);

console.log(`Seen API listening on :${env.port}`);
