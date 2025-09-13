# Usa una imagen base con Node.js
FROM node:22

# Crea el directorio de trabajo
WORKDIR /app

# Instala Python y pip (requerido por yt-dlp)
RUN apt-get update && apt-get install -y python3 python3-pip

# Instala yt-dlp globalmente
RUN pip3 install yt-dlp --break-system-packages

# Habilita pnpm
RUN corepack enable

# Copia los archivos del proyecto
COPY . .

# Instala dependencias del proyecto
RUN pnpm install

# Verifica si el binario global está disponible
RUN which yt-dlp || echo "yt-dlp not found"

# Fuerza a yt-dlp-exec a usar el binario global
ENV YTDLP_EXEC_PATH=yt-dlp

# Expone el puerto del servidor
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["node", "index.js"]