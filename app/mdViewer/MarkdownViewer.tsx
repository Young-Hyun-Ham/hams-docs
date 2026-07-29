'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Close,
  ContentCopy,
  DescriptionOutlined,
  ExpandLess,
  ExpandMore,
  FolderOutlined,
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

type DocumentFolder = {
  name: string;
  path: string;
  folders: DocumentFolder[];
  documents: MarkdownDocument[];
};

const buildDocumentTree = (documents: MarkdownDocument[]): DocumentFolder => {
  const root: DocumentFolder = {
    name: '',
    path: '',
    folders: [],
    documents: [],
  };

  documents.forEach((document) => {
    const segments = document.relativePath.split('/');
    const folderNames = segments.slice(0, -1);
    let current = root;

    folderNames.forEach((folderName) => {
      const folderPath = current.path
        ? `${current.path}/${folderName}`
        : folderName;
      let child = current.folders.find((folder) => folder.name === folderName);

      if (!child) {
        child = {
          name: folderName,
          path: folderPath,
          folders: [],
          documents: [],
        };
        current.folders.push(child);
      }

      current = child;
    });

    current.documents.push(document);
  });

  const sortFolder = (folder: DocumentFolder) => {
    folder.folders.sort((left, right) =>
      left.name.localeCompare(right.name, 'ko'),
    );
    folder.documents.sort((left, right) =>
      left.relativePath.localeCompare(right.relativePath, 'ko'),
    );
    folder.folders.forEach(sortFolder);
  };

  sortFolder(root);
  return root;
};

const getParentFolderPaths = (relativePath: string) => {
  const segments = relativePath.split('/').slice(0, -1);
  return segments.map((_, index) => segments.slice(0, index + 1).join('/'));
};

