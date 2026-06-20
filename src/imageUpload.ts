/**
 * ファイル概要: hackathon-frontend/src/imageUpload.ts
 *
 * 役割:
 * ブラウザ上で画像・動画ファイルをData URLに変換し、DBへ保存できる文字列にします。
 *
 */

/**
 * 実装詳細メモ:
 * 画像と動画をData URLへ変換し、画像はCanvasで圧縮してからAPIへ渡します。
 * DBへ直接メディア文字列を保存する構成のため、ファイルサイズ制限と圧縮品質がユーザー体験とDB負荷を左右します。
 */
// 画像・動画アップロード補助。
//
// このアプリでは、ハッカソン中にCloud Storageなどの外部ストレージ設定を増やさず、
// 「手元のファイルを選ぶだけで出品できる」ことを優先します。
// そのため、画像はブラウザ上で軽量化してData URLへ変換し、動画はサイズ上限を確認してから
// Data URLとしてDBの image_url 列へ保存します。
// 列名は過去実装との互換性で image_url のままですが、中身としては画像・動画を含む
// 「商品メディア配列」をJSON文字列で保持できます。

// 商品画像は一覧・詳細・履歴の複数箇所で表示されるため、大きすぎる写真をそのまま保存しません。
// 900px以内へ縮小すると、デモDBでも扱いやすく、画面表示も高速になります。
const maxImageSize = 900;

// JPEG品質は、文字入り画像でも読み取りやすく、Data URLが大きくなりすぎない程度に設定します。
const jpegQuality = 0.78;

// 動画は圧縮処理をブラウザだけで安定して行うのが難しいため、サイズ上限を設けます。
// 本番運用ではCloud Storageへアップロードし、DBには署名付きURLや公開URLを保存する設計にします。
const maxVideoBytes = 8 * 1024 * 1024;

// fileToCompressedDataUrl は、画像だけを扱っていた古い呼び出し元のために残している互換関数です。
// 実処理はfileToMediaDataUrlへ委譲し、現在の画像・動画両対応の変換ルールを同じように適用します。
export function fileToCompressedDataUrl(file: File): Promise<string> {
  // 既存コードとの互換用です。
  // 画像だけを受け取る古い呼び出しが残っていても動くよう、内部的にメディア変換関数へ委譲します。
  return fileToMediaDataUrl(file);
}
// fileToMediaDataUrl は、アップロードされたFileを商品メディアとして保存可能なData URLへ変換します。
// 画像は圧縮、動画はサイズ検査のみを行い、画面やDBが扱えないファイル形式なら分かりやすいエラーを返します。
export function fileToMediaDataUrl(file: File): Promise<string> {
  // 画像は軽量化して返します。
  // 動画はサイズ上限を満たす場合のみData URLとして返します。
  // それ以外のファイルは、商品メディアとして表示できないためエラーにします。
  if (file.type.startsWith('image/')) return imageFileToCompressedDataUrl(file);
  if (file.type.startsWith('video/')) return videoFileToDataUrl(file);
  return Promise.reject(new Error('画像または動画ファイルを選択してください'));
}
// imageFileToCompressedDataUrl は、画像を読み込み、Canvasで縮小・JPEG再エンコードする内部処理です。
// ブラウザだけで完結するためサーバー側の画像処理が不要になり、アップロード直後のプレビューにも同じData URLを使えます。
function imageFileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // 画像以外が誤って渡された場合は、後続のImage変換前に明示的に止めます。
    if (!file.type.startsWith('image/')) {
      reject(new Error('画像ファイルを選択してください'));
      return;
    }

    // FileReaderでローカルファイルをData URLとして読み込みます。
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('画像ファイルの読み込みに失敗しました'));
    reader.onload = () => {
      // 読み込んだData URLをImageに入れることで、元の縦横サイズを取得します。
      const image = new Image();
      image.onerror = () => reject(new Error('画像ファイルを表示用に変換できませんでした'));
      image.onload = () => {
        // 長辺が maxImageSize を超える場合だけ縮小し、超えない場合は等倍にします。
        const scale = Math.min(1, maxImageSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

        // Canvasへ描画してJPEGとして再エンコードすることで、写真の容量を抑えます。
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('画像変換に必要なCanvasを利用できませんでした'));
          return;
        }
        ctx.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', jpegQuality));
      };
      image.src = String(reader.result ?? '');
    };
    reader.readAsDataURL(file);
  });
}
// videoFileToDataUrl は、動画ファイルをData URLへ変換する内部処理です。
// 動画圧縮はブラウザ実装差が大きいため、このデモではサイズ上限で制御し、読み込み自体はFileReaderに任せます。
function videoFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // 動画はDBへ直接保存するには大きくなりやすいため、デモで扱える上限を設けます。
    if (file.size > maxVideoBytes) {
      reject(new Error('動画は8MB以下のファイルを選択してください。大きい動画は短く切り出してから登録してください'));
      return;
    }

    // 動画は圧縮せず、そのままData URLとして読み込みます。
    // ブラウザの <video> でプレビューし、商品詳細でも同じData URLを再生できます。
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('動画ファイルの読み込みに失敗しました'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}
