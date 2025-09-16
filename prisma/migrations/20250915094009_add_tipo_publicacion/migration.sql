-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_publicaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" DATETIME NOT NULL,
    "red" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "tipo_publicacion" TEXT NOT NULL DEFAULT 'Publicar',
    "impresiones" INTEGER NOT NULL DEFAULT 0,
    "alcance" INTEGER NOT NULL DEFAULT 0,
    "me_gusta" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_publicaciones" ("alcance", "categoria", "created_at", "fecha", "id", "impresiones", "me_gusta", "perfil", "red", "updated_at") SELECT "alcance", "categoria", "created_at", "fecha", "id", "impresiones", "me_gusta", "perfil", "red", "updated_at" FROM "publicaciones";
DROP TABLE "publicaciones";
ALTER TABLE "new_publicaciones" RENAME TO "publicaciones";
CREATE INDEX "publicaciones_red_idx" ON "publicaciones"("red");
CREATE INDEX "publicaciones_perfil_idx" ON "publicaciones"("perfil");
CREATE INDEX "publicaciones_categoria_idx" ON "publicaciones"("categoria");
CREATE INDEX "publicaciones_tipo_publicacion_idx" ON "publicaciones"("tipo_publicacion");
CREATE INDEX "publicaciones_fecha_idx" ON "publicaciones"("fecha");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
