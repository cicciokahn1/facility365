'use client';

import { useMemo, useRef, useState } from 'react';
import { Download, File, FolderPlus, NotebookPen, Plus, Search, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCollection } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import {
  DOCUMENT_ACCEPT,
  documentFromFile,
  downloadDataUrl,
  isAllowedDocument,
  isWithinUploadLimit,
} from '@/lib/media';
import { useSettings } from '@/lib/settings/provider';
import { PrivateFile, PrivateNote } from '@/lib/types';
import { formatBytes, formatDate } from '@/lib/utils/format';

export default function MyAreaPage() {
  const t = useT();
  const { settings } = useSettings();
  const notes = useCollection('privateNotes');
  const files = useCollection('privateFiles');
  const fileInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState({ title: '', content: '', folder: '' });
  const [folder, setFolder] = useState('');
  const [newFolder, setNewFolder] = useState('');

  const folders = useMemo(
    () =>
      Array.from(
        new Set(
          files.items
            .filter((file) => file.isFolder || file.folder)
            .map((file) => file.name || file.folder)
            .filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [files.items],
  );
  const filteredNotes = notes.items.filter((note) =>
    [note.title, note.content, note.folder].join(' ').toLowerCase().includes(query.toLowerCase()),
  );
  const activeNote = selectedNoteId ? notes.get(selectedNoteId) : undefined;

  const startNewNote = () => {
    setSelectedNoteId(null);
    setNoteDraft({ title: '', content: '', folder });
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

  const addFolder = () => {
    const name = newFolder.trim();
    if (!name || folders.includes(name)) return;
    files.create({ name, folder: name, isFolder: true });
    setFolder(name);
    setNewFolder('');
  };

  const uploadFiles = async (selected: FileList | null) => {
    if (!selected) return;
    const accepted = Array.from(selected).filter(
      (file) => isAllowedDocument(file) && isWithinUploadLimit(file),
    );
    if (accepted.length !== selected.length) toast.error(t('myArea.fileTypeError'));
    await Promise.all(
      accepted.map(async (file) => {
        const document = await documentFromFile(file, settings.profileName || settings.companyName);
        files.create({
          name: document.name,
          folder,
          mimeType: document.mimeType,
          url: document.url,
          size: document.size,
          uploadedAt: document.uploadedAt,
        });
      }),
    );
    if (accepted.length > 0) toast.success(t('myArea.fileUploaded'));
  };

  const updateFileFolder = (file: PrivateFile, nextFolder: string) => {
    files.update(file.id, { folder: nextFolder });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">{t('myArea.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('myArea.intro')}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <NotebookPen className="size-5" aria-hidden />
              {t('myArea.notebook')}
            </CardTitle>
            <Button size="sm" variant="outline" onClick={startNewNote}>
              <Plus className="size-4" aria-hidden />
              {t('myArea.newNote')}
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" aria-hidden />
                <Input
                  className="pl-9"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('myArea.searchNotes')}
                  aria-label={t('myArea.searchNotes')}
                />
              </div>
              <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
                {filteredNotes.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    {t('myArea.noNotes')}
                  </p>
                ) : (
                  filteredNotes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      className="rounded-lg border p-3 text-left hover:bg-accent"
                      onClick={() => editNote(note)}
                    >
                      <span className="block truncate text-sm font-medium">{note.title || t('myArea.untitled')}</span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">
                        {note.folder || t('myArea.noFolder')}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="private-note-title">{t('myArea.noteTitle')}</Label>
                <Input
                  id="private-note-title"
                  value={noteDraft.title}
                  onChange={(event) => setNoteDraft((current) => ({ ...current, title: event.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="private-note-folder">{t('myArea.folder')}</Label>
                <Input
                  id="private-note-folder"
                  value={noteDraft.folder}
                  onChange={(event) => setNoteDraft((current) => ({ ...current, folder: event.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="private-note-content">{t('myArea.noteContent')}</Label>
                <Textarea
                  id="private-note-content"
                  rows={7}
                  value={noteDraft.content}
                  onChange={(event) => setNoteDraft((current) => ({ ...current, content: event.target.value }))}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={saveNote}>{t('action.save')}</Button>
                {activeNote ? (
                  <Button variant="outline" onClick={() => { notes.remove(activeNote.id); startNewNote(); }}>
                    <Trash2 className="size-4" aria-hidden />
                    {t('action.delete')}
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <File className="size-5" aria-hidden />
              {t('myArea.files')}
            </CardTitle>
            <Button size="sm" onClick={() => fileInput.current?.click()}>
              <Upload className="size-4" aria-hidden />
              {t('myArea.upload')}
            </Button>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={DOCUMENT_ACCEPT}
              className="hidden"
              onChange={(event) => {
                void uploadFiles(event.target.files);
                event.target.value = '';
              }}
            />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <select
                className="h-10 min-w-40 rounded-md border bg-background px-3 text-sm"
                value={folder}
                onChange={(event) => setFolder(event.target.value)}
                aria-label={t('myArea.folder')}
              >
                <option value="">{t('myArea.allFiles')}</option>
                {folders.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
              <Input
                className="min-w-40 flex-1"
                value={newFolder}
                onChange={(event) => setNewFolder(event.target.value)}
                placeholder={t('myArea.newFolder')}
              />
              <Button variant="outline" onClick={addFolder}>
                <FolderPlus className="size-4" aria-hidden />
                {t('myArea.createFolder')}
              </Button>
            </div>
            <div className="flex flex-col divide-y rounded-lg border">
              {files.items.filter((file) => !file.isFolder && (!folder || file.folder === folder)).length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">{t('myArea.noFiles')}</p>
              ) : (
                files.items
                  .filter((file) => !file.isFolder && (!folder || file.folder === folder))
                  .map((file) => (
                    <div key={file.id} className="flex flex-wrap items-center gap-3 p-3">
                      <File className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{file.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatBytes(file.size)} · {formatDate(file.uploadedAt, settings.language)}
                        </span>
                      </span>
                      <select
                        className="h-9 max-w-36 rounded-md border bg-background px-2 text-xs"
                        value={file.folder}
                        onChange={(event) => updateFileFolder(file, event.target.value)}
                        aria-label={t('myArea.folder')}
                      >
                        <option value="">{t('myArea.noFolder')}</option>
                        {folders.map((name) => <option key={name} value={name}>{name}</option>)}
                      </select>
                      <Button size="icon" variant="ghost" aria-label={t('action.download')} onClick={() => downloadDataUrl(file.url, file.name)}>
                        <Download className="size-4" aria-hidden />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label={t('action.delete')} onClick={() => files.remove(file.id)}>
                        <Trash2 className="size-4 text-destructive" aria-hidden />
                      </Button>
                    </div>
                  ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t('myArea.privateHint')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
