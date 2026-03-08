import { test as base, expect } from '@playwright/test';

export const test = base.extend<{
  waitForData: (page?: import('@playwright/test').Page) => Promise<void>;
  authenticate: () => Promise<void>;
}>({
  waitForData: async ({}, use) => {
    await use(async (page) => {
      if (!page) return;
      await expect(page.getByText('Loading...')).toBeHidden();
    });
  },

  authenticate: async ({ context }, use) => {
    await use(async () => {
      if (!process.env.WP_ADMIN_USER || !process.env.WP_ADMIN_PASSWORD) {
        throw new Error('WP_ADMIN_USER and WP_ADMIN_PASSWORD must be set in .env');
      }

      const graphqlUrl = process.env.VITE_GRAPHQL_URL || 'http://localhost:8080/graphql';
      const response = await context.request.post(graphqlUrl, {
        data: {
          query: `mutation Login($username: String!, $password: String!) {
            login(input: { username: $username, password: $password }) {
              authToken
            }
          }`,
          variables: {
            username: process.env.WP_ADMIN_USER,
            password: process.env.WP_ADMIN_PASSWORD,
          },
        },
      });

      const body = await response.json();
      const token = body.data?.login?.authToken;
      if (!token) {
        throw new Error(`Login failed: ${JSON.stringify(body.errors ?? body)}`);
      }

      await context.addInitScript((jwt: string) => {
        window.localStorage.setItem('clog_jwt_token', jwt);
        window.localStorage.removeItem('clog_bulk_queue');
      }, token);
    });
  },
});

export { expect };
