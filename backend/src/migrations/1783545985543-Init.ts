import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1783545985543 implements MigrationInterface {
  name = 'Init1783545985543';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cvs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicationId" uuid NOT NULL, "originalFilename" character varying NOT NULL, "storagePath" character varying NOT NULL, "fileSizeBytes" integer NOT NULL, "extractedText" text, "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_9f5cc64b4a0e4dcb3d44272ad3" UNIQUE ("applicationId"), CONSTRAINT "PK_e7d8a4d55eb4e7a2e43bea8d83a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."interviews_type_enum" AS ENUM('technical', 'behavioural', 'final')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."interviews_status_enum" AS ENUM('proposed', 'confirmed', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "interviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicationId" uuid NOT NULL, "proposedById" uuid, "hiringManagerId" uuid, "type" "public"."interviews_type_enum" NOT NULL, "proposedSlots" TIMESTAMP WITH TIME ZONE array NOT NULL DEFAULT '{}', "confirmedSlot" TIMESTAMP WITH TIME ZONE, "status" "public"."interviews_status_enum" NOT NULL DEFAULT 'proposed', "questions" jsonb NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fd41af1f96d698fa33c2f070f47" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."offers_status_enum" AS ENUM('issued', 'accepted', 'rejected', 'negotiating')`,
    );
    await queryRunner.query(
      `CREATE TABLE "offers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "applicationId" uuid NOT NULL, "issuedById" uuid, "roleTitle" character varying NOT NULL, "salary" integer NOT NULL, "startDate" date NOT NULL, "benefitsSummary" text NOT NULL, "status" "public"."offers_status_enum" NOT NULL DEFAULT 'issued', "candidateResponse" text, "draftedLetter" text, "letterApproved" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_6d911e68442dac48e56f96a93a" UNIQUE ("applicationId"), CONSTRAINT "PK_4c88e956195bba85977da21b8f4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."applications_stage_enum" AS ENUM('applied', 'screened', 'shortlisted', 'interview_scheduled', 'offer', 'hired', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "applications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "jobPostingId" uuid NOT NULL, "candidateId" uuid NOT NULL, "coverLetter" text, "yearsOfExperience" double precision, "salaryExpectation" integer, "availabilityDate" date, "stage" "public"."applications_stage_enum" NOT NULL DEFAULT 'applied', "aiScore" integer, "aiExtraction" jsonb, "aiStrengths" text array, "aiGaps" text array, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_938c0a27255637bde919591888f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_102168175f2c22c1709fee64ad" ON "applications"  ("jobPostingId", "candidateId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."job_postings_type_enum" AS ENUM('full-time', 'part-time', 'contract')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."job_postings_status_enum" AS ENUM('draft', 'published', 'closed', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "job_postings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" uuid NOT NULL, "createdById" uuid, "title" character varying NOT NULL, "department" character varying NOT NULL, "type" "public"."job_postings_type_enum" NOT NULL, "salaryMin" integer, "salaryMax" integer, "requiredSkills" text array NOT NULL DEFAULT '{}', "responsibilities" text NOT NULL, "cultureNotes" text, "description" text, "status" "public"."job_postings_status_enum" NOT NULL DEFAULT 'draft', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dda635ece382c8ad2d90a179182" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "settings" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('candidate', 'recruiter', 'hiring_manager', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'candidate', "companyId" uuid, "refreshTokenHash" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users"  ("email") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('application_stage_changed', 'interview_proposed', 'interview_confirmed', 'interview_reminder', 'offer_issued', 'offer_responded')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "payload" jsonb NOT NULL, "read" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "cvs" ADD CONSTRAINT "FK_9f5cc64b4a0e4dcb3d44272ad3a" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD CONSTRAINT "FK_ba82c76bf124871821aedc35b7a" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD CONSTRAINT "FK_e5692213b1df792744cbaeea0fa" FOREIGN KEY ("proposedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD CONSTRAINT "FK_30e969b696e47e449e358df0c91" FOREIGN KEY ("hiringManagerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "offers" ADD CONSTRAINT "FK_6d911e68442dac48e56f96a93a3" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "offers" ADD CONSTRAINT "FK_3acaf11ae568f9dcb8b97d72adb" FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "FK_b6f48c7806fd3b0b8cfa52fde17" FOREIGN KEY ("jobPostingId") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "FK_a34254e3f2b3d20f07f8dbd6322" FOREIGN KEY ("candidateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_postings" ADD CONSTRAINT "FK_1caf2545039fcdfe050a0aac6bd" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_postings" ADD CONSTRAINT "FK_b3fd8c797bc9f61f42e590e5972" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_6f9395c9037632a31107c8a9e58" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_6f9395c9037632a31107c8a9e58"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_postings" DROP CONSTRAINT "FK_b3fd8c797bc9f61f42e590e5972"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_postings" DROP CONSTRAINT "FK_1caf2545039fcdfe050a0aac6bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" DROP CONSTRAINT "FK_a34254e3f2b3d20f07f8dbd6322"`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" DROP CONSTRAINT "FK_b6f48c7806fd3b0b8cfa52fde17"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offers" DROP CONSTRAINT "FK_3acaf11ae568f9dcb8b97d72adb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offers" DROP CONSTRAINT "FK_6d911e68442dac48e56f96a93a3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" DROP CONSTRAINT "FK_30e969b696e47e449e358df0c91"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" DROP CONSTRAINT "FK_e5692213b1df792744cbaeea0fa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" DROP CONSTRAINT "FK_ba82c76bf124871821aedc35b7a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cvs" DROP CONSTRAINT "FK_9f5cc64b4a0e4dcb3d44272ad3a"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "companies"`);
    await queryRunner.query(`DROP TABLE "job_postings"`);
    await queryRunner.query(`DROP TYPE "public"."job_postings_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."job_postings_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_102168175f2c22c1709fee64ad"`,
    );
    await queryRunner.query(`DROP TABLE "applications"`);
    await queryRunner.query(`DROP TYPE "public"."applications_stage_enum"`);
    await queryRunner.query(`DROP TABLE "offers"`);
    await queryRunner.query(`DROP TYPE "public"."offers_status_enum"`);
    await queryRunner.query(`DROP TABLE "interviews"`);
    await queryRunner.query(`DROP TYPE "public"."interviews_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."interviews_type_enum"`);
    await queryRunner.query(`DROP TABLE "cvs"`);
  }
}
