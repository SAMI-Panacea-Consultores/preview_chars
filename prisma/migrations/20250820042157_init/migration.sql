-- CreateTable
CREATE TABLE "publicaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" DATETIME NOT NULL,
    "red" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "impresiones" INTEGER NOT NULL DEFAULT 0,
    "alcance" INTEGER NOT NULL DEFAULT 0,
    "me_gusta" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "publicaciones_red_idx" ON "publicaciones"("red");

-- CreateIndex
CREATE INDEX "publicaciones_perfil_idx" ON "publicaciones"("perfil");

-- CreateIndex
CREATE INDEX "publicaciones_categoria_idx" ON "publicaciones"("categoria");

-- CreateIndex
CREATE INDEX "publicaciones_fecha_idx" ON "publicaciones"("fecha");
