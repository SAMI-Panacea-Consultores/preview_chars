-- CreateTable
CREATE TABLE "csv_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "inserted_rows" INTEGER NOT NULL DEFAULT 0,
    "updated_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "duplicate_rows" INTEGER NOT NULL DEFAULT 0,
    "excluded_historias" INTEGER NOT NULL DEFAULT 0,
    "original_headers" TEXT,
    "detected_columns" TEXT,
    "categories_found" TEXT,
    "profiles_found" TEXT,
    "networks_found" TEXT,
    "error_message" TEXT,
    "error_details" TEXT,
    "overwrite" BOOLEAN NOT NULL DEFAULT false,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "processing_time" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

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
    "csv_session_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "publicaciones_csv_session_id_fkey" FOREIGN KEY ("csv_session_id") REFERENCES "csv_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_publicaciones" ("alcance", "categoria", "created_at", "fecha", "id", "impresiones", "me_gusta", "perfil", "red", "tipo_publicacion", "updated_at") SELECT "alcance", "categoria", "created_at", "fecha", "id", "impresiones", "me_gusta", "perfil", "red", "tipo_publicacion", "updated_at" FROM "publicaciones";
DROP TABLE "publicaciones";
ALTER TABLE "new_publicaciones" RENAME TO "publicaciones";
CREATE INDEX "publicaciones_red_idx" ON "publicaciones"("red");
CREATE INDEX "publicaciones_perfil_idx" ON "publicaciones"("perfil");
CREATE INDEX "publicaciones_categoria_idx" ON "publicaciones"("categoria");
CREATE INDEX "publicaciones_tipo_publicacion_idx" ON "publicaciones"("tipo_publicacion");
CREATE INDEX "publicaciones_fecha_idx" ON "publicaciones"("fecha");
CREATE INDEX "publicaciones_csv_session_id_idx" ON "publicaciones"("csv_session_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "csv_sessions_status_idx" ON "csv_sessions"("status");

-- CreateIndex
CREATE INDEX "csv_sessions_started_at_idx" ON "csv_sessions"("started_at");

-- CreateIndex
CREATE INDEX "csv_sessions_file_name_idx" ON "csv_sessions"("file_name");
