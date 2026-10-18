import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const validConfig = {
    MONGODB_URI: 'mongodb://localhost:27017/shortlist',
    JWT_ACCESS_SECRET:
      'a_very_long_jwt_secret_that_is_at_least_32_characters_long',
    JWT_REFRESH_SECRET:
      'another_very_long_jwt_secret_that_is_at_least_32_chars',
    PORT: 3000,
    CORS_ORIGIN: 'http://localhost:5173',
  };

  it('passes when all required variables meet requirements', () => {
    const result = validateEnv(validConfig);
    expect(result.MONGODB_URI).toBe(validConfig.MONGODB_URI);
    expect(result.JWT_ACCESS_SECRET).toBe(validConfig.JWT_ACCESS_SECRET);
    expect(result.PORT).toBe(3000);
  });

  it('fails fast when JWT_ACCESS_SECRET is under 32 characters', () => {
    const shortSecretConfig = {
      ...validConfig,
      JWT_ACCESS_SECRET: 'short_secret',
    };
    expect(() => validateEnv(shortSecretConfig)).toThrow(
      /JWT_ACCESS_SECRET must be at least 32 characters long/,
    );
  });

  it('fails fast when MONGODB_URI is missing', () => {
    const { MONGODB_URI: _unused, ...missingDbConfig } = validConfig;
    void _unused;
    expect(() => validateEnv(missingDbConfig)).toThrow(/MONGODB_URI/);
  });
});
