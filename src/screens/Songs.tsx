import { useState, type FormEvent } from "react";
import type { Song } from "../lib/types";
import { useStore } from "../state";

const newId = () => Math.random().toString(36).slice(2, 10);

export function Songs({ open }: { open: (itemId: string) => void }) {
  const { state, saveSong, deleteSong } = useStore();
  const [editing, setEditing] = useState<Song | null>(null);

  if (editing) {
    return (
      <SongForm
        song={editing}
        isNew={!state.songs.some((s) => s.id === editing.id)}
        onCancel={() => setEditing(null)}
        onSave={(s) => {
          saveSong(s);
          setEditing(null);
        }}
        onDelete={() => {
          deleteSong(editing.id);
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="screen">
      <h1 className="screen-title">Songs</h1>
      <p className="screen-intro">
        Songs you're learning. One comes up in each session of 30 minutes or more, starting with the one you've gone longest without.
      </p>
      {state.songs.length === 0 ? (
        <p className="empty">Add a song with its record tempo. You'll start slower and climb 4 bpm each time you play it clean.</p>
      ) : (
        <ul className="rows">
          {state.songs.map((s) => (
            <li key={s.id} className="song-row">
              <button className="row" onClick={() => open(`song:${s.id}`)}>
                <span className="row-title">{s.title}</span>
                <span className="row-detail">
                  {s.artist ? `${s.artist}. ` : ""}
                  {s.practiceBpm} of {s.targetBpm} bpm
                </span>
                <span className="meter" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, Math.round((s.practiceBpm / s.targetBpm) * 100))}%` }} />
                </span>
              </button>
              <button className="link" onClick={() => setEditing(s)} aria-label={`Edit ${s.title}`}>
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        className="primary"
        onClick={() => setEditing({ id: newId(), title: "", artist: "", targetBpm: 120, practiceBpm: 90, notes: "", lastPracticed: null })}
      >
        Add a song
      </button>
    </div>
  );
}

function SongForm({
  song,
  isNew,
  onSave,
  onCancel,
  onDelete,
}: {
  song: Song;
  isNew: boolean;
  onSave: (s: Song) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [target, setTarget] = useState(String(song.targetBpm));
  const [practice, setPractice] = useState(String(song.practiceBpm));
  const [notes, setNotes] = useState(song.notes);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = Number(target);
    const p = Number(practice);
    if (!title.trim()) return setError("Add a title.");
    if (!(t >= 30 && t <= 300)) return setError("Record tempo should be between 30 and 300 bpm.");
    if (!(p >= 30 && p <= t)) return setError("Start tempo should be between 30 bpm and the record tempo.");
    onSave({ ...song, title: title.trim(), artist: artist.trim(), targetBpm: Math.round(t), practiceBpm: Math.round(p), notes: notes.trim() });
  };

  return (
    <form className="screen form" onSubmit={submit}>
      <h1 className="screen-title">{isNew ? "Add a song" : "Edit song"}</h1>
      <label>
        <span>Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus={isNew} />
      </label>
      <label>
        <span>Artist</span>
        <input value={artist} onChange={(e) => setArtist(e.target.value)} />
      </label>
      <div className="form-pair">
        <label>
          <span>Record tempo</span>
          <input inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} />
        </label>
        <label>
          <span>Start at</span>
          <input inputMode="numeric" value={practice} onChange={(e) => setPractice(e.target.value)} />
        </label>
      </div>
      <label>
        <span>Notes</span>
        <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tricky spots, key, tuning" />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button type="submit" className="primary">
          {isNew ? "Add song" : "Save song"}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {!isNew && (
        <button type="button" className="link danger" onClick={onDelete}>
          Delete this song
        </button>
      )}
    </form>
  );
}
