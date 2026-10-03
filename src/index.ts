import { prisma } from "./infrastructure/database/config.ts";
import { app } from "./api/app.ts";
const port = process.env.PORT || 3000;

await prisma.$connect();
console.log("¡Conexión exitosa a la base de datos!");
app.listen(port, () => console.log(`Listening on port ${port}!`));