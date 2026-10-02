'use client';

import { DragEvent, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Download,
  Eye,
  File,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Home,
  Pencil,
  Plus,
  Search,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCollection, useTrash } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import {
  DOCUMENT_ACCEPT,
  dataUrlToBlobUrl,
  documentFromFile,
  downloadDataUrl,
  isAllowedDocument,
  isWithinUploadLimit,
} from '@/lib/media';
import { useSettings } from '@/lib/settings/provider';
import { PrivateFile, PrivateNote } from '@/lib/types';
import { formatBytes, formatDateTime } from '@/lib/utils/format';

type SortKey = 'name' | 'type' | 'date';

const folderName = (path: string): string => path.split('/').pop() ?? path;

const isPreviewable = (file: PrivateFile): boolean =>
  file.mimeType.startsWith('image/') ||
  file.mimeType === 'application/pdf' ||
  file.mimeType.startsWith('text/');

export default function MyAreaPage() {
  const t = useT();
  const { settings } = useSettings();
  const notes = useCollection('privateNotes');
  const files = useCollection('privateFiles');
  const trash = useTrash();
  const fileInput = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [noteQuery, setNoteQuery] = useState('');
  const [fileQuery, setFileQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState({ title: '', content: '', folder: '' });
  const [currentFolder, setCurrentFolder] = useState('');
  const [newFolder, setNewFolder] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [ascending, setAscending] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [preview, setPreview] = useState<PrivateFile | null>(null);

  const folderPaths = useMemo(() => {
    const paths = new Set<string>();
    files.items.forEach((file) => {
      if (file.isFolder && file.folder) paths.add(file.folder);
      if (!file.isFolder && file.folder) {
        const parts = file.folder.split('/');
        parts.forEach((_, index) => paths.add(parts.slice(0, index + 1).join('/')));
      }
    });
    return Array.from(paths).sort((left, right) => left.localeCompare(right));
  }, [files.items]);

  const folders = folderPaths.filter((path) => {
    const parent = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
    return parent === currentFolder;
  });

  const filteredFiles = useMemo(() => {
    const normalizedQuery = fileQuery.trim().toLowerCase();
    const result = files.items.filter((file) => {
      if (file.isFolder) return false;
      const inFolder = normalizedQuery ? true : file.folder === currentFolder;
      const matchesQuery =
        !normalizedQuery ||
        [file.name, file.mimeType, file.folder].join(' ').toLowerCase().includes(normalizedQuery);
      return inFolder && matchesQuery;
    });
    return result.sort((left, right) => {
      const comparison =
        sortKey === 'date'
          ? left.updatedAt.localeCompare(right.updatedAt)
          : sortKey === 'type'
            ? left.mimeType.localeCompare(right.mimeType) || left.name.localeCompare(right.name)
            : left.name.localeCompare(right.name);
      return ascending ? comparison : -comparison;
    });
  }, [currentFolder, fileQuery, files.items, sortKey, ascending]);

  const filteredNotes = notes.items.filter((note) =>
    [note.title, note.content, note.folder].join(' ').toLowerCase().includes(noteQuery.toLowerCase()),
  );
  const activeNote = selectedNoteId ? notes.get(selectedNoteId) : undefined;
  const deletedFiles = trash.items.privateFiles as PrivateFile[];
  const usedBytes = files.items
    .filter((file) => !file.isFolder)
    .reduce((total, file) => total + file.size, 0);
  const selectedFiles = files.items.filter((file) => selectedIds.includes(file.id) && !file.isFolder);

  const startNewNote = () => {
    setSelectedNoteId(null);
    setNoteDraft({ title: '', content: '', folder: '' });
  };

  const editNote = (note: PrivateNote) => {
    setSelectedNoteId(note.id);
    setNoteDraft({ title: note.title, content: note.content, folder: note.folder });
  };

  const saveNote = () => {
    if (!noteDraft.title.trim() && !noteDraft.content.trim()) return;
    if (activeNote) notes.update(activeNote.id, noteDraft);
    else notes.create(noteDraft);
    startNewNote();
  };

  const createFolder = () => {
    const name = newFolder.trim().replaceAll('/', '-');
    if (!name) return;
    const path = currentFolder ? `${currentFolder}/${name}` : name;
    if (folderPaths.includes(path)) return;
    files.create({ name, folder: path, parentFolder: currentFolder, isFolder: true });
    setNewFolder('');
    setCurrentFolder(path);
  };

  const uploadFiles = async (selected: FileList | File[] | null) => {
    if (!selected) return;
    const candidates = Array.from(selected);
    const accepted = candidates.filter(
      (file) => isAllowedDocument(file) && isWithinUploadLimit(file),
    );
    if (accepted.length !== candidates.length) toast.error(t('myArea.fileTypeError'));
    await Promise.all(
      accepted.map(async (file) => {
        const document = await documentFromFile(file, settings.profileName || settings.companyName);
        files.create({
          name: document.name,
          folder: currentFolder,
          parentFolder: currentFolder,
          mimeType: document.mimeType,
          url: document.url,
          size: document.size,
          uploadedAt: document.uploadedAt,
        });
      }),
    );
    if (accepted.length > 0) toast.success(t('myArea.fileUploaded'));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files.length > 0) void uploadFiles(event.dataTransfer.files);
    dropRef.current?.classList.remove('ring-2', 'ring-primary');
  };

  const beginRename = (file: PrivateFile) => {
    setRenameId(file.id);
    setRenameValue(file.name);
  };

  const saveRename = (file: PrivateFile) => {
    const name = renameValue.trim();
    if (name && name !== file.name) files.update(file.id, { name });
    setRenameId(null);
  };

  const moveSelected = (destination: string) => {
    selectedFiles.forEach((file) => files.update(file.id, { folder: destination, parentFolder: destination }));
    setSelectedIds([]);
  };

  const removeFolder = (path: string) => {
    const marker = files.items.find((file) => file.isFolder && file.folder === path);
    if (!marker) return;
    const parent = marker.parentFolder ?? (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');
    files.items
      .filter((file) => file.folder === path || file.folder.startsWith(`${path}/`))
      .forEach((file) => files.update(file.id, { folder: parent, parentFolder: parent }));
    files.remove(marker.id);
    setCurrentFolder(parent);
  };

  const renameFolder = (path: string) => {
    const marker = files.items.find((file) => file.isFolder && file.folder === path);
    if (!marker || !renameValue.trim()) return;
    const nextName = renameValue.trim().replaceAll('/', '-');
    const parent = marker.parentFolder ?? (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');
    const nextPath = parent ? `${parent}/${nextName}` : nextName;
    files.items
      .filter((file) => file.folder === path || file.folder.startsWith(`${path}/`))
      .forEach((file) => {
        const nextFolder = file.folder === path
          ? nextPath
          : `${nextPath}${file.folder.slice(path.length)}`;
        files.update(file.id, { folder: nextFolder, parentFolder: file.parentFolder === path ? nextPath : file.parentFolder });
      });
    files.update(marker.id, { name: nextName, folder: nextPath });
    if (currentFolder === path || currentFolder.startsWith(`${path}/`)) {
      setCurrentFolder(`${nextPath}${currentFolder.slice(path.length)}`);
    }
    setRenameId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">{t('myArea.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('myArea.intro')}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-5" aria-hidden />
              {t('myArea.notebook')}
            </CardTitle>
            <Button size="sm" variant="outline" onClick={startNewNote}>
              <Plus className="size-4" aria-hidden />
              {t('myArea.newNote')}
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" aria-hidden />
              <Input
                className="pl-9"
                value={noteQuery}
                onChange={(event) => setNoteQuery(event.target.value)}
                placeholder={t('myArea.searchNotes')}
                aria-label={t('myArea.searchNotes')}
              />
            </div>
            <div className="flex max-h-52 flex-col gap-2 overflow-y-auto">
              {filteredNotes.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{t('myArea.noNotes')}</p>
              ) : (
                filteredNotes.map((note) => (
                  <button key={note.id} type="button" className="rounded-lg border p-3 text-left hover:bg-accent" onClick={() => editNote(note)}>
                    <span className="block truncate text-sm font-medium">{note.title || t('myArea.untitled')}</span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">{note.folder || t('myArea.noFolder')}</span>
                  </button>
                ))
              )}
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="private-note-title">{t('myArea.noteTitle')}</Label>
                <Input id="private-note-title" value={noteDraft.title} onChange={(event) => setNoteDraft((current) => ({ ...current, title: event.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="private-note-content">{t('myArea.noteContent')}</Label>
                <Textarea id="private-note-content" rows={5} value={noteDraft.content} onChange={(event) => setNoteDraft((current) => ({ ...current, content: event.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveNote}>{t('action.save')}</Button>
                {activeNote ? <Button variant="outline" onClick={() => { notes.remove(activeNote.id); startNewNote(); }}><Trash2 className="size-4" aria-hidden />{t('action.delete')}</Button> : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderOpen className="size-5" aria-hidden />
                {t('myArea.files')}
              </CardTitle>
              <span className="text-xs text-muted-foreground">{t('myArea.storageUsed')}: {formatBytes(usedBytes)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-48 flex-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" aria-hidden />
                <Input className="pl-9" value={fileQuery} onChange={(event) => setFileQuery(event.target.value)} placeholder={t('myArea.searchFiles')} aria-label={t('myArea.searchFiles')} />
              </div>
              <select className="h-10 rounded-md border bg-background px-3 text-sm" value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} aria-label={t('myArea.sort')}>
                <option value="name">{t('myArea.sortName')}</option>
                <option value="type">{t('myArea.sortType')}</option>
                <option value="date">{t('myArea.sortDate')}</option>
              </select>
              <Button size="icon" variant="outline" aria-label={t('myArea.changeOrder')} onClick={() => setAscending((value) => !value)}>
                {ascending ? <ArrowDownAZ className="size-4" aria-hidden /> : <ArrowUpAZ className="size-4" aria-hidden />}
              </Button>
              <Button onClick={() => fileInput.current?.click()}><Upload className="size-4" aria-hidden />{t('myArea.upload')}</Button>
              <input ref={fileInput} type="file" multiple accept={DOCUMENT_ACCEPT} className="hidden" onChange={(event) => { void uploadFiles(event.target.files); event.target.value = ''; }} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[minmax(10rem,0.35fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-2">
              <button type="button" className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${currentFolder === '' ? 'bg-accent font-medium' : 'hover:bg-accent'}`} onClick={() => setCurrentFolder('')}>
                <Home className="size-4" aria-hidden />{t('myArea.rootFolder')}
              </button>
              {folders.map((path) => (
                <div key={path} className="group flex items-center gap-1">
                  <button type="button" className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${currentFolder === path ? 'bg-accent font-medium' : 'hover:bg-accent'}`} onClick={() => setCurrentFolder(path)}>
                    <Folder className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{folderName(path)}</span>
                  </button>
                  {files.items.some((file) => file.isFolder && file.folder === path) ? (
                    <div className="flex opacity-0 group-hover:opacity-100">
                      <Button size="icon" variant="ghost" className="size-8" aria-label={t('myArea.renameFolder')} onClick={() => { setRenameId(path); setRenameValue(folderName(path)); }}>
                        <Pencil className="size-3.5" aria-hidden />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-8" aria-label={t('action.delete')} onClick={() => removeFolder(path)}>
                        <Trash2 className="size-3.5 text-destructive" aria-hidden />
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
              <div className="mt-2 flex gap-2">
                <Input value={newFolder} onChange={(event) => setNewFolder(event.target.value)} placeholder={t('myArea.newFolder')} />
                <Button size="icon" variant="outline" aria-label={t('myArea.createFolder')} onClick={createFolder}><FolderPlus className="size-4" aria-hidden /></Button>
              </div>
              {renameId && folderPaths.includes(renameId) ? (
                <div className="flex gap-2">
                  <Input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
                  <Button size="sm" onClick={() => renameFolder(renameId)}>{t('action.save')}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setRenameId(null)}>×</Button>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3">
              <div
                ref={dropRef}
                className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground transition-colors"
                onDragOver={(event) => { event.preventDefault(); dropRef.current?.classList.add('ring-2', 'ring-primary'); }}
                onDragLeave={() => dropRef.current?.classList.remove('ring-2', 'ring-primary')}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto mb-1 size-5" aria-hidden />
                {t('myArea.dropFiles')}
              </div>
              {selectedFiles.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-accent p-2">
                  <span className="text-sm font-medium">{selectedFiles.length} {t('myArea.selected')}</span>
                  <select className="h-9 rounded-md border bg-background px-2 text-xs" defaultValue="" onChange={(event) => { if (event.target.value === '__root__' || event.target.value) moveSelected(event.target.value === '__root__' ? '' : event.target.value); }}>
                    <option value="">{t('myArea.moveTo')}</option>
                    <option value="__root__">{t('myArea.rootFolder')}</option>
                    {folderPaths.map((path) => <option key={path} value={path}>{path}</option>)}
                  </select>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>{t('action.cancel')}</Button>
                </div>
              ) : null}
              <div className="flex flex-col divide-y rounded-lg border">
                {filteredFiles.length === 0 ? <p className="p-4 text-sm text-muted-foreground">{t('myArea.noFiles')}</p> : filteredFiles.map((file) => (
                  <div key={file.id} className="flex flex-wrap items-center gap-3 p-3">
                    <Checkbox checked={selectedIds.includes(file.id)} onCheckedChange={(checked) => setSelectedIds((current) => checked ? [...current, file.id] : current.filter((id) => id !== file.id))} aria-label={file.name} />
                    {file.mimeType.startsWith('image/') ? <FileImage className="size-5 shrink-0 text-muted-foreground" aria-hidden /> : <File className="size-5 shrink-0 text-muted-foreground" aria-hidden />}
                    <span className="min-w-0 flex-1">
                      {renameId === file.id ? <Input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onBlur={() => saveRename(file)} onKeyDown={(event) => { if (event.key === 'Enter') saveRename(file); }} /> : <span className="block truncate text-sm font-medium">{file.name}</span>}
                      <span className="block text-xs text-muted-foreground">{file.mimeType || t('myArea.unknownType')} · {formatBytes(file.size)} · {formatDateTime(file.updatedAt, settings.language)}</span>
                    </span>
                    <Button size="icon" variant="ghost" aria-label={t('myArea.rename')} onClick={() => beginRename(file)}><Pencil className="size-4" aria-hidden /></Button>
                    {isPreviewable(file) ? <Button size="icon" variant="ghost" aria-label={t('myArea.preview')} onClick={() => setPreview(file)}><Eye className="size-4" aria-hidden /></Button> : null}
                    <Button size="icon" variant="ghost" aria-label={t('action.download')} onClick={() => downloadDataUrl(file.url, file.name)}><Download className="size-4" aria-hidden /></Button>
                    <Button size="icon" variant="ghost" aria-label={t('action.delete')} onClick={() => files.remove(file.id)}><Trash2 className="size-4 text-destructive" aria-hidden /></Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Trash2 className="size-5" aria-hidden />{t('myArea.trash')}</CardTitle></CardHeader>
        <CardContent>
          {deletedFiles.length === 0 ? <p className="text-sm text-muted-foreground">{t('myArea.trashEmpty')}</p> : (
            <div className="flex flex-col divide-y rounded-lg border">
              {deletedFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3">
                  {file.isFolder ? <Folder className="size-5" aria-hidden /> : <File className="size-5" aria-hidden />}
                  <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
                  <Button size="sm" variant="outline" onClick={() => trash.restore('privateFiles', file.id)}><Undo2 className="size-4" aria-hidden />{t('myArea.restore')}</Button>
                  <Button size="sm" variant="ghost" onClick={() => trash.purge('privateFiles', file.id)}>{t('action.delete')}</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-3 rounded-xl bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="truncate font-semibold">{preview.name}</h2>
              <Button variant="outline" onClick={() => setPreview(null)}>{t('nav.close')}</Button>
            </div>
            <div className="min-h-64 overflow-auto rounded-lg bg-muted p-2">
              {preview.mimeType.startsWith('image/') ? (
                <Image
                  src={preview.url}
                  alt={preview.name}
                  width={1600}
                  height={1200}
                  unoptimized
                  className="mx-auto max-h-[70vh] w-auto object-contain"
                />
              ) : (
                <iframe
                  title={preview.name}
                  src={dataUrlToBlobUrl(preview.url, preview.mimeType) ?? preview.url}
                  className="h-[70vh] w-full rounded-md bg-white"
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
