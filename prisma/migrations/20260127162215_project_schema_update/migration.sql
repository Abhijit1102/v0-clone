/*
  Warnings:

  - You are about to drop the column `fiels` on the `Fragment` table. All the data in the column will be lost.
  - Added the required column `files` to the `Fragment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'ASSISTANT';

-- AlterTable
ALTER TABLE "Fragment" DROP COLUMN "fiels",
ADD COLUMN     "files" JSONB NOT NULL;
