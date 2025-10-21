# BPMN自動可視化システム 開発計画

## 1. 目的と背景
- BPMN図をJSONデータから自動生成し、React Flow/BPMN-jsで可視化する仕組みを確立する。
- `docs/bpmn_visualization_plan.md` の設計方針を実装フェーズに落とし込み、段階的に開発を進められるようにする。
- データモデル・変換レイヤー・UI・エクスポート機能・テスト基盤を一貫して整備する。

## 2. 全体スケジュール
| フェーズ | 内容 | 期間目安 | 主な成果物 |
|----------|------|----------|-------------|
| フェーズ1 | 基盤整備 (TypeScript型、モデル、開発環境) | 1週 | 型定義、Lint/Formatter設定、基本モデル | 
| フェーズ2 | 変換レイヤー実装 (React Flow/BPMN-js) | 2週 | `toReactFlow`/`toBpmnJs` コンバーター、変換テスト |
| フェーズ3 | UI & インタラクション実装 | 2週 | `BpmnViewer`、カスタムノード、操作系カスタムフック |
| フェーズ4 | エクスポート & 高度機能 | 1週 | `toBpmnXml`、自動レイアウト、パフォーマンス/セキュリティ対応 |
| フェーズ5 | テスト・ドキュメント整備 | 1週 | E2E/統合テスト、ユーザーガイド、リリースノート |

※期間はチームのキャパシティに応じて調整可能。

## 3. 作業ブレークダウン (WBS)

### フェーズ1: 基盤整備
1. リポジトリ初期化と開発環境構築
   - TypeScript + React + Vite(or Next.js) のセットアップ
   - ESLint/Prettier、コミットフック (Husky) 導入
2. 型・列挙定義 (`src/types/`)
   - `enums.ts`, `bpmn.ts` を計画通り実装
   - 共通ユーティリティ型の整理 (`Position`, `Size`, `Metadata` 等)
3. モデル層 (`src/models/`)
   - `Diagram`, `Node`, `Edge` クラス/関数の実装
   - メタデータや履歴管理の枠組み作成
4. バリデーション基盤 (`validators/bpmnValidator.ts`)
   - ID/位置/サイズ検証、プロセス整合性チェックの雛形

### フェーズ2: 変換レイヤー
1. React Flow コンバーター (`converters/toReactFlow.ts`)
   - ノード/エッジ変換、スタイルマッピング
   - コンテナ要素 (Pool/Lane) への対応
2. BPMN-js コンバーター (`converters/toBpmnJs.ts`)
   - BPMN要素マッピング、属性補完
   - BPMN 2.0 XML 仕様との差分整理
3. 変換ユーティリティ
   - ID生成 (`utils/idGenerator.ts`)
   - 共通スタイル変換、マッピングテーブル
4. 単体テスト作成
   - Jest + Testing Library で型・変換ロジックを検証

### フェーズ3: UI & インタラクション
1. ビューアコンポーネント (`components/BpmnViewer.tsx`)
   - React Flowを用いたレンダリング、ズーム・パン操作
   - BPMN-js 切替対応 (必要に応じてフラグ/タブ実装)
2. カスタムノード (`components/nodes/`)
   - Start/End/Event/Task/Gateway の個別スタイル
   - ステート同期とダブルクリック編集
3. フック (`hooks/useBpmnDiagram.ts`)
   - データの取得・変換・状態管理
   - パフォーマンスチューニング (memo, debounce)
4. インタラクション補助
   - `utils/layoutEngine.ts` による簡易レイアウト
   - `utils/diagramOptimizer.ts` でのエッジ簡略化

### フェーズ4: エクスポート & 高度機能
1. `toBpmnXml.ts`
   - BPMN要素をXMLにシリアライズ
   - メタデータ、拡張属性対応
2. エクスポートUI
   - ファイルダウンロード/コピー対応
   - バリデーション結果の表示
3. メモリ管理/パフォーマンス
   - `hooks/useDiagramCleanup.ts` 実装
   - レンダリング最適化 (仮想化、遅延ロード)
4. セキュリティ対策
   - `utils/sanitizer.ts` 導入
   - 入力バリデーション (`validators/inputValidator.ts`)

### フェーズ5: テスト・ドキュメント
1. 統合テスト/E2E
   - Cypress/Playwright で主要ユーザーフローを自動化
2. 性能・回帰テスト
   - 大規模BPMNデータセットで負荷検証
3. ドキュメント整備
   - README更新、APIリファレンス生成
   - 操作ガイド、トラブルシューティング追加
4. リリース準備
   - バージョニング方針、CHANGELOG、デプロイ手順

## 4. マイルストーン
- **M1:** 型定義とバリデーションの基盤完成 (フェーズ1完了)
- **M2:** React Flow/BPMN-js 双方向変換の実装 (フェーズ2完了)
- **M3:** インタラクティブなビューアが完成し、主要ノードが編集可能 (フェーズ3完了)
- **M4:** BPMN XMLエクスポートと自動レイアウトが稼働 (フェーズ4完了)
- **M5:** テスト自動化とドキュメント公開でリリース準備完了 (フェーズ5完了)

## 5. リソース計画
- フロントエンドエンジニア: 2名 (React/TypeScript)
- バックエンド/ツールエンジニア: 1名 (変換ロジック・XML)
- QAエンジニア: 1名 (E2Eテスト、負荷検証)
- テクニカルライター: 0.5名相当 (ドキュメント整備)
- プロジェクトマネージャー: 1名 (進行管理、ステークホルダー調整)

## 6. リスクと対策
| リスク | 影響 | 対応策 |
|--------|------|--------|
| BPMN仕様の解釈違い | 変換ロジックの不具合 | 仕様レビュー会・サンプルXML検証を定期実施 |
| レンダリングパフォーマンス低下 | 大規模図で操作性低下 | レイアウト最適化、仮想化レンダリング、プロファイリング |
| セキュリティ (XSS/入力エラー) | データ破損・脆弱性 | `sanitizer.ts`/`inputValidator.ts` の徹底、ユニットテスト |
| スケジュール遅延 | リリース遅延 | スプリントごとのバーンダウン監視、優先度見直し |

## 7. 品質保証計画
- コードレビュー: 全PRに対して2名レビュー。
- 静的解析: ESLint/TypeScriptチェックをCIに組み込み。
- 自動テスト: 単体(Jest)、統合(Cypress/Playwright)をCIで実行。
- パフォーマンス測定: Lighthouse/React Profilerで定期計測。
- ドキュメント監査: 設計文書との乖離を月次で確認。

## 8. コミュニケーション & 管理
- 開発プロセス: Scrum (1週間スプリント) を想定。
- 定例: デイリースタンドアップ、スプリントレビュー/レトロ。
- タスク管理: Jira/LinearでWBS項目をチケット化。
- ナレッジ共有: Notion/Confluenceで仕様・決定事項を記録。

## 9. 付録
- 参考ドキュメント: `docs/bpmn_visualization_plan.md`
- 想定ライブラリ: React 18, TypeScript 5, React Flow, BPMN-js, Jest, Cypress。
- 用語集: BPMN (Business Process Model and Notation), Pool, Lane, Gateway, Event, Task。
