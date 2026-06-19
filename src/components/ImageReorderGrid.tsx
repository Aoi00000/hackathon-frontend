/**
 * 複数画像プレビューとドラッグ&ドロップ並び替えをまとめたコンポーネント。
 *
 * 出品画面と出品履歴の編集画面で同じ操作性にするため、画像配列の表示、削除、
 * HTML5 Drag and Drop による順序変更をここへ集約します。
 */
import { DragEvent, useState } from 'react';

import { normalizeImageUrl } from '../utils';

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [removed] = next.splice(from, 1);
  next.splice(to, 0, removed);
  return next;
}

type ImageReorderGridProps = {
  imageUrls: string[];
  onChange: (next: string[]) => void;
  onRemove: (index: number) => void;
  altPrefix: string;
};

export function ImageReorderGrid({ imageUrls, onChange, onRemove, altPrefix }: ImageReorderGridProps) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function onDragStart(event: DragEvent<HTMLDivElement>, index: number) {
    setDraggingIndex(index);
    setDragOverIndex(index);
    // Firefox対策として、何かしらのdataTransfer値を入れておきます。
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }

  function onDragOver(event: DragEvent<HTMLDivElement>, index: number) {
    // dropを受け取るためにはdragOverでpreventDefaultが必要です。
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }

  function onDrop(event: DragEvent<HTMLDivElement>, index: number) {
    event.preventDefault();
    const from = draggingIndex ?? Number(event.dataTransfer.getData('text/plain'));
    if (Number.isInteger(from)) onChange(moveItem(imageUrls, from, index));
    setDraggingIndex(null);
    setDragOverIndex(null);
  }

  function onDragEnd() {
    setDraggingIndex(null);
    setDragOverIndex(null);
  }

  return (
    <div className="imagePreviewGrid reorderableImageGrid" aria-label="商品画像の並び替え">
      {imageUrls.map((url, index) => (
        <div
          className={`imagePreviewWrap reorderableImage ${draggingIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'dragOver' : ''}`}
          key={`${url.slice(0, 40)}-${index}`}
          draggable
          onDragStart={(event) => onDragStart(event, index)}
          onDragOver={(event) => onDragOver(event, index)}
          onDrop={(event) => onDrop(event, index)}
          onDragEnd={onDragEnd}
          title="ドラッグ&ドロップで画像の順番を変更できます"
        >
          <span className="imageOrderBadge">{index + 1}</span>
          <img className="imagePreview" src={normalizeImageUrl(url)} alt={`${altPrefix} ${index + 1}`} />
          <button type="button" className="imageRemoveButton" onClick={() => onRemove(index)} aria-label={`${index + 1}枚目の画像を削除`}>×</button>
          <span className="imageDragHint">↕ 並び替え</span>
        </div>
      ))}
    </div>
  );
}
