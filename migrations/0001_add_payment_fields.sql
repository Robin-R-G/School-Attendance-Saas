-- Migration number: 0001 	 2026-06-15T18:07:25.856Z
ALTER TABLE "School" ADD COLUMN "bankName" TEXT;
ALTER TABLE "School" ADD COLUMN "bankAccountName" TEXT;
ALTER TABLE "School" ADD COLUMN "bankAccountNumber" TEXT;
ALTER TABLE "School" ADD COLUMN "bankIfscCode" TEXT;
ALTER TABLE "School" ADD COLUMN "upiId" TEXT;
