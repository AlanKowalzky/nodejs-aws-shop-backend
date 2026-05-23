# Workflow pracy z gałęziami

W tym projekcie stosujemy standardowy model pracy oparty na Feature Branches:

1. **main / master**: Gałąź stabilna. Tutaj kod trafia dopiero po zakończeniu zadania.
2. **task-X**: Gałęzie robocze (np. `task-3`). Tutaj implementujemy funkcjonalności.

## Proces kończenia zadania:
1. Implementacja i commity na gałęzi `task-3`.
2. `git push origin task-3` - wysłanie kodu do zdalnego repozytorium.
3. Utworzenie **Pull Request (PR)** z `task-3` do `master`.
4. Recenzja kodu i Cross-check.
5. **Merge**: Połączenie gałęzi `task-3` z `master`.
6. Pobranie zmian lokalnie: `git checkout master` -> `git pull origin master`.
7. Usunięcie gałęzi roboczej: `git branch -d task-3`.