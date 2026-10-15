// Упаковывает содержимое dist/ в yandex-build.zip (index.html в корне архива).
// Нужен пакет: npm i -D fflate
import fs from 'node:fs'
import path from 'node:path'
import { zipSync } from 'fflate'

const DIST = 'dist'
const OUT = 'yandex-build.zip'

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('dist/index.html не найден. Сначала выполни сборку: npm run build:yandex')
  process.exit(1)
}

/** Рекурсивно собирает все файлы папки в объект { 'путь/внутри/архива': байты }. */
function collect(dir, base = '') {
  const files = {}

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    const inside = base ? `${base}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      Object.assign(files, collect(full, inside))
    } else {
      files[inside] = new Uint8Array(fs.readFileSync(full))
    }
  }

  return files
}

const files = collect(DIST)

fs.writeFileSync(OUT, zipSync(files, { level: 9 }))

const size = fs.statSync(OUT).size / 1024 / 1024

console.log(`Готово: ${OUT} (${Object.keys(files).length} файлов, ${size.toFixed(2)} МБ)`)
