import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNote, updateNote } from './notes';
import type { Note } from '../types/note';

const testNote: Note = {
  id: 'test-1',
  title: '테스트 노트',
  content: '내용',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('api.updateNote', () => {
  // 실제 서버(localhost:3001, db.json)로 요청이 나가지 않도록 fetch를 대체한다
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2025-01-15T09:00:00.000Z'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  // A1 — 회귀 테스트: 기존 updateNote가 이미 충족하는 동작이라 Red 단계에서도 통과한다.
  it('should PATCH 본문에 tags를 포함 when updates에 tags를 전달', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ...testNote, tags: ['react', 'design'] }),
    });

    await updateNote('test-1', { tags: ['react', 'design'] });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3001/notes/test-1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({
      tags: ['react', 'design'],
      updatedAt: '2025-01-15T09:00:00.000Z',
    });
  });

  // A2 — 회귀 테스트: 기존 updateNote가 이미 충족하는 동작이라 Red 단계에서도 통과한다.
  it("should Error('Failed to update note')를 던짐 when 응답이 !res.ok", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });

    await expect(updateNote('test-1', { tags: ['react'] })).rejects.toThrow(
      'Failed to update note',
    );
  });
});

describe('api.createNote 태그 (이슈 5)', () => {
  // 실제 서버(localhost:3001, db.json)로 요청이 나가지 않도록 fetch를 대체한다
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2025-01-15T09:00:00.000Z'));
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ...testNote }) });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  // 이슈 5 A1
  // 회귀 테스트: 기존 createNote가 note를 그대로 body에 펼쳐 tags를 이미 포함한다. Red 단계에서도 통과한다.
  it("should POST body에 tags ['react']를 포함 when note에 tags ['react']가 있음", async () => {
    await createNote({ title: '제목', content: '내용', tags: ['react'] });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3001/notes');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      title: '제목',
      content: '내용',
      tags: ['react'],
      createdAt: '2025-01-15T09:00:00.000Z',
      updatedAt: '2025-01-15T09:00:00.000Z',
    });
  });

  // 이슈 5 A2
  // 회귀 테스트: 기존 createNote가 빈 배열 tags도 이미 그대로 보낸다. Red 단계에서도 통과한다.
  it('should POST body에 tags: []를 포함 when note.tags가 빈 배열', async () => {
    await createNote({ title: '제목', content: '내용', tags: [] });

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body).tags).toEqual([]);
  });

  // 이슈 5 A3
  // 회귀 테스트: 기존 createNote가 tags를 이미 임의로 채우지 않는다. Red 단계에서도 통과한다.
  it('should body에 tags를 넣지 않음(기본값을 채우지 않음) when note에 tags가 없음', async () => {
    await createNote({ title: '제목', content: '내용' });

    const [, init] = fetchMock.mock.calls[0];
    expect('tags' in JSON.parse(init.body)).toBe(false);
  });
});
