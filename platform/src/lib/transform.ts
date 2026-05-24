import * as Babel from '@babel/standalone';

export interface TransformResult {
  code: string | null;
  error: string | null;
}

export function transform(source: string): TransformResult {
  try {
    const result = Babel.transform(source, {
      plugins: [['transform-react-jsx', { pragma: 'UnReact.createElement' }]],
    });
    return { code: result.code ?? null, error: null };
  } catch (e) {
    return { code: null, error: e instanceof Error ? e.message : String(e) };
  }
}
