import type { DefaultTheme } from 'vitepress';

export interface SPDConfig extends DefaultTheme.Config {
  spd: {
    search?: DefaultTheme.Config['search'];
    nav?: Record<string, DefaultTheme.Config['nav']>;
  };
}
