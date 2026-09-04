export const SUCCESS = {
  auth: {
    signup: 'Signup successful',
    login: 'Login successful',
    tokenRefreshed: 'Token refreshed successfully',
  },
  category: {
    created: 'Category created successfully',
  },
  plan: {
    upserted: 'Plan upserted successfully',
  },
} as const;

export const ERROR = {
  category: {
    alreadyExists: 'Category already exists',
    nameRequired: 'Category name is required',
  },
} as const;
