'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ContentCopy,
  DescriptionOutlined,
  MenuBookOutlined,
  Search,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import styles from './MarkdownViewer.module.css';

import type { MarkdownDocument } from './page';

type ViewMode = 'preview' | 'source';

type Heading = {
  id: string;
  text: string;
  level: number;
  line: number;
};

const createSlugger = () => {
  const counts = new Map<string, number>();

  return (text: string) => {
    const base =
      text
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/\s+/g, '-') || 'section';
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    return count ? `${base}-${count}` : base;
  };
};

const extractHeadings = (content: string): Heading[] => {
  const slug = createSlugger();

  return content
    .split('\n')
    .map((line, index) => {
      const match = /^(#{1,3})\s+(.+?)\s*#*$/.exec(line.trim());
      if (!match) return null;
      const text = match[2].replace(/[`*_~]/g, '').trim();
      return {
        id: slug(text),
        text,
        level: match[1].length,
        line: index + 1,
      };
    })
    .filter((heading): heading is Heading => heading !== null);
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const getRiskCellClass = (value: string) => {
  const text = value.trim();

  if (/^(?:D:|X:)|\/(?:\s*)?(?:D:|X:)/.test(text)) {
    return styles.riskCritical;
  }
  if (/^C:|\/(?:\s*)?C:/.test(text)) return styles.riskHigh;
  if (/^B:|\/(?:\s*)?B:/.test(text)) return styles.riskMedium;
  if (/^A:/.test(text)) return styles.riskLow;

  if (/^XL\b|~XL\b/.test(text)) return styles.riskCritical;
  if (/^L\b|~L\b/.test(text)) return styles.riskHigh;
  if (/^M\b|~M\b/.test(text)) return styles.riskMedium;
  if (/^S\b/.test(text)) return styles.riskLow;

  return undefined;
};

export default function MarkdownViewer({
  documents,
}: {
  documents: MarkdownDocument[];
}) {
  const [selectedPath, setSelectedPath] = useState(
    documents[0]?.relativePath ?? '',
  );
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [copied, setCopied] = useState(false);

  const filteredDocuments = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko');
    if (!keyword) return documents;
    return documents.filter(
      (document) =>
        document.relativePath.toLocaleLowerCase('ko').includes(keyword) ||
        document.content.toLocaleLowerCase('ko').includes(keyword),
    );
  }, [documents, query]);

  const selectedDocument =
    documents.find((document) => document.relativePath === selectedPath) ??
    documents[0] ??
    null;
  const headings = useMemo(
    () => extractHeadings(selectedDocument?.content ?? ''),
    [selectedDocument],
  );
  const copyDocument = async () => {
    if (!selectedDocument) return;
    await navigator.clipboard.writeText(selectedDocument.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const headingComponent = (level: 1 | 2 | 3) => {
    const HeadingComponent = ({
      children,
      node,
    }: {
      children?: React.ReactNode;
      node?: { position?: { start: { line: number } } };
    }) => {
      const sourceLine = node?.position?.start.line;
      const id =
        headings.find((heading) => heading.line === sourceLine)?.id ??
        `section-${sourceLine ?? level}`;
      const Component = `h${level}` as const;
      return <Component id={id}>{children}</Component>;
    };
    HeadingComponent.displayName = `MarkdownHeading${level}`;
    return HeadingComponent;
  };

  return (
    <Box className={styles.viewer}>
      <AppBar position="static" color="inherit" elevation={0}>
        <Toolbar className={styles.toolbar}>
          <MenuBookOutlined color="primary" />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
              Markdown Docs
            </Typography>
            <Typography variant="caption" color="text.secondary">
              docs 폴더 문서 뷰어
            </Typography>
          </Box>
          <Chip
            label={`${documents.length}개 문서`}
            size="small"
            variant="outlined"
            sx={{ ml: 'auto' }}
          />
        </Toolbar>
      </AppBar>

      <Box className={styles.workspace}>
        <Paper component="aside" square elevation={0} className={styles.sidebar}>
          <Box className={styles.sidebarHeader}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              문서
            </Typography>
            <TextField
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="파일명 또는 내용 검색"
              size="small"
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
          <Divider />
          <List dense disablePadding className={styles.documentList}>
            {filteredDocuments.map((document) => (
              <ListItemButton
                key={document.relativePath}
                selected={document.relativePath === selectedDocument?.relativePath}
                onClick={() => {
                  setSelectedPath(document.relativePath);
                  setCopied(false);
                }}
              >
                <DescriptionOutlined fontSize="small" className={styles.fileIcon} />
                <ListItemText
                  primary={document.name}
                  secondary={document.relativePath}
                  slotProps={{
                    primary: {
                      sx: { fontSize: 14, fontWeight: 600 },
                    },
                    secondary: {
                      sx: { fontSize: 11 },
                      noWrap: true,
                    },
                  }}
                />
              </ListItemButton>
            ))}
            {!filteredDocuments.length && (
              <Box className={styles.emptyList}>검색 결과가 없습니다.</Box>
            )}
          </List>
        </Paper>

        <Box component="main" className={styles.main}>
          {!selectedDocument ? (
            <Alert severity="info">
              docs 폴더에 표시할 Markdown 파일이 없습니다.
            </Alert>
          ) : (
            <>
              <Paper square elevation={0} className={styles.documentHeader}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
                    {selectedDocument.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {selectedDocument.relativePath} · {formatBytes(selectedDocument.size)} ·{' '}
                    {formatDate(selectedDocument.modifiedAt)}
                  </Typography>
                </Box>
                <Box className={styles.headerActions}>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={viewMode}
                    onChange={(_, nextMode: ViewMode | null) => {
                      if (nextMode) setViewMode(nextMode);
                    }}
                  >
                    <ToggleButton value="preview">미리보기</ToggleButton>
                    <ToggleButton value="source">원문</ToggleButton>
                  </ToggleButtonGroup>
                  <Tooltip title={copied ? '복사됨' : 'Markdown 복사'}>
                    <IconButton size="small" onClick={() => void copyDocument()}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>

              <Box className={styles.readingArea}>
                <Paper elevation={0} className={styles.documentPaper}>
                  {viewMode === 'source' ? (
                    <Box component="pre" className={styles.source}>
                      {selectedDocument.content}
                    </Box>
                  ) : (
                    <article className={styles.markdown}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: headingComponent(1),
                          h2: headingComponent(2),
                          h3: headingComponent(3),
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noreferrer">
                              {children}
                            </a>
                          ),
                          code: ({ className, children, node, ...props }) => (
                            <code className={className} {...props} data-line={node?.position?.start.line}>
                              {children}
                            </code>
                          ),
                          td: ({ children, node, ...props }) => {
                            const cellText = String(children ?? '');
                            const riskClass = getRiskCellClass(cellText);

                            return (
                              <td
                                className={riskClass}
                                data-line={node?.position?.start.line}
                                {...props}
                              >
                                {children}
                              </td>
                            );
                          },
                        }}
                      >
                        {selectedDocument.content}
                      </ReactMarkdown>
                    </article>
                  )}
                </Paper>

                {viewMode === 'preview' && headings.length > 1 && (
                  <Paper component="nav" elevation={0} className={styles.outline}>
                    <Typography variant="overline" sx={{ fontWeight: 700 }}>
                      이 문서의 목차
                    </Typography>
                    <Box className={styles.outlineLinks}>
                      {headings.map((heading) => (
                        <Button
                          key={heading.id}
                          className={styles.outlineButton}
                          style={{ paddingLeft: 8 + (heading.level - 1) * 12 }}
                          onClick={() =>
                            document.getElementById(heading.id)?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            })
                          }
                        >
                          {heading.text}
                        </Button>
                      ))}
                    </Box>
                  </Paper>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
