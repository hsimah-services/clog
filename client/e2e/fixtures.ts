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
      if (!process.env.WP_USERNAME || !process.env.WP_PASSWORD) {
        throw new Error('WP_USERNAME and WP_PASSWORD must be set in .env');
      }

      const response = await context.request.post('http://localhost:8080/graphql', {
        data: {
          query: `mutation Login($username: String!, $password: String!) {
            login(input: { username: $username, password: $password }) {
              authToken
            }
          }`,
          variables: {
            username: process.env.WP_USERNAME,
            password: process.env.WP_PASSWORD,
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
      }, token);
    });
  },
});

export { expect };
