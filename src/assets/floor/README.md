# Приближённый рисунок керамогранита

`wood-effect-porcelain-preview.png` — локальная текстура для пробного вида пола,
созданная 2026-09-30 встроенным инструментом imagegen. Вдохновлена визуально
изученным рендером кухни пользователя: тёплый дубовый рисунок, матовое покрытие.
Генератору передано описание, исходный рендер не подавался как входное изображение.
Это приближённый образец для сравнения, не текстура конкретного товара.
Поверхность без сетки/швов: их строит shader viewer в мировых координатах.
В сцене масштаб зерна фиксирован, оттенок зависит от освещения и профиля графики.

Точный prompt:

```text
Use case: product-mockup. Asset type: seamless PBR base-color texture for a 3D apartment floor. Generate a square, edge-to-edge, flat orthographic surface swatch of warm medium-brown oak-effect porcelain, inspired by a cozy kitchen render with natural wood-look flooring. Fine realistic lengthwise wood grain runs strictly from top to bottom, with subtle elongated cathedral patterns and sparse subdued knots. Warm muted honey/tobacco brown, not orange, not grey, not very dark. Matte refined ceramic reproduction of natural oak, gentle tonal variation. This is a single continuous wood surface texture, NOT an assembled floor: no board borders, no tile grid, no grout, no bevels, no objects, no perspective. Completely even neutral lighting without highlights, directional illumination, shadows or ambient occlusion. All four edges should tile seamlessly. No text, logos, watermark. Approximate visual study, no manufacturer identity. Output high resolution square bitmap.
```
