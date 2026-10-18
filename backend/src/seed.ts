import 'dotenv/config';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cognihire';
  console.log(`Connecting to MongoDB at ${uri}...`);
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection failed');
  }

  console.log('Seeding initial company...');
  const companyId = randomUUID();
  const existingCompany = await db
    .collection('companies')
    .findOne({ name: 'Acme Corp' });
  let finalCompanyId: string = companyId;

  if (!existingCompany) {
    await db.collection('companies').insertOne({
      _id: companyId as any,
      name: 'Acme Corp',
      settings: { theme: 'dark' },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`Created Acme Corp with id: ${companyId}`);
  } else {
    finalCompanyId = String(existingCompany._id);
    console.log(`Acme Corp already exists with id: ${finalCompanyId}`);
  }

  console.log('Seeding users...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const users = [
    {
      email: 'admin@acme.com',
      firstName: 'Alice',
      lastName: 'Admin',
      role: 'admin',
      companyId: finalCompanyId,
    },
    {
      email: 'recruiter@acme.com',
      firstName: 'Bob',
      lastName: 'Recruiter',
      role: 'recruiter',
      companyId: finalCompanyId,
    },
    {
      email: 'hiring@acme.com',
      firstName: 'Charlie',
      lastName: 'Manager',
      role: 'hiring_manager',
      companyId: finalCompanyId,
    },
    {
      email: 'candidate@example.com',
      firstName: 'David',
      lastName: 'Candidate',
      role: 'candidate',
      companyId: null,
    },
  ];

  for (const u of users) {
    const exists = await db.collection('users').findOne({ email: u.email });
    if (!exists) {
      await db.collection('users').insertOne({
        _id: randomUUID() as any,
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        companyId: u.companyId,
        refreshTokenHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`Created user: ${u.email}`);
    } else {
      console.log(`User already exists: ${u.email}`);
    }
  }

  console.log('Seeding sample published job posting...');
  const existingJob = await db
    .collection('job_postings')
    .findOne({ title: 'Senior Full Stack Engineer' });
  if (!existingJob) {
    await db.collection('job_postings').insertOne({
      _id: randomUUID() as any,
      companyId: finalCompanyId,
      createdById: null,
      title: 'Senior Full Stack Engineer',
      department: 'Engineering',
      type: 'full-time',
      salaryMin: 90000,
      salaryMax: 130000,
      requiredSkills: ['Node.js', 'React', 'MongoDB', 'TypeScript'],
      responsibilities:
        'Design and build high-performance microservices and intuitive React interfaces.',
      cultureNotes: 'Collaborative, test-driven, continuous deployment.',
      description:
        'We are looking for an exceptional Full Stack Engineer to lead architecture initiatives across our enterprise stack.',
      status: 'published',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Sample job posting created.');
  }

  console.log('Database seeding complete!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
