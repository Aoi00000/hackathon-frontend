/**
 * ファイル概要: hackathon-frontend/src/components/ImageReorderGrid.tsx
 *
 * 役割:
 * 画像・動画をアップロード、削除、ドラッグ&ドロップで並び替える再利用コンポーネントです。
 *
 */

/**
 * 実装詳細メモ:
 * 出品画像をドラッグ操作で並び替えるための独立コンポーネントです。
 * 先頭画像が商品カードの代表画像になるため、並び順の変更を親コンポーネントへ確実に返すことが重要です。
 */
/**
 * 商品メディアのプレビューとドラッグ&ドロップ並び替えをまとめたコンポーネント。
 *
 * ファイル名は過去実装との互換性で ImageReorderGrid のままですが、
 * 現在は画像だけでなく動画も扱います。
 * 出品画面と出品履歴の編集画面で同じ操作性にするため、
 * メディア配列の表示、削除、HTML5 Drag and Drop による順序変更をここへ集約します。
 */
import { DragEvent, useState } from 'react';

import { isVideoUrl, normalizeImageUrl } from '../utils';

// moveItem は、ドラッグ元fromの要素をドラッグ先toへ移動した新しい配列を返します。
// Reactでは既存配列を直接変更すると再描画や差分検知が分かりにくくなるため、コピーした配列を作って返します。
function moveItem<T>(items: T[], from: number, to: number): T[] {
  // 配列の from 番目を取り出し、to 番目へ差し込むだけの小さなヘルパーです。
  // 不正なindexの場合は元配列をそのまま返し、ドラッグ中の誤操作で画面が壊れないようにします。
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [removed] = next.splice(from, 1);
  next.splice(to, 0, removed);
  return next;
}
// ImageReorderGridProps は、親コンポーネントから受け取るメディア配列と操作コールバックです。
// このコンポーネントは状態を親に返す「制御コンポーネント」として動き、保存処理やフォーム状態は親が管理します。
type ImageReorderGridProps = {
  imageUrls: string[];
  onChange: (next: string[]) => void;
  onRemove: (index: number) => void;
  altPrefix: string;
};
// ImageReorderGrid は、商品メディアの表示・削除・順序変更を担当するUI部品です。
// 先頭メディアが商品カードの代表画像として使われるため、並び順の変更は出品体験の重要な操作になります。
export function ImageReorderGrid({ imageUrls, onChange, onRemove, altPrefix }: ImageReorderGridProps) {
  // draggingIndex は、今つかんでいるメディアの位置です。
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  // dragOverIndex は、今ドロップ候補になっているメディアの位置です。
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  function onDragStart(event: DragEvent<HTMLDivElement>, index: number) {
    // ドラッグ開始時点のindexをstateとdataTransferの両方に保存します。
    // FirefoxではdataTransferへ何か入れないとdrag/dropが安定しないため、文字列として保存します。
    setDraggingIndex(index);
    setDragOverIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }
  function onDragOver(event: DragEvent<HTMLDivElement>, index: number) {
    // dropを受け取るためにはdragOverでpreventDefaultが必要です。
    // ここで現在の候補indexも更新し、青い枠でドロップ先を示します。
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }
  function onDrop(event: DragEvent<HTMLDivElement>, index: number) {
    // ドロップされたら、保存しておいたfromから今回のindexへメディアを移動します。
    event.preventDefault();
    const from = draggingIndex ?? Number(event.dataTransfer.getData('text/plain'));
    if (Number.isInteger(from)) onChange(moveItem(imageUrls, from, index));
    setDraggingIndex(null);
    setDragOverIndex(null);
  }
  function onDragEnd() {
    // ドラッグが中断された場合も、見た目の状態が残らないように必ず初期化します。
    setDraggingIndex(null);
    setDragOverIndex(null);
  }

  return (
    <div className="imagePreviewGrid reorderableImageGrid" aria-label="商品メディアの並び替え">
      {imageUrls.map((url, index) => {
        // 画像と動画でプレビュー要素を切り替えます。
        // normalizeImageUrl は互換名ですが、内部的には動画Data URLもそのまま通します。
        const normalizedUrl = normalizeImageUrl(url);
        const video = isVideoUrl(normalizedUrl);
        return (
          <div
            className={`imagePreviewWrap reorderableImage ${draggingIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'dragOver' : ''}`}
            key={`${normalizedUrl.slice(0, 40)}-${index}`}
            draggable
            onDragStart={(event) => onDragStart(event, index)}
            onDragOver={(event) => onDragOver(event, index)}
            onDrop={(event) => onDrop(event, index)}
            onDragEnd={onDragEnd}
            title="ドラッグ&ドロップで画像・動画の順番を変更できます"
          >
            <span className="imageOrderBadge">{index + 1}</span>
            {video ? (
              <video className="imagePreview mediaPreview" src={normalizedUrl} controls muted playsInline />
            ) : (
              <img className="imagePreview mediaPreview" src={normalizedUrl} alt={`${altPrefix} ${index + 1}`} />
            )}
            <button type="button" className="imageRemoveButton" onClick={() => onRemove(index)} aria-label={`${index + 1}件目のメディアを削除`}>×</button>
            <span className="imageDragHint">↕ 並び替え</span>
            <span className="mediaTypeBadge">{video ? '動画' : '画像'}</span>
          </div>
        );
      })}
    </div>
  );
}
