export const SUCCESS = {
  category: {
    created: 'Category created successfully',
  },
} as const;

export const ERROR = {
  category: {
    alreadyExists: 'Category already exists',
    nameRequired: 'Category name is required',
  },
} as const;
