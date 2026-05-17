# Lista kontrolna przed zgłoszeniem Task 3

## 1. Weryfikacja CloudFront i API
- [ ] Czy adres API w aplikacji Frontend został zaktualizowany na: `https://642wyzq699.execute-api.eu-central-1.amazonaws.com/prod/`?
- [ ] Czy po wejściu na stronę sklepu produkty ładują się poprawnie (PLP)?
- [ ] Czy endpoint `/products/{productId}` zwraca status 404 dla nieistniejących ID?

## 2. GitHub & Pull Request
- [ ] Czy utworzyłeś Pull Request z gałęzi `task-3` do `master`?
- [ ] Czy w opisie PR znajdują się linki do API oraz do PR w repozytorium Frontendowym?
- [ ] Czy dołączyłeś samoocenę (Self-assessment) potwierdzającą wykonanie zadań dodatkowych?

## 3. Dokumentacja i Testy
- [ ] Czy plik `product_service/doc/openapi.yaml` jest aktualny i zawiera poprawny adres URL serwera?
- [ ] Czy wszystkie testy jednostkowe przechodzą pomyślnie (`npm test` w folderze `product_service`)?
- [ ] Czy diagramy Mermaid w folderze `doc/` poprawnie wyświetlają się w podglądzie GitHub?

**Link do Crosscheck:** [Wklej link do PR po utworzeniu go na GitHub]