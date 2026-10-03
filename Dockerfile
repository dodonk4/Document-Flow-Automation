# ==========================================
# STAGE 1: Build & Dependencies
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de definición de dependencias
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./prisma.config.ts

# Instalar TODAS las dependencias (incluidas devDependencies para TS y compilación)
RUN npm ci

# Generar el cliente de Prisma
RUN npx prisma generate

# Copiar el código fuente y el archivo tsconfig.json
COPY . .

# Compilar TypeScript a JavaScript (generará la carpeta /dist)
RUN npm run build

# Eliminar dependencias de desarrollo para dejar solo las de producción
RUN npm prune --production

# # ==========================================
# # STAGE 2: Runner / Runtime
# # ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Crear directorio para almacenamiento local de PDFs y asignar permisos
RUN mkdir -p /app/storage && chown -R node:node /app

# Copiar dependencias de producción y el cliente de Prisma generado
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Copiar el código compilado (dist) y el package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Cambiar al usuario no-root por seguridad
USER node

# Exponer el puerto
EXPOSE 3000

# Comando para ejecutar la API compilada
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/src/index.js"]