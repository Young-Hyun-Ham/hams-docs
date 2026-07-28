import { promises as fs } from 'node:fs';
import path from 'node:path';

import MarkdownViewer from './MarkdownViewer';

// Markdown files are embedded at build time because the production file tracing
// configuration intentionally excludes docs/**/*.md from the runtime bundle.
export const dynamic = 'force-static';

export type MarkdownDocument = {
  name: string;
  relativePath: string;
  content: string;
  modifiedAt: string;
  size: number;
};

const DOCS_DIRECTORY = path.join(process.cwd(), 'docs');

async function findMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(directory, entry.name);

      if (entry.isDirectory()) return findMarkdownFiles(absolutePath);
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        return [absolutePath];
      }
      return [];
    }),
  );

  return nestedFiles.flat();
}

async function loadDocuments(): Promise<MarkdownDocument[]> {
  try {
    const files = await findMarkdownFiles(DOCS_DIRECTORY);
    const documents = await Promise.all(
      files.map(async (absolutePath) => {
        const [content, stats] = await Promise.all([
          fs.readFile(absolutePath, 'utf8'),
          fs.stat(absolutePath),
        ]);
        const relativePath = path
          .relative(DOCS_DIRECTORY, absolutePath)
          .split(path.sep)
          .join('/');

        return {
          name: path.basename(absolutePath, path.extname(absolutePath)),
          relativePath,
          content,
          modifiedAt: stats.mtime.toISOString(),
          size: stats.size,
        };
      }),
    );

    return documents.sort((left, right) =>
      left.relativePath.localeCompare(right.relativePath, 'ko'),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

export default async function MarkdownViewerPage() {
  const documents = await loadDocuments();

  return <MarkdownViewer documents={documents} />;
}
