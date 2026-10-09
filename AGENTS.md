# Guidelines & Workflow

## Git & GitHub Workflow
- **Dilarang push langsung ke branch `main`**.
- Untuk setiap pengerjaan task/issue baru:
  1. Buat branch baru dari `main` (misal: `feature/<nama-fitur>` atau `fix/<nama-bug>`).
  2. Kerjakan perubahan dan lakukan commit pada branch tersebut.
  3. Push branch ke GitHub (`git push -u origin <branch-name>`).
  4. Buat Pull Request (PR) ke branch `main` menggunakan GitHub CLI (`gh pr create`).
  5. Berikan tautan Pull Request kepada user untuk di-review.
