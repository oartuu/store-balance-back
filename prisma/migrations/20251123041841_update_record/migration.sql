/*
  Warnings:

  - Added the required column `origin` to the `Record` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RecordOrigin" AS ENUM ('CASH', 'CARD');

-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "origin" "RecordOrigin" NOT NULL;
