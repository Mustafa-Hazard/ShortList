import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const candidateEmail = `candidate.${Date.now()}@example.com`;
  const password = 'Sup3rSecret!';

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a new candidate and returns tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: candidateEmail,
        password,
        firstName: 'Ada',
        lastName: 'Lovelace',
      })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe(candidateEmail);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects duplicate registration with the same email', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: candidateEmail, password, firstName: 'Ada', lastName: 'Lovelace' })
      .expect(409);
  });

  it('rejects recruiter registration without a companyId', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `recruiter.${Date.now()}@example.com`,
        password,
        firstName: 'Rae',
        lastName: 'Cruiter',
        role: 'recruiter',
      })
      .expect(400);
  });

  it('logs in with correct credentials and rejects wrong ones', async () => {
    const ok = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: candidateEmail, password })
      .expect(200);
    expect(ok.body.accessToken).toBeDefined();

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: candidateEmail, password: 'wrong-password' })
      .expect(401);
  });

  it('rejects /auth/me without a token and accepts it with one', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: candidateEmail, password })
      .expect(200);

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);
    expect(me.body.email).toBe(candidateEmail);
  });

  it('issues a new access token from a valid refresh token', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: candidateEmail, password })
      .expect(200);

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(200);
    expect(refreshed.body.accessToken).toBeDefined();
  });

  it('revokes the refresh token on logout', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: candidateEmail, password })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);
  });
});
