import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { buildApartment } from '../src/modeling/build-apartment.ts';
import { serializeApartment } from '../src/modeling/export/index.ts';

async function main() {
  const { values } = parseArgs({
    options: {
      'output-dir': { type: 'string' },
      check: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  if (values.help) {
    console.log(
      'Build the apartment model (metres, Y up).\n\nUsage: npm run model:build -- [--output-dir PATH] [--check]\n\n--check verifies existing exports without writing files.',
    );
    return;
  }
  const outputDir = values['output-dir']
    ? resolve(values['output-dir'])
    : fileURLToPath(new URL('../public/models/apartment/', import.meta.url));
  const model = buildApartment();
  const files = serializeApartment(model);
  if (values.check) {
    const stale: string[] = [];
    for (const [name, expected] of Object.entries(files)) {
      try {
        const actual = await readFile(resolve(outputDir, name));
        const same =
          typeof expected === 'string'
            ? actual.toString('utf8').replaceAll('\r\n', '\n') === expected
            : actual.equals(expected);
        if (!same) stale.push(name);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        stale.push(name);
      }
    }
    if (stale.length) {
      throw new Error(
        `Model exports missing or out of date in ${outputDir}: ${stale.join(', ')}. Run npm run model:build${values['output-dir'] ? ' with the same --output-dir' : ''}.`,
      );
    }
    console.log(`Model exports are up to date (${model.parts.length} parts).`);
    return;
  }
  await mkdir(outputDir, { recursive: true });
  for (const [name, data] of Object.entries(files)) await writeFile(resolve(outputDir, name), data);
  console.log(
    JSON.stringify(
      {
        parts: model.parts.length,
        height: model.metadata.ceilingHeight,
        glb_bytes: files['apartment.glb'].byteLength,
        output: outputDir,
      },
      null,
      2,
    ),
  );
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
