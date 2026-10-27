import { defineConfig } from 'vitepress';
import type { SPDConfig } from '../types.ts';

export default defineConfig<SPDConfig>({
  appearance: 'dark',
  themeConfig: {
    spd: {
      search: {
        provider: 'local',
        options: {
          miniSearch: {
            options: {
              tokenize: (text: string) => {
                const tokens: string[] = [];
                const re = /[A-Za-z0-9]+|[\u4e00-\u9fff]+/g;
                let m;
                while ((m = re.exec(text))) {
                  const t = m[0];
                  if (/^[A-Za-z0-9]+$/.test(t)) {
                    tokens.push(t);
                  }
                  else {
                    for (let i = 0; i < t.length; i++) {
                      tokens.push(t[i]);
                      if (i < t.length - 1) {
                        tokens.push(t.slice(i, i + 2));
                      }
                    }
                  }
                }
                return tokens;
              }
            }
          }
        }
      }
    }
  }
});
