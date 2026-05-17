#!/bin/bash

# Konfiguracja adresów z Twojego wdrożenia
API_URL="https://eeaa54tcdc.execute-api.eu-central-1.amazonaws.com/prod/import"
FILE_NAME="products_test_task5.csv"

echo "--------------------------------------------------------"
echo "🚀 Rozpoczynam test Import Service (Task 5)"
echo "--------------------------------------------------------"

# 1. Przygotowanie testowego pliku CSV
echo "Step 1: Tworzenie pliku testowego $FILE_NAME..."
echo "title,description,price,count" > $FILE_NAME
echo "Korg MS-20,Classic Analog Synth,499,2" >> $FILE_NAME
echo "Moog One,Polyphonic Masterpiece,7999,1" >> $FILE_NAME
echo "Arturia DrumBrute,Analog Drum Machine,350,5" >> $FILE_NAME

# 2. Pobranie Signed URL
echo "Step 2: Pobieranie Signed URL z API Gateway..."
SIGNED_URL=$(curl -s "$API_URL?name=$FILE_NAME")

if [[ $SIGNED_URL == *"X-Amz-Signature"* ]]; then
    echo "✅ Otrzymano Signed URL pomyślnie."
else
    echo "❌ Błąd: Nie udało się pobrać Signed URL. Odpowiedź serwera:"
    echo "$SIGNED_URL"
    exit 1
fi

# 3. Wgrywanie pliku do S3 za pomocą otrzymanego URL
echo "Step 3: Wgrywanie pliku do S3 (PUT)..."

# Tworzymy plik tymczasowy na odpowiedź z S3, żeby podejrzeć błąd w razie 403
RESPONSE_BODY_FILE=$(mktemp)

# Wykonujemy PUT. Używamy --data-binary zamiast --upload-file, co jest bezpieczniejsze dla czystych danych CSV.
# Dodatkowo, jeśli Twoja Lambda wymaga określonego Content-Type, odkomentuj nagłówek poniżej:
UPLOAD_STATUS=$(curl -s -w "%{http_code}" \
  -o "$RESPONSE_BODY_FILE" \
  -X PUT \
  -H "Content-Type: text/csv" \
  --data-binary @"$FILE_NAME" \
  "$SIGNED_URL")

if [ "$UPLOAD_STATUS" == "200" ] || [ "$UPLOAD_STATUS" == "201" ]; then
    echo "✅ Plik został pomyślnie wgrany do S3 (Status $UPLOAD_STATUS)."
    rm -f "$RESPONSE_BODY_FILE"
else
    echo "❌ Błąd wgrywania pliku. HTTP Status: $UPLOAD_STATUS"
    echo "--------------------------------------------------------"
    echo "Szczegóły błędu z AWS S3:"
    cat "$RESPONSE_BODY_FILE"
    echo -e "\n--------------------------------------------------------"
    rm -f "$RESPONSE_BODY_FILE"
    exit 1
fi

# 4. Instrukcja weryfikacji
echo "--------------------------------------------------------"
echo "🏁 Test zakończony!"
echo "--------------------------------------------------------"
echo "Co teraz?"
echo "1. Wejdź do AWS Console -> CloudWatch -> Log Groups."
echo "2. Znajdź grupę: /aws/lambda/ImportServiceStack-ImportFileParserHandler..."
echo "3. Sprawdź najnowszy strumień logów."
echo "4. Powinieneś zobaczyć sparsowane dane z pliku $FILE_NAME."
echo "--------------------------------------------------------"