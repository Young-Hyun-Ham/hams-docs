import { promises as fs } from 'node:fs';
import path from 'node:path';

import { NextResponse } from 'next/server';

const DOCS_DIRECTORY = path.resolve(process.cwd(), 'docs');

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      relativePath?: unknown;
      content?: unknown;
    };

    if (
      typeof body.relativePath !== 'string' ||
      typeof body.content !== 'string' ||
      !body.relativePath.toLowerCase().endsWith('.md')
    ) {
      return NextResponse.json({ error: '잘못된 저장 요청입니다.' }, { status: 400 });
    }

    const absolutePath = path.resolve(DOCS_DIRECTORY, body.relativePath);
    const pathFromDocs = path.relative(DOCS_DIRECTORY, absolutePath);

    if (pathFromDocs.startsWith('..') || path.isAbsolute(pathFromDocs)) {
      return NextResponse.json({ error: '허용되지 않은 문서 경로입니다.' }, { status: 400 });
    }

    await fs.access(absolutePath);
    await fs.writeFile(absolutePath, body.content, 'utf8');
    const stats = await fs.stat(absolutePath);

    return NextResponse.json({
      modifiedAt: stats.mtime.toISOString(),
      size: stats.size,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: '문서 파일을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ error: '문서를 저장하지 못했습니다.' }, { status: 500 });
  }
}
