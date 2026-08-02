import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import {
  selectDraftPayload,
  useEditorStore,
  type EditorDraftPayload,
} from '../stores/editorStore';

function localKey(invitationId: string) {
  return `wishly:draft:${invitationId}`;
}

export function readLocalDraft(invitationId: string): EditorDraftPayload | null {
  try {
    const raw = localStorage.getItem(localKey(invitationId));
    if (!raw) return null;
    return JSON.parse(raw) as EditorDraftPayload;
  } catch {
    return null;
  }
}

function writeLocalDraft(invitationId: string, draft: EditorDraftPayload) {
  try {
    localStorage.setItem(localKey(invitationId), JSON.stringify(draft));
  } catch {
    /* quota — ignore */
  }
}

function clearLocalDraft(invitationId: string) {
  try {
    localStorage.removeItem(localKey(invitationId));
  } catch {
    /* ignore */
  }
}

/**
 * Debounced draft autosave. Reads the draft straight off the editor store via
 * `subscribe`, so keystrokes never re-render the component that calls this.
 */
export function useAutosave(invitationId: string | undefined) {
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [offlineLocal, setOfflineLocal] = useState(false);
  const dirtyRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const saveGenRef = useRef(0);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const saveMutation = useMutation({
    mutationFn: ({
      invitationId: invitationIdInner,
      payload,
    }: {
      invitationId: string;
      payload: EditorDraftPayload;
    }) =>
      api.updateDraft(invitationIdInner, {
        content: payload.content,
        theme: payload.theme,
        blocks: payload.blocks,
        slug: payload.slug,
        ...(payload.brandColor !== undefined
          ? { brandColor: payload.brandColor }
          : {}),
      }),
  });
  const mutateAsyncRef = useRef(saveMutation.mutateAsync);
  mutateAsyncRef.current = saveMutation.mutateAsync;

  const persist = useCallback(async (invitationIdInner: string) => {
    const state = useEditorStore.getState();
    if (state.invitationId !== invitationIdInner) return;
    const payload = selectDraftPayload(state);
    const gen = ++saveGenRef.current;
    setSaving(true);
    const run = (async () => {
      try {
        await mutateAsyncRef.current({
          invitationId: invitationIdInner,
          payload,
        });
        if (gen === saveGenRef.current) {
          dirtyRef.current = false;
          setSavedAt(new Date());
          setError(null);
          setOfflineLocal(false);
          clearLocalDraft(invitationIdInner);
        }
      } catch (err) {
        writeLocalDraft(invitationIdInner, payload);
        setOfflineLocal(true);
        setError(
          err instanceof Error
            ? err.message
            : 'Nội dung đã lưu tạm trên máy.'
        );
        throw err;
      } finally {
        if (gen === saveGenRef.current) {
          setSaving(false);
        }
      }
    })();
    inFlightRef.current = run.finally(() => {
      if (inFlightRef.current === run) inFlightRef.current = null;
    });
    await inFlightRef.current;
  }, []);

  useEffect(() => {
    if (!invitationId) return;
    const unsubscribe = useEditorStore.subscribe((state, prev) => {
      // `revision` only moves on edits to the saved draft, so hydration and
      // UI-only changes (active block, preview mode) never schedule a save.
      if (state.revision === prev.revision) return;
      if (state.invitationId !== invitationId) return;
      dirtyRef.current = true;
      // Mirror to localStorage on every edit so offline never loses keystrokes.
      writeLocalDraft(invitationId, selectDraftPayload(state));
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setOfflineLocal(true);
          return;
        }
        void persist(invitationId).catch(() => {
          /* error already in state */
        });
      }, 800);
    });
    return () => {
      unsubscribe();
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [invitationId, persist]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  useEffect(() => {
    if (!invitationId) return;
    const onOnline = () => {
      if (!dirtyRef.current && !readLocalDraft(invitationId)) {
        setOfflineLocal(false);
        return;
      }
      void persist(invitationId).catch(() => undefined);
    };
    const onOffline = () => setOfflineLocal(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [invitationId, persist]);

  const flush = useCallback(async () => {
    if (!invitationId) return;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (inFlightRef.current) {
      try {
        await inFlightRef.current;
      } catch {
        /* retry below if still dirty */
      }
    }
    if (!dirtyRef.current) return;
    await persist(invitationId);
  }, [invitationId, persist]);

  const retrySync = useCallback(() => {
    if (!invitationId) return;
    void persist(invitationId).catch(() => undefined);
  }, [invitationId, persist]);

  return {
    savedAt,
    error,
    saving,
    flush,
    offlineLocal,
    retrySync,
  };
}
