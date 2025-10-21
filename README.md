# BPMN Visualization Prototype

このリポジトリは、`docs/bpmn_visualization_plan.md` の設計ドキュメントをもとに、BPMN図の自動可視化を行うTypeScript/Reactベースの
プロトタイプ実装を含みます。

## プロジェクト構成

- `src/main.tsx` — Viteエントリーポイント。`App` をDOMにマウントします。
- `src/App.tsx` — サンプルビューアのエントリーポイント
- `src/types` — BPMN要素の型定義と列挙型
- `src/models` — 図、ノード、エッジを扱うモデルクラス
- `src/converters` — React Flow、bpmn-js、BPMN XML向けの変換ユーティリティ
- `src/utils` — ID生成やレイアウト計算のユーティリティ
- `src/hooks` — ダイアグラムの状態管理とバリデーションを行う React フック
- `src/components` — React Flow を利用した BPMN ビューアコンポーネント
- `src/data` — サンプルダイアグラムデータ

## セットアップ

依存関係は `package.json` に定義されています。ローカルで実行する際は以下のコマンドを実行してください。

```bash
npm install
npm run dev
```

`npm run dev` は Vite の開発サーバーを起動します。ブラウザで `http://localhost:5173` (Docker環境ではポートフォワード先) にアクセスすると
React Flow ベースの BPMN ビューアを確認できます。

### ビルド・検証コマンド

- 型チェック: `npm run typecheck`
- Lint: `npm run lint`
- 本番ビルド: `npm run build`
- 本番ビルドのプレビュー: `npm run preview`

## Docker を用いた仮想環境

Docker で開発用の仮想環境を構築する場合は以下の手順を利用できます。

```bash
# イメージのビルド
docker build -t bpmn-visualization .

# プロトタイプの起動 (4173 ポートをホストに公開)
docker run --rm -p 4173:4173 bpmn-visualization
```

`docker run` 実行後、ブラウザから `http://localhost:4173` にアクセスすると、ビルド済みのアプリケーションを `vite preview` が配信します。
ホットリロードを利用したい場合は、ローカルで `npm run dev` を実行するか、ボリュームマウントした上で `npm run dev -- --host 0.0.0.0` を実行してください。

## 主な機能

- BPMN ダイアグラムの型安全なデータモデル
- ノード・エッジの追加／更新／削除を支援するモデルクラス
- BPMN 図の基本的なバリデーションロジック
- React Flow、bpmn-js、BPMN XML 形式への変換ヘルパー
- 簡易的な自動レイアウトユーティリティ
- React Flow ベースの BPMN ビューアコンポーネント

## ライセンス

このプロジェクトは、プロジェクト依頼者の内部利用を想定したサンプル実装です。