const resolveMarkdownLink = (currentPath: string, href?: string) => {
  if (!href || href.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(href)) {
    return null;
  }

  const [rawPath, rawHash] = href.split('#', 2);
  const pathWithoutQuery = rawPath.split('?', 1)[0];
  if (!/\.md$/i.test(pathWithoutQuery)) return null;

  let decodedPath = pathWithoutQuery;
  try {
    decodedPath = decodeURIComponent(pathWithoutQuery);
  } catch {
    // Keep the original path when the href contains malformed escapes.
  }

  const segments = decodedPath.startsWith('/')
    ? []
    : currentPath.split('/').slice(0, -1);

  decodedPath
    .replace(/^\/+/, '')
    .split('/')
    .forEach((segment) => {
      if (!segment || segment === '.') return;
      if (segment === '..') segments.pop();
      else segments.push(segment);
    });

  return {
    path: segments.join('/'),
    hash: rawHash ? decodeURIComponent(rawHash) : '',
  };
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

const formatDate = (value: string) => {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;

  // Keep the server-rendered text and the browser's first render identical.
  // Intl output can vary by runtime even when locale and timeZone are fixed.
  const koreaTime = new Date(timestamp + 9 * 60 * 60 * 1000);
  const year = koreaTime.getUTCFullYear();
  const month = String(koreaTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(koreaTime.getUTCDate()).padStart(2, '0');
  const hour = String(koreaTime.getUTCHours()).padStart(2, '0');
  const minute = String(koreaTime.getUTCMinutes()).padStart(2, '0');

  return `${year}.${month}.${day} ${hour}:${minute}`;
};

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
  const [openDocumentPaths, setOpenDocumentPaths] = useState<string[]>(
    () => (documents[0]?.relativePath ? [documents[0].relativePath] : []),
  );
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [copied, setCopied] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => new Set(getParentFolderPaths('')),
  );
  const mainRef = useRef<HTMLElement | null>(null);

  const filteredDocuments = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko');
    if (!keyword) return documents;
    return documents.filter(
      (document) =>
        document.relativePath.toLocaleLowerCase('ko').includes(keyword) ||
        document.content.toLocaleLowerCase('ko').includes(keyword),
    );
  }, [documents, query]);
  const documentTree = useMemo(
    () => buildDocumentTree(filteredDocuments),
    [filteredDocuments],
  );
  const isSearching = query.trim().length > 0;

  const selectedDocument =
    documents.find((document) => document.relativePath === selectedPath) ?? null;
  const openDocuments = openDocumentPaths
    .map((path) => documents.find((document) => document.relativePath === path))
    .filter((document): document is MarkdownDocument => Boolean(document));
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

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((current) => {
      const next = new Set(current);
      if (next.has(folderPath)) next.delete(folderPath);
      else next.add(folderPath);
      return next;
    });
  };

  const openDocument = (relativePath: string, hash = '') => {
    if (!documents.some((document) => document.relativePath === relativePath)) {
      return;
    }

    setOpenDocumentPaths((current) =>
      current.includes(relativePath) ? current : [...current, relativePath],
    );
    setExpandedFolders((current) => {
      const next = new Set(current);
      getParentFolderPaths(relativePath).forEach((path) => next.add(path));
      return next;
    });
    setSelectedPath(relativePath);
    setCopied(false);

    window.requestAnimationFrame(() => {
      if (hash) {
        document.getElementById(hash)?.scrollIntoView({ block: 'start' });
      } else {
        mainRef.current?.scrollTo({ top: 0 });
      }
    });
  };

  const closeDocument = (relativePath: string) => {
    const closingIndex = openDocumentPaths.indexOf(relativePath);
    if (closingIndex < 0) return;

    const nextPaths = openDocumentPaths.filter((path) => path !== relativePath);
    setOpenDocumentPaths(nextPaths);

    if (selectedPath === relativePath) {
      const nextSelectedPath =
        nextPaths[closingIndex] ?? nextPaths[closingIndex - 1] ?? '';
      setSelectedPath(nextSelectedPath);
      setCopied(false);
      mainRef.current?.scrollTo({ top: 0 });
    }
  };

  const renderDocumentTree = (folder: DocumentFolder, depth = 0) => (
    <>
      {folder.folders.map((childFolder) => {
        const expanded = isSearching || expandedFolders.has(childFolder.path);

        return (
          <Box key={childFolder.path} component="li" className={styles.folderItem}>
            <ListItemButton
              className={styles.folderButton}
              sx={{ pl: 1.25 + depth * 2 }}
              onClick={() => toggleFolder(childFolder.path)}
              aria-expanded={expanded}
            >
              {expanded ? (
                <ExpandLess fontSize="small" className={styles.expandIcon} />
              ) : (
                <ExpandMore fontSize="small" className={styles.expandIcon} />
              )}
              <FolderOutlined fontSize="small" className={styles.folderIcon} />
              <ListItemText
                primary={childFolder.name}
                slotProps={{
                  primary: { sx: { fontSize: 13, fontWeight: 700 } },
                }}
              />
            </ListItemButton>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <List dense disablePadding component="ul">
                {renderDocumentTree(childFolder, depth + 1)}
              </List>
            </Collapse>
          </Box>
        );
      })}

      {folder.documents.map((document) => (
        <ListItemButton
          key={document.relativePath}
          component="li"
          className={styles.documentButton}
          sx={{ 
            pl: depth === 0 ? 1 : 4.5 + depth * 1,  
          }}
          selected={document.relativePath === selectedDocument?.relativePath}
          onClick={() => openDocument(document.relativePath)}
        >
          <DescriptionOutlined fontSize="small" className={styles.fileIcon} />
          <ListItemText
            primary={document.name}
            secondary={document.relativePath}
            slotProps={{
              primary: { sx: { fontSize: 13, fontWeight: 600 } },
              secondary: { sx: { fontSize: 10 }, noWrap: true },
            }}
          />
        </ListItemButton>
      ))}
    </>
  );

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
            {renderDocumentTree(documentTree)}
            {!filteredDocuments.length && (
              <Box className={styles.emptyList}>검색 결과가 없습니다.</Box>
            )}
          </List>
        </Paper>

        <Box component="main" className={styles.main} ref={mainRef}>
          {!selectedDocument ? (
            <Alert severity="info">
              {documents.length
                ? '열린 문서가 없습니다. 문서 목록에서 파일을 선택하세요.'
                : 'docs 폴더에 표시할 Markdown 파일이 없습니다.'}
            </Alert>
          ) : (
            <>
              <Paper square elevation={0} className={styles.documentTabs}>
                <Tabs
                  value={selectedDocument.relativePath}
                  onChange={(_, relativePath: string) => openDocument(relativePath)}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="열린 문서"
                >
                  {openDocuments.map((document) => (
                    <Tab
                      key={document.relativePath}
                      component="div"
                      value={document.relativePath}
                      label={
                        <Box component="span" className={styles.tabLabel}>
                          <Box component="span" className={styles.tabLabelText}>
                            {document.name}
                          </Box>
                          <IconButton
                            size="small"
                            className={styles.tabCloseButton}
                            aria-label={`${document.name} 탭 닫기`}
                            onMouseDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                              event.stopPropagation();
                              closeDocument(document.relativePath);
                            }}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                      title={document.relativePath}
                    />
                  ))}
                </Tabs>
              </Paper>
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
                          a: ({ href, children }) => {
                            const markdownLink = resolveMarkdownLink(
                              selectedDocument.relativePath,
                              href,
                            );
                            const canOpenInViewer = Boolean(
                              markdownLink &&
                                documents.some(
                                  (document) =>
                                    document.relativePath === markdownLink.path,
                                ),
                            );

                            if (markdownLink && canOpenInViewer) {
                              return (
                                <a
                                  href={href}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    openDocument(
                                      markdownLink.path,
                                      markdownLink.hash,
                                    );
                                  }}
                                >
                                  {children}
                                </a>
                              );
                            }

                            return (
                              <a href={href} target="_blank" rel="noreferrer">
                                {children}
                              </a>
                            );
                          },
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
