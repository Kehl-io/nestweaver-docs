import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const documentationPaths = [
  'src/content/docs/configuration/index.md',
  'src/content/docs/concepts/daemon.md',
  'src/content/docs/concepts/token-budget.md',
  'src/content/docs/getting-started/index.md',
];

const documentation = await Promise.all(
  documentationPaths.map(async (path) => [path, await readFile(path, 'utf8')]),
);
const combined = documentation.map(([, contents]) => contents).join('\n');
const combinedLowercase = combined.toLowerCase();

for (const obsoleteClaim of [
  'cpu fallback',
  'fallback to cpu',
  'downloads automatically',
  'main thread',
  'external-to-local fallback',
]) {
  assert.ok(
    !combinedLowercase.includes(obsoleteClaim),
    `embedding docs contain obsolete claim "${obsoleteClaim}"`,
  );
}

for (const requiredContract of [
  'Metal in a Metal-enabled build; CPU only when Metal is not compiled',
  'A Metal failure is reported; `auto` does not retry on CPU',
  'Daemon startup is cache-only',
  'nestweaver embed --db <path> --local --model-id <id> --cache-dir <path>',
  'nestweaver diagnostics capabilities --json',
  'nestweaver daemon --db <path> status',
  'nestweaver brain status --db <path> --json',
  'nestweaver daemon --db "$DB" start --config "$CONFIG"',
  'nestweaver embed --db "$DB" --local --model-id "$MODEL" --cache-dir "$CACHE" --force',
  '`requested_device`',
  '`selected_device`',
  '`fallback_used`',
  '`degraded_components`',
]) {
  assert.ok(
    combined.includes(requiredContract),
    `embedding docs are missing runtime contract "${requiredContract}"`,
  );
}

const requiredByDocument = new Map([
  [
    'src/content/docs/configuration/index.md',
    [
      '## Embedding and semantic retrieval',
      'The local device policies are exact:',
      'An `external_endpoint` is authoritative.',
      '### Model cache',
      'Switching from an external backend to a local model',
    ],
  ],
  [
    'src/content/docs/concepts/daemon.md',
    [
      '**macOS lifecycle:**',
      '## Embedding status and troubleshooting',
      '`metal_compiled = false`',
      '`selected_device = ""`',
      '--cache-dir "$CACHE" --force',
    ],
  ],
  [
    'src/content/docs/concepts/token-budget.md',
    ['`semantic_applied`', '`degraded_components`', 'response cache'],
  ],
  [
    'src/content/docs/getting-started/index.md',
    [
      '## Pre-built CLI (recommended)',
      'ARCHIVE=nestweaver-<tag>-<target>.tar.gz',
      'shasum -a 256 -c "$ARCHIVE.sha256"',
      'cargo install --locked --path .',
      'bash app/build.sh',
      'open target/release/NestWeaver.app',
    ],
  ],
]);

for (const [path, contents] of documentation) {
  for (const requiredClaim of requiredByDocument.get(path) ?? []) {
    assert.ok(contents.includes(requiredClaim), `${path} is missing "${requiredClaim}"`);
  }
}

const byPath = new Map(documentation);
const configPage = byPath.get('src/content/docs/configuration/index.md');
assert.ok(configPage, 'configuration page must be loaded');
for (const requiredConfigShape of [
  'instance_id = "my-project"',
  '[snapshot_storage]',
  '[workspace]',
  '[inference]',
  '[git]',
  '[[repos]]',
  'url = "https://github.com/myorg/docs"',
  'type = "vault"',
  '[[links]]',
  'type = "npm"',
  'nestweaver config validate',
]) {
  assert.ok(
    configPage.includes(requiredConfigShape),
    `configuration page is missing canonical shape "${requiredConfigShape}"`,
  );
}
for (const obsoleteConfigShape of ['[instance]', '[[brains]]', 'kind = "npm"']) {
  assert.ok(
    !configPage.includes(obsoleteConfigShape),
    `configuration page contains obsolete shape "${obsoleteConfigShape}"`,
  );
}

const installationPage = byPath.get('src/content/docs/getting-started/index.md');
assert.ok(installationPage, 'installation page must be loaded');
assert.ok(
  !installationPage.includes('cd app && bash build.sh'),
  'app build commands must keep the repository root as the working directory',
);

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return markdownFiles(entryPath);
      return entry.isFile() && /\.mdx?$/.test(entry.name) ? [entryPath] : [];
    }),
  );
  return nested.flat();
}

const unsupportedInstallCommands = [
  'npm install -g @kehl-io/nestweaver',
  'npm install @kehl-io/nestweaver',
  'cargo install nestweaver',
  'brew install nestweaver',
  'npx @kehl-io/nestweaver',
  'npm exec @kehl-io/nestweaver',
];
for (const markdownPath of await markdownFiles('src/content/docs')) {
  const contents = await readFile(markdownPath, 'utf8');
  for (const unsupportedCommand of unsupportedInstallCommands) {
    assert.ok(
      !contents.includes(unsupportedCommand),
      `${markdownPath} advertises unavailable install command "${unsupportedCommand}"`,
    );
  }
}

const workflow = await readFile('.github/workflows/ci.yml', 'utf8');
assert.match(
  workflow,
  /pull_request:\s+branches: \[main, staging\]/,
  'feature-to-staging pull requests must run the documentation CI gate',
);
assert.match(
  workflow,
  /- name: Product contract\s+run: npm run verify:product/,
  'CI must run the product contract',
);
const repositoryReadme = await readFile('README.md', 'utf8');
assert.ok(
  repositoryReadme.includes('npm run verify:product'),
  'docs-repository check suite must include the product contract',
);
