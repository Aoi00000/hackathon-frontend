/**
 * ファイル概要: hackathon-frontend/src/imageUpload.ts
 *
 * 役割:
 * ブラウザ上で画像・動画ファイルをData URLに変換し、DBへ保存できる文字列にします。
 *
 * 読み方の目安:
 * 1. importで依存しているAPI、型、ユーティリティを確認します。
 * 2. 型定義や定数は、画面に出るデータの形や選択肢を表します。
 * 3. Reactコンポーネントでは、useStateが画面状態、useEffectがAPI取得や副作用、イベント関数がユーザー操作を表します。
 * 4. JSXのclassNameは src/styles.css と対応し、UI/UXの一貫性を保つための入口になります。
 *
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
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
const maxImageSize = 900;

// JPEG品質は、文字入り画像でも読み取りやすく、Data URLが大きくなりすぎない程度に設定します。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
const jpegQuality = 0.78;

// 動画は圧縮処理をブラウザだけで安定して行うのが難しいため、サイズ上限を設けます。
// 本番運用ではCloud Storageへアップロードし、DBには署名付きURLや公開URLを保存する設計にします。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
const maxVideoBytes = 8 * 1024 * 1024;

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function fileToCompressedDataUrl(file: File): Promise<string> {
  // 既存コードとの互換用です。
  // 画像だけを受け取る古い呼び出しが残っていても動くよう、内部的にメディア変換関数へ委譲します。
  return fileToMediaDataUrl(file);
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
export function fileToMediaDataUrl(file: File): Promise<string> {
  // 画像は軽量化して返します。
  // 動画はサイズ上限を満たす場合のみData URLとして返します。
  // それ以外のファイルは、商品メディアとして表示できないためエラーにします。
  if (file.type.startsWith('image/')) return imageFileToCompressedDataUrl(file);
  if (file.type.startsWith('video/')) return videoFileToDataUrl(file);
  return Promise.reject(new Error('画像または動画ファイルを選択してください'));
}

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
function imageFileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // 画像以外が誤って渡された場合は、後続のImage変換前に明示的に止めます。
    if (!file.type.startsWith('image/')) {
      reject(new Error('画像ファイルを選択してください'));
      return;
    }

    // FileReaderでローカルファイルをData URLとして読み込みます。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('画像ファイルの読み込みに失敗しました'));
    reader.onload = () => {
      // 読み込んだData URLをImageに入れることで、元の縦横サイズを取得します。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
      const image = new Image();
      image.onerror = () => reject(new Error('画像ファイルを表示用に変換できませんでした'));
      image.onload = () => {
        // 長辺が maxImageSize を超える場合だけ縮小し、超えない場合は等倍にします。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
        const scale = Math.min(1, maxImageSize / Math.max(image.width, image.height));
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
        const width = Math.max(1, Math.round(image.width * scale));
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
        const height = Math.max(1, Math.round(image.height * scale));

        // Canvasへ描画してJPEGとして再エンコードすることで、写真の容量を抑えます。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
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

// 【詳細コメント】このfunction宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
function videoFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // 動画はDBへ直接保存するには大きくなりやすいため、デモで扱える上限を設けます。
    if (file.size > maxVideoBytes) {
      reject(new Error('動画は8MB以下のファイルを選択してください。大きい動画は短く切り出してから登録してください'));
      return;
    }

    // 動画は圧縮せず、そのままData URLとして読み込みます。
    // ブラウザの <video> でプレビューし、商品詳細でも同じData URLを再生できます。
// 【詳細コメント】このconst宣言は、画面状態・API契約・表示ロジックのいずれかを支える要素です。変更時は呼び出し元と型の対応を合わせて確認します。
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('動画ファイルの読み込みに失敗しました'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}
