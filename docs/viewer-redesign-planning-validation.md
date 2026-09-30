# Проверка документов планирования редизайна

Дата: 2026-09-14. Это проверка документации, не приёмка интерфейса или сцены.
Основной документ — [план редизайна](viewer-redesign-plan.md).

## Повторная проверка и исправление переносов строк

После вопроса пользователя о падении проверок 2026-09-14 установлено:
все 72 замечания ниже вызваны исключительно CRLF вместо LF. Сравнение результата
Prettier с исходными файлами после нормализации переносов не выявило иных отличий.
Git хранит LF, но системный `core.autocrlf=true` создавал CRLF в рабочем дереве.

Добавлен `.gitattributes` с `* text=auto eol=lf`, а перечисленные файлы
нормализованы через Prettier. Это закрепляет LF для текстовых файлов репозитория
при следующих checkout, сохраняя автоматическое распознавание бинарных файлов.
Глобальная конфигурация Git и настройки Prettier не менялись. Содержимое кода,
данных эталонов и конфигов сохранено; интерфейс и геометрия не изменялись.

До исправления на Node 24.14.0 прошли typecheck, все 47 тестов и build с
model:check. Сборка выдаёт предупреждение о viewer chunk размером 628,23 kB
(169,81 kB gzip), превышающем стандартный порог 500 kB. Это не ошибка сборки;
оптимизацию загрузки следует рассматривать отдельно, без повышения порога
ради сокрытия предупреждения.

После исправления повторно прошли `typecheck`, все 47 тестов, `build` с
`model:check`, общий `format:check` и `git diff --check`. По правилам проекта
выполнен `model:build` после нормализации исходников генератора. Git diff не
показывает изменений содержимого исходников, конфигов, эталонов и экспортов;
имена с хешами собранных JS/CSS совпали до и после исправления. Git status
в sandbox может временно показывать такие файлы изменёнными из-за обновлённых
метаданных рабочего дерева, хотя содержательных различий с индексом нет.
Браузер не запускался: изменения ограничены переносами строк и документацией.

## Первоначальная проверка документов

- Сверены бриф, контекст проекта и текущие исходники UI/viewer.
- Относительные Markdown-ссылки брифа, плана и current-state разрешаются.
- `git diff --check` прошёл; Git сообщил о будущей нормализации LF → CRLF
  в current-state согласно настройкам рабочего дерева.
- Изменённые документы отформатированы отдельно через Prettier.
- `npm run format:check` завершился с кодом 1: 72 файла вне задачи требуют
  форматирования. Они перечислены ниже и не исправлялись.
- Сборка, тесты, браузер и замеры FPS не запускались: изменена только документация.
  Визуальный baseline остаётся задачей R0.2.

Файлы, на которых упал общий `format:check` (пути от корня репозитория):

```text
docs/measurement-feature-research.md
docs/measurement-implementation-status.md
docs/plan-dimension-audit.md
docs/plan-dimensions-audit.json
docs/r3f-viewer-migration-plan.md
docs/r3f-viewer-migration-validation.md
docs/room-rework-backlog.md
docs/typescript-migration-plan.md
docs/typescript-migration-validation.md
scripts/build-model.ts
src/App.tsx
src/components/MeasurementPanel.tsx
src/components/ViewerToolbar.tsx
src/hooks/useApartmentViewer.ts
src/model/measurement-math.ts
src/model/measurement-types.ts
src/model/parse-measurements.ts
src/model/parse-model.ts
src/model/types.ts
src/modeling/build-apartment.ts
src/modeling/core/builder.ts
src/modeling/core/materials.ts
src/modeling/core/measurement-target.ts
src/modeling/core/round.ts
src/modeling/export/geometry.ts
src/modeling/export/glb.ts
src/modeling/export/index.ts
src/modeling/export/obj.ts
src/modeling/furniture/bathroom.ts
src/modeling/furniture/cabinet.ts
src/modeling/furniture/plant.ts
src/modeling/furniture/seating.ts
src/modeling/furniture/study.ts
src/modeling/measurements.ts
src/modeling/plan.ts
src/modeling/rooms/bedroom.ts
src/modeling/rooms/cloakroom.ts
src/modeling/rooms/ensuite.ts
src/modeling/rooms/hall.ts
src/modeling/rooms/kitchen.ts
src/modeling/rooms/living-room.ts
src/modeling/rooms/main-bathroom.ts
src/modeling/rooms/study.ts
src/modeling/shell/ceiling.ts
src/modeling/shell/floors.ts
src/modeling/shell/openings.ts
src/modeling/shell/walls.ts
src/styles.css
src/viewer/ApartmentScene.tsx
src/viewer/camera.ts
src/viewer/controls.ts
src/viewer/index.tsx
src/viewer/measurement-picking.ts
src/viewer/measurement-types.ts
src/viewer/measurements.ts
src/viewer/options.ts
src/viewer/scene-resources.ts
src/viewer/types.ts
tests/exports.test.ts
tests/fixtures/apartment-measurements-2026-09-10.json
tests/fixtures/apartment-plan-2026-09-10.json
tests/fixtures/exports-before-ts.json
tests/fixtures/README.md
tests/generator.test.ts
tests/measurement-controls.test.ts
tests/measurement-math.test.ts
tests/measurement-model.test.ts
tests/measurement-picking.test.ts
tests/model-cli.test.ts
tests/plan-dimensions.test.ts
tests/viewer.test.ts
tsconfig.json
```
