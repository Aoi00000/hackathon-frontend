// 画像アップロード補助。
// 今回のMVPでは、画像ファイルをフロントエンドで小さく圧縮し、Data URLとして imageUrl に保存します。
// 本番規模ではCloud Storage等へアップロードしてURLだけDBに保存する方が適切ですが、
// ハッカソンでは外部ストレージ設定を増やさず「ファイルから直接選択できる」体験を優先します。

const maxImageSize = 900;
const jpegQuality = 0.78;

export function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('画像ファイルを選択してください'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('画像ファイルの読み込みに失敗しました'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('画像ファイルを表示用に変換できませんでした'));
      image.onload = () => {
        const scale = Math.min(1, maxImageSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

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
